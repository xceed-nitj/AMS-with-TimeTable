import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ScanFace, Users } from 'lucide-react';
import getEnvironment from '../getenvironment';
import { styles, theme } from '../attendancemodule/config';

const apiUrl = getEnvironment();

const displayPercent = (value) => value == null ? 'No data' : `${value}%`;

function StatCard({ icon: Icon, label, value, detail, color }) {
    return (
        <div style={{ ...styles.card, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <div style={{ color: theme.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                        {label}
                    </div>
                    <div style={{ color: theme.text, fontSize: 26, fontWeight: 700 }}>{value}</div>
                    <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 5 }}>{detail}</div>
                </div>
                <Icon size={24} color={color} aria-hidden="true" />
            </div>
        </div>
    );
}

function ReportRows({ reports }) {
    if (!reports.length) {
        return <div style={{ color: theme.textMuted, padding: '32px 0', textAlign: 'center' }}>No attendance sessions recorded yet.</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ color: theme.textMuted, textAlign: 'left' }}>
                        {['Date', 'Subject', 'Semester', 'Room', 'Attendance', 'Status'].map((label) => (
                            <th key={label} style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>{label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report) => (
                        <tr key={report._id}>
                            <td style={{ padding: 12, borderBottom: `1px solid ${theme.border}` }}>{report.date}</td>
                            <td style={{ padding: 12, borderBottom: `1px solid ${theme.border}`, fontWeight: 600 }}>{report.subject || 'Unspecified'}</td>
                            <td style={{ padding: 12, borderBottom: `1px solid ${theme.border}` }}>{report.semester || '-'}</td>
                            <td style={{ padding: 12, borderBottom: `1px solid ${theme.border}` }}>{report.room || '-'}</td>
                            <td style={{ padding: 12, borderBottom: `1px solid ${theme.border}` }}>{displayPercent(report.summary?.attendancePct)}</td>
                            <td style={{ padding: 12, borderBottom: `1px solid ${theme.border}`, textTransform: 'capitalize' }}>{report.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function DeptDashboard() {
    const [state, setState] = useState({ stats: null, loading: true, error: '' });

    const loadStats = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const response = await fetch(`${apiUrl}/attendancemodule/dept-admin/stats/today`, { credentials: 'include' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to load department statistics.');
            setState({ stats: data, loading: false, error: '' });
        } catch (error) {
            setState({ stats: null, loading: false, error: error.message });
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    if (state.loading && !state.stats) {
        return <div style={{ ...styles.card, color: theme.textMuted }}>Loading department statistics...</div>;
    }

    if (state.error) {
        return (
            <div style={{ ...styles.card, color: theme.danger }}>
                {state.error}
            </div>
        );
    }

    const stats = state.stats;
    const maxYearPct = Math.max(100, ...stats.byYear.map((item) => item.attendancePct || 0));

    return (
        <div style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
                <div>
                    <div style={styles.heading}>{stats.department} Attendance</div>
                    <div style={styles.subheading}>Today, {stats.date}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
                <StatCard icon={Users} label="Today's attendance" value={displayPercent(stats.attendancePct)} detail={`${stats.present} present of ${stats.totalStudents}`} color={theme.accent} />
                <StatCard icon={Clock3} label="Ground truth pending" value={stats.groundTruthPending} detail={`${stats.groundTruthApproved} approved`} color={theme.warning} />
                <StatCard icon={ScanFace} label="Match accuracy" value={displayPercent(stats.matchAccuracy)} detail="Average approved confidence" color={theme.success} />
                <StatCard icon={CheckCircle2} label="Sessions today" value={stats.sessions} detail={`${stats.review} records need review`} color="#0ea5e9" />
            </div>

            <section style={{ ...styles.card, marginTop: 18 }}>
                <div style={{ ...styles.heading, fontSize: 17, marginBottom: 18 }}>Year-wise attendance</div>
                {stats.byYear.length === 0 ? (
                    <div style={{ color: theme.textMuted, padding: '24px 0', textAlign: 'center' }}>No year-wise attendance has been recorded today.</div>
                ) : stats.byYear.map((item) => (
                    <div key={item.year} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 64px', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Year {item.year}</span>
                        <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', background: theme.surfaceAlt }}>
                            <div style={{ height: '100%', width: `${((item.attendancePct || 0) / maxYearPct) * 100}%`, background: theme.accent, borderRadius: 5 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{displayPercent(item.attendancePct)}</span>
                    </div>
                ))}
            </section>

            <section style={{ ...styles.card, marginTop: 18 }}>
                <div style={{ ...styles.heading, fontSize: 17, marginBottom: 8 }}>Recent sessions</div>
                <ReportRows reports={stats.recentReports} />
            </section>
        </div>
    );
}
