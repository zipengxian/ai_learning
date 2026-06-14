import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`🚀 K12 Server running on http://localhost:${config.port}`);
  console.log(`📋 Health check: http://localhost:${config.port}/api/health`);
});