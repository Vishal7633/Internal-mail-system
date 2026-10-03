export interface JavaSourceFile {
  id: string;
  fileName: string;
  packageName: string;
  relativePath: string;
  category: 'database' | 'model' | 'dao' | 'utils' | 'ui' | 'entry' | 'sql';
  description: string;
  code: string;
}

export function buildDatabaseConnectionCode(config: {
  host: string;
  port: string;
  dbName: string;
  user: string;
  password: string;
}): string {
  return `package com.internalmail.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Manages JDBC connectivity between the Java Swing application and MySQL.
 *
 * HOW TO CONFIGURE:
 * 1. Update DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD below to match
 *    your local MySQL Server installation.
 * 2. Ensure the MySQL Connector/J (.jar) file (e.g., mysql-connector-j-8.3.0.jar)
 *    is added to your project's Classpath / Referenced Libraries.
 */
public class DatabaseConnection {

    private static final String DB_HOST = "${config.host}";
    private static final String DB_PORT = "${config.port}";
    private static final String DB_NAME = "${config.dbName}";

    // Configure your MySQL username and password here:
    private static final String DB_USER = "${config.user}";
    private static final String DB_PASSWORD = "${config.password}";

    private static final String DB_URL = String.format(
            "jdbc:mysql://%s:%s/%s?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
            DB_HOST, DB_PORT, DB_NAME
    );

    static {
        try {
            // Explicitly load MySQL Connector/J JDBC Driver
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("CRITICAL ERROR: MySQL JDBC Driver (Connector/J) not found in classpath.");
            System.err.println("Please add mysql-connector-j-8.x.x.jar to your IDE Project Libraries.");
        }
    }

    private DatabaseConnection() {
        // Utility class
    }

    /**
     * Opens and returns a new JDBC Connection to the MySQL database.
     * Always use within a try-with-resources block so connections close automatically.
     *
     * @return active JDBC Connection
     * @throws SQLException if credentials or database URL are invalid
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    /**
     * Helper method to test connectivity at startup.
     */
    public static boolean testConnection() {
        try (Connection conn = getConnection()) {
            return conn != null && !conn.isClosed();
        } catch (SQLException e) {
            System.err.println("Database connection failed: " + e.getMessage());
            return false;
        }
    }
}
`;
}

export const SQL_SCHEMA_AND_SEED = `-- ============================================================================
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
'Hi Alice,\\n\\nOur Security Operations team completed the code review of the new Java Swing Internal Mail client.\\n\\nKey findings:\\n1. All DAO queries properly use PreparedStatement parameter binding (?).\\n2. Passwords are hashed using SHA-256 prior to persistence.\\n3. Connection pooling configuration in DatabaseConnection.java passed stress tests.\\n\\nPlease confirm when we can roll out v1.2 to the engineering floor.\\n\\nBest regards,\\nBob Sterling\\nSecurity Operations',
FALSE, FALSE, '2026-10-03 09:15:00'),

(4, 1, 'alice@company.internal', 'MySQL 8.0 Production Schema & Index Optimization',
'Hello Alice,\\n\\nI have deployed the composite indexes idx_messages_receiver and idx_messages_sender on internal_mail_db.messages.\\n\\nInbox queries filtering by receiver_id and ordering by created_at DESC now execute in under 1.2ms.\\n\\nLet me know if you need any additional columns for the Drafts module.\\n\\nThanks,\\nDiana Kowalski\\nDatabase Administration',
FALSE, FALSE, '2026-10-03 10:42:00'),

(3, 1, 'alice@company.internal', 'Updated Swing UI Theme Constants & Table Row Height',
'Hi Alice,\\n\\nI updated UITheme.java so the JTable rows in the Inbox and Sent panels have a clean 38px height, crisp SansSerif typography, and distinct bold styling for unread rows.\\n\\nTry opening a message from the Inbox table—it automatically triggers MessageDAO.updateReadStatus() and updates the badge count.\\n\\nCheers,\\nCharlie Menon',
TRUE, FALSE, '2026-10-02 16:20:00'),

(1, 2, 'bob@company.internal', 'Re: Security Review Schedule for Internal Mail System',
'Hi Bob,\\n\\nThanks for scheduling the review. I have pushed the final UserDAO and MessageDAO classes to the repository.\\n\\nAll SQL queries use PreparedStatement and no plain-text passwords ever touch the database.\\n\\nBest,\\nAlice Vance',
TRUE, FALSE, '2026-10-02 14:05:00'),

(1, 4, 'diana@company.internal', 'JDBC Connection Parameters for Local Testing',
'Hi Diana,\\n\\nCould you verify that the default JDBC URL jdbc:mysql://localhost:3306/internal_mail_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC works cleanly on fresh MySQL 8 installations in IntelliJ IDEA and VS Code?\\n\\nThanks,\\nAlice Vance',
FALSE, FALSE, '2026-10-03 11:05:00'),

(1, 3, 'charlie@company.internal', '[Draft] Release Notes for Internal Mail Desktop v1.0',
'Hi Charlie,\\n\\nHere is the draft announcement for our internal desktop mail client launch:\\n- Full Inbox, Sent Mail, Compose, and Drafts workflow\\n- Real-time Read/Unread status tracking\\n- MySQL 8 persistence with SHA-256 authentication\\n\\n(Todo: Add screenshot instructions before sending)',
TRUE, TRUE, '2026-10-03 11:50:00');
`;

export const JAVA_PROJECT_FILES: JavaSourceFile[] = [
  {
    id: 'main',
    fileName: 'Main.java',
    packageName: 'com.internalmail',
    relativePath: 'src/com/internalmail/Main.java',
    category: 'entry',
    description: 'Application entry point. Configures Nimbus Look-and-Feel and launches LoginFrame on the Swing Event Dispatch Thread.',
    code: `package com.internalmail;

import com.internalmail.ui.LoginFrame;

import javax.swing.*;

/**
 * Main Entry Point for the Java Swing + MySQL Internal Mail System.
 */
public class Main {

    public static void main(String[] args) {
        // Configure system or Nimbus Look and Feel for clean modern rendering
        try {
            for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (Exception ignored) {
            // Fallback to default cross-platform look and feel
        }

        // Launch the Swing GUI on the Event Dispatch Thread (EDT)
        SwingUtilities.invokeLater(() -> {
            LoginFrame loginFrame = new LoginFrame();
            loginFrame.setVisible(true);
        });
    }
}
`,
  },
  {
    id: 'db-conn',
    fileName: 'DatabaseConnection.java',
    packageName: 'com.internalmail.database',
    relativePath: 'src/com/internalmail/database/DatabaseConnection.java',
    category: 'database',
    description: 'JDBC connection manager loading com.mysql.cj.jdbc.Driver and opening connections to MySQL.',
    code: buildDatabaseConnectionCode({
      host: 'localhost',
      port: '3306',
      dbName: 'internal_mail_db',
      user: 'root',
      password: 'your_mysql_password',
    }),
  },
  {
    id: 'model-user',
    fileName: 'User.java',
    packageName: 'com.internalmail.model',
    relativePath: 'src/com/internalmail/model/User.java',
    category: 'model',
    description: 'User POJO entity representing rows in the MySQL users table.',
    code: `package com.internalmail.model;

import java.sql.Timestamp;

/**
 * Model representing a registered user in the Internal Mail System.
 */
public class User {
    private int id;
    private String name;
    private String username;
    private String email;
    private String passwordHash;
    private String department;
    private Timestamp createdAt;

    public User() {
    }

    public User(int id, String name, String username, String email, String passwordHash, String department, Timestamp createdAt) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.department = department;
        this.createdAt = createdAt;
    }

    public User(String name, String username, String email, String department) {
        this.name = name;
        this.username = username;
        this.email = email;
        this.department = department;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return name + " <" + email + ">";
    }
}
`,
  },
  {
    id: 'model-message',
    fileName: 'Message.java',
    packageName: 'com.internalmail.model',
    relativePath: 'src/com/internalmail/model/Message.java',
    category: 'model',
    description: 'Message POJO entity representing emails and drafts in the MySQL messages table.',
    code: `package com.internalmail.model;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;

/**
 * Model representing an email message or saved draft in the Internal Mail System.
 */
public class Message {
    private int id;
    private int senderId;
    private String senderName;
    private String senderEmail;
    private Integer receiverId;
    private String receiverName;
    private String receiverEmail;
    private String subject;
    private String body;
    private boolean isRead;
    private boolean isDraft;
    private Timestamp createdAt;

    public Message() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getSenderId() {
        return senderId;
    }

    public void setSenderId(int senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public Integer getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Integer receiverId) {
        this.receiverId = receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverEmail() {
        return receiverEmail;
    }

    public void setReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public boolean isDraft() {
        return isDraft;
    }

    public void setDraft(boolean draft) {
        isDraft = draft;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public String getFormattedDate() {
        if (createdAt == null) {
            return "";
        }
        return new SimpleDateFormat("yyyy-MM-dd HH:mm").format(createdAt);
    }
}
`,
  },
  {
    id: 'dao-user',
    fileName: 'UserDAO.java',
    packageName: 'com.internalmail.dao',
    relativePath: 'src/com/internalmail/dao/UserDAO.java',
    category: 'dao',
    description: 'JDBC Data Access Object for User login authentication, registration, and address lookup using PreparedStatement.',
    code: `package com.internalmail.dao;

import com.internalmail.database.DatabaseConnection;
import com.internalmail.model.User;
import com.internalmail.utils.SecurityUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) for User operations.
 * Uses PreparedStatement exclusively to prevent SQL injection.
 */
public class UserDAO {

    /**
     * Authenticates a user by email or username and plain-text password.
     * Hashes the input password using SHA-256 before querying MySQL.
     */
    public User authenticateUser(String identifier, String plainPassword) throws SQLException {
        String sql = "SELECT id, name, username, email, password_hash, department, created_at " +
                     "FROM users " +
                     "WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)) AND password_hash = ?";

        String hashedPassword = SecurityUtils.hashPassword(plainPassword);

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, identifier.trim());
            stmt.setString(2, identifier.trim());
            stmt.setString(3, hashedPassword);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
        }
        return null;
    }

    /**
     * Registers a new user in the MySQL database with a SHA-256 hashed password.
     */
    public boolean registerUser(String name, String username, String email, String plainPassword, String department) throws SQLException {
        String sql = "INSERT INTO users (name, username, email, password_hash, department) VALUES (?, ?, ?, ?, ?)";
        String hashedPassword = SecurityUtils.hashPassword(plainPassword);

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, name.trim());
            stmt.setString(2, username.trim().toLowerCase());
            stmt.setString(3, email.trim().toLowerCase());
            stmt.setString(4, hashedPassword);
            stmt.setString(5, department == null || department.trim().isEmpty() ? "General" : department.trim());

            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        }
    }

    /**
     * Checks if an email or username is already registered.
     */
    public boolean isEmailOrUsernameTaken(String email, String username) throws SQLException {
        String sql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim());
            stmt.setString(2, username.trim());

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * Finds a user by their email address (used when validating recipient in Compose Mail).
     */
    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT id, name, username, email, password_hash, department, created_at " +
                     "FROM users WHERE LOWER(email) = LOWER(?)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToUser(rs);
                }
            }
        }
        return null;
    }

    /**
     * Returns all registered users for the internal address book.
     */
    public List<User> getAllUsers() throws SQLException {
        List<User> users = new ArrayList<>();
        String sql = "SELECT id, name, username, email, password_hash, department, created_at FROM users ORDER BY name ASC";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                users.add(mapResultSetToUser(rs));
            }
        }
        return users;
    }

    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        return new User(
                rs.getInt("id"),
                rs.getString("name"),
                rs.getString("username"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("department"),
                rs.getTimestamp("created_at")
        );
    }
}
`,
  },
  {
    id: 'dao-message',
    fileName: 'MessageDAO.java',
    packageName: 'com.internalmail.dao',
    relativePath: 'src/com/internalmail/dao/MessageDAO.java',
    category: 'dao',
    description: 'JDBC Data Access Object for Inbox, Sent Mail, Drafts, Compose Mail, Read/Unread updates, and Delete.',
    code: `package com.internalmail.dao;

import com.internalmail.database.DatabaseConnection;
import com.internalmail.model.Message;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) for Message operations (Inbox, Sent Mail, Compose, Drafts).
 * Uses PreparedStatement for all SQL queries to prevent SQL injection.
 */
public class MessageDAO {

    /**
     * Sends a new email message and stores it in the MySQL messages table.
     */
    public boolean sendMessage(int senderId, int receiverId, String receiverEmail, String subject, String body) throws SQLException {
        String sql = "INSERT INTO messages (sender_id, receiver_id, receiver_email_draft, subject, body, is_read, is_draft) " +
                     "VALUES (?, ?, ?, ?, ?, FALSE, FALSE)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, senderId);
            stmt.setInt(2, receiverId);
            stmt.setString(3, receiverEmail.trim());
            stmt.setString(4, subject.trim());
            stmt.setString(5, body.trim());

            return stmt.executeUpdate() > 0;
        }
    }

    /**
     * Saves a message as a draft in the database.
     */
    public boolean saveDraft(int senderId, Integer receiverId, String receiverEmailDraft, String subject, String body) throws SQLException {
        String sql = "INSERT INTO messages (sender_id, receiver_id, receiver_email_draft, subject, body, is_read, is_draft) " +
                     "VALUES (?, ?, ?, ?, ?, TRUE, TRUE)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, senderId);
            if (receiverId != null) {
                stmt.setInt(2, receiverId);
            } else {
                stmt.setNull(2, Types.INTEGER);
            }
            stmt.setString(3, receiverEmailDraft == null ? "" : receiverEmailDraft.trim());
            stmt.setString(4, subject == null || subject.trim().isEmpty() ? "(No Subject)" : subject.trim());
            stmt.setString(5, body == null ? "" : body.trim());

            return stmt.executeUpdate() > 0;
        }
    }

    /**
     * Retrieves all received (Inbox) emails for a user ordered by newest first.
     */
    public List<Message> getInboxMessages(int receiverId) throws SQLException {
        List<Message> list = new ArrayList<>();
        String sql = "SELECT m.id, m.sender_id, s.name AS sender_name, s.email AS sender_email, " +
                     "m.receiver_id, r.name AS receiver_name, r.email AS receiver_email, " +
                     "m.subject, m.body, m.is_read, m.is_draft, m.created_at " +
                     "FROM messages m " +
                     "JOIN users s ON m.sender_id = s.id " +
                     "JOIN users r ON m.receiver_id = r.id " +
                     "WHERE m.receiver_id = ? AND m.is_draft = FALSE " +
                     "ORDER BY m.created_at DESC";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, receiverId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToMessage(rs));
                }
            }
        }
        return list;
    }

    /**
     * Retrieves all sent emails by the logged-in user ordered by newest first.
     */
    public List<Message> getSentMessages(int senderId) throws SQLException {
        List<Message> list = new ArrayList<>();
        String sql = "SELECT m.id, m.sender_id, s.name AS sender_name, s.email AS sender_email, " +
                     "m.receiver_id, r.name AS receiver_name, r.email AS receiver_email, " +
                     "m.subject, m.body, m.is_read, m.is_draft, m.created_at " +
                     "FROM messages m " +
                     "JOIN users s ON m.sender_id = s.id " +
                     "JOIN users r ON m.receiver_id = r.id " +
                     "WHERE m.sender_id = ? AND m.is_draft = FALSE " +
                     "ORDER BY m.created_at DESC";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, senderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToMessage(rs));
                }
            }
        }
        return list;
    }

    /**
     * Retrieves all saved drafts for the logged-in user.
     */
    public List<Message> getDraftMessages(int senderId) throws SQLException {
        List<Message> list = new ArrayList<>();
        String sql = "SELECT m.id, m.sender_id, s.name AS sender_name, s.email AS sender_email, " +
                     "m.receiver_id, COALESCE(r.name, 'Draft Recipient') AS receiver_name, " +
                     "COALESCE(r.email, m.receiver_email_draft) AS receiver_email, " +
                     "m.subject, m.body, m.is_read, m.is_draft, m.created_at " +
                     "FROM messages m " +
                     "JOIN users s ON m.sender_id = s.id " +
                     "LEFT JOIN users r ON m.receiver_id = r.id " +
                     "WHERE m.sender_id = ? AND m.is_draft = TRUE " +
                     "ORDER BY m.created_at DESC";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, senderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToMessage(rs));
                }
            }
        }
        return list;
    }

    /**
     * Updates the read/unread status of a message.
     */
    public boolean updateReadStatus(int messageId, boolean isRead) throws SQLException {
        String sql = "UPDATE messages SET is_read = ? WHERE id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setBoolean(1, isRead);
            stmt.setInt(2, messageId);
            return stmt.executeUpdate() > 0;
        }
    }

    /**
     * Deletes a message or draft by ID.
     */
    public boolean deleteMessage(int messageId) throws SQLException {
        String sql = "DELETE FROM messages WHERE id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, messageId);
            return stmt.executeUpdate() > 0;
        }
    }

    private Message mapResultSetToMessage(ResultSet rs) throws SQLException {
        Message msg = new Message();
        msg.setId(rs.getInt("id"));
        msg.setSenderId(rs.getInt("sender_id"));
        msg.setSenderName(rs.getString("sender_name"));
        msg.setSenderEmail(rs.getString("sender_email"));
        int recId = rs.getInt("receiver_id");
        msg.setReceiverId(rs.wasNull() ? null : recId);
        msg.setReceiverName(rs.getString("receiver_name"));
        msg.setReceiverEmail(rs.getString("receiver_email"));
        msg.setSubject(rs.getString("subject"));
        msg.setBody(rs.getString("body"));
        msg.setRead(rs.getBoolean("is_read"));
        msg.setDraft(rs.getBoolean("is_draft"));
        msg.setCreatedAt(rs.getTimestamp("created_at"));
        return msg;
    }
}
`,
  },
  {
    id: 'utils-security',
    fileName: 'SecurityUtils.java',
    packageName: 'com.internalmail.utils',
    relativePath: 'src/com/internalmail/utils/SecurityUtils.java',
    category: 'utils',
    description: 'Password hashing with SHA-256 (MessageDigest) and email/input validation helpers.',
    code: `package com.internalmail.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Pattern;

/**
 * Security utilities for password hashing (SHA-256) and user input validation.
 */
public class SecurityUtils {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$"
    );

    private SecurityUtils() {
    }

    /**
     * Hashes a plain-text password using SHA-256 and returns a 64-character hexadecimal string.
     * Ensures plain-text passwords are never stored or compared directly in MySQL.
     */
    public static String hashPassword(String plainPassword) {
        if (plainPassword == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(plainPassword.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedHash.length);
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Validates whether the given string is a properly formatted email address.
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Validates password strength (minimum 6 characters).
     */
    public static boolean isValidPassword(String password) {
        return password != null && password.trim().length() >= 6;
    }

    /**
     * Checks if a required text field is non-empty.
     */
    public static boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
`,
  },
  {
    id: 'utils-theme',
    fileName: 'UITheme.java',
    packageName: 'com.internalmail.utils',
    relativePath: 'src/com/internalmail/utils/UITheme.java',
    category: 'utils',
    description: 'Modern Java Swing color palette, typography constants, styled JButton/JTextField builders, and JTable renderer.',
    code: `package com.internalmail.utils;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.JTableHeader;
import java.awt.*;

/**
 * Centralized UI theme constants and component factory methods for a modern, clean Java Swing look.
 */
public class UITheme {

    // Color Palette
    public static final Color BG_CANVAS = new Color(248, 250, 252);       // #F8FAFC
    public static final Color BG_SURFACE = new Color(255, 255, 255);      // #FFFFFF
    public static final Color BG_SIDEBAR = new Color(15, 23, 42);         // #0F172A
    public static final Color BG_SIDEBAR_ACTIVE = new Color(30, 41, 59);  // #1E293B
    public static final Color PRIMARY_ACCENT = new Color(37, 99, 235);    // #2563EB
    public static final Color PRIMARY_HOVER = new Color(29, 78, 216);     // #1D4ED8
    public static final Color TEXT_PRIMARY = new Color(15, 23, 42);       // #0F172A
    public static final Color TEXT_SECONDARY = new Color(100, 116, 139);  // #64748B
    public static final Color BORDER_COLOR = new Color(226, 232, 240);    // #E2E8F0
    public static final Color DANGER_COLOR = new Color(220, 38, 38);      // #DC2626
    public static final Color SUCCESS_COLOR = new Color(22, 163, 74);     // #16A34A

    // Fonts
    public static final Font FONT_TITLE = new Font("SansSerif", Font.BOLD, 22);
    public static final Font FONT_SUBTITLE = new Font("SansSerif", Font.BOLD, 15);
    public static final Font FONT_BODY = new Font("SansSerif", Font.PLAIN, 13);
    public static final Font FONT_BODY_BOLD = new Font("SansSerif", Font.BOLD, 13);
    public static final Font FONT_SMALL = new Font("SansSerif", Font.PLAIN, 12);
    public static final Font FONT_MONO = new Font("Monospaced", Font.PLAIN, 12);

    private UITheme() {
    }

    public static JButton createPrimaryButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_BODY_BOLD);
        btn.setBackground(PRIMARY_ACCENT);
        btn.setForeground(Color.WHITE);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setOpaque(true);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(9, 18, 9, 18));
        return btn;
    }

    public static JButton createSecondaryButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_BODY_BOLD);
        btn.setBackground(BG_SURFACE);
        btn.setForeground(TEXT_PRIMARY);
        btn.setFocusPainted(false);
        btn.setOpaque(true);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1),
                new EmptyBorder(8, 16, 8, 16)
        ));
        return btn;
    }

    public static JButton createDangerButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_BODY_BOLD);
        btn.setBackground(DANGER_COLOR);
        btn.setForeground(Color.WHITE);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setOpaque(true);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(8, 16, 8, 16));
        return btn;
    }

    public static JTextField createStyledTextField() {
        JTextField field = new JTextField();
        field.setFont(FONT_BODY);
        field.setForeground(TEXT_PRIMARY);
        field.setBackground(BG_SURFACE);
        field.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1),
                new EmptyBorder(8, 10, 8, 10)
        ));
        return field;
    }

    public static JPasswordField createStyledPasswordField() {
        JPasswordField field = new JPasswordField();
        field.setFont(FONT_BODY);
        field.setForeground(TEXT_PRIMARY);
        field.setBackground(BG_SURFACE);
        field.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1),
                new EmptyBorder(8, 10, 8, 10)
        ));
        return field;
    }

    public static void styleTable(JTable table) {
        table.setFont(FONT_BODY);
        table.setRowHeight(38);
        table.setShowVerticalLines(false);
        table.setGridColor(BORDER_COLOR);
        table.setSelectionBackground(new Color(239, 246, 255));
        table.setSelectionForeground(TEXT_PRIMARY);
        table.setIntercellSpacing(new Dimension(0, 1));

        JTableHeader header = table.getTableHeader();
        header.setFont(FONT_BODY_BOLD);
        header.setBackground(new Color(241, 245, 249));
        header.setForeground(TEXT_PRIMARY);
        header.setPreferredSize(new Dimension(header.getWidth(), 38));

        DefaultTableCellRenderer cellRenderer = new DefaultTableCellRenderer();
        cellRenderer.setBorder(new EmptyBorder(0, 12, 0, 12));
        for (int i = 0; i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setCellRenderer(cellRenderer);
        }
    }
}
`,
  },
  {
    id: 'ui-login',
    fileName: 'LoginFrame.java',
    packageName: 'com.internalmail.ui',
    relativePath: 'src/com/internalmail/ui/LoginFrame.java',
    category: 'ui',
    description: 'Java Swing Login JFrame with Email/Username & Password validation, error handling, and Registration navigation.',
    code: `package com.internalmail.ui;

import com.internalmail.dao.UserDAO;
import com.internalmail.model.User;
import com.internalmail.utils.SecurityUtils;
import com.internalmail.utils.UITheme;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.sql.SQLException;

/**
 * Java Swing Login Window (JFrame).
 * Authenticates users with Email/Username and Password against MySQL using UserDAO.
 */
public class LoginFrame extends JFrame {

    private final JTextField identifierField;
    private final JPasswordField passwordField;
    private final JLabel statusLabel;
    private final UserDAO userDAO;

    public LoginFrame() {
        this.userDAO = new UserDAO();

        setTitle("Internal Mail System - Sign In");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(460, 520);
        setLocationRelativeTo(null);
        setResizable(false);

        JPanel rootPanel = new JPanel(new BorderLayout());
        rootPanel.setBackground(UITheme.BG_CANVAS);
        rootPanel.setBorder(new EmptyBorder(32, 36, 32, 36));

        JPanel cardPanel = new JPanel();
        cardPanel.setLayout(new BoxLayout(cardPanel, BoxLayout.Y_AXIS));
        cardPanel.setBackground(UITheme.BG_SURFACE);
        cardPanel.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(UITheme.BORDER_COLOR, 1),
                new EmptyBorder(28, 28, 28, 28)
        ));

        JLabel titleLabel = new JLabel("Internal Mail System");
        titleLabel.setFont(UITheme.FONT_TITLE);
        titleLabel.setForeground(UITheme.TEXT_PRIMARY);
        titleLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel subtitleLabel = new JLabel("Sign in with your internal email or username");
        subtitleLabel.setFont(UITheme.FONT_BODY);
        subtitleLabel.setForeground(UITheme.TEXT_SECONDARY);
        subtitleLabel.setBorder(new EmptyBorder(6, 0, 20, 0));
        subtitleLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        statusLabel = new JLabel(" ");
        statusLabel.setFont(UITheme.FONT_SMALL);
        statusLabel.setForeground(UITheme.DANGER_COLOR);
        statusLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        statusLabel.setBorder(new EmptyBorder(0, 0, 10, 0));

        JLabel idLabel = new JLabel("Email or Username");
        idLabel.setFont(UITheme.FONT_BODY_BOLD);
        idLabel.setForeground(UITheme.TEXT_PRIMARY);
        idLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        identifierField = UITheme.createStyledTextField();
        identifierField.setMaximumSize(new Dimension(Integer.MAX_VALUE, 38));
        identifierField.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel passLabel = new JLabel("Password");
        passLabel.setFont(UITheme.FONT_BODY_BOLD);
        passLabel.setForeground(UITheme.TEXT_PRIMARY);
        passLabel.setBorder(new EmptyBorder(14, 0, 4, 0));
        passLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        passwordField = UITheme.createStyledPasswordField();
        passwordField.setMaximumSize(new Dimension(Integer.MAX_VALUE, 38));
        passwordField.setAlignmentX(Component.LEFT_ALIGNMENT);

        JButton loginButton = UITheme.createPrimaryButton("Sign In to Mailbox");
        loginButton.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        loginButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        loginButton.addActionListener(e -> handleLogin());

        JButton registerButton = UITheme.createSecondaryButton("Create New Account");
        registerButton.setMaximumSize(new Dimension(Integer.MAX_VALUE, 38));
        registerButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        registerButton.addActionListener(e -> openRegistrationFrame());

        getRootPane().setDefaultButton(loginButton);

        cardPanel.add(titleLabel);
        cardPanel.add(subtitleLabel);
        cardPanel.add(statusLabel);
        cardPanel.add(idLabel);
        cardPanel.add(Box.createVerticalStrut(4));
        cardPanel.add(identifierField);
        cardPanel.add(passLabel);
        cardPanel.add(passwordField);
        cardPanel.add(Box.createVerticalStrut(22));
        cardPanel.add(loginButton);
        cardPanel.add(Box.createVerticalStrut(10));
        cardPanel.add(registerButton);

        rootPanel.add(cardPanel, BorderLayout.CENTER);
        setContentPane(rootPanel);
    }

    private void handleLogin() {
        String identifier = identifierField.getText().trim();
        String password = new String(passwordField.getPassword());

        if (!SecurityUtils.isNotBlank(identifier) || !SecurityUtils.isNotBlank(password)) {
            statusLabel.setText("Please enter both email/username and password.");
            JOptionPane.showMessageDialog(this,
                    "Please enter both your email/username and password.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        try {
            User authenticatedUser = userDAO.authenticateUser(identifier, password);
            if (authenticatedUser != null) {
                DashboardFrame dashboard = new DashboardFrame(authenticatedUser);
                dashboard.setVisible(true);
                dispose();
            } else {
                statusLabel.setText("Invalid email/username or password.");
                JOptionPane.showMessageDialog(this,
                        "Invalid credentials. Please verify your email/username and password.",
                        "Authentication Failed",
                        JOptionPane.ERROR_MESSAGE);
            }
        } catch (SQLException ex) {
            statusLabel.setText("Database error: check MySQL connection.");
            JOptionPane.showMessageDialog(this,
                    "Database Error: " + ex.getMessage() + "\\nVerify DatabaseConnection.java settings.",
                    "MySQL Connection Error",
                    JOptionPane.ERROR_MESSAGE);
        }
    }

    private void openRegistrationFrame() {
        RegisterFrame registerFrame = new RegisterFrame(this);
        registerFrame.setVisible(true);
        this.setVisible(false);
    }
}
`,
  },
  {
    id: 'ui-register',
    fileName: 'RegisterFrame.java',
    packageName: 'com.internalmail.ui',
    relativePath: 'src/com/internalmail/ui/RegisterFrame.java',
    category: 'ui',
    description: 'Java Swing Registration JFrame validating Name, Username, Email, and Password before hashing and storing in MySQL.',
    code: `package com.internalmail.ui;

import com.internalmail.dao.UserDAO;
import com.internalmail.utils.SecurityUtils;
import com.internalmail.utils.UITheme;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.sql.SQLException;

/**
 * Java Swing User Registration Window (JFrame).
 * Validates Name, Email, Username, and Password, then stores SHA-256 hash in MySQL.
 */
public class RegisterFrame extends JFrame {

    private final LoginFrame parentLoginFrame;
    private final UserDAO userDAO;

    private final JTextField nameField;
    private final JTextField usernameField;
    private final JTextField emailField;
    private final JTextField departmentField;
    private final JPasswordField passwordField;
    private final JPasswordField confirmPasswordField;

    public RegisterFrame(LoginFrame parentLoginFrame) {
        this.parentLoginFrame = parentLoginFrame;
        this.userDAO = new UserDAO();

        setTitle("Internal Mail System - User Registration");
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setSize(500, 620);
        setLocationRelativeTo(null);
        setResizable(false);

        JPanel rootPanel = new JPanel(new BorderLayout());
        rootPanel.setBackground(UITheme.BG_CANVAS);
        rootPanel.setBorder(new EmptyBorder(24, 32, 24, 32));

        JPanel cardPanel = new JPanel();
        cardPanel.setLayout(new BoxLayout(cardPanel, BoxLayout.Y_AXIS));
        cardPanel.setBackground(UITheme.BG_SURFACE);
        cardPanel.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(UITheme.BORDER_COLOR, 1),
                new EmptyBorder(24, 28, 24, 28)
        ));

        JLabel titleLabel = new JLabel("Register New Account");
        titleLabel.setFont(UITheme.FONT_TITLE);
        titleLabel.setForeground(UITheme.TEXT_PRIMARY);
        titleLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel subLabel = new JLabel("Create an internal mail account stored securely in MySQL");
        subLabel.setFont(UITheme.FONT_BODY);
        subLabel.setForeground(UITheme.TEXT_SECONDARY);
        subLabel.setBorder(new EmptyBorder(4, 0, 16, 0));
        subLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        nameField = UITheme.createStyledTextField();
        usernameField = UITheme.createStyledTextField();
        emailField = UITheme.createStyledTextField();
        departmentField = UITheme.createStyledTextField();
        passwordField = UITheme.createStyledPasswordField();
        confirmPasswordField = UITheme.createStyledPasswordField();

        cardPanel.add(titleLabel);
        cardPanel.add(subLabel);
        addFormField(cardPanel, "Full Name *", nameField);
        addFormField(cardPanel, "Username *", usernameField);
        addFormField(cardPanel, "Internal Email Address *", emailField);
        addFormField(cardPanel, "Department", departmentField);
        addFormField(cardPanel, "Password (min 6 characters) *", passwordField);
        addFormField(cardPanel, "Confirm Password *", confirmPasswordField);

        cardPanel.add(Box.createVerticalStrut(18));

        JButton registerBtn = UITheme.createPrimaryButton("Complete Registration");
        registerBtn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        registerBtn.setAlignmentX(Component.LEFT_ALIGNMENT);
        registerBtn.addActionListener(e -> handleRegister());

        JButton backBtn = UITheme.createSecondaryButton("Back to Sign In");
        backBtn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 38));
        backBtn.setAlignmentX(Component.LEFT_ALIGNMENT);
        backBtn.addActionListener(e -> returnToLogin());

        cardPanel.add(registerBtn);
        cardPanel.add(Box.createVerticalStrut(8));
        cardPanel.add(backBtn);

        rootPanel.add(cardPanel, BorderLayout.CENTER);
        setContentPane(rootPanel);
    }

    private void addFormField(JPanel container, String labelText, JComponent field) {
        JLabel label = new JLabel(labelText);
        label.setFont(UITheme.FONT_BODY_BOLD);
        label.setForeground(UITheme.TEXT_PRIMARY);
        label.setBorder(new EmptyBorder(8, 0, 4, 0));
        label.setAlignmentX(Component.LEFT_ALIGNMENT);

        field.setMaximumSize(new Dimension(Integer.MAX_VALUE, 36));
        field.setAlignmentX(Component.LEFT_ALIGNMENT);

        container.add(label);
        container.add(field);
    }

    private void handleRegister() {
        String name = nameField.getText().trim();
        String username = usernameField.getText().trim();
        String email = emailField.getText().trim();
        String department = departmentField.getText().trim();
        String password = new String(passwordField.getPassword());
        String confirmPassword = new String(confirmPasswordField.getPassword());

        if (!SecurityUtils.isNotBlank(name) || !SecurityUtils.isNotBlank(username) || !SecurityUtils.isNotBlank(email)) {
            JOptionPane.showMessageDialog(this, "Name, Username, and Email are required.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            return;
        }

        if (!SecurityUtils.isValidEmail(email)) {
            JOptionPane.showMessageDialog(this, "Please enter a valid email address (e.g., user@company.internal).", "Invalid Email", JOptionPane.WARNING_MESSAGE);
            return;
        }

        if (!SecurityUtils.isValidPassword(password)) {
            JOptionPane.showMessageDialog(this, "Password must be at least 6 characters long.", "Weak Password", JOptionPane.WARNING_MESSAGE);
            return;
        }

        if (!password.equals(confirmPassword)) {
            JOptionPane.showMessageDialog(this, "Passwords do not match.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            return;
        }

        try {
            if (userDAO.isEmailOrUsernameTaken(email, username)) {
                JOptionPane.showMessageDialog(this, "That email or username is already registered.", "Duplicate Account", JOptionPane.ERROR_MESSAGE);
                return;
            }

            boolean created = userDAO.registerUser(name, username, email, password, department);
            if (created) {
                JOptionPane.showMessageDialog(this,
                        "Account registered successfully! You may now sign in.",
                        "Registration Complete",
                        JOptionPane.INFORMATION_MESSAGE);
                returnToLogin();
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this,
                    "Database error while registering user: " + ex.getMessage(),
                    "Database Error",
                    JOptionPane.ERROR_MESSAGE);
        }
    }

    private void returnToLogin() {
        if (parentLoginFrame != null) {
            parentLoginFrame.setVisible(true);
        }
        dispose();
    }
}
`,
  },
  {
    id: 'ui-dashboard',
    fileName: 'DashboardFrame.java',
    packageName: 'com.internalmail.ui',
    relativePath: 'src/com/internalmail/ui/DashboardFrame.java',
    category: 'ui',
    description: 'Main Java Swing Dashboard JFrame containing Sidebar navigation (Inbox, Sent Mail, Compose Mail, Drafts, Logout) and JTable views.',
    code: `package com.internalmail.ui;

import com.internalmail.dao.MessageDAO;
import com.internalmail.dao.UserDAO;
import com.internalmail.model.Message;
import com.internalmail.model.User;
import com.internalmail.utils.SecurityUtils;
import com.internalmail.utils.UITheme;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Main Dashboard Window (JFrame) for the Internal Mail System.
 * Features Sidebar Navigation (Inbox, Sent Mail, Compose Mail, Drafts, Logout)
 * and a CardLayout center workspace.
 */
public class DashboardFrame extends JFrame {

    private final User currentUser;
    private final UserDAO userDAO;
    private final MessageDAO messageDAO;

    private final CardLayout cardLayout;
    private final JPanel contentCardsPanel;

    private final DefaultTableModel inboxTableModel;
    private final JTable inboxTable;
    private List<Message> inboxMessages = new ArrayList<>();

    private final DefaultTableModel sentTableModel;
    private final JTable sentTable;
    private List<Message> sentMessages = new ArrayList<>();

    private final DefaultTableModel draftsTableModel;
    private final JTable draftsTable;
    private List<Message> draftMessages = new ArrayList<>();

    private final JTextField receiverEmailField;
    private final JTextField subjectField;
    private final JTextArea messageBodyArea;
    private Integer activeDraftId = null;

    private final JButton navInboxBtn;
    private final JButton navSentBtn;
    private final JButton navComposeBtn;
    private final JButton navDraftsBtn;

    public DashboardFrame(User currentUser) {
        this.currentUser = currentUser;
        this.userDAO = new UserDAO();
        this.messageDAO = new MessageDAO();

        setTitle("Internal Mail System - " + currentUser.getName() + " (" + currentUser.getEmail() + ")");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1080, 680);
        setLocationRelativeTo(null);

        JPanel rootPanel = new JPanel(new BorderLayout());
        rootPanel.setBackground(UITheme.BG_CANVAS);

        JPanel sidebar = new JPanel();
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setBackground(UITheme.BG_SIDEBAR);
        sidebar.setPreferredSize(new Dimension(240, getHeight()));
        sidebar.setBorder(new EmptyBorder(24, 16, 24, 16));

        JLabel brandLabel = new JLabel("InternalMail");
        brandLabel.setFont(UITheme.FONT_TITLE);
        brandLabel.setForeground(Color.WHITE);
        brandLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel userBadgeLabel = new JLabel(currentUser.getEmail());
        userBadgeLabel.setFont(UITheme.FONT_SMALL);
        userBadgeLabel.setForeground(new Color(148, 163, 184));
        userBadgeLabel.setBorder(new EmptyBorder(4, 0, 24, 0));
        userBadgeLabel.setAlignmentX(Component.LEFT_ALIGNMENT);

        navComposeBtn = createSidebarButton("+ Compose Mail", true);
        navInboxBtn = createSidebarButton("Inbox", false);
        navSentBtn = createSidebarButton("Sent Mail", false);
        navDraftsBtn = createSidebarButton("Drafts", false);
        JButton navLogoutBtn = createSidebarButton("Logout", false);

        navComposeBtn.addActionListener(e -> {
            clearComposeForm();
            showCard("COMPOSE");
        });
        navInboxBtn.addActionListener(e -> {
            refreshAllMailboxes();
            showCard("INBOX");
        });
        navSentBtn.addActionListener(e -> {
            refreshAllMailboxes();
            showCard("SENT");
        });
        navDraftsBtn.addActionListener(e -> {
            refreshAllMailboxes();
            showCard("DRAFTS");
        });
        navLogoutBtn.addActionListener(e -> handleLogout());

        sidebar.add(brandLabel);
        sidebar.add(userBadgeLabel);
        sidebar.add(navComposeBtn);
        sidebar.add(Box.createVerticalStrut(12));
        sidebar.add(navInboxBtn);
        sidebar.add(Box.createVerticalStrut(6));
        sidebar.add(navSentBtn);
        sidebar.add(Box.createVerticalStrut(6));
        sidebar.add(navDraftsBtn);
        sidebar.add(Box.createVerticalGlue());
        sidebar.add(navLogoutBtn);

        cardLayout = new CardLayout();
        contentCardsPanel = new JPanel(cardLayout);
        contentCardsPanel.setBackground(UITheme.BG_CANVAS);

        inboxTableModel = new DefaultTableModel(new Object[]{"ID", "Status", "From", "Subject", "Date/Time"}, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        inboxTable = new JTable(inboxTableModel);
        UITheme.styleTable(inboxTable);

        sentTableModel = new DefaultTableModel(new Object[]{"ID", "To (Receiver)", "Subject", "Recipient Status", "Date/Time"}, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        sentTable = new JTable(sentTableModel);
        UITheme.styleTable(sentTable);

        draftsTableModel = new DefaultTableModel(new Object[]{"ID", "Draft Recipient", "Subject", "Saved At"}, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        draftsTable = new JTable(draftsTableModel);
        UITheme.styleTable(draftsTable);

        receiverEmailField = UITheme.createStyledTextField();
        subjectField = UITheme.createStyledTextField();
        messageBodyArea = new JTextArea(12, 40);
        messageBodyArea.setFont(UITheme.FONT_BODY);
        messageBodyArea.setLineWrap(true);
        messageBodyArea.setWrapStyleWord(true);
        messageBodyArea.setBorder(new EmptyBorder(10, 10, 10, 10));

        contentCardsPanel.add(buildInboxPanel(), "INBOX");
        contentCardsPanel.add(buildSentPanel(), "SENT");
        contentCardsPanel.add(buildDraftsPanel(), "DRAFTS");
        contentCardsPanel.add(buildComposePanel(), "COMPOSE");

        rootPanel.add(sidebar, BorderLayout.WEST);
        rootPanel.add(contentCardsPanel, BorderLayout.CENTER);
        setContentPane(rootPanel);

        refreshAllMailboxes();
        showCard("INBOX");
    }

    private JButton createSidebarButton(String text, boolean isPrimaryCompose) {
        JButton btn = new JButton(text);
        btn.setFont(UITheme.FONT_BODY_BOLD);
        btn.setForeground(Color.WHITE);
        btn.setBackground(isPrimaryCompose ? UITheme.PRIMARY_ACCENT : UITheme.BG_SIDEBAR_ACTIVE);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setOpaque(true);
        btn.setHorizontalAlignment(SwingConstants.LEFT);
        btn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        btn.setBorder(new EmptyBorder(10, 14, 10, 14));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        return btn;
    }

    private JPanel buildInboxPanel() {
        JPanel panel = new JPanel(new BorderLayout(0, 14));
        panel.setBackground(UITheme.BG_CANVAS);
        panel.setBorder(new EmptyBorder(24, 28, 24, 28));

        JPanel topBar = new JPanel(new BorderLayout());
        topBar.setBackground(UITheme.BG_CANVAS);

        JLabel title = new JLabel("Inbox");
        title.setFont(UITheme.FONT_TITLE);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        actions.setBackground(UITheme.BG_CANVAS);

        JButton openBtn = UITheme.createPrimaryButton("Read Selected");
        openBtn.addActionListener(e -> openSelectedInboxMessage());

        JButton refreshBtn = UITheme.createSecondaryButton("Refresh");
        refreshBtn.addActionListener(e -> refreshAllMailboxes());

        actions.add(openBtn);
        actions.add(refreshBtn);

        topBar.add(title, BorderLayout.WEST);
        topBar.add(actions, BorderLayout.EAST);

        inboxTable.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    openSelectedInboxMessage();
                }
            }
        });

        JScrollPane scrollPane = new JScrollPane(inboxTable);
        scrollPane.setBorder(new LineBorder(UITheme.BORDER_COLOR, 1));

        panel.add(topBar, BorderLayout.NORTH);
        panel.add(scrollPane, BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildSentPanel() {
        JPanel panel = new JPanel(new BorderLayout(0, 14));
        panel.setBackground(UITheme.BG_CANVAS);
        panel.setBorder(new EmptyBorder(24, 28, 24, 28));

        JPanel topBar = new JPanel(new BorderLayout());
        topBar.setBackground(UITheme.BG_CANVAS);

        JLabel title = new JLabel("Sent Mail");
        title.setFont(UITheme.FONT_TITLE);

        JButton viewBtn = UITheme.createSecondaryButton("View Sent Message");
        viewBtn.addActionListener(e -> openSelectedSentMessage());

        topBar.add(title, BorderLayout.WEST);
        topBar.add(viewBtn, BorderLayout.EAST);

        sentTable.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    openSelectedSentMessage();
                }
            }
        });

        JScrollPane scrollPane = new JScrollPane(sentTable);
        scrollPane.setBorder(new LineBorder(UITheme.BORDER_COLOR, 1));

        panel.add(topBar, BorderLayout.NORTH);
        panel.add(scrollPane, BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildDraftsPanel() {
        JPanel panel = new JPanel(new BorderLayout(0, 14));
        panel.setBackground(UITheme.BG_CANVAS);
        panel.setBorder(new EmptyBorder(24, 28, 24, 28));

        JPanel topBar = new JPanel(new BorderLayout());
        topBar.setBackground(UITheme.BG_CANVAS);

        JLabel title = new JLabel("Saved Drafts");
        title.setFont(UITheme.FONT_TITLE);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        actions.setBackground(UITheme.BG_CANVAS);

        JButton editDraftBtn = UITheme.createPrimaryButton("Resume Editing Draft");
        editDraftBtn.addActionListener(e -> resumeSelectedDraft());

        JButton deleteDraftBtn = UITheme.createDangerButton("Discard Draft");
        deleteDraftBtn.addActionListener(e -> deleteSelectedDraft());

        actions.add(editDraftBtn);
        actions.add(deleteDraftBtn);

        topBar.add(title, BorderLayout.WEST);
        topBar.add(actions, BorderLayout.EAST);

        JScrollPane scrollPane = new JScrollPane(draftsTable);
        scrollPane.setBorder(new LineBorder(UITheme.BORDER_COLOR, 1));

        panel.add(topBar, BorderLayout.NORTH);
        panel.add(scrollPane, BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildComposePanel() {
        JPanel panel = new JPanel(new BorderLayout(0, 16));
        panel.setBackground(UITheme.BG_CANVAS);
        panel.setBorder(new EmptyBorder(24, 28, 24, 28));

        JLabel title = new JLabel("Compose Internal Mail");
        title.setFont(UITheme.FONT_TITLE);

        JPanel formCard = new JPanel(new BorderLayout(0, 12));
        formCard.setBackground(UITheme.BG_SURFACE);
        formCard.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(UITheme.BORDER_COLOR, 1),
                new EmptyBorder(20, 24, 20, 24)
        ));

        JPanel fieldsPanel = new JPanel(new GridLayout(4, 1, 0, 6));
        fieldsPanel.setBackground(UITheme.BG_SURFACE);

        JLabel toLabel = new JLabel("Receiver Email Address:");
        toLabel.setFont(UITheme.FONT_BODY_BOLD);
        JLabel subjectLabel = new JLabel("Subject:");
        subjectLabel.setFont(UITheme.FONT_BODY_BOLD);

        fieldsPanel.add(toLabel);
        fieldsPanel.add(receiverEmailField);
        fieldsPanel.add(subjectLabel);
        fieldsPanel.add(subjectField);

        JScrollPane bodyScroll = new JScrollPane(messageBodyArea);
        bodyScroll.setBorder(new LineBorder(UITheme.BORDER_COLOR, 1));

        JPanel bottomButtons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        bottomButtons.setBackground(UITheme.BG_SURFACE);

        JButton saveDraftBtn = UITheme.createSecondaryButton("Save to Drafts");
        saveDraftBtn.addActionListener(e -> handleSaveDraft());

        JButton sendBtn = UITheme.createPrimaryButton("Send Mail Now");
        sendBtn.addActionListener(e -> handleSendMail());

        bottomButtons.add(saveDraftBtn);
        bottomButtons.add(sendBtn);

        formCard.add(fieldsPanel, BorderLayout.NORTH);
        formCard.add(bodyScroll, BorderLayout.CENTER);
        formCard.add(bottomButtons, BorderLayout.SOUTH);

        panel.add(title, BorderLayout.NORTH);
        panel.add(formCard, BorderLayout.CENTER);
        return panel;
    }

    private void refreshAllMailboxes() {
        try {
            inboxMessages = messageDAO.getInboxMessages(currentUser.getId());
            inboxTableModel.setRowCount(0);
            int unreadCount = 0;
            for (Message m : inboxMessages) {
                if (!m.isRead()) {
                    unreadCount++;
                }
                inboxTableModel.addRow(new Object[]{
                        m.getId(),
                        m.isRead() ? "Read" : "UNREAD",
                        m.getSenderName() + " <" + m.getSenderEmail() + ">",
                        m.getSubject(),
                        m.getFormattedDate()
                });
            }
            navInboxBtn.setText(unreadCount > 0 ? "Inbox (" + unreadCount + ")" : "Inbox");

            sentMessages = messageDAO.getSentMessages(currentUser.getId());
            sentTableModel.setRowCount(0);
            for (Message m : sentMessages) {
                sentTableModel.addRow(new Object[]{
                        m.getId(),
                        m.getReceiverName() + " <" + m.getReceiverEmail() + ">",
                        m.getSubject(),
                        m.isRead() ? "Opened by Recipient" : "Delivered (Unread)",
                        m.getFormattedDate()
                });
            }

            draftMessages = messageDAO.getDraftMessages(currentUser.getId());
            draftsTableModel.setRowCount(0);
            for (Message m : draftMessages) {
                draftsTableModel.addRow(new Object[]{
                        m.getId(),
                        m.getReceiverEmail(),
                        m.getSubject(),
                        m.getFormattedDate()
                });
            }
            navDraftsBtn.setText(!draftMessages.isEmpty() ? "Drafts (" + draftMessages.size() + ")" : "Drafts");

        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this,
                    "Failed to load messages from MySQL: " + ex.getMessage(),
                    "Database Error",
                    JOptionPane.ERROR_MESSAGE);
        }
    }

    private void openSelectedInboxMessage() {
        int row = inboxTable.getSelectedRow();
        if (row < 0 || row >= inboxMessages.size()) {
            JOptionPane.showMessageDialog(this, "Please select a message from the Inbox table first.");
            return;
        }
        Message selected = inboxMessages.get(row);
        try {
            if (!selected.isRead()) {
                messageDAO.updateReadStatus(selected.getId(), true);
                selected.setRead(true);
                refreshAllMailboxes();
            }
            MessageDetailDialog dialog = new MessageDetailDialog(
                    this,
                    selected,
                    messageDAO,
                    this::refreshAllMailboxes,
                    msgToReply -> {
                        clearComposeForm();
                        receiverEmailField.setText(msgToReply.getSenderEmail());
                        String subj = msgToReply.getSubject();
                        subjectField.setText(subj.startsWith("Re:") ? subj : "Re: " + subj);
                        messageBodyArea.setText("\\n\\n--- On " + msgToReply.getFormattedDate() + ", " +
                                msgToReply.getSenderName() + " wrote: ---\\n" + msgToReply.getBody());
                        showCard("COMPOSE");
                    }
            );
            dialog.setVisible(true);
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Error opening message: " + ex.getMessage());
        }
    }

    private void openSelectedSentMessage() {
        int row = sentTable.getSelectedRow();
        if (row < 0 || row >= sentMessages.size()) {
            JOptionPane.showMessageDialog(this, "Please select a message from Sent Mail first.");
            return;
        }
        Message selected = sentMessages.get(row);
        MessageDetailDialog dialog = new MessageDetailDialog(
                this,
                selected,
                messageDAO,
                this::refreshAllMailboxes,
                null
        );
        dialog.setVisible(true);
    }

    private void resumeSelectedDraft() {
        int row = draftsTable.getSelectedRow();
        if (row < 0 || row >= draftMessages.size()) {
            JOptionPane.showMessageDialog(this, "Please select a draft to resume editing.");
            return;
        }
        Message draft = draftMessages.get(row);
        activeDraftId = draft.getId();
        receiverEmailField.setText(draft.getReceiverEmail());
        subjectField.setText(draft.getSubject());
        messageBodyArea.setText(draft.getBody());
        showCard("COMPOSE");
    }

    private void deleteSelectedDraft() {
        int row = draftsTable.getSelectedRow();
        if (row < 0 || row >= draftMessages.size()) {
            JOptionPane.showMessageDialog(this, "Please select a draft to discard.");
            return;
        }
        Message draft = draftMessages.get(row);
        try {
            messageDAO.deleteMessage(draft.getId());
            refreshAllMailboxes();
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Error deleting draft: " + ex.getMessage());
        }
    }

    private void handleSendMail() {
        String receiverEmail = receiverEmailField.getText().trim();
        String subject = subjectField.getText().trim();
        String body = messageBodyArea.getText().trim();

        if (!SecurityUtils.isValidEmail(receiverEmail)) {
            JOptionPane.showMessageDialog(this, "Please enter a valid receiver email address.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (!SecurityUtils.isNotBlank(subject) || !SecurityUtils.isNotBlank(body)) {
            JOptionPane.showMessageDialog(this, "Subject and Message body cannot be empty.", "Validation Error", JOptionPane.WARNING_MESSAGE);
            return;
        }

        try {
            User receiver = userDAO.findByEmail(receiverEmail);
            if (receiver == null) {
                JOptionPane.showMessageDialog(this,
                        "No internal user found with email: " + receiverEmail,
                        "Unknown Recipient",
                        JOptionPane.ERROR_MESSAGE);
                return;
            }

            boolean sent = messageDAO.sendMessage(currentUser.getId(), receiver.getId(), receiver.getEmail(), subject, body);
            if (sent) {
                if (activeDraftId != null) {
                    messageDAO.deleteMessage(activeDraftId);
                    activeDraftId = null;
                }
                JOptionPane.showMessageDialog(this, "Email sent successfully to " + receiver.getName() + "!");
                clearComposeForm();
                refreshAllMailboxes();
                showCard("SENT");
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Database error while sending mail: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void handleSaveDraft() {
        String receiverEmail = receiverEmailField.getText().trim();
        String subject = subjectField.getText().trim();
        String body = messageBodyArea.getText().trim();

        try {
            Integer receiverId = null;
            if (SecurityUtils.isValidEmail(receiverEmail)) {
                User found = userDAO.findByEmail(receiverEmail);
                if (found != null) {
                    receiverId = found.getId();
                }
            }
            if (activeDraftId != null) {
                messageDAO.deleteMessage(activeDraftId);
                activeDraftId = null;
            }
            messageDAO.saveDraft(currentUser.getId(), receiverId, receiverEmail, subject, body);
            JOptionPane.showMessageDialog(this, "Message saved to Drafts.");
            clearComposeForm();
            refreshAllMailboxes();
            showCard("DRAFTS");
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Error saving draft: " + ex.getMessage());
        }
    }

    private void clearComposeForm() {
        activeDraftId = null;
        receiverEmailField.setText("");
        subjectField.setText("");
        messageBodyArea.setText("");
    }

    private void showCard(String cardName) {
        cardLayout.show(contentCardsPanel, cardName);
    }

    private void handleLogout() {
        int choice = JOptionPane.showConfirmDialog(
                this,
                "Sign out of " + currentUser.getEmail() + "?",
                "Confirm Logout",
                JOptionPane.YES_NO_OPTION
        );
        if (choice == JOptionPane.YES_OPTION) {
            LoginFrame loginFrame = new LoginFrame();
            loginFrame.setVisible(true);
            dispose();
        }
    }
}
`,
  },
  {
    id: 'ui-dialog',
    fileName: 'MessageDetailDialog.java',
    packageName: 'com.internalmail.ui',
    relativePath: 'src/com/internalmail/ui/MessageDetailDialog.java',
    category: 'ui',
    description: 'Modal Swing JDialog to read full email messages, reply to sender, toggle read/unread status, or delete.',
    code: `package com.internalmail.ui;

import com.internalmail.dao.MessageDAO;
import com.internalmail.model.Message;
import com.internalmail.utils.UITheme;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.sql.SQLException;
import java.util.function.Consumer;

/**
 * Modal JDialog for reading an email message in full detail, with Reply and Delete actions.
 */
public class MessageDetailDialog extends JDialog {

    public MessageDetailDialog(
            JFrame parent,
            Message message,
            MessageDAO messageDAO,
            Runnable onListRefresh,
            Consumer<Message> onReplyCallback
    ) {
        super(parent, "Message Reader - " + message.getSubject(), true);
        setSize(680, 520);
        setLocationRelativeTo(parent);

        JPanel root = new JPanel(new BorderLayout(0, 16));
        root.setBackground(UITheme.BG_SURFACE);
        root.setBorder(new EmptyBorder(24, 24, 24, 24));

        JPanel headerPanel = new JPanel(new GridLayout(0, 1, 4, 4));
        headerPanel.setBackground(new Color(248, 250, 252));
        headerPanel.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(UITheme.BORDER_COLOR, 1),
                new EmptyBorder(14, 16, 14, 16)
        ));

        JLabel subjectLabel = new JLabel(message.getSubject());
        subjectLabel.setFont(UITheme.FONT_TITLE);
        subjectLabel.setForeground(UITheme.TEXT_PRIMARY);

        JLabel fromLabel = new JLabel("From: " + message.getSenderName() + " <" + message.getSenderEmail() + ">");
        fromLabel.setFont(UITheme.FONT_BODY_BOLD);
        fromLabel.setForeground(UITheme.TEXT_PRIMARY);

        JLabel toLabel = new JLabel("To: " + message.getReceiverName() + " <" + message.getReceiverEmail() + ">   |   Date: " + message.getFormattedDate());
        toLabel.setFont(UITheme.FONT_SMALL);
        toLabel.setForeground(UITheme.TEXT_SECONDARY);

        headerPanel.add(subjectLabel);
        headerPanel.add(fromLabel);
        headerPanel.add(toLabel);

        JTextArea bodyArea = new JTextArea(message.getBody());
        bodyArea.setFont(UITheme.FONT_BODY);
        bodyArea.setForeground(UITheme.TEXT_PRIMARY);
        bodyArea.setEditable(false);
        bodyArea.setLineWrap(true);
        bodyArea.setWrapStyleWord(true);
        bodyArea.setBorder(new EmptyBorder(14, 14, 14, 14));

        JScrollPane scrollPane = new JScrollPane(bodyArea);
        scrollPane.setBorder(new LineBorder(UITheme.BORDER_COLOR, 1));

        JPanel actionPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        actionPanel.setBackground(UITheme.BG_SURFACE);

        JButton replyBtn = UITheme.createPrimaryButton("Reply to Sender");
        replyBtn.addActionListener(e -> {
            dispose();
            if (onReplyCallback != null) {
                onReplyCallback.accept(message);
            }
        });

        JButton toggleUnreadBtn = UITheme.createSecondaryButton("Mark as Unread");
        toggleUnreadBtn.addActionListener(e -> {
            try {
                messageDAO.updateReadStatus(message.getId(), false);
                if (onListRefresh != null) {
                    onListRefresh.run();
                }
                dispose();
            } catch (SQLException ex) {
                JOptionPane.showMessageDialog(this, "Error updating status: " + ex.getMessage());
            }
        });

        JButton deleteBtn = UITheme.createDangerButton("Delete Message");
        deleteBtn.addActionListener(e -> {
            int confirm = JOptionPane.showConfirmDialog(
                    this,
                    "Are you sure you want to permanently delete this message?",
                    "Confirm Delete",
                    JOptionPane.YES_NO_OPTION
            );
            if (confirm == JOptionPane.YES_OPTION) {
                try {
                    messageDAO.deleteMessage(message.getId());
                    if (onListRefresh != null) {
                        onListRefresh.run();
                    }
                    dispose();
                } catch (SQLException ex) {
                    JOptionPane.showMessageDialog(this, "Error deleting message: " + ex.getMessage());
                }
            }
        });

        JButton closeBtn = UITheme.createSecondaryButton("Close");
        closeBtn.addActionListener(e -> dispose());

        actionPanel.add(replyBtn);
        actionPanel.add(toggleUnreadBtn);
        actionPanel.add(deleteBtn);
        actionPanel.add(closeBtn);

        root.add(headerPanel, BorderLayout.NORTH);
        root.add(scrollPane, BorderLayout.CENTER);
        root.add(actionPanel, BorderLayout.SOUTH);

        setContentPane(root);
    }
}
`,
  },
  {
    id: 'sql-schema',
    fileName: 'schema_and_seed.sql',
    packageName: 'sql',
    relativePath: 'sql/schema_and_seed.sql',
    category: 'sql',
    description: 'Complete MySQL 8.0 DDL schema for users and messages tables with foreign keys, indexes, and sample seed data.',
    code: SQL_SCHEMA_AND_SEED,
  },
];
