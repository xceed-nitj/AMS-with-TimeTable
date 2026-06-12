// client/src/attendancemodule/config.js

import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const API_BASE = `${apiUrl}/attendancemodule/ground-truth`;
const TIMETABLE_API = `${apiUrl}/timetablemodule`;

// Dropdown options
const DEGREES = ['BTECH', 'MTECH', 'BSC', 'MSC', 'PHD'];
// DEPARTMENTS is intentionally removed — always fetched live from /departments
const DEPARTMENTS = [];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear - i));

// ── Light colorful theme ────────────────────────────────────────────────────
const theme = {
    bg:           '#f5f6fb',
    surface:      '#ffffff',
    surfaceAlt:   '#f0f2f9',
    border:       '#e4e8f5',
    borderFocus:  '#6366f1',
    text:         '#1a1f3c',
    textMuted:    '#7b84ab',
    accent:       '#6366f1',
    accentDim:    'rgba(99,102,241,0.09)',
    accentText:   '#ffffff',
    success:      '#10b981',
    successDim:   'rgba(16,185,129,0.10)',
    warning:      '#f59e0b',
    warningDim:   'rgba(245,158,11,0.10)',
    danger:       '#ef4444',
    dangerDim:    'rgba(239,68,68,0.10)',
    fontMono:     "'IBM Plex Mono', 'Fira Code', monospace",
    fontBody:     "'IBM Plex Sans', 'Segoe UI', sans-serif",
};

// ── Reusable style objects ──────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.fontBody,
        padding: 'clamp(14px, 3vw, 28px) clamp(12px, 4vw, 32px)',
    },
    card: {
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 6px rgba(26,31,60,0.06)',
    },
    input: {
        padding: '10px 14px',
        background: '#f8f9fd',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        color: theme.text,
        fontSize: '14px',
        fontFamily: theme.fontBody,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    select: {
        padding: '10px 14px',
        background: '#f8f9fd',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        color: theme.text,
        fontSize: '14px',
        fontFamily: theme.fontBody,
        outline: 'none',
        cursor: 'pointer',
        width: '100%',
        boxSizing: 'border-box',
    },
    btnPrimary: {
        padding: '10px 24px',
        background: theme.accent,
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: theme.fontBody,
        boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
    },
    btnGhost: {
        padding: '10px 24px',
        background: '#ffffff',
        color: theme.textMuted,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: theme.fontBody,
    },
    btnDanger: {
        padding: '8px 16px',
        background: theme.dangerDim,
        color: theme.danger,
        border: `1px solid rgba(239,68,68,0.25)`,
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: theme.fontBody,
    },
    label: {
        display: 'block',
        fontSize: '11px',
        color: theme.textMuted,
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 700,
    },
    badge: (color) => ({
        display: 'block',
        padding: '8px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        background: color === 'success' ? theme.successDim :
                    color === 'danger'  ? theme.dangerDim  :
                    color === 'warning' ? theme.warningDim : theme.accentDim,
        color: color === 'success' ? theme.success :
               color === 'danger'  ? theme.danger  :
               color === 'warning' ? theme.warning  : theme.accent,
        border: `1px solid ${
            color === 'success' ? 'rgba(16,185,129,0.30)' :
            color === 'danger'  ? 'rgba(239,68,68,0.30)'  :
            color === 'warning' ? 'rgba(245,158,11,0.30)' : 'rgba(99,102,241,0.30)'
        }`,
        wordBreak: 'break-word',
        lineHeight: '1.3',
    }),
    sectionTitle: {
        fontSize: '11px',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 700,
        marginBottom: '12px',
    },
    heading: {
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        marginBottom: '4px',
        color: theme.text,
    },
    subheading: {
        fontSize: '13px',
        color: theme.textMuted,
        marginBottom: '24px',
    },
};

const cssReset = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body { background: ${theme.bg}; }
    input:focus, select:focus, textarea:focus {
        border-color: ${theme.borderFocus} !important;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${theme.bg}; }
    ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #c5cadf; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }
    @keyframes pulse  { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes spin   { to { transform: rotate(360deg); } }

    /* ── Responsive grid helpers (used across all module pages) ── */
    .r-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .r-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .r-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .r-flex   { display: flex; flex-wrap: wrap; gap: 12px; }
    @media (max-width: 900px) {
        .r-grid-3, .r-grid-4 { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 600px) {
        .r-grid-2, .r-grid-3, .r-grid-4 { grid-template-columns: 1fr !important; }
        .r-flex { flex-direction: column; }
    }

    /* ── Table overflow wrapper ── */
    .r-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

    /* ── Page header responsive ── */
    .ams-page-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
    }
    .ams-page-header h1 {
        font-size: clamp(16px, 2.5vw, 22px); font-weight: 700;
        letter-spacing: -0.02em; margin: 0 0 3px; color: ${theme.text};
    }
    .ams-page-header p {
        font-size: 13px; color: ${theme.textMuted}; margin: 0;
    }
`;

export { API_BASE, TIMETABLE_API, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset };
