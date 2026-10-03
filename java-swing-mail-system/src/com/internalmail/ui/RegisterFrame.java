package com.internalmail.ui;

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
