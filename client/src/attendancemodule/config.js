// client/src/attendancemodule/config.js

import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const API_BASE = `${apiUrl}/attendancemodule/ground-truth`;
const TIMETABLE_API = `${apiUrl}/timetablemodule`;

// Dropdown options
const DEGREES = ['BTECH', 'MTECH', 'BSC', 'MSC', 'PHD'];
// DEPARTMENTS is intentionally removed — always fetched live from /departments
// to guarantee batch folder names match timetable DB values.
// Use the useDepartments() hook from useDepartments.js instead.
const DEPARTMENTS = []; // kept as empty fallback — do not populate here

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear - i));

// Shared color tokens
const theme = {
    bg: '#0b0e17',
    surface: '#12162a',
    surfaceAlt: '#181d35',
    border: '#242a45',
    borderFocus: '#38bdf8',
    text: '#e0e7ff',
    textMuted: '#636e8a',
    accent: '#38bdf8',
    accentDim: 'rgba(56, 189, 248, 0.1)',
    accentText: '#082f3a',
    success: '#34d399',
    successDim: 'rgba(52, 211, 153, 0.1)',
    warning: '#fbbf24',
    warningDim: 'rgba(251, 191, 36, 0.1)',
    danger: '#f87171',
    dangerDim: 'rgba(248, 113, 113, 0.1)',
    fontMono: "'IBM Plex Mono', 'Fira Code', monospace",
    fontBody: "'IBM Plex Sans', 'Segoe UI', sans-serif",
};

// Reusable inline style generators
const styles = {
    page: {
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.fontBody,
        padding: '24px 32px',
    },
    card: {
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: '24px',
    },
    input: {
        padding: '10px 14px',
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '6px',
        color: theme.text,
        fontSize: '14px',
        fontFamily: theme.fontBody,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    select: {
        padding: '10px 14px',
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '6px',
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
        color: theme.accentText,
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: theme.fontBody,
    },
    btnGhost: {
        padding: '10px 24px',
        background: 'transparent',
        color: theme.textMuted,
        border: `1px solid ${theme.border}`,
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: theme.fontBody,
    },
    btnDanger: {
        padding: '8px 16px',
        background: theme.dangerDim,
        color: theme.danger,
        border: 'none',
        borderRadius: '6px',
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
        fontWeight: 600,
    },
    badge: (color) => ({
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        background: color === 'success' ? theme.successDim :
                    color === 'danger' ? theme.dangerDim :
                    color === 'warning' ? theme.warningDim : theme.accentDim,
        color: color === 'success' ? theme.success :
               color === 'danger' ? theme.danger :
               color === 'warning' ? theme.warning : theme.accent,
    }),
    sectionTitle: {
        fontSize: '11px',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
        marginBottom: '12px',
    },
    heading: {
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        marginBottom: '4px',
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
    input:focus, select:focus { border-color: ${theme.borderFocus} !important; box-shadow: 0 0 0 2px ${theme.accentDim}; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${theme.bg}; }
    ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes spin { to { transform: rotate(360deg); } }
`;

export { API_BASE, TIMETABLE_API, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset };
