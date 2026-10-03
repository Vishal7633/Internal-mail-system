package com.internalmail.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Pattern;

/**
 * Security utilities for password hashing (SHA-256) and user input validation.
 */
public class SecurityUtils {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
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
