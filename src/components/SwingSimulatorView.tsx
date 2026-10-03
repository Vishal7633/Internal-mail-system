import React, { useState, useMemo } from 'react';
import {
  Mail,
  Send,
  FileText,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Reply,
  CheckCircle2,
  AlertCircle,
  Search,
  UserPlus,
  LogIn,
  Database,
  Eye,
  EyeOff,
  Users,
  X,
  FolderOpen,
} from 'lucide-react';
import {
  UserRecord,
  MessageRecord,
  JdbcQueryLog,
  DEFAULT_DEMO_PASSWORD,
} from '../data/seedData';
import { sha256Hex } from '../utils/sha256';

interface SwingSimulatorViewProps {
  users: UserRecord[];
  messages: MessageRecord[];
  currentUser: UserRecord | null;
  queryLogs: JdbcQueryLog[];
  onLogin: (identifier: string, plainPassword: string) => { ok: boolean; error?: string };
  onQuickSwitchUser: (user: UserRecord) => void;
  onLogout: () => void;
  onRegister: (data: {
    name: string;
    username: string;
    email: string;
    department: string;
    password: string;
  }) => { ok: boolean; error?: string };
  onSendMessage: (data: {
    receiverEmail: string;
    subject: string;
    body: string;
    draftIdToDelete?: number | null;
  }) => { ok: boolean; error?: string };
  onSaveDraft: (data: {
    receiverEmail: string;
    subject: string;
    body: string;
    existingDraftId?: number | null;
  }) => { ok: boolean; error?: string };
  onUpdateReadStatus: (messageId: number, isRead: boolean) => void;
  onDeleteMessage: (messageId: number) => void;
  onClearLogs: () => void;
}

type SwingWindowMode = 'LOGIN' | 'REGISTER' | 'DASHBOARD';
type DashboardCard = 'INBOX' | 'SENT' | 'COMPOSE' | 'DRAFTS' | 'DIRECTORY';
type InboxStatusFilter = 'ALL' | 'UNREAD' | 'READ';

export const SwingSimulatorView: React.FC<SwingSimulatorViewProps> = ({
  users,
  messages,
  currentUser,
  queryLogs,
  onLogin,
  onQuickSwitchUser,
  onLogout,
  onRegister,
  onSendMessage,
  onSaveDraft,
  onUpdateReadStatus,
  onDeleteMessage,
  onClearLogs,
}) => {
  // Window mode tracks LoginFrame vs RegisterFrame vs DashboardFrame
  const [authScreen, setAuthScreen] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [activeCard, setActiveCard] = useState<DashboardCard>('INBOX');

  // LoginFrame State
  const [loginIdentifier, setLoginIdentifier] = useState('alice@company.internal');
  const [loginPassword, setLoginPassword] = useState(DEFAULT_DEMO_PASSWORD);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // RegisterFrame State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('Engineering');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Dashboard Selection & Search State
  const [selectedInboxId, setSelectedInboxId] = useState<number | null>(null);
  const [selectedSentId, setSelectedSentId] = useState<number | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxStatusFilter>('ALL');

  // MessageDetailDialog Modal State
  const [openedMessageId, setOpenedMessageId] = useState<number | null>(null);

  // Compose Mail Form State
  const [composeReceiver, setComposeReceiver] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [composeFeedback, setComposeFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Swing JOptionPane notification banner
  const [swingToast, setSwingToast] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
  } | null>(null);

  const windowMode: SwingWindowMode = currentUser ? 'DASHBOARD' : authScreen;

  // Compute user's Inbox, Sent, and Drafts lists
  const userMap = useMemo(() => {
    const map = new Map<number, UserRecord>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const inboxMessages = useMemo(() => {
    if (!currentUser) return [];
    return messages
      .filter((m) => m.receiverId === currentUser.id && !m.isDraft)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages, currentUser]);

  const filteredInboxMessages = useMemo(() => {
    return inboxMessages.filter((m) => {
      if (inboxFilter === 'UNREAD' && m.isRead) return false;
      if (inboxFilter === 'READ' && !m.isRead) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const sender = userMap.get(m.senderId);
      return (
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (sender?.name.toLowerCase().includes(q) ?? false) ||
        (sender?.email.toLowerCase().includes(q) ?? false)
      );
    });
  }, [inboxMessages, inboxFilter, searchQuery, userMap]);

  const sentMessages = useMemo(() => {
    if (!currentUser) return [];
    return messages
      .filter((m) => m.senderId === currentUser.id && !m.isDraft)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages, currentUser]);

  const filteredSentMessages = useMemo(() => {
    if (!searchQuery.trim()) return sentMessages;
    const q = searchQuery.toLowerCase();
    return sentMessages.filter((m) => {
      const receiver = m.receiverId ? userMap.get(m.receiverId) : null;
      return (
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (receiver?.name.toLowerCase().includes(q) ?? false) ||
        (receiver?.email.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sentMessages, searchQuery, userMap]);

  const draftMessages = useMemo(() => {
    if (!currentUser) return [];
    return messages
      .filter((m) => m.senderId === currentUser.id && m.isDraft)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages, currentUser]);

  const unreadInboxCount = useMemo(
    () => inboxMessages.filter((m) => !m.isRead).length,
    [inboxMessages]
  );

  const openedMessage = useMemo(
    () => messages.find((m) => m.id === openedMessageId) || null,
    [messages, openedMessageId]
  );

  // Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = onLogin(loginIdentifier, loginPassword);
    if (!res.ok) {
      setLoginError(res.error || 'Authentication failed.');
    } else {
      setActiveCard('INBOX');
      setSwingToast(null);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim()) {
      setRegError('Full Name, Username, and Email are required fields.');
      return;
    }
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(regEmail.trim())) {
      setRegError('Please enter a valid email address (e.g., name@company.internal).');
      return;
    }
    if (regPassword.trim().length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    const res = onRegister({
      name: regName,
      username: regUsername,
      email: regEmail,
      department: regDepartment,
      password: regPassword,
    });

    if (!res.ok) {
      setRegError(res.error || 'Registration failed.');
    } else {
      setLoginIdentifier(regEmail.trim().toLowerCase());
      setLoginPassword(regPassword);
      setRegName('');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setAuthScreen('LOGIN');
      setSwingToast({
        title: 'Registration Complete (JOptionPane)',
        message: `Account registered in MySQL with SHA-256 password hash! Credentials pre-filled below—click "Sign In to Mailbox".`,
        type: 'info',
      });
    }
  };

  const openMessageReader = (msg: MessageRecord, markReadIfUnread: boolean) => {
    if (markReadIfUnread && !msg.isRead) {
      onUpdateReadStatus(msg.id, true);
    }
    setOpenedMessageId(msg.id);
  };

  const handleReplyToMessage = (msg: MessageRecord) => {
    const sender = userMap.get(msg.senderId);
    setOpenedMessageId(null);
    setEditingDraftId(null);
    setComposeReceiver(sender ? sender.email : '');
    setComposeSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
    setComposeBody(
      `\n\n--- On ${msg.createdAt}, ${sender?.name || 'Sender'} <${sender?.email || ''}> wrote: ---\n${msg.body}`
    );
    setComposeFeedback(null);
    setActiveCard('COMPOSE');
  };

  const handleResumeDraft = (draft: MessageRecord) => {
    const rec = draft.receiverId ? userMap.get(draft.receiverId) : null;
    setEditingDraftId(draft.id);
    setComposeReceiver(rec ? rec.email : draft.receiverEmailDraft);
    setComposeSubject(draft.subject === '(No Subject)' ? '' : draft.subject);
    setComposeBody(draft.body);
    setComposeFeedback(null);
    setActiveCard('COMPOSE');
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setComposeFeedback(null);

    const res = onSendMessage({
      receiverEmail: composeReceiver,
      subject: composeSubject,
      body: composeBody,
      draftIdToDelete: editingDraftId,
    });

    if (!res.ok) {
      setComposeFeedback({
        type: 'error',
        message: res.error || 'Failed to send message.',
      });
    } else {
      setComposeReceiver('');
      setComposeSubject('');
      setComposeBody('');
      setEditingDraftId(null);
      setSwingToast({
        title: 'Message Sent (JOptionPane.INFORMATION_MESSAGE)',
        message: `Email stored in MySQL messages table via PreparedStatement and delivered to ${composeReceiver.trim()}.`,
        type: 'info',
      });
      setActiveCard('SENT');
    }
  };

  const handleSaveDraftClick = () => {
    setComposeFeedback(null);
    const res = onSaveDraft({
      receiverEmail: composeReceiver,
      subject: composeSubject,
      body: composeBody,
      existingDraftId: editingDraftId,
    });

    if (res.ok) {
      setComposeReceiver('');
      setComposeSubject('');
      setComposeBody('');
      setEditingDraftId(null);
      setSwingToast({
        title: 'Draft Saved (JOptionPane.INFORMATION_MESSAGE)',
        message: 'Draft saved in MySQL messages table with is_draft = TRUE.',
        type: 'info',
      });
      setActiveCard('DRAFTS');
    } else {
      setComposeFeedback({
        type: 'error',
        message: res.error || 'Could not save draft.',
      });
    }
  };

  const frameTitle =
    windowMode === 'LOGIN'
      ? 'javax.swing.JFrame — Internal Mail System - Sign In (LoginFrame.java)'
      : windowMode === 'REGISTER'
      ? 'javax.swing.JFrame — Internal Mail System - User Registration (RegisterFrame.java)'
      : `javax.swing.JFrame — Internal Mail System - ${currentUser?.name} (${currentUser?.email}) (DashboardFrame.java)`;

  return (
    <div className="space-y-6">
      {/* Quick Testing Control Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-slate-900">
            Interactive Java Swing + MySQL Desktop Simulator
          </div>
          <p className="text-xs text-slate-600">
            Test Login, Registration, Inbox, Sent Mail, Compose, and Drafts below, or click any sample user to switch sessions immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Quick Sign-In Sample Users:
          </span>
          {users.map((u) => {
            const isCurrent = currentUser?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => {
                  onQuickSwitchUser(u);
                  setActiveCard('INBOX');
                  setSwingToast(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                  isCurrent
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {u.name.split(' ')[0]} ({u.username})
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulated Java Swing JFrame Window */}
      <div className="bg-[#F8FAFC] border border-slate-300 rounded-lg overflow-hidden shadow-sm">
        {/* Authentic OS / Java Swing JFrame Title Bar */}
        <div className="bg-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono text-slate-200 truncate">
              {frameTitle}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400 hidden sm:block shrink-0">
            JDBC: mysql://localhost:3306/internal_mail_db
          </div>
        </div>

        {/* Swing JOptionPane Toast Banner if active */}
        {swingToast && (
          <div
            className={`px-5 py-3 border-b flex items-center justify-between gap-4 text-xs ${
              swingToast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : swingToast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {swingToast.type === 'info' ? (
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <div>
                <span className="font-semibold">{swingToast.title}: </span>
                <span>{swingToast.message}</span>
              </div>
            </div>
            <button
              onClick={() => setSwingToast(null)}
              className="px-2.5 py-1 font-medium bg-white/80 hover:bg-white border border-slate-300 rounded text-slate-800 whitespace-nowrap"
            >
              OK
            </button>
          </div>
        )}

        {/* WINDOW MODE 1: LOGIN FRAME */}
        {windowMode === 'LOGIN' && (
          <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[540px] bg-[#F8FAFC]">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-7 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Internal Mail System
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in with your internal email or username (validated via MySQL PreparedStatement)
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Authentication Failed (JOptionPane.ERROR_MESSAGE)</div>
                    <div>{loginError}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. alice@company.internal or alice"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 pr-9 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-1.5 text-[11px] font-mono text-slate-500 truncate">
                    SHA-256 Hash: {loginPassword ? sha256Hex(loginPassword).slice(0, 32) + '...' : '(empty)'}
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In to Mailbox
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegError(null);
                      setRegSuccess(null);
                      setAuthScreen('REGISTER');
                    }}
                    className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 rounded transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create New Account
                  </button>
                </div>
              </form>

              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-medium text-slate-600 mb-2">
                  Sample MySQL Accounts (Password: <code className="font-mono font-semibold">Password123!</code>)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {users.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setLoginIdentifier(u.email);
                        setLoginPassword(DEFAULT_DEMO_PASSWORD);
                        setLoginError(null);
                      }}
                      className="text-left px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors truncate"
                    >
                      <span className="font-semibold text-slate-800">{u.username}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-500">{u.department}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WINDOW MODE 2: REGISTER FRAME */}
        {windowMode === 'REGISTER' && (
          <div className="p-8 md:p-10 flex flex-col items-center justify-center min-h-[540px] bg-[#F8FAFC]">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-7 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Register New Account
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create an internal mail account stored in MySQL with SHA-256 password hashing
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
                  {regSuccess}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. elena"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Internal Email Address *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="elena@company.internal"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="Engineering"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-600">
                  <div>SecurityUtils.hashPassword() SHA-256 Preview:</div>
                  <div className="text-slate-900 font-semibold truncate mt-0.5">
                    {regPassword ? sha256Hex(regPassword) : '(Enter password above to preview 64-char hex digest)'}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Complete Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthScreen('LOGIN')}
                    className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 rounded transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* WINDOW MODE 3: DASHBOARD FRAME */}
        {windowMode === 'DASHBOARD' && currentUser && (
          <div className="flex flex-col md:flex-row min-h-[580px]">
            {/* Left Swing Sidebar (240px) */}
            <aside className="w-full md:w-60 bg-[#0F172A] text-white p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-800">
                  <div className="text-lg font-bold tracking-tight text-white">
                    InternalMail
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-1 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {currentUser.email}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setEditingDraftId(null);
                      setComposeReceiver('');
                      setComposeSubject('');
                      setComposeBody('');
                      setComposeFeedback(null);
                      setActiveCard('COMPOSE');
                    }}
                    className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Compose Mail
                  </button>

                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => setActiveCard('INBOX')}
                      className={`w-full py-2.5 px-3.5 text-xs font-medium rounded flex items-center justify-between transition-colors whitespace-nowrap cursor-pointer ${
                        activeCard === 'INBOX'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4" />
                        Inbox
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-300">
                        {unreadInboxCount > 0 ? `${unreadInboxCount} unread` : inboxMessages.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveCard('SENT')}
                      className={`w-full py-2.5 px-3.5 text-xs font-medium rounded flex items-center justify-between transition-colors whitespace-nowrap cursor-pointer ${
                        activeCard === 'SENT'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Send className="w-4 h-4" />
                        Sent Mail
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-400">
                        {sentMessages.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveCard('DRAFTS')}
                      className={`w-full py-2.5 px-3.5 text-xs font-medium rounded flex items-center justify-between transition-colors whitespace-nowrap cursor-pointer ${
                        activeCard === 'DRAFTS'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4" />
                        Drafts
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-400">
                        {draftMessages.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveCard('DIRECTORY')}
                      className={`w-full py-2.5 px-3.5 text-xs font-medium rounded flex items-center justify-between transition-colors whitespace-nowrap cursor-pointer ${
                        activeCard === 'DIRECTORY'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Users className="w-4 h-4" />
                        User Directory
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-400">
                        {users.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <button
                  onClick={() => {
                    onLogout();
                    setAuthScreen('LOGIN');
                  }}
                  className="w-full py-2 px-3.5 bg-slate-800/80 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-semibold rounded flex items-center gap-2.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Session
                </button>
              </div>
            </aside>

            {/* Right CardLayout Workspace */}
            <div className="flex-1 p-6 bg-[#F8FAFC] flex flex-col justify-between min-w-0">
              {/* CARD 1: INBOX */}
              {activeCard === 'INBOX' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Inbox ({inboxMessages.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Click any row to read the full email and mark it as Read in MySQL
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Filter Buttons */}
                      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded">
                        {(['ALL', 'UNREAD', 'READ'] as InboxStatusFilter[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => setInboxFilter(st)}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                              inboxFilter === st
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st === 'ALL' ? 'All' : st === 'UNREAD' ? 'Unread' : 'Read'}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search sender or subject..."
                          className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* JTable for Inbox */}
                  <div className="bg-white border border-slate-200 rounded overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700">
                          <th className="py-2.5 px-3 w-16 font-mono">ID</th>
                          <th className="py-2.5 px-3 w-28">Status</th>
                          <th className="py-2.5 px-3">Sender</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3 w-40 text-right">Date / Time</th>
                          <th className="py-2.5 px-3 w-28 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredInboxMessages.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500">
                              No messages in Inbox matching the current filter.
                            </td>
                          </tr>
                        ) : (
                          filteredInboxMessages.map((msg) => {
                            const sender = userMap.get(msg.senderId);
                            const isSelected = selectedInboxId === msg.id;
                            return (
                              <tr
                                key={msg.id}
                                onClick={() => setSelectedInboxId(msg.id)}
                                onDoubleClick={() => openMessageReader(msg, true)}
                                className={`transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50/90'
                                    : !msg.isRead
                                    ? 'bg-white hover:bg-slate-50 font-semibold text-slate-900'
                                    : 'bg-white hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                                  #{msg.id}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {!msg.isRead ? (
                                    <span className="font-semibold text-blue-700">
                                      Unread
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">Read</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 truncate max-w-[180px]">
                                  {sender ? `${sender.name} <${sender.email}>` : `User #${msg.senderId}`}
                                </td>
                                <td className="py-2.5 px-3 truncate max-w-[260px]">
                                  {msg.subject}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                                  {msg.createdAt}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openMessageReader(msg, true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition-colors"
                                  >
                                    Read Mail
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CARD 2: SENT MAIL */}
              {activeCard === 'SENT' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Sent Mail ({sentMessages.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        All messages sent by {currentUser.name} ({currentUser.email})
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search recipient or subject..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700">
                          <th className="py-2.5 px-3 w-16 font-mono">ID</th>
                          <th className="py-2.5 px-3">To (Receiver)</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3 w-44">Recipient Status</th>
                          <th className="py-2.5 px-3 w-40 text-right">Date / Time</th>
                          <th className="py-2.5 px-3 w-28 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredSentMessages.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500">
                              No sent emails yet. Click "Compose Mail" to send your first message.
                            </td>
                          </tr>
                        ) : (
                          filteredSentMessages.map((msg) => {
                            const receiver = msg.receiverId ? userMap.get(msg.receiverId) : null;
                            const isSelected = selectedSentId === msg.id;
                            return (
                              <tr
                                key={msg.id}
                                onClick={() => setSelectedSentId(msg.id)}
                                onDoubleClick={() => openMessageReader(msg, false)}
                                className={`transition-colors cursor-pointer ${
                                  isSelected ? 'bg-blue-50/90' : 'bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                                  #{msg.id}
                                </td>
                                <td className="py-2.5 px-3 truncate max-w-[200px] font-medium text-slate-900">
                                  {receiver
                                    ? `${receiver.name} <${receiver.email}>`
                                    : msg.receiverEmailDraft}
                                </td>
                                <td className="py-2.5 px-3 truncate max-w-[260px]">
                                  {msg.subject}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                  {msg.isRead ? 'Opened by Recipient' : 'Delivered · Unread'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                                  {msg.createdAt}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openMessageReader(msg, false);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium rounded transition-colors"
                                  >
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CARD 3: DRAFTS */}
              {activeCard === 'DRAFTS' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Saved Drafts ({draftMessages.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Resume editing a saved draft to send it, or discard drafts you no longer need
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700">
                          <th className="py-2.5 px-3 w-16 font-mono">ID</th>
                          <th className="py-2.5 px-3">Draft Recipient</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3 w-40 text-right">Saved At</th>
                          <th className="py-2.5 px-3 w-44 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {draftMessages.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500">
                              No saved drafts. You can save a draft from the "Compose Mail" screen.
                            </td>
                          </tr>
                        ) : (
                          draftMessages.map((draft) => {
                            const rec = draft.receiverId ? userMap.get(draft.receiverId) : null;
                            const isSelected = selectedDraftId === draft.id;
                            return (
                              <tr
                                key={draft.id}
                                onClick={() => setSelectedDraftId(draft.id)}
                                className={`transition-colors ${
                                  isSelected ? 'bg-blue-50/90' : 'bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                                  #{draft.id}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  {rec ? `${rec.name} <${rec.email}>` : draft.receiverEmailDraft || '(Not specified)'}
                                </td>
                                <td className="py-2.5 px-3">{draft.subject}</td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                                  {draft.createdAt}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1.5">
                                  <button
                                    onClick={() => handleResumeDraft(draft)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded transition-colors inline-flex items-center gap-1"
                                  >
                                    <FolderOpen className="w-3 h-3" />
                                    Resume
                                  </button>
                                  <button
                                    onClick={() => onDeleteMessage(draft.id)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-medium rounded transition-colors inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Discard
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CARD 4: COMPOSE MAIL */}
              {activeCard === 'COMPOSE' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {editingDraftId ? `Editing Draft #${editingDraftId}` : 'Compose Internal Mail'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        From: <span className="font-medium text-slate-700">{currentUser.name} &lt;{currentUser.email}&gt;</span>
                      </p>
                    </div>
                  </div>

                  {composeFeedback && (
                    <div
                      className={`p-3 rounded border text-xs flex items-center gap-2 ${
                        composeFeedback.type === 'error'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{composeFeedback.message}</span>
                    </div>
                  )}

                  <form
                    onSubmit={handleSendSubmit}
                    className="bg-white border border-slate-200 rounded p-5 space-y-4 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <label className="text-xs font-semibold text-slate-800">
                            Receiver Email Address *
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400">Quick Select Recipient:</span>
                            {users
                              .filter((u) => u.id !== currentUser.id)
                              .map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => setComposeReceiver(u.email)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded transition-colors font-mono"
                                >
                                  {u.email}
                                </button>
                              ))}
                          </div>
                        </div>
                        <input
                          type="email"
                          value={composeReceiver}
                          onChange={(e) => setComposeReceiver(e.target.value)}
                          placeholder="e.g. bob@company.internal"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          placeholder="Enter email subject line"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Message Body *
                        </label>
                        <textarea
                          rows={8}
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                          placeholder="Write your internal message here..."
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 resize-y"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={handleSaveDraftClick}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 rounded transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Save to Drafts
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Mail Now
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* CARD 5: INTERNAL DIRECTORY */}
              {activeCard === 'DIRECTORY' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Registered MySQL Users Directory ({users.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click "Compose to User" on any colleague to pre-fill their email address in Compose Mail
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700">
                          <th className="py-2.5 px-3 w-16 font-mono">ID</th>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Username</th>
                          <th className="py-2.5 px-3">Internal Email</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                              #{u.id}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {u.name} {u.id === currentUser.id && '(You)'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {u.username}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-blue-700">
                              {u.email}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {u.department}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setEditingDraftId(null);
                                  setComposeReceiver(u.email);
                                  setComposeSubject('');
                                  setComposeBody('');
                                  setComposeFeedback(null);
                                  setActiveCard('COMPOSE');
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition-colors whitespace-nowrap"
                              >
                                Compose to User
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal JDialog for Reading Message (MessageDetailDialog.java) */}
      {openedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-lg max-w-2xl w-full overflow-hidden shadow-xl">
            {/* JDialog Title Bar */}
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-mono truncate">
                javax.swing.JDialog — Message Reader (MessageDetailDialog.java)
              </span>
              <button
                onClick={() => setOpenedMessageId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  {openedMessage.subject}
                </h4>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold">From: </span>
                  {userMap.get(openedMessage.senderId)?.name} &lt;
                  {userMap.get(openedMessage.senderId)?.email}&gt;
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3">
                  <span>
                    <span className="font-semibold">To: </span>
                    {openedMessage.receiverId
                      ? `${userMap.get(openedMessage.receiverId)?.name} <${
                          userMap.get(openedMessage.receiverId)?.email
                        }>`
                      : openedMessage.receiverEmailDraft}
                  </span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">
                    Date: {openedMessage.createdAt}
                  </span>
                  <span>·</span>
                  <span>
                    Status: {openedMessage.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-4 bg-white min-h-[180px] max-h-[280px] overflow-y-auto whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
                {openedMessage.body}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {currentUser && openedMessage.receiverId === currentUser.id && (
                  <>
                    <button
                      onClick={() => handleReplyToMessage(openedMessage)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply to Sender
                    </button>
                    <button
                      onClick={() => {
                        onUpdateReadStatus(openedMessage.id, !openedMessage.isRead);
                        setOpenedMessageId(null);
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 rounded transition-colors cursor-pointer"
                    >
                      {openedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    onDeleteMessage(openedMessage.id);
                    setOpenedMessageId(null);
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Message
                </button>

                <button
                  onClick={() => setOpenedMessageId(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 rounded transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live JDBC PreparedStatement & MySQL Execution Inspector */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold tracking-tight">
              Live JDBC PreparedStatement Execution Log (DAO Layer Trace)
            </span>
          </div>
          <button
            onClick={onClearLogs}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear Log
          </button>
        </div>

        <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto font-mono text-xs">
          {queryLogs.length === 0 ? (
            <div className="p-5 text-center text-slate-500 font-sans">
              Interact with the Swing simulator above (Sign In, Read Mail, Send Mail, Save Draft) to inspect the exact JDBC PreparedStatement queries.
            </div>
          ) : (
            queryLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-blue-700">{log.daoMethod}</span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span>{log.rowsAffectedOrReturned}</span>
                    <span>·</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
                <div className="text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded overflow-x-auto">
                  {log.sql}
                </div>
                {log.params.length > 0 && (
                  <div className="text-[11px] text-slate-600">
                    Bound Parameters (?):{' '}
                    {log.params.map((p, idx) => (
                      <span key={idx} className="mr-3">
                        [{idx + 1}] = <span className="text-emerald-700 font-semibold">"{p}"</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
