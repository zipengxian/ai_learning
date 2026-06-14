import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import coursesRouter from './routes/courses.js';
import postsRouter from './routes/posts.js';
import learningRouter from './routes/learning.js';
import recommendationsRouter from './routes/recommendations.js';
import achievementsRouter from './routes/achievements.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', coursesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/learning', learningRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api', achievementsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});