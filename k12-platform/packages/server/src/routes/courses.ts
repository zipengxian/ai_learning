import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router: Router = Router();

// 所有课程相关路由都使用可选认证（用于获取学习状态等）
router.use(optionalAuth);

// ============================================================
// GET /api/subjects - 获取所有学科
// ============================================================
router.get('/subjects', async (_req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ subjects });
  } catch (err) {
    console.error('获取学科列表失败:', err);
    res.status(500).json({ error: '获取学科列表失败' });
  }
});

// ============================================================
// GET /api/grades - 获取所有年级
// ============================================================
router.get('/grades', async (_req: Request, res: Response) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: { level: 'asc' },
    });
    res.json({ grades });
  } catch (err) {
    console.error('获取年级列表失败:', err);
    res.status(500).json({ error: '获取年级列表失败' });
  }
});

// ============================================================
// GET /api/chapters - 获取章节列表
// 查询参数：?subjectId=&gradeId= （均为可选）
// ============================================================
router.get('/chapters', async (req: Request, res: Response) => {
  try {
    const { subjectId, gradeId } = req.query;

    const where: Record<string, unknown> = {};
    if (subjectId) {
      where.subjectId = parseInt(subjectId as string, 10);
    }
    if (gradeId) {
      where.gradeId = parseInt(gradeId as string, 10);
    }

    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        grade: { select: { name: true } },
        _count: { select: { knowledgePoints: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const result = chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      subjectId: ch.subjectId,
      subjectName: ch.subject.name,
      gradeId: ch.gradeId,
      gradeName: ch.grade.name,
      knowledgePointCount: ch._count.knowledgePoints,
      sortOrder: ch.sortOrder,
    }));

    res.json({ chapters: result });
  } catch (err) {
    console.error('获取章节列表失败:', err);
    res.status(500).json({ error: '获取章节列表失败' });
  }
});

// ============================================================
// GET /api/chapters/:id/knowledge-points - 获取章节下的知识点
// ============================================================
router.get('/chapters/:id/knowledge-points', async (req: Request, res: Response) => {
  try {
    const chapterId = parseInt(req.params.id as string, 10);
    const userId = req.user?.id;

    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: { chapterId },
      orderBy: { sortOrder: 'asc' },
    });

    // 如果有登录用户，查询学习状态
    const result = await Promise.all(
      knowledgePoints.map(async (kp) => {
        let status: string | null = null;
        if (userId) {
          const record = await prisma.studyRecord.findFirst({
            where: {
              userId,
              knowledgePointId: kp.id,
            },
            orderBy: { completedAt: 'desc' },
          });
          status = record?.status || null;
        }

        return {
          id: kp.id,
          title: kp.title,
          content: kp.content,
          videoUrl: kp.videoUrl,
          sortOrder: kp.sortOrder,
          status,
        };
      })
    );

    res.json({ knowledgePoints: result });
  } catch (err) {
    console.error('获取知识点列表失败:', err);
    res.status(500).json({ error: '获取知识点列表失败' });
  }
});

// ============================================================
// GET /api/knowledge-points/:id - 获取单个知识点详情
// 包含练习题（不含答案）
// ============================================================
router.get('/knowledge-points/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);

    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            subject: { select: { name: true } },
          },
        },
        questions: {
          select: {
            id: true,
            type: true,
            content: true,
            options: true,
            difficulty: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!knowledgePoint) {
      return res.status(404).json({ error: '知识点不存在' });
    }

    res.json({
      id: knowledgePoint.id,
      chapterId: knowledgePoint.chapterId,
      title: knowledgePoint.title,
      chapterTitle: knowledgePoint.chapter.title,
      subjectName: knowledgePoint.chapter.subject.name,
      content: knowledgePoint.content,
      videoUrl: knowledgePoint.videoUrl,
      questions: knowledgePoint.questions,
    });
  } catch (err) {
    console.error('获取知识点详情失败:', err);
    res.status(500).json({ error: '获取知识点详情失败' });
  }
});

// ============================================================
// POST /api/questions/check - 批改答案
// ============================================================
router.post('/questions/check', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { answers } = req.body as {
      answers: { questionId: number; answer: string }[];
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: '请提供答案列表' });
    }

    // 批量获取问题
    const questionIds = answers.map((a) => a.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const results = [];
    let correctCount = 0;

    for (const ans of answers) {
      const question = questionMap.get(ans.questionId);

      if (!question) {
        results.push({
          questionId: ans.questionId,
          correct: false,
          userAnswer: ans.answer,
          correctAnswer: '',
          explanation: '题目不存在',
        });
        continue;
      }

      const isCorrect =
        ans.answer.trim().toLowerCase() === question.answer.trim().toLowerCase();

      if (isCorrect) {
        correctCount++;
      } else {
        // 记录错题
        await prisma.wrongAnswer.create({
          data: {
            userId,
            questionId: question.id,
            userAnswer: ans.answer,
            correctAnswer: question.answer,
          },
        });
      }

      results.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer: ans.answer,
        correctAnswer: question.answer,
        explanation: question.explanation,
      });
    }

    const total = answers.length;
    const score = Math.round((correctCount / total) * 100);

    res.json({ results, score, total });
  } catch (err) {
    console.error('批改答案失败:', err);
    res.status(500).json({ error: '批改答案失败' });
  }
});

// ============================================================
// GET /api/search?q=keyword - 全局搜索
// ============================================================
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';

    if (!q.trim()) {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }

    const keyword = `%${q}%`;

    // 搜索章节
    const chapters = await prisma.chapter.findMany({
      where: { title: { contains: q } },
      include: {
        subject: { select: { name: true } },
        grade: { select: { name: true } },
      },
      take: 10,
    });

    // 搜索知识点
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: { title: { contains: q } },
      include: {
        chapter: { select: { title: true } },
      },
      take: 10,
    });

    // 搜索题目
    const questions = await prisma.question.findMany({
      where: { content: { contains: q } },
      select: {
        id: true,
        type: true,
        content: true,
      },
      take: 10,
    });

    const results: Array<Record<string, unknown>> = [
      ...chapters.map((ch) => ({
        type: 'chapter',
        id: ch.id,
        title: ch.title,
        subjectName: ch.subject.name,
        gradeName: ch.grade.name,
      })),
      ...knowledgePoints.map((kp) => ({
        type: 'knowledgePoint',
        id: kp.id,
        title: kp.title,
        chapterTitle: kp.chapter.title,
      })),
      ...questions.map((q) => ({
        type: 'question',
        id: q.id,
        content: q.content,
        questionType: q.type,
      })),
    ];

    res.json({ results });
  } catch (err) {
    console.error('搜索失败:', err);
    res.status(500).json({ error: '搜索失败' });
  }
});

export default router;