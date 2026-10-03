-- ============================================================================
-- Internal Mail System - MySQL Database Schema & Sample Seed Data
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS internal_mail_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE internal_mail_db;

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- 1. USERS TABLE
-- Stores registered internal mail users with SHA-256 hashed passwords
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash CHAR(64) NOT NULL COMMENT 'SHA-256 hex digest of password',
    department VARCHAR(80) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. MESSAGES TABLE
-- Stores sent messages, received inbox messages, and saved drafts
-- ============================================================================
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NULL COMMENT 'Nullable when saved as draft without recipient',
    receiver_email_draft VARCHAR(120) DEFAULT '' COMMENT 'Stores draft recipient text before sending',
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_draft BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_messages_receiver (receiver_id, is_draft, created_at),
    INDEX idx_messages_sender (sender_id, is_draft, created_at)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. SAMPLE USERS SEED DATA
-- All sample users share the demo password: Password123!
-- SHA-256('Password123!') = 0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e
-- ============================================================================
INSERT INTO users (name, username, email, password_hash, department) VALUES
('Alice Vance', 'alice', 'alice@company.internal', '0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e', 'Platform Engineering'),
('Bob Sterling', 'bob', 'bob@company.internal', '0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e', 'Security Operations'),
('Charlie Menon', 'charlie', 'charlie@company.internal', '0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e', 'Product Design'),
('Diana Kowalski', 'diana', 'diana@company.internal', '0b14d501a594442a01c6859541bcb3e8164d183d32937b851835442f69d5c94e', 'Database Administration');

-- ============================================================================
-- 4. SAMPLE MESSAGES SEED DATA (Inbox, Sent Mail, and Drafts)
-- ============================================================================
INSERT INTO messages (sender_id, receiver_id, receiver_email_draft, subject, body, is_read, is_draft, created_at) VALUES
(2, 1, 'alice@company.internal', 'Q4 Security Audit & JDBC PreparedStatement Verification',
'Hi Alice,\n\nOur Security Operations team completed the code review of the new Java Swing Internal Mail client.\n\nKey findings:\n1. All DAO queries properly use PreparedStatement parameter binding (?).\n2. Passwords are hashed using SHA-256 prior to persistence.\n3. Connection pooling configuration in DatabaseConnection.java passed stress tests.\n\nPlease confirm when we can roll out v1.2 to the engineering floor.\n\nBest regards,\nBob Sterling\nSecurity Operations',
FALSE, FALSE, '2026-10-03 09:15:00'),

(4, 1, 'alice@company.internal', 'MySQL 8.0 Production Schema & Index Optimization',
'Hello Alice,\n\nI have deployed the composite indexes idx_messages_receiver and idx_messages_sender on internal_mail_db.messages.\n\nInbox queries filtering by receiver_id and ordering by created_at DESC now execute in under 1.2ms.\n\nLet me know if you need any additional columns for the Drafts module.\n\nThanks,\nDiana Kowalski\nDatabase Administration',
FALSE, FALSE, '2026-10-03 10:42:00'),

(3, 1, 'alice@company.internal', 'Updated Swing UI Theme Constants & Table Row Height',
'Hi Alice,\n\nI updated UITheme.java so the JTable rows in the Inbox and Sent panels have a clean 38px height, crisp Inter/Sans typography, and distinct bold styling for unread rows.\n\nTry opening a message from the Inbox table—it automatically triggers MessageDAO.markAsRead() and updates the badge count.\n\nCheers,\nCharlie Menon',
TRUE, FALSE, '2026-10-02 16:20:00'),

(1, 2, 'bob@company.internal', 'Re: Security Review Schedule for Internal Mail System',
'Hi Bob,\n\nThanks for scheduling the review. I have pushed the final UserDAO and MessageDAO classes to the repository.\n\nAll SQL queries use PreparedStatement and no plain-text passwords ever touch the database.\n\nBest,\nAlice Vance',
TRUE, FALSE, '2026-10-02 14:05:00'),

(1, 4, 'diana@company.internal', 'JDBC Connection Parameters for Local Testing',
'Hi Diana,\n\nCould you verify that the default JDBC URL jdbc:mysql://localhost:3306/internal_mail_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC works cleanly on fresh MySQL 8 installations in IntelliJ IDEA and VS Code?\n\nThanks,\nAlice Vance',
FALSE, FALSE, '2026-10-03 11:05:00'),

(1, 3, 'charlie@company.internal', '[Draft] Release Notes for Internal Mail Desktop v1.0',
'Hi Charlie,\n\nHere is the draft announcement for our internal desktop mail client launch:\n- Full Inbox, Sent Mail, Compose, and Drafts workflow\n- Real-time Read/Unread status tracking\n- MySQL 8 persistence with SHA-256 authentication\n\n(Todo: Add screenshot instructions before sending)',
TRUE, TRUE, '2026-10-03 11:50:00');
