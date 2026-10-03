/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_USERS,
  INITIAL_MESSAGES,
  UserRecord,
  MessageRecord,
  JdbcQueryLog,
} from './data/seedData';
import {
  JAVA_PROJECT_FILES,
  buildDatabaseConnectionCode,
} from './data/javaProjectFiles';
import { sha256Hex } from './utils/sha256';
import { SwingSimulatorView } from './components/SwingSimulatorView';
import { JavaCodeExplorerView } from './components/JavaCodeExplorerView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { IdeSetupGuideView } from './components/IdeSetupGuideView';

type MainSection = 'SIMULATOR' | 'SOURCE_CODE' | 'MYSQL_SCHEMA' | 'SETUP_GUIDE';

const STORAGE_USERS_KEY = 'internal_mail_mysql_users_v1';
const STORAGE_MESSAGES_KEY = 'internal_mail_mysql_messages_v1';

function formatNowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<MainSection>('SIMULATOR');

  const [users, setUsers] = useState<UserRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  const [messages, setMessages] = useState<MessageRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MESSAGES;
  });

  // Pre-sign in as Alice Vance so the user can immediately explore the Dashboard OR logout to test Login/Registration
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(() => {
    return INITIAL_USERS[0];
  });

  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '3306',
    dbName: 'internal_mail_db',
    user: 'root',
    password: 'your_mysql_password',
  });

  const [queryLogs, setQueryLogs] = useState<JdbcQueryLog[]>([
    {
      id: 'init-1',
      timestamp: '09:15:00',
      daoMethod: 'UserDAO.authenticateUser("alice@company.internal", "***")',
      sql: 'SELECT id, name, username, email, password_hash, department, created_at FROM users WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)) AND password_hash = ?',
      params: [
        'alice@company.internal',
        'alice@company.internal',
        '0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e',
      ],
      rowsAffectedOrReturned: '1 row returned (User #1)',
    },
    {
      id: 'init-2',
      timestamp: '09:15:01',
      daoMethod: 'MessageDAO.getInboxMessages(1)',
      sql: 'SELECT m.*, s.name AS sender_name, s.email AS sender_email FROM messages m JOIN users s ON m.sender_id = s.id WHERE m.receiver_id = ? AND m.is_draft = FALSE ORDER BY m.created_at DESC',
      params: ['1'],
      rowsAffectedOrReturned: '3 rows returned',
    },
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const appendLog = (
    daoMethod: string,
    sql: string,
    params: string[],
    rowsAffectedOrReturned: string
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setQueryLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        daoMethod,
        sql,
        params,
        rowsAffectedOrReturned,
      },
      ...prev.slice(0, 29),
    ]);
  };

  // 1. Login Handler (UserDAO.authenticateUser)
  const handleLogin = (identifier: string, plainPassword: string) => {
    const cleanId = identifier.trim();
    if (!cleanId || !plainPassword) {
      return {
        ok: false,
        error: 'Please enter both your email/username and password.',
      };
    }

    const hash = sha256Hex(plainPassword);
    const matched = users.find(
      (u) =>
        (u.email.toLowerCase() === cleanId.toLowerCase() ||
          u.username.toLowerCase() === cleanId.toLowerCase()) &&
        u.passwordHash === hash
    );

    appendLog(
      `UserDAO.authenticateUser("${cleanId}", "***")`,
      'SELECT id, name, username, email, password_hash, department, created_at FROM users WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)) AND password_hash = ?',
      [cleanId, cleanId, hash],
      matched ? `1 row returned (User #${matched.id})` : '0 rows returned (Auth failed)'
    );

    if (!matched) {
      return {
        ok: false,
        error:
          'Invalid email/username or password. Verify credentials or try a sample user (Password123!).',
      };
    }

    setCurrentUser(matched);
    return { ok: true };
  };

  const handleQuickSwitchUser = (user: UserRecord) => {
    setCurrentUser(user);
    appendLog(
      `UserDAO.authenticateUser("${user.email}", "***")`,
      'SELECT id, name, username, email, password_hash, department, created_at FROM users WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)) AND password_hash = ?',
      [user.email, user.email, user.passwordHash],
      `1 row returned (Switched to ${user.name})`
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // 2. Registration Handler (UserDAO.registerUser)
  const handleRegister = (data: {
    name: string;
    username: string;
    email: string;
    department: string;
    password: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanUsername = data.username.trim().toLowerCase();

    const duplicate = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.username.toLowerCase() === cleanUsername
    );

    if (duplicate) {
      appendLog(
        `UserDAO.isEmailOrUsernameTaken("${cleanEmail}", "${cleanUsername}")`,
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)',
        [cleanEmail, cleanUsername],
        '1 row returned (Duplicate found)'
      );
      return {
        ok: false,
        error: 'That email address or username is already registered in MySQL.',
      };
    }

    const passwordHash = sha256Hex(data.password);
    const nextId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const newUser: UserRecord = {
      id: nextId,
      name: data.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      department: data.department.trim() || 'General',
      createdAt: formatNowTimestamp(),
    };

    setUsers((prev) => [...prev, newUser]);

    appendLog(
      `UserDAO.registerUser("${newUser.name}", "${newUser.username}", "${newUser.email}", "***", "${newUser.department}")`,
      'INSERT INTO users (name, username, email, password_hash, department) VALUES (?, ?, ?, ?, ?)',
      [newUser.name, newUser.username, newUser.email, passwordHash, newUser.department],
      `1 row inserted (New User ID #${nextId})`
    );

    return { ok: true };
  };

  // 3. Send Message Handler (MessageDAO.sendMessage)
  const handleSendMessage = (data: {
    receiverEmail: string;
    subject: string;
    body: string;
    draftIdToDelete?: number | null;
  }) => {
    if (!currentUser) {
      return { ok: false, error: 'You must be signed in to send mail.' };
    }

    const cleanReceiverEmail = data.receiverEmail.trim().toLowerCase();
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(cleanReceiverEmail)) {
      return { ok: false, error: 'Please enter a valid receiver email address.' };
    }
    if (!data.subject.trim() || !data.body.trim()) {
      return { ok: false, error: 'Subject and Message body cannot be empty.' };
    }

    const receiver = users.find(
      (u) => u.email.toLowerCase() === cleanReceiverEmail
    );

    appendLog(
      `UserDAO.findByEmail("${cleanReceiverEmail}")`,
      'SELECT id, name, username, email, password_hash, department, created_at FROM users WHERE LOWER(email) = LOWER(?)',
      [cleanReceiverEmail],
      receiver ? `1 row returned (User #${receiver.id})` : '0 rows returned'
    );

    if (!receiver) {
      return {
        ok: false,
        error: `No registered internal user found with email "${cleanReceiverEmail}". Select a valid user chip above or register that account first.`,
      };
    }

    const nextId = messages.reduce((max, m) => Math.max(max, m.id), 100) + 1;
    const newMsg: MessageRecord = {
      id: nextId,
      senderId: currentUser.id,
      receiverId: receiver.id,
      receiverEmailDraft: receiver.email,
      subject: data.subject.trim(),
      body: data.body.trim(),
      isRead: false,
      isDraft: false,
      createdAt: formatNowTimestamp(),
    };

    setMessages((prev) => {
      const filtered = data.draftIdToDelete
        ? prev.filter((m) => m.id !== data.draftIdToDelete)
        : prev;
      return [newMsg, ...filtered];
    });

    appendLog(
      `MessageDAO.sendMessage(${currentUser.id}, ${receiver.id}, "${receiver.email}", "${newMsg.subject}", "...")`,
      'INSERT INTO messages (sender_id, receiver_id, receiver_email_draft, subject, body, is_read, is_draft) VALUES (?, ?, ?, ?, ?, FALSE, FALSE)',
      [
        String(currentUser.id),
        String(receiver.id),
        receiver.email,
        newMsg.subject,
        newMsg.body.slice(0, 48) + (newMsg.body.length > 48 ? '...' : ''),
      ],
      `1 row inserted (Message ID #${nextId})`
    );

    return { ok: true };
  };

  // 4. Save Draft Handler (MessageDAO.saveDraft)
  const handleSaveDraft = (data: {
    receiverEmail: string;
    subject: string;
    body: string;
    existingDraftId?: number | null;
  }) => {
    if (!currentUser) {
      return { ok: false, error: 'Not signed in.' };
    }

    const cleanEmail = data.receiverEmail.trim().toLowerCase();
    const matchedReceiver = cleanEmail
      ? users.find((u) => u.email.toLowerCase() === cleanEmail) || null
      : null;

    const nextId = messages.reduce((max, m) => Math.max(max, m.id), 100) + 1;
    const draftMsg: MessageRecord = {
      id: nextId,
      senderId: currentUser.id,
      receiverId: matchedReceiver ? matchedReceiver.id : null,
      receiverEmailDraft: cleanEmail,
      subject: data.subject.trim() || '(No Subject)',
      body: data.body.trim(),
      isRead: true,
      isDraft: true,
      createdAt: formatNowTimestamp(),
    };

    setMessages((prev) => {
      const withoutOld = data.existingDraftId
        ? prev.filter((m) => m.id !== data.existingDraftId)
        : prev;
      return [draftMsg, ...withoutOld];
    });

    appendLog(
      `MessageDAO.saveDraft(${currentUser.id}, ${matchedReceiver?.id ?? 'null'}, "${cleanEmail}", "${draftMsg.subject}", "...")`,
      'INSERT INTO messages (sender_id, receiver_id, receiver_email_draft, subject, body, is_read, is_draft) VALUES (?, ?, ?, ?, ?, TRUE, TRUE)',
      [
        String(currentUser.id),
        matchedReceiver ? String(matchedReceiver.id) : 'NULL',
        cleanEmail,
        draftMsg.subject,
        draftMsg.body.slice(0, 40),
      ],
      `1 row inserted (Draft ID #${nextId})`
    );

    return { ok: true };
  };

  // 5. Mark Read / Unread Handler (MessageDAO.updateReadStatus)
  const handleUpdateReadStatus = (messageId: number, isRead: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRead } : m))
    );
    appendLog(
      `MessageDAO.updateReadStatus(${messageId}, ${isRead})`,
      'UPDATE messages SET is_read = ? WHERE id = ?',
      [String(isRead).toUpperCase(), String(messageId)],
      '1 row updated'
    );
  };

  // 6. Delete Message Handler (MessageDAO.deleteMessage)
  const handleDeleteMessage = (messageId: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    appendLog(
      `MessageDAO.deleteMessage(${messageId})`,
      'DELETE FROM messages WHERE id = ?',
      [String(messageId)],
      '1 row deleted'
    );
  };

  const handleResetDatabase = () => {
    setUsers(INITIAL_USERS);
    setMessages(INITIAL_MESSAGES);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem(STORAGE_USERS_KEY);
    localStorage.removeItem(STORAGE_MESSAGES_KEY);
    appendLog(
      'Database Reset (schema_and_seed.sql)',
      'DROP TABLE IF EXISTS messages, users; CREATE TABLE users ...; CREATE TABLE messages ...;',
      [],
      'Seeded 4 sample users and 7 sample messages'
    );
  };

  // Download Complete Project Bundle
  const handleDownloadBundle = () => {
    const files = JAVA_PROJECT_FILES.map((f) =>
      f.id === 'db-conn'
        ? { ...f, code: buildDatabaseConnectionCode(dbConfig) }
        : f
    );

    const sections = files
      .map(
        (f) =>
          `================================================================================\nFILE: ${f.relativePath}\nPACKAGE: ${f.packageName}\nDESCRIPTION: ${f.description}\n================================================================================\n\n${f.code}\n\n`
      )
      .join('\n');

    const bundleHeader = `INTERNAL MAIL SYSTEM - COMPLETE JAVA SWING & MYSQL PROJECT BUNDLE
Generated with Configured MySQL Connection:
- Host: ${dbConfig.host}:${dbConfig.port}
- Database: ${dbConfig.dbName}
- User: ${dbConfig.user}

Included Files:
${files.map((f) => `- ${f.relativePath}`).join('\n')}

`;

    const blob = new Blob([bundleHeader + sections], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'InternalMailSystem_JavaSwing_MySQL_Project.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
        {/* Zone 1: Brand Title (Single text element wordmark) */}
        <a
          href="#simulator"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('SIMULATOR');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          InternalMail Swing
        </a>

        {/* Zone 2: 4 Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#simulator"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('SIMULATOR');
            }}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeSection === 'SIMULATOR'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Live Swing App
          </a>
          <a
            href="#source-code"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('SOURCE_CODE');
            }}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeSection === 'SOURCE_CODE'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Java Source Code
          </a>
          <a
            href="#mysql-schema"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('MYSQL_SCHEMA');
            }}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeSection === 'MYSQL_SCHEMA'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            MySQL Schema & Queries
          </a>
          <a
            href="#setup-guide"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('SETUP_GUIDE');
            }}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeSection === 'SETUP_GUIDE'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            IDE & JAR Setup Guide
          </a>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDatabase}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            Reset Sample DB
          </button>
          <button
            onClick={handleDownloadBundle}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Download Project Code
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (visible only on narrow screens) */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {(
          [
            ['SIMULATOR', 'Live Swing App'],
            ['SOURCE_CODE', 'Java Source Code'],
            ['MYSQL_SCHEMA', 'MySQL Schema'],
            ['SETUP_GUIDE', 'IDE Setup Guide'],
          ] as [MainSection, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
              activeSection === id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeSection === 'SIMULATOR' && (
          <SwingSimulatorView
            users={users}
            messages={messages}
            currentUser={currentUser}
            queryLogs={queryLogs}
            onLogin={handleLogin}
            onQuickSwitchUser={handleQuickSwitchUser}
            onLogout={handleLogout}
            onRegister={handleRegister}
            onSendMessage={handleSendMessage}
            onSaveDraft={handleSaveDraft}
            onUpdateReadStatus={handleUpdateReadStatus}
            onDeleteMessage={handleDeleteMessage}
            onClearLogs={() => setQueryLogs([])}
          />
        )}

        {activeSection === 'SOURCE_CODE' && (
          <JavaCodeExplorerView
            dbConfig={dbConfig}
            onDownloadBundle={handleDownloadBundle}
          />
        )}

        {activeSection === 'MYSQL_SCHEMA' && (
          <DatabaseSchemaView
            users={users}
            messages={messages}
            onResetDatabase={handleResetDatabase}
          />
        )}

        {activeSection === 'SETUP_GUIDE' && (
          <IdeSetupGuideView
            dbConfig={dbConfig}
            onChangeDbConfig={setDbConfig}
          />
        )}
      </main>
    </div>
  );
}
