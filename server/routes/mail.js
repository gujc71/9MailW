// ── Mail routes ──
const express = require('express');
const fs = require('fs');
const path = require('path');
const { simpleParser } = require('mailparser');
const db = require('../db');
const config = require('../config');
const { logEvent } = require('../middleware/logger');

const router = express.Router();

// ── GET /api/mails?mailbox_id=xxx&page=1&limit=30 ──
router.get('/', (req, res) => {
  const email = req.user.email;
  const { mailbox_id, page = 1, limit = 30 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  logEvent('info', 'Fetch mail list', { email, mailbox_id, page, limit });

  if (!mailbox_id) {
    return res.status(400).json({ error: 'mailbox_id is required' });
  }

  try {
    // Verify mailbox belongs to user
    const mb = db.prepare(
      'SELECT mailbox_id FROM MAIL_MAILBOX WHERE mailbox_id = ? AND email = ?'
    ).get(mailbox_id, email);
    if (!mb) {
      logEvent('warn', 'Mailbox not found or not owned', { email, mailbox_id });
      return res.status(404).json({ error: 'Mailbox not found' });
    }

    // Total count
    const countRow = db.prepare(
      `SELECT COUNT(*) AS total
       FROM MAIL_MAIL ml
       WHERE ml.mailbox_id = ? AND ml.is_deleted = 0`
    ).get(mailbox_id);
    const total = countRow.total;

    // Mail list
    const rows = db.prepare(
      `SELECT mm.message_id, mm.subject, mm.sender, mm.send_dt,
              mm.recipient, ml.is_read, ml.is_flagged, ml.uid, ml.size,
              ml.receive_dt, ml.receive_time
       FROM MAIL_MAIL ml
       JOIN MAIL_MESSAGE mm ON ml.message_id = mm.message_id
       WHERE ml.mailbox_id = ? AND ml.is_deleted = 0
       ORDER BY ml.receive_dt DESC, ml.receive_time DESC
       LIMIT ? OFFSET ?`
    ).all(mailbox_id, parseInt(limit, 10), offset);

    logEvent('info', 'Mail list fetched', { email, mailbox_id, total, returned: rows.length });
    res.json({ total, page: parseInt(page, 10), limit: parseInt(limit, 10), mails: rows });
  } catch (err) {
    logEvent('error', 'Fetch mail list error', { email, mailbox_id, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/mails/:message_id ── view single mail (parse EML)
router.get('/:message_id', async (req, res) => {
  const email = req.user.email;
  const { message_id } = req.params;
  logEvent('info', 'Fetch mail content', { email, message_id });

  try {
    const mail = db.prepare(
      `SELECT mm.message_id, mm.subject, mm.sender, mm.send_dt,
              mm.recipient, mm.filename,
              ml.is_read, ml.mailbox_id
       FROM MAIL_MAIL ml
       JOIN MAIL_MESSAGE mm ON ml.message_id = mm.message_id
       JOIN MAIL_MAILBOX mb ON ml.mailbox_id = mb.mailbox_id
       WHERE mm.message_id = ? AND mb.email = ?
       LIMIT 1`
    ).get(message_id, email);

    if (!mail) {
      logEvent('warn', 'Mail not found', { email, message_id });
      return res.status(404).json({ error: 'Mail not found' });
    }

    // Mark as read
    db.prepare(
      'UPDATE MAIL_MAIL SET is_read = 1 WHERE message_id = ? AND mailbox_id = ?'
    ).run(message_id, mail.mailbox_id);

    // Parse EML file
    if (!mail.filename) {
      logEvent('warn', 'No EML file for mail', { email, message_id });
      return res.json({ ...mail, html: '', text: 'No content available', attachments: [] });
    }

    const emlPath = path.join(config.maildir, mail.filename);
    logEvent('info', 'Reading EML file', { emlPath });

    if (!fs.existsSync(emlPath)) {
      logEvent('warn', 'EML file not found on disk', { emlPath });
      return res.json({ ...mail, html: '', text: 'EML file not found', attachments: [] });
    }

    const emlData = fs.readFileSync(emlPath);
    const parsed = await simpleParser(emlData);

    const attachments = (parsed.attachments || []).map(a => ({
      filename: a.filename,
      contentType: a.contentType,
      size: a.size,
      cid: a.cid || null,
    }));

    logEvent('info', 'Mail content parsed', { email, message_id, hasHtml: !!parsed.html });
    res.json({
      message_id: mail.message_id,
      subject: parsed.subject || mail.subject,
      sender: mail.sender,
      send_dt: mail.send_dt,
      recipient: mail.recipient,
      from: parsed.from,
      to: parsed.to,
      cc: parsed.cc,
      bcc: parsed.bcc,
      html: parsed.html || '',
      text: parsed.text || '',
      attachments,
    });
  } catch (err) {
    logEvent('error', 'Fetch mail content error', { email, message_id, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/mails/:message_id ── delete mail (remove from MAIL_MAIL)
router.delete('/:message_id', (req, res) => {
  const email = req.user.email;
  const { message_id } = req.params;
  logEvent('info', 'Delete mail', { email, message_id });

  try {
    // Verify mail exists and belongs to user
    const row = db.prepare(
      `SELECT ml.id, ml.mailbox_id
       FROM MAIL_MAIL ml
       JOIN MAIL_MAILBOX mb ON ml.mailbox_id = mb.mailbox_id
       WHERE ml.message_id = ? AND mb.email = ?`
    ).get(message_id, email);
    if (!row) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    const mailboxId = row.mailbox_id;

    // Delete from MAIL_MAIL
    db.prepare(
      'DELETE FROM MAIL_MAIL WHERE message_id = ? AND mailbox_id = ?'
    ).run(message_id, mailboxId);

    // Update mail_count
    db.prepare(
      'UPDATE MAIL_MAILBOX SET mail_count = MAX(0, mail_count - 1) WHERE mailbox_id = ?'
    ).run(mailboxId);

    logEvent('info', 'Mail deleted', { email, message_id, mailbox_id: mailboxId });
    res.json({ success: true });
  } catch (err) {
    logEvent('error', 'Delete mail error', { email, message_id, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/mails/:message_id/move ── move mail to another mailbox
router.put('/:message_id/move', (req, res) => {
  const email = req.user.email;
  const { message_id } = req.params;
  const { target_mailbox_id } = req.body;

  if (!target_mailbox_id) {
    return res.status(400).json({ error: 'target_mailbox_id is required' });
  }

  logEvent('info', 'Move mail', { email, message_id, target_mailbox_id });

  try {
    // Verify target mailbox belongs to user
    const mb = db.prepare(
      'SELECT mailbox_id FROM MAIL_MAILBOX WHERE mailbox_id = ? AND email = ?'
    ).get(target_mailbox_id, email);
    if (!mb) {
      return res.status(404).json({ error: 'Target mailbox not found' });
    }

    // Verify mail exists and belongs to user
    const mailRow = db.prepare(
      `SELECT ml.id, ml.mailbox_id
       FROM MAIL_MAIL ml
       JOIN MAIL_MAILBOX mb ON ml.mailbox_id = mb.mailbox_id
       WHERE ml.message_id = ? AND mb.email = ?`
    ).get(message_id, email);
    if (!mailRow) {
      return res.status(404).json({ error: 'Mail not found' });
    }

    const oldMailboxId = mailRow.mailbox_id;
    if (oldMailboxId === target_mailbox_id) {
      return res.json({ success: true }); // already there
    }

    // Move: update mailbox_id
    db.prepare(
      'UPDATE MAIL_MAIL SET mailbox_id = ? WHERE message_id = ? AND mailbox_id = ?'
    ).run(target_mailbox_id, message_id, oldMailboxId);

    // Update mail_count on both mailboxes
    db.prepare(
      'UPDATE MAIL_MAILBOX SET mail_count = MAX(0, mail_count - 1) WHERE mailbox_id = ?'
    ).run(oldMailboxId);
    db.prepare(
      'UPDATE MAIL_MAILBOX SET mail_count = mail_count + 1 WHERE mailbox_id = ?'
    ).run(target_mailbox_id);

    logEvent('info', 'Mail moved', { email, message_id, from: oldMailboxId, to: target_mailbox_id });
    res.json({ success: true });
  } catch (err) {
    logEvent('error', 'Move mail error', { email, message_id, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/mails/:message_id/attachment/:index ── download attachment
router.get('/:message_id/attachment/:index', async (req, res) => {
  const email = req.user.email;
  const { message_id, index } = req.params;
  logEvent('info', 'Download attachment', { email, message_id, index });

  try {
    const row = db.prepare(
      `SELECT mm.filename
       FROM MAIL_MAIL ml
       JOIN MAIL_MESSAGE mm ON ml.message_id = mm.message_id
       JOIN MAIL_MAILBOX mb ON ml.mailbox_id = mb.mailbox_id
       WHERE mm.message_id = ? AND mb.email = ?
       LIMIT 1`
    ).get(message_id, email);

    if (!row || !row.filename) {
      return res.status(404).json({ error: 'Not found' });
    }

    const emlPath = path.join(config.maildir, row.filename);
    if (!fs.existsSync(emlPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const parsed = await simpleParser(fs.readFileSync(emlPath));
    const att = (parsed.attachments || [])[parseInt(index, 10)];
    if (!att) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.set('Content-Type', att.contentType);
    res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(att.filename)}"`);
    res.send(att.content);
  } catch (err) {
    logEvent('error', 'Download attachment error', { email, message_id, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
