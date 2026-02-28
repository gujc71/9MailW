// ── i18n translations ──
const translations = {
  en: {
    // Login
    login: 'Login',
    email: 'Email',
    password: 'Password',
    loginError: 'Invalid email or password',
    language: 'Language',

    // Mailbox names
    INBOX: 'Inbox',
    Sent: 'Sent',
    Drafts: 'Drafts',
    Trash: 'Trash',
    Junk: 'Junk',

    // Mail list
    noMails: 'No mails in this folder',
    page: 'Page',
    of: 'of',
    from: 'From',
    subject: 'Subject',
    date: 'Date',
    noSubject: '(No subject)',

    // Mail view
    to: 'To',
    cc: 'CC',
    bcc: 'BCC',
    attachments: 'Attachments',
    close: 'Close',
    delete: 'Delete',
    move: 'Move',
    moveTo: 'Move to mailbox',
    mailDeleted: 'Mail deleted.',
    mailDeleteError: 'Failed to delete mail.',

    // Compose
    compose: 'Compose',
    send: 'Send',
    cancel: 'Cancel',
    recipient: 'To',
    ccBcc: 'CC/BCC',
    mailSubject: 'Subject',
    mailBody: 'Message',
    sendSuccess: 'Mail sent successfully',
    sendError: 'Failed to send mail',
    showCcBcc: 'CC/BCC',

    // General
    logout: 'Logout',
    mailboxes: 'Mailboxes',
    loading: 'Loading...',
    prev: 'Prev',
    next: 'Next',

    // Mailbox management
    settings: 'Settings',
    createMailbox: 'Create Mailbox',
    deleteMailbox: 'Delete Mailbox',
    mailboxName: 'Mailbox Name',
    createAsChild: 'Create as sub-mailbox',
    create: 'Create',
    cannotDeleteDefault: 'Default mailboxes cannot be deleted.',
    confirmDeleteMailbox: 'Are you sure you want to delete this mailbox?',
    mailboxCreated: 'Mailbox created successfully.',
    mailboxDeleted: 'Mailbox deleted successfully.',
    mailboxCreateError: 'Failed to create mailbox.',
    mailboxDeleteError: 'Failed to delete mailbox.',
    mailMoved: 'Mail moved successfully.',
    mailMoveError: 'Failed to move mail.',
  },
  ko: {
    // Login
    login: '로그인',
    email: '이메일',
    password: '비밀번호',
    loginError: '이메일 또는 비밀번호가 올바르지 않습니다',
    language: '언어',

    // Mailbox names
    INBOX: '받은 편지함',
    Sent: '보낸 편지함',
    Drafts: '임시 저장함',
    Trash: '지운 편지함',
    Junk: '정크 메일',

    // Mail list
    noMails: '이 폴더에 메일이 없습니다',
    page: '페이지',
    of: '/',
    from: '보낸 사람',
    subject: '제목',
    date: '날짜',
    noSubject: '(제목 없음)',

    // Mail view
    to: '받는 사람',
    cc: '참조',
    bcc: '숨은 참조',
    attachments: '첨부파일',
    close: '닫기',
    delete: '삭제',
    move: '이동',
    moveTo: '이동할 메일함 선택',
    mailDeleted: '메일이 삭제되었습니다.',
    mailDeleteError: '메일 삭제에 실패했습니다.',

    // Compose
    compose: '메일 쓰기',
    send: '보내기',
    cancel: '취소',
    recipient: '받는 사람',
    ccBcc: '참조/숨은 참조',
    mailSubject: '제목',
    mailBody: '내용',
    sendSuccess: '메일이 성공적으로 발송되었습니다',
    sendError: '메일 발송에 실패했습니다',
    showCcBcc: '참조/숨은 참조',

    // General
    logout: '로그아웃',
    mailboxes: '메일함',
    loading: '로딩 중...',
    prev: '이전',
    next: '다음',

    // Mailbox management
    settings: '설정',
    createMailbox: '메일함 생성',
    deleteMailbox: '메일함 삭제',
    mailboxName: '메일함 이름',
    createAsChild: '하위 메일함으로 생성',
    create: '생성',
    cannotDeleteDefault: '기본 메일함은 삭제할 수 없습니다.',
    confirmDeleteMailbox: '이 메일함을 삭제하시겠습니까?',
    mailboxCreated: '메일함이 생성되었습니다.',
    mailboxDeleted: '메일함이 삭제되었습니다.',
    mailboxCreateError: '메일함 생성에 실패했습니다.',
    mailboxDeleteError: '메일함 삭제에 실패했습니다.',
    mailMoved: '메일이 이동되었습니다.',
    mailMoveError: '메일 이동에 실패했습니다.',
  },
};

export default translations;
