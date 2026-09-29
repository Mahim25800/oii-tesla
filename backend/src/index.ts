import http from 'http';
import { createApp } from './app.js';
import { CONFIG } from './config/index.js';
import { wsService } from './services/WebSocketService.js';
import { getDatabase } from './database/connection.js';

const app = createApp();
const server = http.createServer(app);

// Initialize WebSocket streaming
wsService.init(server);

// Initialize DB and ensure seed data is present on first run
const db = getDatabase();
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count === 0) {
    const { runSeed } = await import('./database/seed.js');
    runSeed();
  }
} catch (err) {
  console.warn('Initial seed check notice:', err);
}

server.listen(CONFIG.PORT, () => {
  console.log(`====================================================`);
  console.log(` Dhaka Tesla Pool API Server running on port ${CONFIG.PORT}`);
  console.log(` REST API: http://localhost:${CONFIG.PORT}/api`);
  console.log(` WebSocket: ws://localhost:${CONFIG.PORT}/ws`);
  console.log(` Environment: ${CONFIG.NODE_ENV}`);
  console.log(`====================================================`);
});
