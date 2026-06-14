import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { callLLM, ChatMessage, ContentPart } from '../services/llm';

const router: Router = Router();

// 所有 AI 路由都需要认证
router.use(authMiddleware);

// ============================================================
// POST /api/ai/chat — SSE 流式对话
// ============================================================
router.post('/chat', async (req: Request, res: Response) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const writeSSE = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { message, context, sessionId } = req.body as {
      message?: string;
      context?: { chapterId?: number; knowledgePointId?: number; questionId?: number };
      sessionId?: string;
    };

    if (!message || !message.trim()) {
      writeSSE({ type: 'error', content: '消息不能为空' });
      res.end();
      return;
    }

    const userId = req.user!.id;
    const sid = sessionId || 'default';

    // 保存用户消息
    await prisma.chatHistory.create({
      data: { userId, sessionId: sid, role: 'user', content: message.trim() },
    });

    // 构建 system prompt
    let systemPrompt =
      '你是一个中小学学习助手（AI 老师），专门帮助 K-12 学生解答学习问题。\n请用友好、鼓励的语气回答，每次回答问题后可以给学生一个简短的学习建议。\n';

    // 根据 context 查询数据库，补充上下文信息
    if (context) {
      const contextParts: string[] = [];

      if (context.knowledgePointId) {
        const kp = await prisma.knowledgePoint.findUnique({
          where: { id: context.knowledgePointId },
          include: {
            chapter: { include: { subject: { select: { name: true } } } },
          },
        });
        if (kp) {
          contextParts.push(
            `学生当前正在学习 ${kp.chapter.subject.name} - ${kp.chapter.title} - ${kp.title}`
          );
        }
      } else if (context.chapterId) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: context.chapterId },
          include: { subject: { select: { name: true } } },
        });
        if (chapter) {
          contextParts.push(
            `学生当前正在学习 ${chapter.subject.name} - ${chapter.title}`
          );
        }
      }

      if (context.questionId) {
        const question = await prisma.question.findUnique({
          where: { id: context.questionId },
          select: { content: true },
        });
        if (question) {
          contextParts.push(
            `学生当前卡在题目：${question.content}，请给出解题思路而非直接答案`
          );
        }
      }

      if (contextParts.length > 0) {
        systemPrompt += '\n' + contextParts.join('\n') + '\n';
      }
    }

    systemPrompt += '\n请用中文回答，对于理科题目可以使用 LaTeX 公式。';

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message.trim() },
    ];

    // 收集 assistant 的完整回复
    const assistantTokens: string[] = [];

    // 调用 LLM 流式生成
    await callLLM(messages, (token: string) => {
      assistantTokens.push(token);
      writeSSE({ type: 'token', content: token });
    });

    // 保存 assistant 消息
    const assistantContent = assistantTokens.join('');
    await prisma.chatHistory.create({
      data: { userId, sessionId: sid, role: 'assistant', content: assistantContent },
    });

    writeSSE({ type: 'done' });
    res.end();
  } catch (err) {
    console.error('AI chat error:', err);
    try {
      writeSSE({ type: 'error', content: 'AI 服务暂时不可用，请稍后重试' });
    } catch {
      // 连接可能已断开
    }
    res.end();
  }
});

// ============================================================
// POST /api/ai/chat/save — 保存对话
// ============================================================
router.post('/chat/save', async (req: Request, res: Response) => {
  try {
    const { sessionId, role, content } = req.body as {
      sessionId?: string;
      role?: string;
      content?: string;
    };

    if (!sessionId || !role || !content) {
      return res.status(400).json({ error: 'sessionId、role 和 content 为必填项' });
    }

    if (role !== 'user' && role !== 'assistant') {
      return res.status(400).json({ error: 'role 必须是 user 或 assistant' });
    }

    const userId = req.user!.id;

    const record = await prisma.chatHistory.create({
      data: { userId, sessionId, role, content },
    });

    return res.status(201).json({
      id: record.id,
      sessionId: record.sessionId,
      role: record.role,
      content: record.content,
      createdAt: record.createdAt,
    });
  } catch (err) {
    console.error('Save chat error:', err);
    return res.status(500).json({ error: '保存对话失败' });
  }
});

// ============================================================
// GET /api/ai/chat/history?sessionId= — 获取会话历史
// ============================================================
router.get('/chat/history', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string | undefined;
    if (!sessionId) {
      return res.status(400).json({ error: '请提供 sessionId' });
    }

    const userId = req.user!.id;

    const records = await prisma.chatHistory.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return res.json({
      messages: records.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get chat history error:', err);
    return res.status(500).json({ error: '获取对话历史失败' });
  }
});

// ============================================================
// GET /api/ai/chat/sessions — 获取用户会话列表
// ============================================================
router.get('/chat/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 获取用户所有唯一的 sessionId
    const sessions = await prisma.chatHistory.groupBy({
      by: ['sessionId'],
      where: { userId },
      _count: { id: true },
      _max: { createdAt: true },
    });

    // 按最近更新时间排序
    sessions.sort((a, b) => {
      const dateA = a._max.createdAt?.getTime() || 0;
      const dateB = b._max.createdAt?.getTime() || 0;
      return dateB - dateA;
    });

    // 为每个 session 获取第一条用户消息作为标题
    const result = await Promise.all(
      sessions.map(async (s) => {
        const firstMessage = await prisma.chatHistory.findFirst({
          where: { userId, sessionId: s.sessionId, role: 'user' },
          orderBy: { createdAt: 'asc' },
          select: { content: true },
        });

        const rawTitle = firstMessage?.content || '新的对话';
        const title = rawTitle.length > 30 ? rawTitle.slice(0, 30) + '...' : rawTitle;

        return {
          sessionId: s.sessionId,
          title,
          updatedAt: s._max.createdAt,
          messageCount: s._count.id,
        };
      })
    );

    return res.json({ sessions: result });
  } catch (err) {
    console.error('Get sessions error:', err);
    return res.status(500).json({ error: '获取会话列表失败' });
  }
});

// ============================================================
// POST /api/ai/essay-grade — 作文批改
// ============================================================
router.post('/essay-grade', async (req: Request, res: Response) => {
  try {
    const { essay, grade, requirements } = req.body as {
      essay?: string;
      grade?: number;
      requirements?: string;
    };

    if (!essay || !essay.trim()) {
      return res.status(400).json({ error: '请提供作文内容' });
    }

    let systemPrompt = `你是一位经验丰富的语文老师，专门批改学生作文。请严格按照以下标准对作文进行评分和点评：

评分标准（各25分，满分100分）：
- 立意（主题思想）：25分 - 主题是否明确、思想是否深刻
- 结构（篇章结构）：25分 - 结构是否完整、层次是否清晰
- 语言（文字表达）：25分 - 语言是否流畅、表达是否准确
- 内容（素材内容）：25分 - 内容是否充实、选材是否恰当`;

    if (grade) {
      systemPrompt += `\n学生年级：${grade}年级，请用适合该年级的标准评分。`;
    }

    if (requirements) {
      systemPrompt += `\n批改重点要求：${requirements}`;
    }

    systemPrompt += `\n\n请以严格的JSON格式返回评改结果，不要包含任何其他文字：
{
  "overallScore": 数字（满分100）,
  "themeScore": 数字（满分25）,
  "structureScore": 数字（满分25）,
  "languageScore": 数字（满分25）,
  "contentScore": 数字（满分25）,
  "comments": "总体评语，200字左右",
  "suggestions": "改进建议，150字左右"
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请批改以下作文：\n\n${essay.trim()}` },
    ];

    const tokens: string[] = [];
    await callLLM(messages, (token: string) => {
      tokens.push(token);
    });

    const fullResponse = tokens.join('').trim();

    // 尝试从响应中提取 JSON
    let jsonStr = fullResponse;
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const result = JSON.parse(jsonStr);
      return res.json({
        overallScore: result.overallScore,
        themeScore: result.themeScore,
        structureScore: result.structureScore,
        languageScore: result.languageScore,
        contentScore: result.contentScore,
        comments: result.comments,
        suggestions: result.suggestions,
      });
    } catch {
      // JSON 解析失败，返回原始文本作为评语
      return res.json({
        overallScore: 0,
        themeScore: 0,
        structureScore: 0,
        languageScore: 0,
        contentScore: 0,
        comments: fullResponse,
        suggestions: '',
      });
    }
  } catch (err) {
    console.error('Essay grading error:', err);
    return res.status(500).json({ error: '作文批改失败，请稍后重试' });
  }
});

// ============================================================
// POST /api/ai/generate-questions — 智能出题
// ============================================================
router.post('/generate-questions', async (req: Request, res: Response) => {
  try {
    const { knowledgePointId, questionType, count } = req.body as {
      knowledgePointId?: number;
      questionType?: string;
      count?: number;
    };

    const questionCount = Math.min(Math.max(count || 3, 1), 10);

    let systemPrompt = `你是一位经验丰富的老师，专门为学生出题。`;

    // 如果提供了知识点ID，获取知识点信息
    if (knowledgePointId) {
      const kp = await prisma.knowledgePoint.findUnique({
        where: { id: knowledgePointId },
        include: {
          chapter: { include: { subject: { select: { name: true } } } },
        },
      });
      if (kp) {
        systemPrompt += `\n学生正在学习 ${kp.chapter.subject.name} - ${kp.chapter.title} - ${kp.title}`;
        systemPrompt += `\n知识点内容：${kp.content.substring(0, 500)}`;
      }
    }

    const typeMap: Record<string, string> = {
      choice: '选择题',
      fill: '填空题',
      judge: '判断题',
      essay: '问答题',
    };

    const typeLabel = questionType && typeMap[questionType] ? typeMap[questionType] : '混合题型';

    systemPrompt += `\n\n请生成${questionCount}道${typeLabel}。`;

    if (questionType && typeMap[questionType]) {
      systemPrompt += `\n题目类型：${typeLabel}`;
    } else {
      systemPrompt += `\n题目可以包含选择题(choice)、填空题(fill)、判断题(judge)、问答题(essay)的任意组合。`;
    }

    systemPrompt += `
\n题目要求：
- 难度适中，适合K-12学生
- 选择题需提供4个选项，格式为["A.xxx","B.xxx","C.xxx","D.xxx"]
- 每道题都需要提供正确答案(answer)和解析(explanation)

请以严格的JSON格式返回，不要包含任何其他文字：
{
  "questions": [
    {
      "type": "choice|fill|judge|essay",
      "content": "题目内容",
      "options": ["A.xxx","B.xxx","C.xxx","D.xxx"],
      "answer": "正确答案",
      "explanation": "解析说明"
    }
  ]
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请生成${questionCount}道题目。` },
    ];

    const tokens: string[] = [];
    await callLLM(messages, (token: string) => {
      tokens.push(token);
    });

    const fullResponse = tokens.join('').trim();

    // 尝试从响应中提取 JSON
    let jsonStr = fullResponse;
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const result = JSON.parse(jsonStr);
      return res.json({
        questions: Array.isArray(result.questions) ? result.questions : [],
      });
    } catch {
      return res.status(500).json({ error: '生成题目失败，AI 返回格式异常' });
    }
  } catch (err) {
    console.error('Question generation error:', err);
    return res.status(500).json({ error: '生成题目失败，请稍后重试' });
  }
});

// ============================================================
// POST /api/ai/photo-search — 拍照搜题
// ============================================================
router.post('/photo-search', async (req: Request, res: Response) => {
  try {
    const { image, grade } = req.body as {
      image?: string;
      grade?: number;
    };

    if (!image || typeof image !== 'string' || !image.trim()) {
      return res.status(400).json({ error: '请提供图片数据' });
    }

    // Validate base64 format
    const base64Pattern = /^data:image\/(jpeg|png|jpg|webp);base64,/;
    if (!base64Pattern.test(image) && !/^[A-Za-z0-9+/=]+$/.test(image)) {
      return res.status(400).json({ error: '图片格式无效，请提供 base64 编码的图片' });
    }

    // Normalize: ensure data URL format
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    const systemPrompt = '你是一个题目识别助手。请识别图片中的题目文字，然后给出解答。如果图片中没有题目，请说明。';

    const userContent: ContentPart[] = [
      { type: 'text', text: '请识别这张图片中的题目并给出解答' },
      { type: 'image_url', image_url: { url: imageUrl } },
    ];

    let gradeHint = '';
    if (grade) {
      gradeHint = `（该学生就读${grade}年级，请使用适合该年级的难度进行解答）`;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    if (gradeHint) {
      messages.push({ role: 'user', content: gradeHint });
    }

    const tokens: string[] = [];
    await callLLM(messages, (token: string) => {
      tokens.push(token);
    });

    const fullResponse = tokens.join('').trim();

    return res.json({
      text: fullResponse,
      answer: fullResponse,
    });
  } catch (err) {
    console.error('Photo search error:', err);
    return res.status(500).json({ error: '拍照搜题失败，请稍后重试' });
  }
});

export default router;