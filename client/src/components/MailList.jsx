import React from 'react';
import { useLang } from '../contexts/LangContext';

function formatDate(dateStr, timeStr) {
  if (!dateStr) return '';
  const raw = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  const dt = new Date(raw);
  if (isNaN(dt.getTime())) return dateStr;
  const hhmm = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) {
    // 오늘: 시간:분만
    return hhmm;
  }
  // 어제 이전: 년-월-일 시간:분
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} ${hhmm}`;
}

function extractName(sender) {
  if (!sender) return '';
  // "Name <email>" → Name
  const m = sender.match(/^"?([^"<]+)"?\s*</);
  if (m) return m[1].trim();
  return sender.split('@')[0];
}

export default function MailList({ mails, total, page, limit, onSelect, onPageChange, selectedId }) {
  const { t } = useLang();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (!mails || mails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        {t('noMails')}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mail items */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {mails.map((mail) => {
          const isActive = mail.message_id === selectedId;
          return (
            <button
              key={mail.message_id}
              onClick={() => onSelect(mail)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-mail-id', mail.message_id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className={`w-full text-left px-4 py-3 transition cursor-grab active:cursor-grabbing
                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                ${!mail.is_read ? 'font-semibold' : 'font-normal'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800 truncate max-w-[60%]">
                  {extractName(mail.sender)}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                  {formatDate(mail.send_dt || mail.receive_dt, mail.receive_time)}
                </span>
              </div>
              <div className="text-sm text-gray-600 truncate mt-0.5">
                {mail.subject || t('noSubject')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white text-sm">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition"
          >
            {t('prev')}
          </button>
          <span className="text-gray-500">
            {page} {t('of')} {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
