// ── Centralised API helper ──
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token expired – force logout
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  getMailboxes: () => request('GET', '/api/mailboxes'),
  getMails: (mailboxId, page = 1, limit = 30) =>
    request('GET', `/api/mails?mailbox_id=${mailboxId}&page=${page}&limit=${limit}`),
  getMail: (messageId) => request('GET', `/api/mails/${encodeURIComponent(messageId)}`),
  sendMail: (data) => request('POST', '/api/send', data),
  createMailbox: (mailbox_name, parent_path) =>
    request('POST', '/api/mailboxes', { mailbox_name, parent_path }),
  deleteMailbox: (mailboxId) => request('DELETE', `/api/mailboxes/${mailboxId}`),
  moveMail: (messageId, targetMailboxId) =>
    request('PUT', `/api/mails/${encodeURIComponent(messageId)}/move`, { target_mailbox_id: targetMailboxId }),
  deleteMail: (messageId) => request('DELETE', `/api/mails/${encodeURIComponent(messageId)}`),
};
