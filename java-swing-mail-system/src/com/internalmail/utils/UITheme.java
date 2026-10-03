package com.internalmail.utils;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.JTableHeader;
import java.awt.*;

/**
 * Centralized UI theme constants and component factory methods for a modern, clean Java Swing look.
 */
public class UITheme {

    // Color Palette
    public static final Color BG_CANVAS = new Color(248, 250, 252);       // #F8FAFC
    public static final Color BG_SURFACE = new Color(255, 255, 255);      // #FFFFFF
    public static final Color BG_SIDEBAR = new Color(15, 23, 42);         // #0F172A
    public static final Color BG_SIDEBAR_ACTIVE = new Color(30, 41, 59);  // #1E293B
    public static final Color PRIMARY_ACCENT = new Color(37, 99, 235);    // #2563EB
    public static final Color PRIMARY_HOVER = new Color(29, 78, 216);     // #1D4ED8
    public static final Color TEXT_PRIMARY = new Color(15, 23, 42);       // #0F172A
    public static final Color TEXT_SECONDARY = new Color(100, 116, 139);  // #64748B
    public static final Color BORDER_COLOR = new Color(226, 232, 240);    // #E2E8F0
    public static final Color DANGER_COLOR = new Color(220, 38, 38);      // #DC2626
    public static final Color SUCCESS_COLOR = new Color(22, 163, 74);     // #16A34A

    // Fonts
    public static final Font FONT_TITLE = new Font("SansSerif", Font.BOLD, 22);
    public static final Font FONT_SUBTITLE = new Font("SansSerif", Font.BOLD, 15);
    public static final Font FONT_BODY = new Font("SansSerif", Font.PLAIN, 13);
    public static final Font FONT_BODY_BOLD = new Font("SansSerif", Font.BOLD, 13);
    public static final Font FONT_SMALL = new Font("SansSerif", Font.PLAIN, 12);
    public static final Font FONT_MONO = new Font("Monospaced", Font.PLAIN, 12);

    private UITheme() {
    }

    public static JButton createPrimaryButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_BODY_BOLD);
        btn.setBackground(PRIMARY_ACCENT);
        btn.setForeground(Color.WHITE);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setOpaque(true);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(9, 18, 9, 18));
        return btn;
    }

    public static JButton createSecondaryButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_BODY_BOLD);
        btn.setBackground(BG_SURFACE);
        btn.setForeground(TEXT_PRIMARY);
        btn.setFocusPainted(false);
        btn.setOpaque(true);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1),
                new EmptyBorder(8, 16, 8, 16)
        ));
        return btn;
    }

    public static JButton createDangerButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(FONT_BODY_BOLD);
        btn.setBackground(DANGER_COLOR);
        btn.setForeground(Color.WHITE);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setOpaque(true);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(new EmptyBorder(8, 16, 8, 16));
        return btn;
    }

    public static JTextField createStyledTextField() {
        JTextField field = new JTextField();
        field.setFont(FONT_BODY);
        field.setForeground(TEXT_PRIMARY);
        field.setBackground(BG_SURFACE);
        field.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1),
                new EmptyBorder(8, 10, 8, 10)
        ));
        return field;
    }

    public static JPasswordField createStyledPasswordField() {
        JPasswordField field = new JPasswordField();
        field.setFont(FONT_BODY);
        field.setForeground(TEXT_PRIMARY);
        field.setBackground(BG_SURFACE);
        field.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(BORDER_COLOR, 1),
                new EmptyBorder(8, 10, 8, 10)
        ));
        return field;
    }

    public static void styleTable(JTable table) {
        table.setFont(FONT_BODY);
        table.setRowHeight(38);
        table.setShowVerticalLines(false);
        table.setGridColor(BORDER_COLOR);
        table.setSelectionBackground(new Color(239, 246, 255));
        table.setSelectionForeground(TEXT_PRIMARY);
        table.setIntercellSpacing(new Dimension(0, 1));

        JTableHeader header = table.getTableHeader();
        header.setFont(FONT_BODY_BOLD);
        header.setBackground(new Color(241, 245, 249));
        header.setForeground(TEXT_PRIMARY);
        header.setPreferredSize(new Dimension(header.getWidth(), 38));

        DefaultTableCellRenderer cellRenderer = new DefaultTableCellRenderer();
        cellRenderer.setBorder(new EmptyBorder(0, 12, 0, 12));
        for (int i = 0; i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setCellRenderer(cellRenderer);
        }
    }
}
