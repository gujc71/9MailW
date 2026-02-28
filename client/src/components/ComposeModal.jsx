import React, { useState } from 'react';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function ComposeModal({ onClose }) {
  const { t } = useLang();
  const { auth } = useAuth();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.sendMail({
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        text: body,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(t('sendError') + ': ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh] rounded-t-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{t('compose')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 space-y-3">
            {/* From (read-only) */}
            <div className="flex items-center gap-2">
              <label className="w-20 text-sm font-medium text-gray-500">{t('from')}:</label>
              <input
                type="text"
                value={auth?.email || ''}
                readOnly
                className="flex-1 px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded"
              />
            </div>

            {/* To */}
            <div className="flex items-center gap-2">
              <label className="w-20 text-sm font-medium text-gray-500">{t('recipient')}:</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="recipient@example.com"
              />
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="px-2 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded transition whitespace-nowrap"
              >
                {t('showCcBcc')}
              </button>
            </div>

            {/* CC / BCC */}
            {showCcBcc && (
              <>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-500">{t('cc')}:</label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-500">{t('bcc')}:</label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2">
              <label className="w-20 text-sm font-medium text-gray-500">{t('mailSubject')}:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder={t('mailBody')}
            />

            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            {success && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{t('sendSuccess')}</div>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
            >
              {sending ? t('loading') : t('send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
