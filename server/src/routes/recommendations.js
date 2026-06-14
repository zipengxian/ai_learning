import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware as auth } from '../middleware/auth.js';

const router = Router();

// 级别从低到高的排序
const LEVEL_ORDER = ['入门', '初级', '中级', '高级'];

// ============================================================
// GET /api/recommendations - 获取学习路径推荐
// ============================================================
router.get('/', auth, (req, res) => {
  const userId = req.user.id;

  // 1. 获取用户已完成的所有课程 ID（去重）
  const completedRows = db.prepare(
    'SELECT DISTINCT course_id FROM learning_records WHERE user_id = ?'
  ).all(userId);
  const completedIds = new Set(completedRows.map(r => r.course_id));

  // 2. 获取所有课程
  const allCourses = db.prepare(
    'SELECT id, language, level, title, description, sort_order FROM courses ORDER BY sort_order'
  ).all();

  // 3. 按语种和级别分组
  // courseMap: { language: { level: [courses] } }
  const courseMap = {};
  for (const c of allCourses) {
    if (!courseMap[c.language]) courseMap[c.language] = {};
    if (!courseMap[c.language][c.level]) courseMap[c.language][c.level] = [];
    courseMap[c.language][c.level].push(c);
  }

  // 4. 确定用户学过哪些语种
  const studiedLanguages = new Set();
  for (const c of allCourses) {
    if (completedIds.has(c.id)) {
      studiedLanguages.add(c.language);
    }
  }

  // 获取所有语种列表（按 sort_order 中首次出现顺序）
  const languages = [...new Set(allCourses.map(c => c.language))];

  const priority1 = []; // 当前级别未完成课程
  const priority2 = []; // 下一级别课程
  const priority3 = []; // 未学过的语种入门课程

  for (const lang of languages) {
    // 按 LEVEL_ORDER 排序该语种的级别
    const levelsForLang = Object.keys(courseMap[lang]).sort(
      (a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b)
    );

    if (studiedLanguages.has(lang)) {
      // 找到用户在该语种中学过的最高级别
      let highestStudiedLevel = null;
      for (const level of levelsForLang) {
        const courses = courseMap[lang][level];
        const hasCompleted = courses.some(c => completedIds.has(c.id));
        if (hasCompleted) {
          highestStudiedLevel = level;
        }
      }

      if (highestStudiedLevel) {
        const currentLevelCourses = courseMap[lang][highestStudiedLevel];
        const allCompleted = currentLevelCourses.every(c => completedIds.has(c.id));
        const unfinished = currentLevelCourses.filter(c => !completedIds.has(c.id));

        if (allCompleted) {
          // 当前级别全部完成 → 推荐下一级别
          const currentIdx = LEVEL_ORDER.indexOf(highestStudiedLevel);
          const nextLevelName = LEVEL_ORDER[currentIdx + 1];
          if (nextLevelName && courseMap[lang][nextLevelName]) {
            const nextCourses = courseMap[lang][nextLevelName].filter(c => !completedIds.has(c.id));
            for (const c of nextCourses) {
              priority2.push({
                id: c.id,
                language: c.language,
                level: c.level,
                title: c.title,
                description: c.description,
                reason: `继续学习${c.language}${c.level}课程`,
              });
            }
          }
        } else {
          // 当前级别有未完成课程 → 推荐这些课程
          for (const c of unfinished) {
            priority1.push({
              id: c.id,
              language: c.language,
              level: c.level,
              title: c.title,
              description: c.description,
              reason: `继续学习${c.language}${c.level}课程`,
            });
          }
        }
      }
    } else {
      // 未学过的语种 → 推荐入门课程
      const entryCourses = courseMap[lang]['入门'] || [];
      for (const c of entryCourses) {
        priority3.push({
          id: c.id,
          language: c.language,
          level: c.level,
          title: c.title,
          description: c.description,
          reason: `开启${c.language}学习之旅`,
        });
      }
    }
  }

  // 组合推荐结果：优先级1 > 优先级2 > 优先级3，每种最多取3门，总计最多6门
  const recommendations = [];

  for (const rec of priority1.slice(0, 3)) {
    recommendations.push(rec);
  }

  for (const rec of priority2.slice(0, 3)) {
    recommendations.push(rec);
  }

  const remaining = 6 - recommendations.length;
  for (const rec of priority3.slice(0, remaining)) {
    recommendations.push(rec);
  }

  res.json({ recommendations });
});

export default router;