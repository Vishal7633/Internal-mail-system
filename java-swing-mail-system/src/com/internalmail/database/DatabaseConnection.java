package com.internalmail.database;

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

    private static final String DB_HOST = "localhost";
    private static final String DB_PORT = "3306";
    private static final String DB_NAME = "internal_mail_db";

    // Configure your MySQL username and password here:
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "your_mysql_password";

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
