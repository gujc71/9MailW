// ── JWT authentication middleware ──
const jwt = require('jsonwebtoken');
const config = require('../config');
const { logEvent } = require('./logger');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    logEvent('warn', 'Auth failed – no token', { url: req.originalUrl, ip: req.ip });
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { email, username }
    next();
  } catch (err) {
    logEvent('warn', 'Auth failed – invalid token', { url: req.originalUrl, ip: req.ip, err: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
