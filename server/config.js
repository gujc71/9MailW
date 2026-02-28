// ── 9Mail Server Configuration ──
module.exports = {
  // HTTP server
  port: process.env.PORT || 4000,

  // SQLite
  dbdir: process.env.DB_DIR || 'D:/workSQlite/9Mail/data/',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-me-9mail-secret-key',
  jwtExpiresIn: '24h',

  // Mail directory – absolute path where EML files are stored
  maildir: process.env.MAILDIR || 'D:/workSQlite/9Mail/data/maildir',

  // SMTP – outgoing mail relay
  smtp: {
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: parseInt(process.env.SMTP_PORT, 10) || 25,
    secure: false,                     // true for 465 (TLS)
    auth: null,                        // { user: '', pass: '' } if needed
    tls: { rejectUnauthorized: false },
  },
};
