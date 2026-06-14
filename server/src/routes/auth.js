import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'language_learning_secret';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, username, password } = req.body;

  // 校验
  if (!email || !username || !password) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  // 检查邮箱是否已注册
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(409).json({ error: '该邮箱已被注册' });
  }

  // 密码哈希
  const hashedPassword = bcrypt.hashSync(password, 10);

  // 创建用户
  const result = db.prepare(
    'INSERT INTO users (email, username, password) VALUES (?, ?, ?)'
  ).run(email, username, hashedPassword);

  const userId = result.lastInsertRowid;

  // 生成 JWT
  const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: { id: userId, email, username }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '请填写邮箱和密码' });
  }

  const user = db.prepare('SELECT id, email, username, password FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.status(200).json({
    token,
    user: { id: user.id, email: user.email, username: user.username }
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, username, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(401).json({ error: '未授权访问' });
  }

  res.status(200).json({ user });
});

export default router;