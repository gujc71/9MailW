import React, { useState } from 'react';
import { useLang } from '../contexts/LangContext';

// ── Move-to-mailbox picker modal ──
function MoveMailboxModal({ mailboxes, onSelect, onClose, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('moveTo')}</h3>
        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
          {mailboxes.map((mb) => {
            const depth = (mb.mailbox_path?.match(/\./g) || []).length;
            const label = t(mb.mailbox_name) || mb.mailbox_name;
            return (
              <button
                key={mb.mailbox_id}
                onClick={() => onSelect(mb.mailbox_id)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                style={{ paddingLeft: `${12 + depth * 16}px` }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MailView({ mail, onClose, onDeleteMail, onMoveMail, mailboxes }) {
  const { t } = useLang();
  const [showMoveModal, setShowMoveModal] = useState(false);

  if (!mail) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p>{t('noMails')}</p>
        </div>
      </div>
    );
  }

  const formatAddr = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    if (addr.text) return addr.text;
    if (Array.isArray(addr.value)) return addr.value.map(v => v.address || v.name).join(', ');
    return JSON.stringify(addr);
  };

  const handleDelete = () => {
    if (onDeleteMail) onDeleteMail(mail.message_id);
  };

  const handleMove = (targetMailboxId) => {
    setShowMoveModal(false);
    if (onMoveMail) onMoveMail(mail.message_id, targetMailboxId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Action toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {t('delete')}
        </button>
        <button
          onClick={() => setShowMoveModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          {t('move')}
        </button>
        <div className="flex-1" />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 leading-snug">
          {mail.subject || t('noSubject')}
        </h2>

        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <div><span className="font-medium text-gray-500">{t('from')}:</span> {formatAddr(mail.from) || mail.sender}</div>
          <div><span className="font-medium text-gray-500">{t('to')}:</span> {formatAddr(mail.to) || mail.recipient}</div>
          {mail.cc && (
            <div><span className="font-medium text-gray-500">{t('cc')}:</span> {formatAddr(mail.cc)}</div>
          )}
          <div><span className="font-medium text-gray-500">{t('date')}:</span> {mail.send_dt ? new Date(mail.send_dt).toLocaleString() : ''}</div>
        </div>

        {/* Attachments */}
        {mail.attachments && mail.attachments.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500">{t('attachments')}:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {mail.attachments.map((att, i) => (
                <a
                  key={i}
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/mails/${encodeURIComponent(mail.message_id)}/attachment/${i}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {att.filename}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {mail.html ? (
          <iframe
            title="mail-body"
            srcDoc={mail.html}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
            style={{ minHeight: '400px' }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{mail.text}</pre>
        )}
      </div>

      {/* Move mailbox picker modal */}
      {showMoveModal && (
        <MoveMailboxModal
          mailboxes={mailboxes || []}
          onSelect={handleMove}
          onClose={() => setShowMoveModal(false)}
          t={t}
        />
      )}
    </div>
  );
}
