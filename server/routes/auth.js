// ── Auth route – POST /api/auth/login ──
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { logEvent } = require('../middleware/logger');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  logEvent('info', 'Login attempt', { email });

  if (!email || !password) {
    logEvent('warn', 'Login failed – missing fields', { email });
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare(
      'SELECT email, username, password FROM MAIL_USER WHERE email = ? AND active = 1'
    ).get(email);

    if (!user) {
      logEvent('warn', 'Login failed – user not found', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hashed = crypto.createHash('sha256').update(password).digest('hex');

    if (hashed !== user.password) {
      logEvent('warn', 'Login failed – wrong password', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: user.email, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    logEvent('info', 'Login success', { email });
    res.json({ token, email: user.email, username: user.username });
  } catch (err) {
    logEvent('error', 'Login error', { email, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
