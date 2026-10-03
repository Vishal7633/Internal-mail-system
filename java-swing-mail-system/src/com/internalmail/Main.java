package com.internalmail;

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
