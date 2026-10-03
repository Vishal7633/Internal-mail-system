package com.internalmail.ui;

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

        // Enter key triggers login
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
                    "Database Error: " + ex.getMessage() + "\nVerify DatabaseConnection.java settings.",
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
