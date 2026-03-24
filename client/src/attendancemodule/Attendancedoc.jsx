// client/src/attendancemodule/Attendancedoc.jsx
// Page 4: Run attendance — video + timetable lookup → attendance report with confidence

import { useState, useCallback } from 'react';
import { API_BASE, TIMETABLE_API, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset } from './config';

export default function Attendancedoc() {
    // Mode: manual batch select OR timetable lookup
    const [mode, setMode] = useState('manual'); // 'manual' | 'timetable'

    // Manual mode
    const [degree, setDegree] = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');

    // Timetable mode
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [room, setRoom] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [session, setSession] = useState('');
    const [ttData, setTtData] = useState(null);
    const [ttLoading, setTtLoading] = useState(false);

    // Common
    const [videoLink, setVideoLink] = useState('');
    const [processing, setProcessing] = useState(false);
    const [report, setReport] = useState(null);
    const [toast, setToast] = useState(null);

    const CONFIDENCE_THRESHOLD = 0.65;

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase() : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    // ─── Lookup timetable by room ─────────────────────────────────
    const lookupTimetable = useCallback(async () => {
        if (!session || !room) {
            showToast('Enter session code and room number', 'error');
            return;
        }
        setTtLoading(true);
        setTtData(null);
        try {
            const res = await fetch(`${TIMETABLE_API}/locktt/viewroom/${session}/${room}`);
            const data = await res.json();
            setTtData(data);
            if (data && data.length > 0) {
                showToast(`Found ${data.length} slot(s) for room ${room}`);
            } else {
                showToast('No timetable data found for this room', 'error');
            }
        } catch (err) {
            showToast('Timetable lookup failed', 'error');
        }
        setTtLoading(false);
    }, [session, room]);

    // ─── Run attendance ───────────────────────────────────────────
    const runAttendance = async () => {
        const batch = mode === 'manual' ? batchName : ttData?.batch;

        if (!videoLink.trim()) {
            showToast('Paste the video link', 'error');
            return;
        }
        if (mode === 'manual' && !batchName) {
            showToast('Select degree, department, and year', 'error');
            return;
        }

        setProcessing(true);
        setReport(null);

        try {
            const res = await fetch(`${API_BASE}/run-attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoLink: videoLink.trim(),
                    batch: batch || batchName,
                    room,
                    date,
                    timeSlot,
                    faculty: ttData?.faculty || '',
                    subject: ttData?.subject || '',
                })
            });

            const data = await res.json();
            if (data.error) {
                showToast(data.error, 'error');
            } else {
                setReport(data);
                showToast('Attendance report generated');
            }
        } catch (err) {
            showToast('Failed: ' + err.message, 'error');
        }
        setProcessing(false);
    };

    // ─── Stats from report ────────────────────────────────────────
    const getStats = () => {
        if (!report?.attendance) return { present: 0, absent: 0, flagged: 0, total: 0 };
        const students = report.attendance;
        const present = students.filter(s => s.status === 'present').length;
        const absent = students.filter(s => s.status === 'absent').length;
        const flagged = students.filter(s => s.status === 'present' && s.confidence < CONFIDENCE_THRESHOLD).length;
        return { present, absent, flagged, total: students.length };
    };

    const stats = report ? getStats() : null;

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 999, padding: '12px 24px',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s',
                    background: toast.type === 'error' ? theme.dangerDim : theme.successDim,
                    color: toast.type === 'error' ? theme.danger : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Attendance Report</div>
                <div style={styles.subheading}>Process class video → compare with ground truth → generate attendance with confidence scores</div>
            </div>

            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                    { id: 'manual', label: 'Select Batch Manually' },
                    { id: 'timetable', label: 'Lookup from Timetable' },
                ].map(m => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        style={{
                            padding: '8px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            border: `1px solid ${mode === m.id ? theme.accent : theme.border}`,
                            background: mode === m.id ? theme.accentDim : 'transparent',
                            color: mode === m.id ? theme.accent : theme.textMuted,
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Config Card */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                {mode === 'manual' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={styles.label}>Degree</label>
                            <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                                <option value="">Select...</option>
                                {DEGREES.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Department</label>
                            <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select}>
                                <option value="">Select...</option>
                                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Year</label>
                            <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                                <option value="">Select...</option>
                                {YEARS.map(y => <option key={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={styles.label}>Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>Session Code</label>
                                <input type="text" placeholder="e.g. 2025-26-odd" value={session}
                                    onChange={e => setSession(e.target.value)} style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>Room No</label>
                                <input type="text" placeholder="e.g. LT-101" value={room}
                                    onChange={e => setRoom(e.target.value)} style={styles.input} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    onClick={lookupTimetable}
                                    disabled={ttLoading}
                                    style={{ ...styles.btnGhost, width: '100%', opacity: ttLoading ? 0.5 : 1 }}
                                >
                                    {ttLoading ? 'Looking up...' : 'Lookup'}
                                </button>
                            </div>
                        </div>

                        {/* Timetable results */}
                        {ttData && ttData.length > 0 && (
                            <div style={{
                                background: theme.bg, borderRadius: '6px', padding: '12px 16px',
                                marginBottom: 16, fontSize: '13px',
                            }}>
                                <div style={{ ...styles.label, marginBottom: 8 }}>Slots found for Room {room}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {ttData.map((entry, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setTimeSlot(entry.slot);
                                                // Try to derive batch from sem/code
                                            }}
                                            style={{
                                                padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                                                background: timeSlot === entry.slot ? theme.accentDim : 'transparent',
                                                border: `1px solid ${timeSlot === entry.slot ? theme.accent : theme.border}`,
                                                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8,
                                            }}
                                        >
                                            <span><strong>{entry.day}</strong> {entry.slot}</span>
                                            {entry.slotData?.map((sd, j) => (
                                                <span key={j} style={{ color: theme.textMuted }}>
                                                    {sd.subject} — {sd.faculty}
                                                </span>
                                            ))}
                                            <span style={{ color: theme.accent, fontFamily: theme.fontMono }}>
                                                Sem: {entry.sem}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Video Link + Run */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Video Link</label>
                        <input
                            type="text"
                            placeholder="Paste daily class video link..."
                            value={videoLink}
                            onChange={e => setVideoLink(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <button
                        onClick={runAttendance}
                        disabled={processing || !videoLink.trim()}
                        style={{
                            ...styles.btnPrimary, minWidth: 180,
                            opacity: (processing || !videoLink.trim()) ? 0.5 : 1,
                        }}
                    >
                        {processing ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)',
                                    borderTopColor: theme.accentText, borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                                }} />
                                Processing...
                            </span>
                        ) : 'Run Attendance'}
                    </button>
                </div>
            </div>

            {/* Processing state */}
            {processing && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '50px 20px' }}>
                    <div style={{
                        width: 44, height: 44, border: `3px solid ${theme.border}`,
                        borderTopColor: theme.accent, borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                    }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>Processing Video</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>
                        Detecting faces and comparing with ground truth embeddings...
                    </div>
                </div>
            )}

            {/* Attendance Report */}
            {report && !processing && (
                <div style={{ animation: 'fadeIn 0.4s' }}>
                    {/* Stats bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Total', val: stats.total, color: theme.text },
                            { label: 'Present', val: stats.present, color: theme.success },
                            { label: 'Absent', val: stats.absent, color: theme.danger },
                            { label: 'Flagged', val: stats.flagged, color: theme.warning },
                        ].map(s => (
                            <div key={s.label} style={{ ...styles.card, textAlign: 'center', padding: '20px 16px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 700, color: s.color, fontFamily: theme.fontMono }}>
                                    {s.val}
                                </div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Metadata bar */}
                    {report.metadata && (
                        <div style={{
                            ...styles.card, padding: '12px 20px', marginBottom: 16,
                            display: 'flex', gap: 24, fontSize: '13px', flexWrap: 'wrap',
                        }}>
                            {Object.entries(report.metadata).filter(([, v]) => v).map(([k, v]) => (
                                <span key={k}>
                                    <span style={{ color: theme.textMuted, textTransform: 'capitalize' }}>{k}: </span>
                                    <span style={{ fontWeight: 600 }}>{v}</span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Attendance Table */}
                    <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    {['#', 'Roll No', 'Status', 'Confidence', 'Flag'].map(h => (
                                        <th key={h} style={{
                                            padding: '14px 16px', textAlign: 'left',
                                            ...styles.label, marginBottom: 0, fontSize: '11px',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(report.attendance || []).map((student, i) => {
                                    const isFlagged = student.status === 'present' && student.confidence < CONFIDENCE_THRESHOLD;
                                    return (
                                        <tr
                                            key={student.rollNo}
                                            style={{
                                                borderBottom: `1px solid ${theme.border}`,
                                                background: isFlagged ? theme.warningDim : 'transparent',
                                            }}
                                        >
                                            <td style={{ padding: '12px 16px', color: theme.textMuted }}>{i + 1}</td>
                                            <td style={{ padding: '12px 16px', fontFamily: theme.fontMono, fontWeight: 600 }}>
                                                {student.rollNo}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={styles.badge(student.status === 'present' ? 'success' : 'danger')}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {student.status === 'present' ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{
                                                            width: 80, height: 6, borderRadius: '3px',
                                                            background: theme.border, overflow: 'hidden',
                                                        }}>
                                                            <div style={{
                                                                width: `${(student.confidence || 0) * 100}%`,
                                                                height: '100%', borderRadius: '3px',
                                                                background: student.confidence >= CONFIDENCE_THRESHOLD
                                                                    ? theme.success : theme.warning,
                                                            }} />
                                                        </div>
                                                        <span style={{
                                                            fontFamily: theme.fontMono, fontSize: '12px',
                                                            color: student.confidence >= CONFIDENCE_THRESHOLD
                                                                ? theme.success : theme.warning,
                                                        }}>
                                                            {(student.confidence * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: theme.textMuted }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {isFlagged && (
                                                    <span style={{
                                                        ...styles.badge('warning'),
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    }}>
                                                        ⚠ SVS Review
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
