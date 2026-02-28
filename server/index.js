// ── 9Mail Express Server ──
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db');
const { requestLogger, logEvent } = require('./middleware/logger');
const authMiddleware = require('./middleware/auth');

async function start() {
  // Initialize SQLite database before starting server
  await db.init();

  const app = express();

  // ── Global middleware ──
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logger runs before auth so we can log anonymous requests too
  app.use(requestLogger);

  // ── Public routes ──
  app.use('/api/auth', require('./routes/auth'));

  // ── Protected routes ──
  app.use('/api/mailboxes', authMiddleware, require('./routes/mailbox'));
  app.use('/api/mails', authMiddleware, require('./routes/mail'));
  app.use('/api/send', authMiddleware, require('./routes/send'));

  // ── Serve React build in production ──
  const clientBuild = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuild));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });

  // ── Start ──
  app.listen(config.port, () => {
    logEvent('info', `9Mail server started on port ${config.port}`);
    console.log(`✉  9Mail server running → http://localhost:${config.port}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
