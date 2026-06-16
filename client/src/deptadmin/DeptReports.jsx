import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { styles, theme } from '../attendancemodule/config';

const apiUrl = getEnvironment();
const fieldStyle = {
    ...styles.input,
    display: 'block',
    marginTop: 6,
};
const actionStyle = {
    ...styles.btnGhost,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
};

export default function DeptReports() {
    const { department, fullAccess } = useOutletContext();
    const [date, setDate] = useState('');
    const [status, setStatus] = useState('');
    const [state, setState] = useState({ reports: [], loading: true, error: '' });

    const loadReports = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const params = new URLSearchParams();
            if (date) params.set('date', date);
            if (status) params.set('status', status);
            const response = await fetch(`${apiUrl}/attendancemodule/dept-admin/reports?${params}`, { credentials: 'include' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to load reports.');
            setState({ reports: data.reports, loading: false, error: '' });
        } catch (error) {
            setState({ reports: [], loading: false, error: error.message });
        }
    }, [date, status]);

    useEffect(() => { loadReports(); }, [loadReports]);

    return (
        <div style={{ padding: '24px 32px' }}>
            <div style={styles.heading}>Attendance Reports</div>
            <div style={styles.subheading}>
                {fullAccess ? 'Institute-wide attendance reports.' : `Reports are limited to ${department}.`}
            </div>

            <div style={{ ...styles.card, padding: 16, display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap', marginBottom: 18 }}>
                <label style={{ minWidth: 190, fontSize: 12, color: theme.textMuted }}>
                    Date
                    <input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={fieldStyle} />
                </label>
                <label style={{ minWidth: 180, fontSize: 12, color: theme.textMuted }}>
                    Status
                    <select value={status} onChange={(event) => setStatus(event.target.value)} style={fieldStyle}>
                        <option value="">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="live">Live</option>
                        <option value="finalized">Finalized</option>
                    </select>
                </label>
                <button onClick={loadReports} style={{ ...styles.btnPrimary, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Search size={15} /> Search
                </button>
                <button
                    onClick={() => {
                        setDate('');
                        setStatus('');
                    }}
                    title="Clear filters"
                    style={actionStyle}
                >
                    <RefreshCw size={15} /> Clear
                </button>
            </div>

            <div style={styles.card}>
                {state.error && <div style={{ color: theme.danger }}>{state.error}</div>}
                {state.loading ? (
                    <div style={{ color: theme.textMuted, padding: 24, textAlign: 'center' }}>Loading reports...</div>
                ) : !state.reports.length ? (
                    <div style={{ color: theme.textMuted, padding: 24, textAlign: 'center' }}>No reports match these filters.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ color: theme.textMuted, textAlign: 'left' }}>
                                    {['Date', 'Time', 'Subject', 'Faculty', 'Semester', 'Room', 'Present', 'Attendance', 'Status'].map((label) => (
                                        <th key={label} style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {state.reports.map((report) => (
                                    <tr key={report._id}>
                                        <td style={cell}>{report.date}</td>
                                        <td style={cell}>{report.timeSlot || '-'}</td>
                                        <td style={{ ...cell, fontWeight: 600 }}>{report.subject || 'Unspecified'}</td>
                                        <td style={cell}>{report.faculty || '-'}</td>
                                        <td style={cell}>{report.semester || '-'}</td>
                                        <td style={cell}>{report.room || '-'}</td>
                                        <td style={cell}>{report.summary?.present || 0}/{report.summary?.totalStudents || 0}</td>
                                        <td style={cell}>{report.summary?.attendancePct == null ? '-' : `${report.summary.attendancePct}%`}</td>
                                        <td style={{ ...cell, textTransform: 'capitalize' }}>{report.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

const cell = {
    padding: 12,
    borderBottom: `1px solid ${theme.border}`,
    whiteSpace: 'nowrap',
};
