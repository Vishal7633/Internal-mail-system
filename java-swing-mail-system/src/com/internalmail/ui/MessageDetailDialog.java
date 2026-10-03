package com.internalmail.ui;

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

        // Header panel with metadata
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

        // Message body area
        JTextArea bodyArea = new JTextArea(message.getBody());
        bodyArea.setFont(UITheme.FONT_BODY);
        bodyArea.setForeground(UITheme.TEXT_PRIMARY);
        bodyArea.setEditable(false);
        bodyArea.setLineWrap(true);
        bodyArea.setWrapStyleWord(true);
        bodyArea.setBorder(new EmptyBorder(14, 14, 14, 14));

        JScrollPane scrollPane = new JScrollPane(bodyArea);
        scrollPane.setBorder(new LineBorder(UITheme.BORDER_COLOR, 1));

        // Bottom action bar
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
