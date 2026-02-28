// ── Mailbox route – /api/mailboxes ──
const express = require('express');
const db = require('../db');
const { logEvent } = require('../middleware/logger');

const router = express.Router();

const DEFAULT_MAILBOXES = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Junk'];

function generateMailboxId() {
  // Random unique value less than 10 digits
  return String(Math.floor(100000000 + Math.random() * 900000000));
}

// List mailboxes for authenticated user
router.get('/', (req, res) => {
  const email = req.user.email;
  logEvent('info', 'Fetch mailboxes', { email });

  try {
    const rows = db.prepare(
      `SELECT mailbox_id, mailbox_name, mailbox_path, mail_count
       FROM MAIL_MAILBOX
       WHERE email = ?
       ORDER BY
         CASE
           WHEN mailbox_path = 'INBOX' OR mailbox_path LIKE 'INBOX.%' THEN 1
           WHEN mailbox_path = 'Sent'  OR mailbox_path LIKE 'Sent.%'  THEN 2
           WHEN mailbox_path = 'Drafts' OR mailbox_path LIKE 'Drafts.%' THEN 3
           WHEN mailbox_path = 'Trash' OR mailbox_path LIKE 'Trash.%' THEN 4
           WHEN mailbox_path = 'Junk'  OR mailbox_path LIKE 'Junk.%'  THEN 5
           ELSE 6
         END,
         mailbox_path`
    ).all(email);

    logEvent('info', 'Mailboxes fetched', { email, count: rows.length });
    res.json(rows);
  } catch (err) {
    logEvent('error', 'Fetch mailboxes error', { email, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new mailbox
router.post('/', (req, res) => {
  const email = req.user.email;
  const { mailbox_name, parent_path } = req.body;

  if (!mailbox_name || !mailbox_name.trim()) {
    return res.status(400).json({ error: 'Mailbox name is required' });
  }

  const name = mailbox_name.trim();

  // Compute mailbox_path
  const mailbox_path = parent_path ? `${parent_path}.${name}` : name;

  logEvent('info', 'Create mailbox', { email, mailbox_name: name, mailbox_path });

  try {
    // Check for duplicate path
    const existing = db.prepare(
      'SELECT mailbox_id FROM MAIL_MAILBOX WHERE email = ? AND mailbox_path = ?'
    ).get(email, mailbox_path);
    if (existing) {
      return res.status(409).json({ error: 'Mailbox already exists' });
    }

    const mailbox_id = generateMailboxId();
    db.prepare(
      `INSERT INTO MAIL_MAILBOX (mailbox_id, email, mailbox_name, mailbox_path)
       VALUES (?, ?, ?, ?)`
    ).run(mailbox_id, email, name, mailbox_path);

    logEvent('info', 'Mailbox created', { email, mailbox_id, mailbox_path });
    res.json({ mailbox_id, mailbox_name: name, mailbox_path, mail_count: 0 });
  } catch (err) {
    logEvent('error', 'Create mailbox error', { email, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a mailbox
router.delete('/:mailbox_id', (req, res) => {
  const email = req.user.email;
  const { mailbox_id } = req.params;

  logEvent('info', 'Delete mailbox request', { email, mailbox_id });

  try {
    // Look up the mailbox
    const mailbox = db.prepare(
      'SELECT mailbox_id, mailbox_name, mailbox_path FROM MAIL_MAILBOX WHERE mailbox_id = ? AND email = ?'
    ).get(mailbox_id, email);
    if (!mailbox) {
      return res.status(404).json({ error: 'Mailbox not found' });
    }

    // Prevent deletion of default mailboxes (top-level only, path has no dot)
    if (DEFAULT_MAILBOXES.includes(mailbox.mailbox_name) && !mailbox.mailbox_path.includes('.')) {
      return res.status(400).json({ error: 'Cannot delete default mailbox' });
    }

    // Delete child mailboxes (path starts with this mailbox's path + '.')
    db.prepare(
      'DELETE FROM MAIL_MAILBOX WHERE email = ? AND mailbox_path LIKE ?'
    ).run(email, `${mailbox.mailbox_path}.%`);

    // Delete the mailbox itself
    db.prepare(
      'DELETE FROM MAIL_MAILBOX WHERE mailbox_id = ? AND email = ?'
    ).run(mailbox_id, email);

    logEvent('info', 'Mailbox deleted', { email, mailbox_id, mailbox_path: mailbox.mailbox_path });
    res.json({ success: true });
  } catch (err) {
    logEvent('error', 'Delete mailbox error', { email, err: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
