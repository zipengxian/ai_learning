import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware as auth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// GET /api/posts - 需要认证，分页获取帖子列表（按时间倒序）
// ============================================================
router.get('/', auth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as total FROM posts').get().total;

  const posts = db.prepare(`
    SELECT
      p.id, p.title, p.content, p.user_id,
      u.username AS author_name, p.created_at,
      (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS reply_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const result = posts.map(p => ({
    id: p.id,
    title: p.title,
    content_preview: p.content.length > 100 ? p.content.substring(0, 100) + '...' : p.content,
    user_id: p.user_id,
    author_name: p.author_name,
    created_at: p.created_at,
    reply_count: p.reply_count,
  }));

  res.json({
    posts: result,
    total,
    page,
    limit,
  });
});

// ============================================================
// POST /api/posts - 需要认证，创建帖子
// ============================================================
router.post('/', auth, (req, res) => {
  const { title, content } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: '标题不能超过200个字符' });
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '内容不能为空' });
  }

  const result = db.prepare(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)'
  ).run(req.user.id, title.trim(), content.trim());

  const post = db.prepare('SELECT id, title, content, user_id, created_at FROM posts WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ post });
});

// ============================================================
// GET /api/posts/:id - 需要认证，返回帖子详情 + 回帖列表
// ============================================================
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;

  const post = db.prepare(`
    SELECT p.id, p.title, p.content, p.user_id, u.username AS author_name, p.created_at
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id);

  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const replies = db.prepare(`
    SELECT r.id, r.content, r.user_id, u.username AS author_name, r.created_at
    FROM replies r
    JOIN users u ON r.user_id = u.id
    WHERE r.post_id = ?
    ORDER BY r.created_at ASC
  `).all(id);

  res.json({
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      user_id: post.user_id,
      author_name: post.author_name,
      created_at: post.created_at,
    },
    replies: replies.map(r => ({
      id: r.id,
      content: r.content,
      user_id: r.user_id,
      author_name: r.author_name,
      created_at: r.created_at,
    })),
  });
});

// ============================================================
// POST /api/posts/:id/replies - 需要认证，创建回帖
// ============================================================
router.post('/:id/replies', auth, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '回复内容不能为空' });
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
  if (!post) {
    return res.status(404).json({ error: '帖子不存在' });
  }

  const result = db.prepare(
    'INSERT INTO replies (post_id, user_id, content) VALUES (?, ?, ?)'
  ).run(id, req.user.id, content.trim());

  const reply = db.prepare('SELECT id, content, user_id, post_id, created_at FROM replies WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ reply });
});

export default router;