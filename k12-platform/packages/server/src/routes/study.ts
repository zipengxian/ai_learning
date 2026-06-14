import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// 所有 study 路由都需要认证
router.use(authMiddleware);

// ============================================================
// POST /api/study/records - 创建或更新学习记录
// ============================================================
router.post('/study/records', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { knowledgePointId, status, score } = req.body;

    if (!knowledgePointId) {
      return res.status(400).json({ error: 'knowledgePointId 为必填项' });
    }

    // 验证知识点存在
    const kp = await prisma.knowledgePoint.findUnique({
      where: { id: knowledgePointId },
    });
    if (!kp) {
      return res.status(404).json({ error: '知识点不存在' });
    }

    // 查找已有记录（upsert）
    const existing = await prisma.studyRecord.findFirst({
      where: { userId, knowledgePointId },
    });

    let record;
    if (existing) {
      record = await prisma.studyRecord.update({
        where: { id: existing.id },
        data: {
          status: status || existing.status,
          score: score !== undefined ? score : existing.score,
          completedAt: new Date(),
        },
      });
    } else {
      record = await prisma.studyRecord.create({
        data: {
          userId,
          knowledgePointId,
          status: status || 'completed',
          score: score !== undefined ? score : null,
        },
      });
    }

    return res.status(201).json({ record });
  } catch (err) {
    console.error('创建学习记录失败:', err);
    return res.status(500).json({ error: '创建学习记录失败' });
  }
});

// ============================================================
// GET /api/study/progress - 学习进度摘要
// ============================================================
router.get('/study/progress', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 全部知识点总数
    const totalKnowledgePoints = await prisma.knowledgePoint.count();

    // 用户已完成的知识点数
    const completedKnowledgePoints = await prisma.studyRecord.count({
      where: { userId },
    });

    // 完成率
    const completionRate = totalKnowledgePoints > 0
      ? Math.round((completedKnowledgePoints / totalKnowledgePoints) * 100)
      : 0;

    // 用户做错的题目总数
    const wrongAnswerCount = await prisma.wrongAnswer.count({
      where: { userId },
    });

    // 做过的题目总数（所有属于用户学习过的知识点的题目）
    // 获取用户学习记录涉及的知识点 ID
    const userStudyRecords = await prisma.studyRecord.findMany({
      where: { userId },
      select: { knowledgePointId: true },
    });
    const studiedKpIds = [...new Set(userStudyRecords.map((r) => r.knowledgePointId))];

    const totalQuestions = await prisma.question.count({
      where: {
        knowledgePointId: { in: studiedKpIds },
      },
    });

    // 正确率
    const correctRate = totalQuestions > 0
      ? Math.round(((totalQuestions - wrongAnswerCount) / totalQuestions) * 100)
      : 0;

    // 按学科分的进度
    const subjects = await prisma.subject.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const subjectProgress = [];
    for (const subject of subjects) {
      // 该学科下的所有知识点
      const kpsInSubject = await prisma.knowledgePoint.findMany({
        where: { chapter: { subjectId: subject.id } },
        select: { id: true },
      });
      const kpIds = kpsInSubject.map((k) => k.id);
      const total = kpIds.length;

      const completed = total > 0
        ? await prisma.studyRecord.count({
            where: {
              userId,
              knowledgePointId: { in: kpIds },
            },
          })
        : 0;

      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      subjectProgress.push({
        subjectId: subject.id,
        subjectName: subject.name,
        completed,
        total,
        rate,
      });
    }

    // 按年级分的进度
    const grades = await prisma.grade.findMany({
      orderBy: { level: 'asc' },
    });

    const gradeProgress = [];
    for (const grade of grades) {
      const kpsInGrade = await prisma.knowledgePoint.findMany({
        where: { chapter: { gradeId: grade.id } },
        select: { id: true },
      });
      const kpIds = kpsInGrade.map((k) => k.id);
      const total = kpIds.length;

      const completed = total > 0
        ? await prisma.studyRecord.count({
            where: {
              userId,
              knowledgePointId: { in: kpIds },
            },
          })
        : 0;

      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      gradeProgress.push({
        gradeId: grade.id,
        gradeName: grade.name,
        completed,
        total,
        rate,
      });
    }

    // 最近10条学习记录（含知识点名称、章节名称、学科名称、完成时间）
    const recentRecords = await prisma.studyRecord.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        knowledgePoint: {
          include: {
            chapter: {
              include: {
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const recentActivities = recentRecords.map((r) => ({
      knowledgePointId: r.knowledgePointId,
      knowledgePointTitle: r.knowledgePoint.title,
      chapterTitle: r.knowledgePoint.chapter.title,
      subjectName: r.knowledgePoint.chapter.subject.name,
      score: r.score,
      completedAt: r.completedAt.toISOString(),
    }));

    return res.json({
      totalKnowledgePoints,
      completedKnowledgePoints,
      completionRate,
      totalQuestions,
      correctRate,
      subjectProgress,
      gradeProgress,
      recentActivities,
    });
  } catch (err) {
    console.error('获取学习进度失败:', err);
    return res.status(500).json({ error: '获取学习进度失败' });
  }
});

// ============================================================
// GET /api/wrong-answers - 错题列表
// ============================================================
router.get('/wrong-answers', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string, 10) : undefined;
    const knowledgePointId = req.query.knowledgePointId
      ? parseInt(req.query.knowledgePointId as string, 10)
      : undefined;

    const skip = (page - 1) * limit;

    // 构建 where 条件
    const where: Record<string, unknown> = { userId };

    if (knowledgePointId) {
      where.question = { knowledgePointId };
    }

    if (subjectId) {
      where.question = {
        ...((where.question as Record<string, unknown>) || {}),
        knowledgePoint: { chapter: { subjectId } },
      };
    }

    const [wrongAnswers, total] = await Promise.all([
      prisma.wrongAnswer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          question: {
            include: {
              knowledgePoint: {
                include: {
                  chapter: {
                    include: {
                      subject: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.wrongAnswer.count({ where }),
    ]);

    const list = wrongAnswers.map((wa) => ({
      id: wa.id,
      questionId: wa.questionId,
      questionContent: wa.question.content,
      questionType: wa.question.type,
      userAnswer: wa.userAnswer,
      correctAnswer: wa.correctAnswer,
      explanation: wa.question.explanation,
      subjectName: wa.question.knowledgePoint.chapter.subject.name,
      knowledgePointTitle: wa.question.knowledgePoint.title,
      createdAt: wa.createdAt.toISOString(),
    }));

    return res.json({
      list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('获取错题列表失败:', err);
    return res.status(500).json({ error: '获取错题列表失败' });
  }
});

// ============================================================
// DELETE /api/wrong-answers/:id - 删除错题记录
// ============================================================
router.delete('/wrong-answers/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = parseInt(req.params.id as string, 10);

    const wrongAnswer = await prisma.wrongAnswer.findFirst({
      where: { id, userId },
    });

    if (!wrongAnswer) {
      return res.status(404).json({ error: '错题记录不存在' });
    }

    await prisma.wrongAnswer.delete({ where: { id } });

    return res.json({ message: '已从错题本移除' });
  } catch (err) {
    console.error('删除错题记录失败:', err);
    return res.status(500).json({ error: '删除错题记录失败' });
  }
});

// ============================================================
// GET /api/study/stats - 今日/本周统计
// ============================================================
router.get('/study/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 计算今日和本周的时间范围
    const now = new Date();

    // 今日开始（当天 00:00:00）
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 今日结束（当天 23:59:59）
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    // 本周一 00:00:00
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周一为一周开始
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - mondayOffset);

    // 今日完成知识点数
    const todayCompleted = await prisma.studyRecord.count({
      where: {
        userId,
        completedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 今日做题数（今日创建的错题记录数代表今天做的题目数）
    const todayWrongAnswers = await prisma.wrongAnswer.count({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 获取今日涉及的知识点
    const todayRecords = await prisma.studyRecord.findMany({
      where: {
        userId,
        completedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: { knowledgePointId: true },
    });
    const todayKpIds = [...new Set(todayRecords.map((r) => r.knowledgePointId))];

    // 今日关联知识点的题目总数
    const todayQuestionsTotal = todayKpIds.length > 0
      ? await prisma.question.count({
          where: { knowledgePointId: { in: todayKpIds } },
        })
      : 0;

    const todayQuestions = todayQuestionsTotal;

    // 今日正确率
    const todayCorrectRate = todayQuestions > 0
      ? Math.round(((todayQuestions - todayWrongAnswers) / todayQuestions) * 100)
      : 0;

    // 本周完成知识点数
    const weekCompleted = await prisma.studyRecord.count({
      where: {
        userId,
        completedAt: {
          gte: weekStart,
          lte: now,
        },
      },
    });

    // 本周每天完成数
    const weekTrend: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.studyRecord.count({
        where: {
          userId,
          completedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      weekTrend.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    // 待复习错题数
    const pendingWrongAnswers = await prisma.wrongAnswer.count({
      where: { userId },
    });

    return res.json({
      todayCompleted,
      todayQuestions,
      todayCorrectRate,
      weekCompleted,
      weekTrend,
      pendingWrongAnswers,
    });
  } catch (err) {
    console.error('获取学习统计失败:', err);
    return res.status(500).json({ error: '获取学习统计失败' });
  }
});

export default router;