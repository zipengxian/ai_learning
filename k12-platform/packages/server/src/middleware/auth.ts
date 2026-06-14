import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'k12_learning_secret';

function extractUser(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
  return decoded;
}

// 必须认证的中间件
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权访问' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '未授权访问' });
    }

    const decoded = extractUser(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ error: '未授权访问' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch {
    return res.status(401).json({ error: '未授权访问' });
  }
}

// authMiddleware 是 requireAuth 的别名（任务要求）
export { requireAuth as authMiddleware };

// 可选认证中间件：有 token 就解析，没有也继续
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = extractUser(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true },
        });
        if (user) {
          req.user = { id: user.id, email: user.email };
        }
      }
    }
  } catch {
    // 可选认证，忽略错误
  }
  next();
}