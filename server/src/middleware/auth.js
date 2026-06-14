import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'language_learning_secret';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: '未授权访问' });
  }
}