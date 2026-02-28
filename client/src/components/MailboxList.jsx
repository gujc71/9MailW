import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../contexts/LangContext';

const DEFAULT_MAILBOXES = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Junk'];

// Icons for well-known mailbox names
const ICONS = {
  INBOX: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  Sent: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Drafts: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Junk: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
};

function defaultIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

// Get the top-level mailbox name from a path (e.g., "INBOX.test" → "INBOX")
function getRootName(path) {
  return path ? path.split('.')[0] : '';
}

// Compute indentation depth from mailbox_path
function getDepth(mailbox_path) {
  if (!mailbox_path) return 0;
  return (mailbox_path.match(/\./g) || []).length;
}

// Determine icon: use root mailbox icon for sub-mailboxes of default ones
function getIcon(mb) {
  if (ICONS[mb.mailbox_name]) return ICONS[mb.mailbox_name];
  const root = getRootName(mb.mailbox_path);
  if (ICONS[root]) return defaultIcon();
  return defaultIcon();
}

// ── Create Mailbox Modal ──
function CreateMailboxModal({ onClose, onCreate, selectedMailbox, t }) {
  const [name, setName] = useState('');
  const [asChild, setAsChild] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parentPath = asChild && selectedMailbox ? selectedMailbox.mailbox_path : null;
    onCreate(name.trim(), parentPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-800 mb-4">{t('createMailbox')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">{t('mailboxName')}</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('mailboxName')}
            />
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={asChild}
              onChange={(e) => setAsChild(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">{t('createAsChild')}</span>
          </label>
          {asChild && selectedMailbox && (
            <p className="text-xs text-gray-400 mb-3">
              → {selectedMailbox.mailbox_path}.{name || '...'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition"
            >
              {t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MailboxList({ mailboxes, selectedId, onSelect, onCreateMailbox, onDeleteMailbox, onMoveMail }) {
  const { t } = useLang();
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const selectedMailbox = mailboxes.find((mb) => mb.mailbox_id === selectedId) || null;

  const handleCreate = async (name, parentPath) => {
    if (onCreateMailbox) {
      await onCreateMailbox(name, parentPath);
    }
    setShowCreateModal(false);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!selectedMailbox) return;
    // Prevent deleting top-level default mailboxes
    const isDefault = DEFAULT_MAILBOXES.includes(selectedMailbox.mailbox_name) && !selectedMailbox.mailbox_path.includes('.');
    if (isDefault) {
      alert(t('cannotDeleteDefault'));
      return;
    }
    if (!window.confirm(t('confirmDeleteMailbox'))) return;
    if (onDeleteMailbox) {
      await onDeleteMailbox(selectedMailbox.mailbox_id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-0.5 flex-1">
        {mailboxes.map((mb) => {
          const active = mb.mailbox_id === selectedId;
          const label = t(mb.mailbox_name) || mb.mailbox_name;
          const icon = getIcon(mb);
          const depth = getDepth(mb.mailbox_path);

          return (
            <button
              key={mb.mailbox_id}
              onClick={() => onSelect(mb)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverId(mb.mailbox_id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverId(null);
                const messageId = e.dataTransfer.getData('application/x-mail-id');
                if (messageId && onMoveMail) {
                  onMoveMail(messageId, mb.mailbox_id);
                }
              }}
              className={`flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition
                ${active
                  ? 'bg-blue-100 text-blue-700'
                  : dragOverId === mb.mailbox_id
                    ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-300'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: '12px' }}
            >
              <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
              <span className="flex-1 text-left truncate">{label}</span>
              {mb.mail_count > 0 && (
                <span className="text-xs text-gray-400">{mb.mail_count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings button at bottom */}
      <div className="relative pt-2 border-t border-gray-200 mt-2" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition w-full"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{t('settings')}</span>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute bottom-full left-0 mb-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
            <button
              onClick={() => { setShowMenu(false); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('createMailbox')}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('deleteMailbox')}
            </button>
          </div>
        )}
      </div>

      {/* Create mailbox modal */}
      {showCreateModal && (
        <CreateMailboxModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          selectedMailbox={selectedMailbox}
          t={t}
        />
      )}
    </div>
  );
}
