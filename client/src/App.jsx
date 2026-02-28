import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider, useLang } from './contexts/LangContext';
import LoginPage from './components/LoginPage';
import MailboxList from './components/MailboxList';
import MailList from './components/MailList';
import MailView from './components/MailView';
import ComposeModal from './components/ComposeModal';
import { api } from './api';

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
}

function MainApp() {
  const { auth, logout } = useAuth();
  const { t, lang, changeLang } = useLang();
  const isMobile = useIsMobile();

  const [mailboxes, setMailboxes] = useState([]);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [mails, setMails] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedMail, setSelectedMail] = useState(null);
  const [mailContent, setMailContent] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showMobileMailbox, setShowMobileMailbox] = useState(false);
  const [showMobileMailView, setShowMobileMailView] = useState(false);
  const [loadingMails, setLoadingMails] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const LIMIT = 30;

  // Fetch mailboxes
  const refreshMailboxes = useCallback(async () => {
    try {
      const data = await api.getMailboxes();
      setMailboxes(data);
      return data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    refreshMailboxes().then((data) => {
      const inbox = data.find((m) => m.mailbox_name === 'INBOX') || data[0];
      if (inbox) setSelectedMailbox(inbox);
    });
  }, [refreshMailboxes]);

  // Create mailbox
  const handleCreateMailbox = async (name, parentPath) => {
    try {
      await api.createMailbox(name, parentPath);
      await refreshMailboxes();
    } catch (err) {
      alert(t('mailboxCreateError'));
    }
  };

  // Delete mailbox
  const handleDeleteMailbox = async (mailboxId) => {
    try {
      await api.deleteMailbox(mailboxId);
      const data = await refreshMailboxes();
      // Select INBOX after deletion
      const inbox = data.find((m) => m.mailbox_name === 'INBOX') || data[0];
      if (inbox) {
        setSelectedMailbox(inbox);
        setPage(1);
        setSelectedMail(null);
        setMailContent(null);
      }
    } catch (err) {
      alert(t('mailboxDeleteError'));
    }
  };

  // Move mail to another mailbox
  const handleMoveMail = async (messageId, targetMailboxId) => {
    try {
      await api.moveMail(messageId, targetMailboxId);
      await refreshMailboxes();
      fetchMails();
      // Clear mail view after move
      setSelectedMail(null);
      setMailContent(null);
    } catch (err) {
      alert(t('mailMoveError'));
    }
  };

  // Delete mail
  const handleDeleteMail = async (messageId) => {
    try {
      await api.deleteMail(messageId);
      await refreshMailboxes();
      fetchMails();
      setSelectedMail(null);
      setMailContent(null);
    } catch (err) {
      alert(t('mailDeleteError'));
    }
  };

  // Fetch mails when mailbox or page changes
  const fetchMails = useCallback(() => {
    if (!selectedMailbox) return;
    setLoadingMails(true);
    api.getMails(selectedMailbox.mailbox_id, page, LIMIT)
      .then((data) => {
        setMails(data.mails);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoadingMails(false));
  }, [selectedMailbox, page]);

  useEffect(() => { fetchMails(); }, [fetchMails]);

  // Select mailbox
  const handleSelectMailbox = (mb) => {
    setSelectedMailbox(mb);
    setPage(1);
    setSelectedMail(null);
    setMailContent(null);
    setShowMobileMailbox(false);
  };

  // Select mail
  const handleSelectMail = async (mail) => {
    setSelectedMail(mail);
    setLoadingContent(true);
    if (isMobile) setShowMobileMailView(true);
    try {
      const data = await api.getMail(mail.message_id);
      setMailContent(data);
      // Mark as read in local state
      setMails((prev) =>
        prev.map((m) =>
          m.message_id === mail.message_id ? { ...m, is_read: 1 } : m
        )
      );
    } catch {
      setMailContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCloseMobileMailView = () => {
    setShowMobileMailView(false);
    setMailContent(null);
    setSelectedMail(null);
  };

  // ────────────────── MOBILE LAYOUT ──────────────────
  if (isMobile) {
    // Mail view overlay
    if (showMobileMailView) {
      return (
        <div className="fixed inset-0 z-40 bg-white flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white">
            <button onClick={handleCloseMobileMailView} className="p-1 rounded hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-800 truncate flex-1">
              {mailContent?.subject || t('loading')}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingContent ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">{t('loading')}</div>
            ) : (
              <MailView
                mail={mailContent}
                onDeleteMail={handleDeleteMail}
                onMoveMail={handleMoveMail}
                mailboxes={mailboxes}
              />
            )}
          </div>
          {/* Compose FAB on mail view too */}
          <ComposeFAB onClick={() => setShowCompose(true)} />
          {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileMailbox(!showMobileMailbox)} className="p-1 rounded hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {selectedMailbox ? (t(selectedMailbox.mailbox_name) || selectedMailbox.mailbox_name) : '9Mail'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle lang={lang} changeLang={changeLang} />
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition">
              {t('logout')}
            </button>
          </div>
        </header>

        {/* Mailbox drawer */}
        {showMobileMailbox && (
          <div className="fixed inset-0 z-30 flex">
            <div className="w-64 bg-white shadow-xl h-full overflow-y-auto p-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-800">{t('mailboxes')}</span>
                <button onClick={() => setShowMobileMailbox(false)} className="p-1 rounded hover:bg-gray-100">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <MailboxList
                mailboxes={mailboxes}
                selectedId={selectedMailbox?.mailbox_id}
                onSelect={handleSelectMailbox}
                onCreateMailbox={handleCreateMailbox}
                onDeleteMailbox={handleDeleteMailbox}
                onMoveMail={handleMoveMail}
              />
            </div>
            <div className="flex-1 bg-black/30" onClick={() => setShowMobileMailbox(false)} />
          </div>
        )}

        {/* Mail list */}
        <div className="flex-1 overflow-hidden">
          {loadingMails ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">{t('loading')}</div>
          ) : (
            <MailList
              mails={mails}
              total={total}
              page={page}
              limit={LIMIT}
              selectedId={selectedMail?.message_id}
              onSelect={handleSelectMail}
              onPageChange={setPage}
            />
          )}
        </div>

        {/* Compose FAB */}
        <ComposeFAB onClick={() => setShowCompose(true)} />
        {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
      </div>
    );
  }

  // ────────────────── DESKTOP / TABLET LAYOUT ──────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-blue-600 text-white text-sm font-bold">✉</span>
          <span className="text-lg font-bold text-gray-800">9Mail</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{auth?.email}</span>
          <LangToggle lang={lang} changeLang={changeLang} />
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition">
            {t('logout')}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left – Mailbox list */}
        <aside className="w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto shrink-0 flex flex-col">
          <MailboxList
            mailboxes={mailboxes}
            selectedId={selectedMailbox?.mailbox_id}
            onSelect={handleSelectMailbox}
            onCreateMailbox={handleCreateMailbox}
            onDeleteMailbox={handleDeleteMailbox}
            onMoveMail={handleMoveMail}
          />
        </aside>

        {/* Center – Mail list */}
        <section className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-2 border-b border-gray-100 text-sm font-semibold text-gray-700">
            {selectedMailbox ? (t(selectedMailbox.mailbox_name) || selectedMailbox.mailbox_name) : '—'}
          </div>
          <div className="flex-1 overflow-hidden">
            {loadingMails ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">{t('loading')}</div>
            ) : (
              <MailList
                mails={mails}
                total={total}
                page={page}
                limit={LIMIT}
                selectedId={selectedMail?.message_id}
                onSelect={handleSelectMail}
                onPageChange={setPage}
              />
            )}
          </div>
        </section>

        {/* Right – Mail view */}
        <main className="flex-1 bg-white overflow-hidden">
          {loadingContent ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">{t('loading')}</div>
          ) : (
            <MailView
              mail={mailContent}
              onDeleteMail={handleDeleteMail}
              onMoveMail={handleMoveMail}
              mailboxes={mailboxes}
            />
          )}
        </main>
      </div>

      {/* Compose FAB */}
      <ComposeFAB onClick={() => setShowCompose(true)} />
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
    </div>
  );
}

// ── Floating compose button ──
function ComposeFAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition z-20"
      title="Compose"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}

// ── Language toggle ──
function LangToggle({ lang, changeLang }) {
  return (
    <button
      onClick={() => changeLang(lang === 'ko' ? 'en' : 'ko')}
      className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
    >
      {lang === 'ko' ? 'EN' : '한국어'}
    </button>
  );
}

// ── Root with providers ──
export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </LangProvider>
  );
}

function AppRouter() {
  const { auth } = useAuth();
  return auth ? <MainApp /> : <LoginPage />;
}
