// client/src/attendancemodule/BackButton.jsx
// Small "← Back" button shown at the top of every page reachable from the
// AMS dashboard's icon row. Goes back in history when there is history
// (works whether the page was opened from the dashboard, a dept-admin menu,
// or elsewhere); falls back to the dashboard on a direct/fresh-tab visit.

import { useNavigate } from 'react-router-dom';
import { theme } from './config';

export default function BackButton({ label = 'Back', fallback = '/attendance', style = {} }) {
    const navigate = useNavigate();
    const goBack = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate(fallback);
    };
    return (
        <button
            onClick={goBack}
            title="Go back"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', flexShrink: 0,
                background: 'transparent', color: theme.textMuted,
                border: `1px solid ${theme.border}`, borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                ...style,
            }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
            {label}
        </button>
    );
}
