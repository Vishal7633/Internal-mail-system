import { sha256Hex } from '../utils/sha256';

export interface UserRecord {
  id: number;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  department: string;
  createdAt: string;
}

export interface MessageRecord {
  id: number;
  senderId: number;
  receiverId: number | null;
  receiverEmailDraft: string;
  subject: string;
  body: string;
  isRead: boolean;
  isDraft: boolean;
  createdAt: string;
}

export interface JdbcQueryLog {
  id: string;
  timestamp: string;
  daoMethod: string;
  sql: string;
  params: string[];
  rowsAffectedOrReturned: string;
}

export const DEFAULT_DEMO_PASSWORD = 'Password123!';
export const DEFAULT_DEMO_HASH = sha256Hex(DEFAULT_DEMO_PASSWORD);

export const INITIAL_USERS: UserRecord[] = [
  {
    id: 1,
    name: 'Alice Vance',
    username: 'alice',
    email: 'alice@company.internal',
    passwordHash: DEFAULT_DEMO_HASH,
    department: 'Platform Engineering',
    createdAt: '2026-09-15 08:30:00',
  },
  {
    id: 2,
    name: 'Bob Sterling',
    username: 'bob',
    email: 'bob@company.internal',
    passwordHash: DEFAULT_DEMO_HASH,
    department: 'Security Operations',
    createdAt: '2026-09-16 09:10:00',
  },
  {
    id: 3,
    name: 'Charlie Menon',
    username: 'charlie',
    email: 'charlie@company.internal',
    passwordHash: DEFAULT_DEMO_HASH,
    department: 'Product Design',
    createdAt: '2026-09-18 11:00:00',
  },
  {
    id: 4,
    name: 'Diana Kowalski',
    username: 'diana',
    email: 'diana@company.internal',
    passwordHash: DEFAULT_DEMO_HASH,
    department: 'Database Administration',
    createdAt: '2026-09-20 14:25:00',
  },
];

export const INITIAL_MESSAGES: MessageRecord[] = [
  {
    id: 101,
    senderId: 2,
    receiverId: 1,
    receiverEmailDraft: 'alice@company.internal',
    subject: 'Q4 Security Audit & JDBC PreparedStatement Verification',
    body: `Hi Alice,

Our Security Operations team completed the code review of the new Java Swing Internal Mail client.

Key findings:
1. All DAO queries in UserDAO and MessageDAO properly use PreparedStatement parameter binding (?).
2. Passwords are hashed using SHA-256 in SecurityUtils.hashPassword() prior to persistence—no plain-text passwords touch MySQL.
3. DatabaseConnection.java cleanly manages JDBC DriverManager connections with try-with-resources.

Please confirm when we can roll out v1.2 to the engineering floor.

Best regards,
Bob Sterling
Security Operations`,
    isRead: false,
    isDraft: false,
    createdAt: '2026-10-03 09:15:00',
  },
  {
    id: 102,
    senderId: 4,
    receiverId: 1,
    receiverEmailDraft: 'alice@company.internal',
    subject: 'MySQL 8.0 Production Schema & Index Optimization',
    body: `Hello Alice,

I have deployed the composite indexes idx_messages_receiver and idx_messages_sender on internal_mail_db.messages.

Inbox queries filtering by receiver_id and ordering by created_at DESC now execute in under 1.2ms.

Let me know if you need any additional columns for the Drafts module.

Thanks,
Diana Kowalski
Database Administration`,
    isRead: false,
    isDraft: false,
    createdAt: '2026-10-03 10:42:00',
  },
  {
    id: 103,
    senderId: 3,
    receiverId: 1,
    receiverEmailDraft: 'alice@company.internal',
    subject: 'Updated Swing UI Theme Constants & Table Row Height',
    body: `Hi Alice,

I updated UITheme.java so the JTable rows in the Inbox and Sent panels have a clean 38px height, crisp SansSerif typography, and clear status formatting for unread rows.

Try double-clicking or opening a message from the Inbox table—it automatically triggers MessageDAO.updateReadStatus(id, true) and updates the sidebar unread counter.

Cheers,
Charlie Menon
Product Design`,
    isRead: true,
    isDraft: false,
    createdAt: '2026-10-02 16:20:00',
  },
  {
    id: 104,
    senderId: 1,
    receiverId: 2,
    receiverEmailDraft: 'bob@company.internal',
    subject: 'Re: Security Review Schedule for Internal Mail System',
    body: `Hi Bob,

Thanks for scheduling the review. I have pushed the final UserDAO and MessageDAO classes to the repository.

All SQL queries use PreparedStatement and SHA-256 password hashing is enforced on both registration and login.

Best,
Alice Vance
Platform Engineering`,
    isRead: true,
    isDraft: false,
    createdAt: '2026-10-02 14:05:00',
  },
  {
    id: 105,
    senderId: 1,
    receiverId: 4,
    receiverEmailDraft: 'diana@company.internal',
    subject: 'JDBC Connection Parameters for Local Testing',
    body: `Hi Diana,

Could you verify that the default JDBC URL:
jdbc:mysql://localhost:3306/internal_mail_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
works cleanly on fresh MySQL 8 installations in IntelliJ IDEA and VS Code?

Thanks,
Alice Vance`,
    isRead: false,
    isDraft: false,
    createdAt: '2026-10-03 11:05:00',
  },
  {
    id: 106,
    senderId: 1,
    receiverId: 3,
    receiverEmailDraft: 'charlie@company.internal',
    subject: '[Draft] Release Notes for Internal Mail Desktop v1.0',
    body: `Hi Charlie,

Here is the draft announcement for our internal desktop mail client launch:
- Full Inbox, Sent Mail, Compose, and Drafts workflow
- Real-time Read/Unread status tracking
- MySQL 8 persistence with SHA-256 authentication

(Todo: Confirm rollout window with Diana before sending)`,
    isRead: true,
    isDraft: true,
    createdAt: '2026-10-03 11:50:00',
  },
  {
    id: 107,
    senderId: 4,
    receiverId: 2,
    receiverEmailDraft: 'bob@company.internal',
    subject: 'Database Backup & Audit Logs Enabled',
    body: `Hi Bob,

Automated nightly snapshots and binary logs are now active on internal_mail_db. Foreign key constraints with ON DELETE CASCADE have also been verified.

Regards,
Diana Kowalski`,
    isRead: false,
    isDraft: false,
    createdAt: '2026-10-03 08:50:00',
  },
];
