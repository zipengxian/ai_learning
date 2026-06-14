import { initDatabase } from './schema.js';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = dirname(dirname(dirname(__dirname))) + '/data';

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

console.log('Initializing database...');
initDatabase();
console.log('Database initialization complete.');