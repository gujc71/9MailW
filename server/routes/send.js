// ── Send mail route – POST /api/send ──
const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config');
const db = require('../db');
const { logEvent } = require('../middleware/logger');

const router = express.Router();

// ── Helper: save sent mail to "Sent" mailbox in DB ──
function saveSentMail(email, messageId, { to, cc, bcc, subject, text, html }) {
  try {
    // 1. Find "Sent" mailbox for this user
    const sentBox = db.prepare(
      `SELECT mailbox_id, next_uid FROM MAIL_MAILBOX
       WHERE email = ? AND mailbox_path = 'Sent' LIMIT 1`
    ).get(email);
    if (!sentBox) {
      logEvent('warn', 'Sent mailbox not found, skip saving', { email });
      return;
    }
    const uid = sentBox.next_uid;

    // 2. Build a minimal EML and save to maildir
    const now = new Date();
    const dateDir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}.eml`;
    const relPath = `${dateDir}/${fileName}`;
    const absDir = path.join(config.maildir, dateDir);
    const absPath = path.join(config.maildir, relPath);

    if (!fs.existsSync(absDir)) fs.mkdirSync(absDir, { recursive: true });

    const emlLines = [
      `From: ${email}`,
      `To: ${to}`,
      cc ? `Cc: ${cc}` : null,
      `Subject: ${subject || '(no subject)'}`,
      `Message-ID: ${messageId}`,
      `Date: ${now.toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html || text || '',
    ].filter(l => l !== null).join('\r\n');

    fs.writeFileSync(absPath, emlLines, 'utf8');
    const emlSize = Buffer.byteLength(emlLines, 'utf8');

    // 3–6. All DB writes in a single transaction (atomic)
    const insertAll = db.transaction(() => {
      // 3. Insert MAIL_MESSAGE
      const firstRecipient = to.split(',')[0].trim();
      db.prepare(
        `INSERT OR IGNORE INTO MAIL_MESSAGE (message_id, subject, sender, send_dt, recipient, filename)
         VALUES (?, ?, ?, datetime('now'), ?, ?)`
      ).run(messageId, subject || '(no subject)', email, firstRecipient, relPath);

      // 4. Insert MAIL_RECIPIENT
      const allRecipients = [to, cc, bcc]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);

      const insertRecipient = db.prepare(
        `INSERT OR IGNORE INTO MAIL_RECIPIENT (message_id, email) VALUES (?, ?)`
      );
      for (const rcpt of [...new Set(allRecipients)]) {
        insertRecipient.run(messageId, rcpt);
      }

      // 5. Insert MAIL_MAIL (link to Sent mailbox)
      db.prepare(
        `INSERT INTO MAIL_MAIL (message_id, mailbox_id, uid, is_read, size)
         VALUES (?, ?, ?, 1, ?)`
      ).run(messageId, sentBox.mailbox_id, uid, emlSize);

      // 6. Update mailbox counters
      db.prepare(
        `UPDATE MAIL_MAILBOX SET next_uid = ?, mail_count = mail_count + 1
         WHERE mailbox_id = ?`
      ).run(uid + 1, sentBox.mailbox_id);
    });

    insertAll();

    logEvent('info', 'Sent mail saved to Sent mailbox', { email, messageId, mailbox_id: sentBox.mailbox_id });
  } catch (err) {
    logEvent('error', 'Failed to save sent mail', { email, err: err.message });
  }
}

router.post('/', async (req, res) => {
  const email = req.user.email;
  const { to, cc, bcc, subject, text, html } = req.body;

  logEvent('info', 'Send mail request', { from: email, to, cc, bcc, subject });

  if (!to) {
    logEvent('warn', 'Send mail failed – no recipient', { email });
    return res.status(400).json({ error: 'Recipient (to) is required' });
  }

  try {
    const transporter = nodemailer.createTransport(config.smtp);

    const mailOptions = {
      from: email,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: subject || '(no subject)',
      text: text || '',
      html: html || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    logEvent('info', 'Mail sent successfully', { email, messageId: info.messageId, to });

    // Save to Sent mailbox (non-blocking – don't fail the response)
    saveSentMail(email, info.messageId, { to, cc, bcc, subject, text, html });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    logEvent('error', 'Send mail error', { email, to, err: err.message });
    res.status(500).json({ error: 'Failed to send mail: ' + err.message });
  }
});

module.exports = router;
