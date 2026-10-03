import React, { useState } from 'react';
import { Copy, Check, Download, RotateCcw } from 'lucide-react';
import { SQL_SCHEMA_AND_SEED } from '../data/javaProjectFiles';
import { UserRecord, MessageRecord } from '../data/seedData';

interface DatabaseSchemaViewProps {
  users: UserRecord[];
  messages: MessageRecord[];
  onResetDatabase: () => void;
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({
  users,
  messages,
  onResetDatabase,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_AND_SEED);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 1800);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SQL_SCHEMA_AND_SEED], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema_and_seed.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const preparedStatementsCatalog = [
    {
      dao: 'UserDAO.authenticateUser(identifier, plainPassword)',
      purpose: 'Validates user credentials against email or username and SHA-256 password hash.',
      sql: 'SELECT id, name, username, email, password_hash, department, created_at FROM users WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)) AND password_hash = ?',
    },
    {
      dao: 'UserDAO.registerUser(name, username, email, plainPassword, department)',
      purpose: 'Inserts a newly registered user with a 64-character SHA-256 hex digest.',
      sql: 'INSERT INTO users (name, username, email, password_hash, department) VALUES (?, ?, ?, ?, ?)',
    },
    {
      dao: 'MessageDAO.sendMessage(senderId, receiverId, receiverEmail, subject, body)',
      purpose: 'Stores a sent email in the messages table with is_read = FALSE and is_draft = FALSE.',
      sql: 'INSERT INTO messages (sender_id, receiver_id, receiver_email_draft, subject, body, is_read, is_draft) VALUES (?, ?, ?, ?, ?, FALSE, FALSE)',
    },
    {
      dao: 'MessageDAO.saveDraft(senderId, receiverId, receiverEmailDraft, subject, body)',
      purpose: 'Stores a draft message in the messages table with is_draft = TRUE.',
      sql: 'INSERT INTO messages (sender_id, receiver_id, receiver_email_draft, subject, body, is_read, is_draft) VALUES (?, ?, ?, ?, ?, TRUE, TRUE)',
    },
    {
      dao: 'MessageDAO.getInboxMessages(receiverId)',
      purpose: 'Fetches all received non-draft messages joined with sender and receiver details.',
      sql: 'SELECT m.*, s.name AS sender_name, s.email AS sender_email, r.name AS receiver_name, r.email AS receiver_email FROM messages m JOIN users s ON m.sender_id = s.id JOIN users r ON m.receiver_id = r.id WHERE m.receiver_id = ? AND m.is_draft = FALSE ORDER BY m.created_at DESC',
    },
    {
      dao: 'MessageDAO.getSentMessages(senderId)',
      purpose: 'Fetches all emails sent by the logged-in user ordered by newest first.',
      sql: 'SELECT m.*, s.name AS sender_name, s.email AS sender_email, r.name AS receiver_name, r.email AS receiver_email FROM messages m JOIN users s ON m.sender_id = s.id JOIN users r ON m.receiver_id = r.id WHERE m.sender_id = ? AND m.is_draft = FALSE ORDER BY m.created_at DESC',
    },
    {
      dao: 'MessageDAO.updateReadStatus(messageId, isRead)',
      purpose: 'Marks a message as read (TRUE) when opened in MessageDetailDialog or toggles back to unread.',
      sql: 'UPDATE messages SET is_read = ? WHERE id = ?',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Live MySQL State Inspector */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Live MySQL Relational Tables (internal_mail_db)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Inspect the real-time contents of <code className="font-mono">users</code> and <code className="font-mono">messages</code> as you register users or send mail in the simulator.
            </p>
          </div>
          <button
            onClick={onResetDatabase}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Tables to Initial Seed Data
          </button>
        </div>

        {/* Table 1: users */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800 font-mono">
            TABLE: internal_mail_db.users ({users.length} rows)
          </div>
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-mono text-slate-700">
                  <th className="py-2 px-3">id (PK)</th>
                  <th className="py-2 px-3">name</th>
                  <th className="py-2 px-3">username</th>
                  <th className="py-2 px-3">email</th>
                  <th className="py-2 px-3">password_hash (SHA-256 CHAR(64))</th>
                  <th className="py-2 px-3">department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 tabular-nums text-slate-500">{u.id}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">{u.name}</td>
                    <td className="py-2 px-3 text-slate-700">{u.username}</td>
                    <td className="py-2 px-3 text-blue-700">{u.email}</td>
                    <td className="py-2 px-3 text-emerald-700 max-w-[240px] truncate" title={u.passwordHash}>
                      {u.passwordHash}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600">{u.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: messages */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-slate-800 font-mono">
            TABLE: internal_mail_db.messages ({messages.length} rows)
          </div>
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-mono text-slate-700">
                  <th className="py-2 px-3">id (PK)</th>
                  <th className="py-2 px-3">sender_id (FK)</th>
                  <th className="py-2 px-3">receiver_id (FK)</th>
                  <th className="py-2 px-3">subject</th>
                  <th className="py-2 px-3">is_read</th>
                  <th className="py-2 px-3">is_draft</th>
                  <th className="py-2 px-3 text-right">created_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {messages.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 tabular-nums text-slate-500">{m.id}</td>
                    <td className="py-2 px-3 tabular-nums text-slate-700">{m.senderId}</td>
                    <td className="py-2 px-3 tabular-nums text-slate-700">
                      {m.receiverId ?? 'NULL'}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-900 max-w-[260px] truncate">
                      {m.subject}
                    </td>
                    <td className="py-2 px-3">
                      {m.isRead ? 'TRUE (1)' : 'FALSE (0)'}
                    </td>
                    <td className="py-2 px-3">
                      {m.isDraft ? 'TRUE (1)' : 'FALSE (0)'}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-500">
                      {m.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PreparedStatement Queries Catalog */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            JDBC PreparedStatement SQL Queries Reference
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Every query in <code className="font-mono">UserDAO.java</code> and <code className="font-mono">MessageDAO.java</code> uses parameterized <code className="font-mono">?</code> placeholders to prevent SQL injection.
          </p>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded">
          {preparedStatementsCatalog.map((item) => (
            <div key={item.dao} className="p-4 space-y-1.5">
              <div className="text-xs font-mono font-bold text-blue-700">
                {item.dao}
              </div>
              <p className="text-xs text-slate-600">{item.purpose}</p>
              <pre className="p-2.5 bg-slate-900 text-slate-100 rounded font-mono text-xs overflow-x-auto">
                <code>{item.sql}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Complete SQL Script */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Complete MySQL Database Schema & Seed Script (sql/schema_and_seed.sql)
            </h3>
            <p className="text-xs text-slate-600">
              Run this script in MySQL Workbench, IntelliJ Database Console, or the <code className="font-mono">mysql</code> CLI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied SQL
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy SQL Script
                </>
              )}
            </button>
            <button
              onClick={handleDownloadSql}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .sql
            </button>
          </div>
        </div>
        <pre className="p-5 bg-[#0F172A] text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto max-h-[540px]">
          <code>{SQL_SCHEMA_AND_SEED}</code>
        </pre>
      </div>
    </div>
  );
};
