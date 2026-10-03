package com.internalmail.ui;

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

    // Table Models & Lists
    private final DefaultTableModel inboxTableModel;
    private final JTable inboxTable;
    private List<Message> inboxMessages = new ArrayList<>();

    private final DefaultTableModel sentTableModel;
    private final JTable sentTable;
    private List<Message> sentMessages = new ArrayList<>();

    private final DefaultTableModel draftsTableModel;
    private final JTable draftsTable;
    private List<Message> draftMessages = new ArrayList<>();

    // Compose Mail Fields
    private final JTextField receiverEmailField;
    private final JTextField subjectField;
    private final JTextArea messageBodyArea;
    private Integer activeDraftId = null;

    // Sidebar Badge Labels
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

        // 1. Left Sidebar Navigation
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

        // 2. Main CardLayout Workspace
        cardLayout = new CardLayout();
        contentCardsPanel = new JPanel(cardLayout);
        contentCardsPanel.setBackground(UITheme.BG_CANVAS);

        // Initialize Tables
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

        // Initialize Compose Fields
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
                        messageBodyArea.setText("\n\n--- On " + msgToReply.getFormattedDate() + ", " +
                                msgToReply.getSenderName() + " wrote: ---\n" + msgToReply.getBody());
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
