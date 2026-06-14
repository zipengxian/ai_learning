import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import coursesRouter from './routes/courses';
import authRouter from './routes/auth';
import studyRouter from './routes/study';
import aiRouter from './routes/ai';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

const app: express.Application = express();

// 安全响应头
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }
  next();
});

// 响应时间头
app.use((_req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  next();
});

// CORS 配置
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// JSON body parser
app.use(express.json());

// 请求日志
app.use(requestLogger);

// 路由
app.use('/api', healthRouter);
app.use('/api', coursesRouter);
app.use('/api/auth', authRouter);
app.use('/api', studyRouter);
app.use('/api/ai', aiRouter);

// 全局错误处理
app.use(errorHandler);

export default app;