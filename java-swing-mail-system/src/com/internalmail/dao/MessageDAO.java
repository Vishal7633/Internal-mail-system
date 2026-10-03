package com.internalmail.dao;

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
