// client/src/attendancemodule/groundtruthgen.jsx
// Page 1: Extract faces from class video → auto-save to serial folders → assign roll numbers later

import { useState, useCallback, useRef } from 'react';
import { API_BASE, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset } from './config';

export default function GroundTruthGen() {
    const [degree,       setDegree]       = useState('BTECH');
    const [department,   setDepartment]   = useState('');
    const [year,         setYear]         = useState('');
    const [videoLink,    setVideoLink]    = useState('');
    const [detSize,      setDetSize]      = useState(320);   // 320=Fast, 640=Accurate
    const [frameSkip,    setFrameSkip]    = useState(10);    // process every N frames
    const [minFaceSize,  setMinFaceSize]  = useState(80);    // min bbox dimension (px)
    const [lapThreshold, setLapThreshold] = useState(100);   // Laplacian blur threshold
    const [topN,         setTopN]         = useState(10);    // max images saved per person

    const [extracting,   setExtracting]   = useState(false);
    const [progress,     setProgress]     = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [log,          setLog]          = useState([]);   // [{time, msg}]
    const [result,       setResult]       = useState(null); // {peopleDetected, imagesSaved, batchDir}
    const [toast,        setToast]        = useState(null);

    const logRef = useRef(null);

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLog(prev => {
            const next = [...prev, { time, msg }].slice(-30);
            return next;
        });
        setTimeout(() => {
            if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 40);
    };

    // ─── Extract faces and auto-save to serial folders ────────────
    const handleExtract = useCallback(async () => {
        if (!batchName || !videoLink.trim()) {
            showToast('Fill in all fields and provide a video path', 'error');
            return;
        }

        setExtracting(true);
        setResult(null);
        setProgress(0);
        setProgressStage('start');
        setLog([]);

        // Ensure batch folder exists
        await fetch(`${API_BASE}/create-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ degree, department, year })
        });

        try {
            const response = await fetch(`${API_BASE}/extract-and-save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoLink: videoLink.trim(), batch: batchName,
                    detSize, frameSkip,
                    minFaceSize, lapThreshold, topN,
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const reader  = response.body.getReader();
            const decoder = new TextDecoder();
            let   buffer  = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split('\n\n');
                buffer = chunks.pop();

                for (const chunk of chunks) {
                    const line = chunk.split('\n').find(l => l.startsWith('data: '));
                    if (!line) continue;
                    let ev;
                    try { ev = JSON.parse(line.slice(6)); } catch { continue; }

                    if (ev.type === 'stage') {
                        setProgressStage(ev.stage);
                        addLog(`▶ ${ev.message}`);

                    } else if (ev.type === 'progress') {
                        setProgress(ev.progress || 0);
                        addLog(`⏳ ${ev.message}`);

                    } else if (ev.type === 'done') {
                        setProgress(100);
                        setProgressStage('done');
                        setResult({
                            peopleDetected: ev.people_detected,
                            imagesSaved:    ev.images_saved,
                            batchDir:       ev.batch_dir,
                            elapsedSec:     ev.elapsed_sec,
                        });
                        addLog(`✅ ${ev.message}`);
                        showToast(`${ev.people_detected} people detected, ${ev.images_saved} images saved`);

                    } else if (ev.type === 'error') {
                        setProgressStage('error');
                        addLog(`❌ ${ev.message}`);
                        showToast(ev.message, 'error');
                    }
                }
            }
        } catch (err) {
            addLog(`❌ ${err.message}`);
            showToast('Extraction failed: ' + err.message, 'error');
            setProgressStage('error');
        } finally {
            setExtracting(false);
        }
    }, [batchName, videoLink, degree, department, year, detSize, frameSkip, minFaceSize, lapThreshold, topN]);

    const stageLabel = {
        start:      '🚀 Starting…',
        extracting: '🎞 Extracting faces from video',
        clustering: '🔵 Clustering unique faces',
        saving:     '💾 Saving images to folders',
        done:       '✅ Completed',
        error:      '❌ Error',
    };

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 999,
                    padding: '12px 24px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 600,
                    background: toast.type === 'error' ? theme.dangerDim : theme.successDim,
                    color:      toast.type === 'error' ? theme.danger    : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Ground Truth Generation</div>
                <div style={styles.subheading}>
                    Extract faces from class video → images saved automatically to serial folders →
                    assign roll numbers on the next page
                </div>
            </div>

            {/* Config Card */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 16, marginBottom: 20 }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Year (Batch)</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Video Path</label>
                        <input
                            type="text"
                            placeholder="C:/path/to/classroom_video.mp4"
                            value={videoLink}
                            onChange={e => setVideoLink(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Detection quality toggle */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Detection Quality</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[
                            { value: 320, label: 'Fast (320)', hint: '~4× faster, good for clear footage' },
                            { value: 640, label: 'Accurate (640)', hint: 'Better for small/distant faces' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setDetSize(opt.value)}
                                title={opt.hint}
                                style={{
                                    padding: '7px 18px', borderRadius: 6, cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 600, border: '1px solid',
                                    borderColor: detSize === opt.value ? theme.accent : theme.border,
                                    background:  detSize === opt.value ? theme.accentDim || theme.accent + '22' : 'transparent',
                                    color:       detSize === opt.value ? theme.accent : theme.textMuted,
                                    transition:  'all 0.15s',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Frame skip toggle */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Frame Skip</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[
                            { value: 10,  hint: 'Denser sampling, slower' },
                            { value: 20,  hint: 'Balanced' },
                            { value: 50,  hint: 'Fast, sparser sampling' },
                            { value: 100, hint: 'Fastest, fewest frames' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFrameSkip(opt.value)}
                                title={opt.hint}
                                style={{
                                    padding: '7px 18px', borderRadius: 6, cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 600, border: '1px solid',
                                    borderColor: frameSkip === opt.value ? theme.accent : theme.border,
                                    background:  frameSkip === opt.value ? theme.accentDim : 'transparent',
                                    color:       frameSkip === opt.value ? theme.accent : theme.textMuted,
                                    transition:  'all 0.15s',
                                }}
                            >
                                Every {opt.value}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 5 }}>
                        {frameSkip === 10  && 'Every 10th frame — best coverage, slower processing'}
                        {frameSkip === 20  && 'Every 20th frame — good balance of speed and coverage'}
                        {frameSkip === 50  && 'Every 50th frame — fast processing, may miss some faces'}
                        {frameSkip === 100 && 'Every 100th frame — fastest, use for very long videos'}
                    </div>
                </div>

                {/* Min face size */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>
                        Min Face Size
                        <span style={{ marginLeft: 6, fontSize: '11px', color: theme.textMuted, fontWeight: 400 }}>
                            — skip faces smaller than this (unreliable embeddings)
                        </span>
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[
                            { value: 0,   label: 'Off',     hint: 'No size filter' },
                            { value: 60,  label: '60 px',   hint: 'Loose filter — allows distant faces' },
                            { value: 80,  label: '80 px',   hint: 'Recommended — good quality threshold' },
                            { value: 100, label: '100 px',  hint: 'Strict — only close-up faces' },
                            { value: 120, label: '120 px',  hint: 'Very strict — frontrow only' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setMinFaceSize(opt.value)}
                                title={opt.hint}
                                style={{
                                    padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 600, border: '1px solid',
                                    borderColor: minFaceSize === opt.value ? theme.accent : theme.border,
                                    background:  minFaceSize === opt.value ? theme.accentDim : 'transparent',
                                    color:       minFaceSize === opt.value ? theme.accent : theme.textMuted,
                                    transition:  'all 0.15s',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 5 }}>
                        {minFaceSize === 0   && 'No size filter — all detected faces included'}
                        {minFaceSize === 60  && '60×60 px minimum — allows faces up to ~3–4 m away'}
                        {minFaceSize === 80  && '80×80 px minimum — recommended for reliable embeddings'}
                        {minFaceSize === 100 && '100×100 px minimum — close-up faces only'}
                        {minFaceSize === 120 && '120×120 px minimum — front-row seats only'}
                    </div>
                </div>

                {/* Blur / Laplacian threshold */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>
                        Blur Filter (Laplacian Variance)
                        <span style={{ marginLeft: 6, fontSize: '11px', color: theme.textMuted, fontWeight: 400 }}>
                            — skip motion-blurred faces
                        </span>
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[
                            { value: 0,   label: 'Off',    hint: 'No blur filter' },
                            { value: 50,  label: 'Loose',  hint: 'Only remove very blurry frames' },
                            { value: 100, label: 'Medium', hint: 'Recommended — removes motion blur' },
                            { value: 200, label: 'Strict', hint: 'Requires sharp, well-lit faces' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setLapThreshold(opt.value)}
                                title={opt.hint}
                                style={{
                                    padding: '7px 18px', borderRadius: 6, cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 600, border: '1px solid',
                                    borderColor: lapThreshold === opt.value ? theme.accent : theme.border,
                                    background:  lapThreshold === opt.value ? theme.accentDim : 'transparent',
                                    color:       lapThreshold === opt.value ? theme.accent : theme.textMuted,
                                    transition:  'all 0.15s',
                                }}
                            >
                                {opt.label} {opt.value > 0 ? `(${opt.value})` : ''}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 5 }}>
                        {lapThreshold === 0   && 'No blur filter — all sharp and blurry faces included'}
                        {lapThreshold === 50  && 'Loose (≥50) — removes severely blurry frames only'}
                        {lapThreshold === 100 && 'Medium (≥100) — recommended, removes motion blur'}
                        {lapThreshold === 200 && 'Strict (≥200) — requires well-focused faces'}
                    </div>
                </div>

                {/* Top-N images per person */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>
                        Images per Person
                        <span style={{ marginLeft: 6, fontSize: '11px', color: theme.textMuted, fontWeight: 400 }}>
                            — top 5 used for embedding, rest kept as backup
                        </span>
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[
                            { value: 5,  hint: 'Minimal storage, embedding = all 5' },
                            { value: 8,  hint: '5 embed + 3 backup' },
                            { value: 10, hint: '5 embed + 5 backup (recommended)' },
                            { value: 15, hint: '5 embed + 10 backup' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setTopN(opt.value)}
                                title={opt.hint}
                                style={{
                                    padding: '7px 18px', borderRadius: 6, cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 600, border: '1px solid',
                                    borderColor: topN === opt.value ? theme.accent : theme.border,
                                    background:  topN === opt.value ? theme.accentDim : 'transparent',
                                    color:       topN === opt.value ? theme.accent : theme.textMuted,
                                    transition:  'all 0.15s',
                                }}
                            >
                                {opt.value} imgs
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 5 }}>
                        {topN === 5  && '5 images — all used for embedding, no backup'}
                        {topN === 8  && '8 images — top 5 for embedding, 3 backup for manual review'}
                        {topN === 10 && '10 images — top 5 for embedding, 5 backup (recommended)'}
                        {topN === 15 && '15 images — top 5 for embedding, 10 backup for diversity'}
                    </div>
                </div>

                {/* Folder preview + Extract button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                        padding: '10px 16px', background: theme.bg, borderRadius: '6px',
                        fontSize: '13px', fontFamily: theme.fontMono, flex: 1, marginRight: 16,
                    }}>
                        <span style={{ color: theme.textMuted }}>Folder: </span>
                        <span style={{ color: batchName ? theme.accent : theme.textMuted, fontWeight: 600 }}>
                            ground_truth/{batchName || '…'}/person_001/ … person_NNN/
                        </span>
                    </div>
                    <button
                        onClick={handleExtract}
                        disabled={extracting || !batchName || !videoLink.trim()}
                        style={{
                            ...styles.btnPrimary,
                            opacity: (extracting || !batchName || !videoLink.trim()) ? 0.5 : 1,
                            minWidth: 200,
                        }}
                    >
                        {extracting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                <span style={{
                                    width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)',
                                    borderTopColor: theme.accentText, borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite', display: 'inline-block'
                                }} />
                                Processing…
                            </span>
                        ) : '🎞 Extract & Save Faces'}
                    </button>
                </div>
            </div>

            {/* Live progress panel */}
            {extracting && (
                <div style={{ ...styles.card, background: '#0d1117', borderColor: theme.accent, marginBottom: 20 }}>
                    {/* Stage */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: theme.accent, animation: 'pulse 1.5s infinite'
                        }} />
                        <span style={{ color: theme.accent, fontWeight: 700, fontSize: '14px' }}>
                            {stageLabel[progressStage] || progressStage}
                        </span>
                    </div>

                    {/* Progress bar (extraction phase) */}
                    {progressStage === 'extracting' && (
                        <div style={{ marginBottom: 14 }}>
                            <div style={{
                                width: '100%', height: 8, background: theme.border,
                                borderRadius: 4, overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${progress}%`, height: '100%',
                                    background: theme.accent, borderRadius: 4,
                                    transition: 'width 0.4s ease'
                                }} />
                            </div>
                            <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: 4, textAlign: 'right' }}>
                                {progress}%
                            </div>
                        </div>
                    )}

                    {/* Scrollable log */}
                    <div
                        ref={logRef}
                        style={{
                            maxHeight: 160, overflowY: 'auto',
                            background: '#000', borderRadius: 6,
                            padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '12px'
                        }}
                    >
                        {log.map((entry, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
                                <span style={{ color: '#555', flexShrink: 0 }}>{entry.time}</span>
                                <span style={{ color: '#ccc' }}>{entry.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Completion card */}
            {result && !extracting && (
                <div style={{
                    ...styles.card,
                    borderColor: theme.success, background: theme.successDim,
                    marginBottom: 20
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: theme.success, marginBottom: 12 }}>
                        ✅ Extraction Complete
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                        {[
                            { label: 'People Detected', value: result.peopleDetected },
                            { label: 'Images Saved',    value: result.imagesSaved    },
                            { label: 'Time Taken',      value: `${result.elapsedSec}s` },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: '#fff', borderRadius: 8, padding: '12px 16px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: theme.accent }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        padding: '10px 14px', background: theme.bg,
                        borderRadius: 6, fontFamily: theme.fontMono, fontSize: '12px', color: theme.textMuted
                    }}>
                        Saved to: <span style={{ color: theme.accent }}>{result.batchDir}</span>
                    </div>
                    <div style={{ marginTop: 12, fontSize: '13px', color: theme.textMuted }}>
                        Folders named <strong style={{ color: theme.text }}>person_001</strong>,&nbsp;
                        <strong style={{ color: theme.text }}>person_002</strong>, … — go to
                        &nbsp;<strong style={{ color: theme.accent }}>Edit Ground Truth</strong>&nbsp;
                        to curate images, then to&nbsp;<strong style={{ color: theme.accent }}>Assign Roll Numbers</strong>&nbsp;
                        to map clusters to students.
                    </div>
                </div>
            )}

            {/* Post-extraction log (collapsed view) */}
            {result && log.length > 0 && (
                <div style={{ ...styles.card, padding: '12px 16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted, marginBottom: 8 }}>
                        Processing Log
                    </div>
                    <div style={{
                        maxHeight: 120, overflowY: 'auto',
                        fontFamily: theme.fontMono, fontSize: '11px', color: theme.textMuted
                    }}>
                        {log.map((entry, i) => (
                            <div key={i}><span style={{ color: '#555' }}>{entry.time}</span>&nbsp;{entry.msg}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!extracting && !result && (
                <div style={{
                    ...styles.card, textAlign: 'center',
                    padding: '60px 20px', borderStyle: 'dashed',
                }}>
                    <div style={{ fontSize: '40px', marginBottom: 12, opacity: 0.4 }}>🎥</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>
                        Ready to extract faces
                    </div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>
                        Select batch → paste video path → click "Extract & Save Faces"
                        <br />
                        Images are automatically saved to serial folders — no tagging needed here
                    </div>
                </div>
            )}
        </div>
    );
}
