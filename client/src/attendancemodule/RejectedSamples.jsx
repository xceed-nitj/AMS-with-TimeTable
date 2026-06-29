import { useState, useEffect, useCallback } from 'react';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const SAMPLES_API = `${getEnvironment()}/api/v1/ml/liveness-rejected-samples`;

export default function RejectedSamples() {
    const [samples,       setSamples]       = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [availableDepts, setAvailableDepts] = useState([]);
    const [deptFilter,    setDeptFilter]    = useState('');

    const loadSamples = useCallback(async (dept = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 50 });
            if (dept) params.set('dept', dept);
            const res  = await fetch(`${SAMPLES_API}?${params}`);
            const data = await res.json();
            setSamples(data.samples || []);
            if (data.depts?.length) setAvailableDepts(data.depts);
        } catch {}
        setLoading(false);
    }, []);

    useEffect(() => { loadSamples(''); }, [loadSamples]);

    const handleDeptChange = (dept) => {
        setDeptFilter(dept);
        loadSamples(dept);
    };

    return (
        <div style={{ marginTop: 16 }}>
            <style>{cssReset}</style>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                        Rejected Samples
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>
                        Face crops rejected by liveness / anti-spoofing during attendance. Use these to judge whether the threshold is too strict or too lenient.
                    </div>
                </div>
                {availableDepts.length > 0 && (
                    <select
                        value={deptFilter}
                        onChange={e => handleDeptChange(e.target.value)}
                        disabled={loading}
                        style={{ ...styles.select, padding: '6px 10px', fontSize: 12, minWidth: 130 }}
                    >
                        <option value="">All Depts</option>
                        {availableDepts.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                )}
                <button
                    onClick={() => loadSamples(deptFilter)}
                    disabled={loading}
                    style={{ ...styles.btnGhost, padding: '6px 14px', fontSize: 12 }}
                >
                    {loading ? 'Loading…' : '↻ Refresh'}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Loading…</div>
            ) : samples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, fontSize: 13 }}>
                    No rejected crops saved yet. They appear here once attendance runs reject a spoofed face
                    (requires "Save rejected crops" to be on in ML Fine Tuning).
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                    {samples.map(s => (
                        <div key={s.filename} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                            <img
                                src={s.image}
                                alt={s.filename}
                                style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                            />
                            <div style={{ padding: '4px 6px' }}>
                                {s.dept && (
                                    <div style={{
                                        display: 'inline-block', fontSize: 9, fontWeight: 700,
                                        padding: '1px 5px', borderRadius: 4, marginBottom: 2,
                                        background: `${theme.accent}18`, color: theme.accent,
                                    }}>
                                        {s.dept}
                                    </div>
                                )}
                                <div style={{ fontSize: 10, color: theme.textMuted, wordBreak: 'break-all' }}>
                                    {s.filename}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
