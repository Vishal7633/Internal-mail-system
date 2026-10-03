package com.internalmail.dao;

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
     *
     * @param identifier    User's email or username
     * @param plainPassword User's plain-text password
     * @return User object if valid credentials, or null if invalid
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
     * Returns all registered users for the internal address book / recipient autocomplete.
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
