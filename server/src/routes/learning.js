import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware as auth } from '../middleware/auth.js';
import { checkAndAwardAchievements } from './achievements.js';

const router = Router();

const VALID_ACTIVITY_TYPES = ['vocabulary', 'grammar', 'speaking', 'listening'];

// ============================================================
// POST /api/learning/records - 创建学习记录
// ============================================================
router.post('/records', auth, (req, res) => {
  const { course_id, activity_type, score } = req.body;

  if (!course_id || !activity_type || score === undefined) {
    return res.status(400).json({ error: '请提供 course_id, activity_type, score' });
  }

  if (!VALID_ACTIVITY_TYPES.includes(activity_type)) {
    return res.status(400).json({ error: 'activity_type 必须是 vocabulary/grammar/speaking/listening 之一' });
  }

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return res.status(400).json({ error: 'score 必须是 0-100 的整数' });
  }

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const result = db.prepare(
    'INSERT INTO learning_records (user_id, course_id, activity_type, score, completed_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
  ).run(req.user.id, course_id, activity_type, score);

  const record = db.prepare('SELECT id, user_id, course_id, activity_type, score, completed_at FROM learning_records WHERE id = ?').get(result.lastInsertRowid);

  const newAchievements = checkAndAwardAchievements(req.user.id);

  const response = { record };
  if (newAchievements.length > 0) {
    response.new_achievements = newAchievements;
  }

  res.status(201).json(response);
});

// ============================================================
// GET /api/learning/progress - 获取学习进度摘要
// ============================================================
router.get('/progress', auth, (req, res) => {
  const userId = req.user.id;

  const completedCourses = db.prepare(
    'SELECT COUNT(DISTINCT course_id) as count FROM learning_records WHERE user_id = ?'
  ).get(userId).count;

  const totalActivities = db.prepare(
    'SELECT COUNT(*) as count FROM learning_records WHERE user_id = ?'
  ).get(userId).count;

  const avgScores = db.prepare(
    'SELECT activity_type, AVG(score) as avg_score FROM learning_records WHERE user_id = ? GROUP BY activity_type'
  ).all(userId);

  const scoreMap = {};
  for (const row of avgScores) {
    scoreMap[row.activity_type] = Math.round(row.avg_score);
  }

  // 计算连续学习天数
  const dates = db.prepare(
    `SELECT DISTINCT DATE(completed_at) as date
     FROM learning_records
     WHERE user_id = ?
     ORDER BY date DESC`
  ).all(userId);

  const dateSet = new Set(dates.map(r => r.date));

  let streakDays = 0;
  const today = new Date();
  // 将 today 转为 yyyy-mm-dd 格式（本地时区）
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  // 从今天开始向前检查
  const checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.getFullYear() + '-' +
      String(checkDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(checkDate.getDate()).padStart(2, '0');

    if (dateSet.has(dateStr)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // 如果是今天且今天还没学习，允许继续向前检查昨天
      if (dateStr === todayStr && streakDays === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  res.json({
    progress: {
      completed_courses: completedCourses,
      total_activities: totalActivities,
      vocabulary_score: scoreMap['vocabulary'] || 0,
      grammar_score: scoreMap['grammar'] || 0,
      speaking_score: scoreMap['speaking'] || 0,
      listening_score: scoreMap['listening'] || 0,
      streak_days: streakDays,
    }
  });
});

// ============================================================
// GET /api/learning/history - 获取学习历史记录（分页 + 课程信息）
// ============================================================
router.get('/history', auth, (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM learning_records WHERE user_id = ?'
  ).get(userId).count;

  const records = db.prepare(
    `SELECT lr.id, lr.course_id, lr.activity_type, lr.score, lr.completed_at,
            c.title as course_title, c.language as course_language, c.level as course_level
     FROM learning_records lr
     JOIN courses c ON lr.course_id = c.id
     WHERE lr.user_id = ?
     ORDER BY lr.completed_at DESC
     LIMIT ? OFFSET ?`
  ).all(userId, limit, offset);

  res.json({
    records,
    total,
    page,
    limit,
  });
});

export default router;