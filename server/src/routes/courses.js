import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware as auth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// GET /api/languages - 无需认证，返回所有语种列表
// ============================================================
router.get('/languages', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT language FROM courses ORDER BY language').all();
  const languages = rows.map(r => r.language);
  res.json({ languages });
});

// ============================================================
// GET /api/courses - 需要认证，按语种和级别筛选课程列表
// ============================================================
router.get('/courses', auth, (req, res) => {
  const { language, level } = req.query;

  let sql = 'SELECT id, language, level, title, description FROM courses WHERE 1=1';
  const params = [];

  if (language) {
    sql += ' AND language = ?';
    params.push(language);
  }
  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }

  sql += ' ORDER BY sort_order';

  const courses = db.prepare(sql).all(...params);
  res.json({ courses });
});

// ============================================================
// GET /api/courses/:id - 需要认证，返回单个课程详情（含四类活动统计）
// ============================================================
router.get('/courses/:id', auth, (req, res) => {
  const { id } = req.params;

  const course = db.prepare('SELECT id, language, level, title, description FROM courses WHERE id = ?').get(id);

  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const vocabularyCount = db.prepare('SELECT COUNT(*) as count FROM vocabulary_words WHERE course_id = ?').get(id).count;
  const grammarCount = db.prepare('SELECT COUNT(*) as count FROM grammar_questions WHERE course_id = ?').get(id).count;
  const speakingCount = db.prepare('SELECT COUNT(*) as count FROM speaking_sentences WHERE course_id = ?').get(id).count;
  const listeningCount = db.prepare('SELECT COUNT(*) as count FROM listening_exercises WHERE course_id = ?').get(id).count;

  res.json({
    course: {
      ...course,
      vocabulary_count: vocabularyCount,
      grammar_count: grammarCount,
      speaking_count: speakingCount,
      listening_count: listeningCount,
    }
  });
});

// ============================================================
// GET /api/courses/:id/vocabulary - 需要认证，返回单词列表
// ============================================================
router.get('/courses/:id/vocabulary', auth, (req, res) => {
  const { id } = req.params;

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const vocabulary = db.prepare(
    'SELECT id, word, meaning, example, sort_order FROM vocabulary_words WHERE course_id = ? ORDER BY sort_order'
  ).all(id);

  res.json({ vocabulary });
});

// ============================================================
// GET /api/courses/:id/grammar - 需要认证，返回语法题目（不含正确答案）
// ============================================================
router.get('/courses/:id/grammar', auth, (req, res) => {
  const { id } = req.params;

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const grammar = db.prepare(
    'SELECT id, question, option_a, option_b, option_c, option_d, explanation, sort_order FROM grammar_questions WHERE course_id = ? ORDER BY sort_order'
  ).all(id);

  res.json({ grammar });
});

// ============================================================
// GET /api/courses/:id/speaking - 需要认证，返回跟读句子列表
// ============================================================
router.get('/courses/:id/speaking', auth, (req, res) => {
  const { id } = req.params;

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const speaking = db.prepare(
    'SELECT id, sentence, translation, sort_order FROM speaking_sentences WHERE course_id = ? ORDER BY sort_order'
  ).all(id);

  res.json({ speaking });
});

// ============================================================
// GET /api/courses/:id/listening - 需要认证，返回听力题目（不含正确答案）
// ============================================================
router.get('/courses/:id/listening', auth, (req, res) => {
  const { id } = req.params;

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const listening = db.prepare(
    'SELECT id, audio_url, question, option_a, option_b, option_c, option_d, sort_order FROM listening_exercises WHERE course_id = ? ORDER BY sort_order'
  ).all(id);

  res.json({ listening });
});

// ============================================================
// POST /api/courses/:id/grammar/check - 需要认证，验证语法答案
// ============================================================
router.post('/courses/:id/grammar/check', auth, (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: '请提供答案数组' });
  }

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const questions = db.prepare(
    'SELECT id, correct_answer, explanation FROM grammar_questions WHERE course_id = ?'
  ).all(id);

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const results = [];
  let correctCount = 0;

  for (const item of answers) {
    const question = questionMap.get(item.question_id);
    if (!question) {
      results.push({
        question_id: item.question_id,
        correct: false,
        correct_answer: null,
        explanation: '题目不存在',
      });
      continue;
    }

    const isCorrect = item.answer === question.correct_answer;
    if (isCorrect) correctCount++;

    results.push({
      question_id: item.question_id,
      correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
    });
  }

  res.json({
    results,
    score: correctCount,
    total: answers.length,
  });
});

// ============================================================
// POST /api/courses/:id/listening/check - 需要认证，验证听力答案
// ============================================================
router.post('/courses/:id/listening/check', auth, (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: '请提供答案数组' });
  }

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const questions = db.prepare(
    'SELECT id, correct_answer, question FROM listening_exercises WHERE course_id = ?'
  ).all(id);

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const results = [];
  let correctCount = 0;

  for (const item of answers) {
    const question = questionMap.get(item.question_id);
    if (!question) {
      results.push({
        question_id: item.question_id,
        correct: false,
        correct_answer: null,
        explanation: '题目不存在',
      });
      continue;
    }

    const isCorrect = item.answer === question.correct_answer;
    if (isCorrect) correctCount++;

    results.push({
      question_id: item.question_id,
      correct: isCorrect,
      correct_answer: question.correct_answer,
    });
  }

  res.json({
    results,
    score: correctCount,
    total: answers.length,
  });
});

export default router;