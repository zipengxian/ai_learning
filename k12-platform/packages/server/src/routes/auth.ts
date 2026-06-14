import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'k12_learning_secret';
const TOKEN_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nickname, grade, phone } = req.body;

    // 校验必填字段
    if (!email || !password || !nickname) {
      return res.status(400).json({ error: '邮箱、密码和昵称为必填项' });
    }

    // 校验 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 校验密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    // 校验昵称非空
    if (!nickname.trim()) {
      return res.status(400).json({ error: '昵称不能为空' });
    }

    // 检查邮箱唯一性
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: '该邮箱已被注册' });
    }

    // 检查手机号唯一性
    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ error: '该手机号已被注册' });
      }
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname: nickname.trim(),
        grade: grade || null,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        grade: true,
        avatar: true,
      },
    });

    const token = generateToken(user.id, user.email);

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码为必填项' });
    }

    // 支持邮箱或手机号登录
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const user = await prisma.user.findFirst({
      where: isEmail ? { email } : { phone: email },
    });

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = generateToken(user.id, user.email);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        grade: user.grade,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        grade: true,
        subjects: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: '获取用户信息失败' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { nickname, grade, subjects, avatar } = req.body;

    const data: Record<string, unknown> = {};
    if (nickname !== undefined) data.nickname = nickname;
    if (grade !== undefined) data.grade = grade;
    if (subjects !== undefined) data.subjects = subjects;
    if (avatar !== undefined) data.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        grade: true,
        subjects: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: '更新用户信息失败' });
  }
});

export default router;