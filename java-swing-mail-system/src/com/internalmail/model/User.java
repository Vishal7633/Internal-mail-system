package com.internalmail.model;

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
