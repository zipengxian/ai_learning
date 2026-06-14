import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware as auth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// 计算连续学习天数
// ============================================================
function calculateStreakDays(userId) {
  const dates = db.prepare(
    `SELECT DISTINCT DATE(completed_at) as date
     FROM learning_records
     WHERE user_id = ?
     ORDER BY date DESC`
  ).all(userId);

  const dateSet = new Set(dates.map(r => r.date));

  let streakDays = 0;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  const checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.getFullYear() + '-' +
      String(checkDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(checkDate.getDate()).padStart(2, '0');

    if (dateSet.has(dateStr)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (dateStr === todayStr && streakDays === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streakDays;
}

// ============================================================
// 成就检查函数 - 在学习活动后调用
// 返回新获得的成就列表
// ============================================================
export function checkAndAwardAchievements(userId) {
  // 查询用户学习统计
  const completedCourses = db.prepare(
    'SELECT COUNT(DISTINCT course_id) as count FROM learning_records WHERE user_id = ?'
  ).get(userId).count;

  const streakDays = calculateStreakDays(userId);

  const totalScore = db.prepare(
    'SELECT COALESCE(SUM(score), 0) as total FROM learning_records WHERE user_id = ?'
  ).get(userId).total;

  // 获取所有成就定义
  const allAchievements = db.prepare('SELECT * FROM achievements').all();

  const insertStmt = db.prepare(
    'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, datetime(\'now\'))'
  );

  const newAchievements = [];

  for (const achievement of allAchievements) {
    let conditionMet = false;

    switch (achievement.condition_type) {
      case 'completed_courses':
        conditionMet = completedCourses >= achievement.condition_value;
        break;
      case 'streak_days':
        conditionMet = streakDays >= achievement.condition_value;
        break;
      case 'total_score':
        conditionMet = totalScore >= achievement.condition_value;
        break;
    }

    if (conditionMet) {
      const result = insertStmt.run(userId, achievement.id);
      if (result.changes > 0) {
        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          condition_type: achievement.condition_type,
          condition_value: achievement.condition_value,
          earned_at: new Date().toISOString(),
        });
      }
    }
  }

  return newAchievements;
}

// ============================================================
// GET /api/achievements - 获取所有成就并标记当前用户是否获得
// ============================================================
router.get('/achievements', auth, (req, res) => {
  const userId = req.user.id;

  const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY id').all();

  const earnedMap = {};
  const userAchievements = db.prepare(
    'SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?'
  ).all(userId);
  for (const ua of userAchievements) {
    earnedMap[ua.achievement_id] = ua.earned_at;
  }

  const achievements = allAchievements.map(a => ({
    ...a,
    earned: !!earnedMap[a.id],
    earned_at: earnedMap[a.id] || null,
  }));

  res.json({ achievements });
});

// ============================================================
// GET /api/users/:id/achievements - 获取指定用户已获得的成就
// ============================================================
router.get('/users/:id/achievements', auth, (req, res) => {
  const targetUserId = parseInt(req.params.id);

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const achievements = db.prepare(
    `SELECT a.id, a.name, a.description, a.icon, a.condition_type, a.condition_value,
            ua.earned_at
     FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = ?
     ORDER BY ua.earned_at DESC`
  ).all(targetUserId);

  res.json({ achievements });
});

export default router;