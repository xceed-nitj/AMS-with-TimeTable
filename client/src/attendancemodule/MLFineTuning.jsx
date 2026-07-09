// client/src/attendancemodule/MLFineTuning.jsx
// ML Fine Tuning — liveness/anti-spoofing threshold controls + rejected
// sample review, so a non-developer admin can tune detection without
// touching server code or restarting the ML service.

import { useState, useEffect, useCallback } from 'react';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const CONFIG_API      = `${apiUrl}/api/v1/ml/liveness-config`;
const GT_CONFIG_API   = `${apiUrl}/api/v1/ml/gt-config`;
const ATTEND_API      = `${apiUrl}/attendancemodule/acquisitioncontrol/attendance-thresholds`;
const FAISS_CONFIG_API = `${apiUrl}/api/v1/ml/faiss-config`;
const MAX_K_CONFIG_API = `${apiUrl}/api/v1/ml/max-k-config`;
const ADAFACE_CONFIG_API = `${apiUrl}/api/v1/ml/adaface-config`;
const PIPELINE_CONFIG_API = `${apiUrl}/api/v1/ml/pipeline-config`;
const DETECTOR_CONFIG_API = `${apiUrl}/api/v1/ml/detector-config`;

// Face Detector — detection-only swap; embedding side untouched
const DETECTOR_MODELS = [
    { key: 'scrfd',      label: 'SCRFD-10G (buffalo_l built-in)', hint: 'InsightFace buffalo_l’s own detector — strong small-face recall, the long-standing default.' },
    { key: 'retinaface', label: 'RetinaFace (external ONNX)',     hint: 'Optional comparison detector — needs models/retinaface.onnx on the ML machine (README_RETINAFACE.md).' },
];

// Model Pipeline — the four models selectable as primary / middle-run shadow
const PIPELINE_MODELS = [
    { key: 'mean',    label: 'Mean (InsightFace)',     hint: 'Classic weighted-mean embedding per student — the long-standing default.' },
    { key: 'max_k',   label: 'Max-of-K (InsightFace)', hint: 'Max-similarity across each student’s top-K stored embeddings.' },
    { key: 'faiss',   label: 'FAISS Index',            hint: 'Full-index top-k voting (all departments). No Hungarian optimality as primary.' },
    { key: 'adaface', label: 'AdaFace',                hint: 'Independent second model — needs its ONNX file and AdaFace embeddings.' },
];

const HEURISTIC_OPTIONS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40];
const ONNX_OPTIONS      = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90];

// GT Acquisition — fixed option sets per parameter
const GT_OPTIONS = {
    frame_skip:             [1, 3, 5, 10, 15, 20, 30],
    target_imgs_per_person: [5, 8, 10, 15, 20, 30],
    cluster_threshold:      [0.35, 0.40, 0.45, 0.50, 0.55, 0.60],
    min_samples:            [2, 3, 5, 7, 10],
    det_size:               [320, 640],
    merge_threshold:        [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90],
    nms_iou_thresh:         [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50],
    det_score_floor:        [0.30, 0.40, 0.50, 0.60, 0.70],
    new_person_timeout:     [15, 30, 45, 60, 90, 120, 180],
    top_n:                  [5, 8, 10, 15, 20, 30],
    embed_n:                [3, 4, 5, 7, 10],
};

const GT_LABELS = {
    frame_skip:             { label: 'Frame skip',             unit: 'frames',  hint: 'Process 1 in every N frames. Lower = more coverage, higher = faster.' },
    target_imgs_per_person: { label: 'Target images / person', unit: 'images',  hint: 'Stop collecting for a person once this many are saved.' },
    cluster_threshold:      { label: 'Cluster threshold',      unit: '',        hint: 'DBSCAN cosine similarity eps. Higher = looser clusters (may merge different people).' },
    min_samples:            { label: 'Min cluster samples',    unit: 'detections', hint: 'DBSCAN min_samples. Higher = fewer but more certain clusters.' },
    det_size:               { label: 'Detection grid size',    unit: 'px',      hint: 'InsightFace input size. 640 is more accurate but slower.' },
    merge_threshold:        { label: 'Merge threshold',        unit: '',        hint: 'Post-DBSCAN cluster-merge cosine similarity. Lower merges more aggressively.' },
    nms_iou_thresh:         { label: 'NMS IoU threshold',      unit: '',        hint: 'Non-maximum suppression overlap. Lower keeps fewer overlapping detections.' },
    det_score_floor:        { label: 'Det score floor',        unit: '',        hint: 'Minimum InsightFace detection confidence to include a face in embeddings.' },
    new_person_timeout:     { label: 'New-person timeout',     unit: 'sec',     hint: 'Auto-stop if all people reach target and no new person appears for N seconds.' },
    top_n:                  { label: 'Max images / person',    unit: 'images',  hint: 'Maximum images kept per person folder (lowest-quality ones are deleted).' },
    embed_n:                { label: 'Embedding images',       unit: 'images',  hint: 'Of the top-N kept, how many are used to compute the mean embedding.' },
};

const ATTEND_OPTIONS = {
    threshold:              [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60],
    auto_present_threshold: [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75],
    review_threshold:       [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50],
    min_detections:         [1, 2, 3, 4, 5, 7, 10],
    auto_enroll_threshold:  [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95],
    alert_confidence:       [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70],
};

const ATTEND_LABELS = {
    threshold:              { label: 'Recognition threshold',    unit: '',       hint: 'Minimum cosine similarity to match a detected face to a known student.' },
    auto_present_threshold: { label: 'Auto-present threshold',   unit: '',       hint: 'Confidence at or above this marks a student as Present automatically.' },
    review_threshold:       { label: 'Review threshold',         unit: '',       hint: 'Scores between this and auto-present are flagged for manual review (R).' },
    min_detections:         { label: 'Min detections',           unit: 'frames', hint: 'Student must appear in at least this many frames to be considered detected.' },
    auto_enroll_threshold:  { label: 'Auto-enroll threshold',    unit: '',       hint: 'Confidence required to auto-add a new face to the ground-truth dataset.' },
    alert_confidence:       { label: 'Low-confidence alert',     unit: '',       hint: 'Students with average confidence below this trigger a low-confidence notification.' },
};

const ATTEND_DEFAULTS = {
    threshold: 0.45, auto_present_threshold: 0.60, review_threshold: 0.40,
    min_detections: 3, auto_enroll_threshold: 0.75, alert_confidence: 0.60,
};

// FAISS Recognition — live tracked-attendance matching pipeline
const FAISS_OPTIONS = {
    top_k:               [3, 5, 7, 10, 15, 20],
    recog_threshold:     [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60],
    reverify_high_score: [0.70, 0.75, 0.80, 0.85, 0.90, 0.95],
    reverify_high_ttl:   [15, 20, 30, 45, 60, 90, 120],
    reverify_med_score:  [0.50, 0.55, 0.60, 0.65, 0.70, 0.75],
    reverify_med_ttl:    [5, 10, 15, 20, 30, 45, 60],
    reverify_low_score:  [0.30, 0.35, 0.40, 0.45, 0.50, 0.55],
    reverify_low_ttl:    [0, 5, 8, 10, 12, 15, 20, 30],
};

const FAISS_LABELS = {
    top_k:               { label: 'Top-K candidates',        unit: '',    hint: 'Nearest-neighbor candidates considered per detection before vote-matching.' },
    recog_threshold:     { label: 'Recognition threshold',   unit: '',    hint: 'Minimum similarity to accept a FAISS match.' },
    reverify_high_score: { label: 'High-confidence score',   unit: '',    hint: 'Scores at or above this use the longest re-verify cache TTL.' },
    reverify_high_ttl:   { label: 'High-confidence TTL',     unit: 'sec', hint: 'How long a high-confidence track skips re-recognition.' },
    reverify_med_score:  { label: 'Medium-confidence score', unit: '',    hint: 'Scores at or above this (below high) use the medium TTL.' },
    reverify_med_ttl:    { label: 'Medium-confidence TTL',   unit: 'sec', hint: 'Cache duration for medium-confidence tracks.' },
    reverify_low_score:  { label: 'Low-confidence score',    unit: '',    hint: 'Scores at or above this (below medium) use the low TTL. Below this, always re-verify.' },
    reverify_low_ttl:    { label: 'Low-confidence TTL',      unit: 'sec', hint: 'Cache duration for low-confidence tracks.' },
};

const FAISS_DEFAULTS = {
    top_k: 5, recog_threshold: 0.35,
    reverify_high_score: 0.80, reverify_high_ttl: 60,
    reverify_med_score: 0.65, reverify_med_ttl: 30,
    reverify_low_score: 0.45, reverify_low_ttl: 12,
};

// Max-of-K shadow comparison — Hungarian batch-matching pipeline (RTSP
// attendance runs, both "Run Once" and scheduled sessions)
const MAX_K_OPTIONS = { top_k: [1, 2, 3] };
const MAX_K_LABELS = {
    top_k: { label: 'Top-K embeddings per student', unit: '', hint: 'How many of each student’s stored embeddings to score against (max-similarity across the K). Capped by how many were retained the last time that student’s embedding was regenerated (up to 3).' },
};
const MAX_K_DEFAULTS = { enabled: false, top_k: 3 };

// AdaFace shadow comparison — independent face-recognition model, compared
// mid-period against the primary (InsightFace mean-embedding) assignment.
const ADAFACE_OPTIONS = {
    top_k:           [1, 2, 3],
    recog_threshold: [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50],
};
const ADAFACE_LABELS = {
    top_k:           { label: 'Top-K embeddings per student', unit: '', hint: 'How many of each student’s stored AdaFace embeddings to score against (max-similarity across the K).' },
    recog_threshold: { label: 'Recognition threshold',        unit: '', hint: 'Minimum AdaFace similarity to accept a match. AdaFace has its own similarity scale — don’t assume it matches InsightFace/FAISS thresholds.' },
};
const ADAFACE_DEFAULTS = { enabled: false, recog_threshold: 0.30, top_k: 3 };

function Toggle({ checked, onChange, disabled, label }) {
    return (
        <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        }}>
            <span
                onClick={() => !disabled && onChange(!checked)}
                style={{
                    width: 42, height: 24, borderRadius: 14, position: 'relative',
                    background: checked ? theme.accent : theme.border,
                    transition: 'background 0.2s', flexShrink: 0,
                }}
            >
                <span style={{
                    position: 'absolute', top: 3, left: checked ? 21 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }} />
            </span>
            {label && <span style={{ fontSize: 13, color: theme.text }}>{label}</span>}
        </label>
    );
}

export default function MLFineTuning() {
    const [config, setConfig]       = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [toast, setToast]         = useState(null);

    const [gtConfig,     setGtConfig]     = useState(null);
    const [gtLoading,    setGtLoading]    = useState(true);
    const [gtSaving,     setGtSaving]     = useState(false);

    const [attendThresh, setAttendThresh] = useState(null);
    const [attendLoading, setAttendLoading] = useState(true);
    const [attendSaving,  setAttendSaving]  = useState(false);

    const [faissConfig,  setFaissConfig]  = useState(null);
    const [faissLoading, setFaissLoading] = useState(true);
    const [faissSaving,  setFaissSaving]  = useState(false);
    const [faissRebuilding, setFaissRebuilding] = useState(false);

    const [maxKConfig,  setMaxKConfig]  = useState(null);
    const [maxKLoading, setMaxKLoading] = useState(true);
    const [maxKSaving,  setMaxKSaving]  = useState(false);

    const [adafaceConfig,  setAdafaceConfig]  = useState(null);
    const [adafaceLoading, setAdafaceLoading] = useState(true);
    const [adafaceSaving,  setAdafaceSaving]  = useState(false);

    const [pipelineConfig,  setPipelineConfig]  = useState(null);
    const [pipelineLoading, setPipelineLoading] = useState(true);
    const [pipelineSaving,  setPipelineSaving]  = useState(false);

    const [detectorConfig,  setDetectorConfig]  = useState(null);
    const [detectorLoading, setDetectorLoading] = useState(true);
    const [detectorSaving,  setDetectorSaving]  = useState(false);

    const [restarting, setRestarting] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Restart the ML service (may be on a remote GPU box, e.g. the H100) —
    // triggers its in-place re-exec, then polls /health until it's back,
    // then reloads every config section so the page reflects fresh state.
    const restartMlService = async () => {
        if (!window.confirm(
            'Restart the ML service? In-flight attendance/embedding runs will be dropped, '
            + 'and the service will be unavailable while models reload (typically 30–90s).'
        )) return;
        setRestarting(true);
        try {
            const res = await fetch(`${apiUrl}/api/v1/ml/restart-ml-service`, { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showToast('Restart triggered — waiting for the service to come back…');

            const HEALTH_API = `${apiUrl}/api/v1/ml/health`;
            const deadline = Date.now() + 4 * 60 * 1000;
            // Give the process a moment to actually go down before polling.
            await new Promise(r => setTimeout(r, 5000));
            while (Date.now() < deadline) {
                try {
                    const h = await fetch(HEALTH_API);
                    const hd = await h.json();
                    if (h.ok && hd.status === 'ok') {
                        showToast(`ML service is back online${hd.model_loaded ? ' (model loaded)' : ''}.`);
                        loadConfig(); loadGtConfig(); loadFaissConfig(); loadMaxKConfig(); loadAdafaceConfig(); loadPipelineConfig(); loadDetectorConfig();
                        setRestarting(false);
                        return;
                    }
                } catch (_) { /* still down — keep polling */ }
                await new Promise(r => setTimeout(r, 4000));
            }
            showToast('Service did not come back within 4 minutes — check the ML machine.', 'error');
        } catch (err) {
            showToast(`Restart failed: ${err.message}`, 'error');
        }
        setRestarting(false);
    };

    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setConfig(data);
        } catch (err) {
            showToast(`Failed to load config: ${err.message}`, 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfig(); }, [loadConfig]);

    const loadGtConfig = useCallback(async () => {
        setGtLoading(true);
        try {
            const res = await fetch(GT_CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGtConfig(data);
        } catch (err) {
            showToast(`Failed to load GT config: ${err.message}`, 'error');
        }
        setGtLoading(false);
    }, []);

    useEffect(() => { loadGtConfig(); }, [loadGtConfig]);

    const loadAttendThresh = useCallback(async () => {
        setAttendLoading(true);
        try {
            const res = await fetch(ATTEND_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAttendThresh(data);
        } catch (err) {
            showToast(`Failed to load attendance thresholds: ${err.message}`, 'error');
        }
        setAttendLoading(false);
    }, []);

    useEffect(() => { loadAttendThresh(); }, [loadAttendThresh]);

    const loadFaissConfig = useCallback(async () => {
        setFaissLoading(true);
        try {
            const res = await fetch(FAISS_CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setFaissConfig(data);
        } catch (err) {
            showToast(`Failed to load FAISS config: ${err.message}`, 'error');
        }
        setFaissLoading(false);
    }, []);

    useEffect(() => { loadFaissConfig(); }, [loadFaissConfig]);

    const loadMaxKConfig = useCallback(async () => {
        setMaxKLoading(true);
        try {
            const res = await fetch(MAX_K_CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setMaxKConfig(data);
        } catch (err) {
            showToast(`Failed to load Max-of-K config: ${err.message}`, 'error');
        }
        setMaxKLoading(false);
    }, []);

    useEffect(() => { loadMaxKConfig(); }, [loadMaxKConfig]);

    const updateMaxKConfig = async (patch) => {
        setMaxKSaving(true);
        const prev = maxKConfig;
        setMaxKConfig({ ...maxKConfig, ...patch });
        try {
            const res = await fetch(MAX_K_CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setMaxKConfig(data);
            showToast('Max-of-K setting updated');
        } catch (err) {
            setMaxKConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setMaxKSaving(false);
    };

    const loadAdafaceConfig = useCallback(async () => {
        setAdafaceLoading(true);
        try {
            const res = await fetch(ADAFACE_CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAdafaceConfig(data);
        } catch (err) {
            showToast(`Failed to load AdaFace config: ${err.message}`, 'error');
        }
        setAdafaceLoading(false);
    }, []);

    useEffect(() => { loadAdafaceConfig(); }, [loadAdafaceConfig]);

    const updateAdafaceConfig = async (patch) => {
        setAdafaceSaving(true);
        const prev = adafaceConfig;
        setAdafaceConfig({ ...adafaceConfig, ...patch });
        try {
            const res = await fetch(ADAFACE_CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAdafaceConfig(data);
            showToast('AdaFace setting updated');
        } catch (err) {
            setAdafaceConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setAdafaceSaving(false);
    };

    const loadPipelineConfig = useCallback(async () => {
        setPipelineLoading(true);
        try {
            const res = await fetch(PIPELINE_CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPipelineConfig(data);
        } catch (err) {
            showToast(`Failed to load Model Pipeline config: ${err.message}`, 'error');
        }
        setPipelineLoading(false);
    }, []);

    useEffect(() => { loadPipelineConfig(); }, [loadPipelineConfig]);

    const updatePipelineConfig = async (patch) => {
        setPipelineSaving(true);
        const prev = pipelineConfig;
        setPipelineConfig({ ...pipelineConfig, ...patch });
        try {
            const res = await fetch(PIPELINE_CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPipelineConfig(data);
            showToast('Model Pipeline updated');
        } catch (err) {
            setPipelineConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setPipelineSaving(false);
    };

    const loadDetectorConfig = useCallback(async () => {
        setDetectorLoading(true);
        try {
            const res = await fetch(DETECTOR_CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setDetectorConfig(data);
        } catch (err) {
            showToast(`Failed to load detector config: ${err.message}`, 'error');
        }
        setDetectorLoading(false);
    }, []);

    useEffect(() => { loadDetectorConfig(); }, [loadDetectorConfig]);

    const updateDetectorConfig = async (patch) => {
        setDetectorSaving(true);
        const prev = detectorConfig;
        setDetectorConfig({ ...detectorConfig, ...patch });
        try {
            const res = await fetch(DETECTOR_CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setDetectorConfig(data);
            showToast('Face detector updated — applies to the next detection');
        } catch (err) {
            setDetectorConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setDetectorSaving(false);
    };

    const updateFaissConfig = async (patch) => {
        setFaissSaving(true);
        const prev = faissConfig;
        setFaissConfig({ ...faissConfig, ...patch });
        try {
            const res = await fetch(FAISS_CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setFaissConfig(data);
            showToast('FAISS setting updated');
        } catch (err) {
            setFaissConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setFaissSaving(false);
    };

    const triggerFaissRebuild = async () => {
        if (!window.confirm('Trigger a manual FAISS index rebuild from the stored embeddings? (This usually happens automatically).')) return;
        setFaissRebuilding(true);
        try {
            const res = await fetch(`${apiUrl}/api/v1/ml/rebuild-faiss`, { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showToast('FAISS index rebuild triggered successfully');
        } catch (err) {
            showToast(`Failed to trigger FAISS rebuild: ${err.message}`, 'error');
        }
        setFaissRebuilding(false);
    };

    const updateAttendThresh = async (patch) => {
        setAttendSaving(true);
        const prev = attendThresh;
        setAttendThresh({ ...attendThresh, ...patch });
        try {
            const res = await fetch(ATTEND_API, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAttendThresh(data);
            showToast('Threshold updated');
        } catch (err) {
            setAttendThresh(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setAttendSaving(false);
    };

    const updateGtConfig = async (patch) => {
        setGtSaving(true);
        const prev = gtConfig;
        setGtConfig({ ...gtConfig, ...patch });
        try {
            const res = await fetch(GT_CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGtConfig(data);
            showToast('GT setting updated');
        } catch (err) {
            setGtConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setGtSaving(false);
    };

    const updateConfig = async (patch) => {
        setSaving(true);
        // Optimistic UI update — revert on failure
        const prev = config;
        setConfig({ ...config, ...patch });
        try {
            const res = await fetch(CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setConfig(data);
            showToast('Setting updated');
        } catch (err) {
            setConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <style>{cssReset}</style>
                <div style={{ ...styles.subheading, padding: 40, textAlign: 'center' }}>Loading configuration…</div>
            </div>
        );
    }

    if (!config) {
        return (
            <div style={styles.page}>
                <style>{cssReset}</style>
                <div style={{ padding: 40, textAlign: 'center', color: theme.danger }}>
                    Could not reach the ML service. Make sure python-ml-service is running.
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 9000,
                    padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: toast.type === 'error' ? theme.danger : theme.success, color: '#fff',
                }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <div style={styles.heading}>ML Fine Tuning</div>
                    <div style={styles.subheading}>Tune model behaviour for attendance detection — no restart required, changes apply to the next face check.</div>
                </div>
                <button
                    onClick={restartMlService}
                    disabled={restarting}
                    style={{
                        ...styles.btnPrimary,
                        background: restarting ? theme.textMuted : theme.danger,
                        whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                >
                    {restarting ? 'Restarting… waiting for service' : 'Restart ML Service'}
                </button>
            </div>

            {/* ── Model Pipeline — primary decision-maker + middle-run shadows ── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Model Pipeline</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Choose which model <strong>decides attendance</strong> (Primary) and which run as
                        diagnostic comparisons on the <strong>middle run</strong> of each scheduled period.
                        Applies to all attendance runs. If the primary can&rsquo;t run at attendance time
                        (missing model/index/embeddings) it falls back to Mean and the report is tagged.
                    </div>
                </div>

                {pipelineLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !pipelineConfig ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load Model Pipeline config.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {PIPELINE_MODELS.map((m, idx) => {
                            const isPrimary = pipelineConfig.primary === m.key;
                            const notReady =
                                (m.key === 'adaface' && !pipelineConfig.adaface_model_loaded) ||
                                (m.key === 'faiss'   && !pipelineConfig.faiss_index_loaded);
                            return (
                                <div key={m.key} style={{
                                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                                    padding: '12px 4px',
                                    borderTop: idx > 0 ? `1px solid ${theme.border}` : 'none',
                                }}>
                                    <label style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        cursor: pipelineSaving ? 'not-allowed' : 'pointer',
                                        minWidth: 230, fontWeight: isPrimary ? 700 : 500,
                                        fontSize: 13, color: theme.text,
                                    }}>
                                        <input
                                            type="radio"
                                            name="pipeline-primary"
                                            checked={isPrimary}
                                            disabled={pipelineSaving}
                                            onChange={() => updatePipelineConfig({ primary: m.key })}
                                        />
                                        {m.label}
                                        {isPrimary && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                                borderRadius: 999, background: theme.accent, color: '#fff',
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                            }}>
                                                Primary
                                            </span>
                                        )}
                                    </label>

                                    <div style={{ minWidth: 220 }}>
                                        {isPrimary ? (
                                            <span style={{ fontSize: 12, color: theme.textMuted }}>
                                                Decides attendance — shadow not applicable
                                            </span>
                                        ) : (
                                            <Toggle
                                                checked={!!pipelineConfig[`shadow_${m.key}`]}
                                                disabled={pipelineSaving}
                                                onChange={(val) => updatePipelineConfig({ [`shadow_${m.key}`]: val })}
                                                label="Run at middle of session"
                                            />
                                        )}
                                    </div>

                                    <div style={{ flex: 1, fontSize: 11, color: theme.textMuted }}>
                                        {m.hint}
                                        {notReady && (
                                            <span style={{ color: theme.warning, fontWeight: 700 }}>
                                                {' '}⚠ {m.key === 'adaface' ? 'AdaFace ONNX model not loaded' : 'No FAISS index loaded'}
                                                {isPrimary ? ' — runs will fall back to Mean.' : '.'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Face Detector — SCRFD-10G vs optional RetinaFace ─────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Face Detector</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Which detection model finds faces in frames, everywhere detection runs
                        (attendance, ground-truth acquisition, live tracking). Detection-only swap —
                        embeddings and recognition are untouched, since both detectors hand over the
                        same aligned face crops.
                    </div>
                </div>

                {detectorLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !detectorConfig ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load detector config.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {DETECTOR_MODELS.map((m, idx) => {
                            const isActive = detectorConfig.active === m.key;
                            const unavailable = m.key === 'retinaface' && !detectorConfig.retinaface_model_loaded;
                            return (
                                <div key={m.key} style={{
                                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                                    padding: '12px 4px',
                                    borderTop: idx > 0 ? `1px solid ${theme.border}` : 'none',
                                    opacity: unavailable ? 0.6 : 1,
                                }}>
                                    <label style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        cursor: detectorSaving || unavailable ? 'not-allowed' : 'pointer',
                                        minWidth: 280, fontWeight: isActive ? 700 : 500,
                                        fontSize: 13, color: theme.text,
                                    }}>
                                        <input
                                            type="radio"
                                            name="detector-active"
                                            checked={isActive}
                                            disabled={detectorSaving || unavailable}
                                            onChange={() => updateDetectorConfig({ active: m.key })}
                                        />
                                        {m.label}
                                        {isActive && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                                borderRadius: 999, background: theme.accent, color: '#fff',
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                            }}>
                                                Active
                                            </span>
                                        )}
                                    </label>
                                    <div style={{ flex: 1, fontSize: 11, color: theme.textMuted }}>
                                        {m.hint}
                                        {unavailable && (
                                            <span style={{ color: theme.warning, fontWeight: 700 }}>
                                                {' '}⚠ ONNX not found on the ML machine.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── GT Acquisition config ──────────────────────────────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>GT Acquisition Thresholds</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Controls how ground-truth face images are collected from RTSP streams.
                        Changes apply to the next acquisition run — no restart needed.
                    </div>
                </div>

                {gtLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !gtConfig ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load GT config.</div>
                ) : (
                    <>
                        {/* Group 1 — Session params */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Session Parameters
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                            {['frame_skip', 'target_imgs_per_person', 'cluster_threshold', 'min_samples', 'det_size'].map(key => {
                                const meta = GT_LABELS[key];
                                const opts = GT_OPTIONS[key];
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                        <select
                                            value={gtConfig[key]}
                                            disabled={gtSaving}
                                            onChange={e => updateGtConfig({ [key]: Number(e.target.value) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>
                                                    {v}{v === (key === 'frame_skip' ? 10 : key === 'target_imgs_per_person' ? 10 : key === 'cluster_threshold' ? 0.45 : key === 'min_samples' ? 3 : 320) ? ' (default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Group 2 — Quality filters */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Quality Filters
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                            {['merge_threshold', 'nms_iou_thresh', 'det_score_floor'].map(key => {
                                const meta = GT_LABELS[key];
                                const opts = GT_OPTIONS[key];
                                const defaults = { merge_threshold: 0.75, nms_iou_thresh: 0.35, det_score_floor: 0.5 };
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}</label>
                                        <select
                                            value={gtConfig[key]}
                                            disabled={gtSaving}
                                            onChange={e => updateGtConfig({ [key]: Number(e.target.value) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>{v}{v === defaults[key] ? ' (default)' : ''}</option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Group 3 — Behaviour & storage */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Behaviour & Storage
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {['new_person_timeout', 'top_n', 'embed_n'].map(key => {
                                const meta = GT_LABELS[key];
                                const opts = GT_OPTIONS[key];
                                const defaults = { new_person_timeout: 60, top_n: 10, embed_n: 5 };
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                        <select
                                            value={gtConfig[key]}
                                            disabled={gtSaving}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                if (key === 'top_n' && gtConfig.embed_n > val) {
                                                    updateGtConfig({ top_n: val, embed_n: Math.min(gtConfig.embed_n, val) });
                                                } else {
                                                    updateGtConfig({ [key]: val });
                                                }
                                            }}
                                            style={styles.select}
                                        >
                                            {opts.filter(v => key === 'embed_n' ? v <= gtConfig.top_n : true).map(v => (
                                                <option key={v} value={v}>{v}{v === defaults[key] ? ' (default)' : ''}</option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {gtConfig.embed_n > gtConfig.top_n && (
                            <div style={{ marginTop: 12, fontSize: 12, color: theme.danger }}>
                                ⚠ Embedding images ({gtConfig.embed_n}) cannot exceed max images/person ({gtConfig.top_n}).
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Live Attendance Thresholds ─────────────────────────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Live Attendance Thresholds</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Controls how the ML service classifies students during live attendance runs.
                        Changes apply to the next run — no restart needed.
                    </div>
                </div>

                {attendLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !attendThresh ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load attendance thresholds.</div>
                ) : (
                    <>
                        {/* Row 1 — recognition & classification */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Recognition & Classification
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                            {['threshold', 'auto_present_threshold', 'review_threshold', 'min_detections'].map(key => {
                                const meta = ATTEND_LABELS[key];
                                const opts = ATTEND_OPTIONS[key];
                                const isFloat = key !== 'min_detections';
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                        <select
                                            value={attendThresh[key] ?? ATTEND_DEFAULTS[key]}
                                            disabled={attendSaving}
                                            onChange={e => updateAttendThresh({ [key]: isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>
                                                    {isFloat ? v.toFixed(2) : v}{v === ATTEND_DEFAULTS[key] ? ' (default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Row 2 — enrollment & alerts */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Enrolment & Alerts
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {['auto_enroll_threshold', 'alert_confidence'].map(key => {
                                const meta = ATTEND_LABELS[key];
                                const opts = ATTEND_OPTIONS[key];
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}</label>
                                        <select
                                            value={attendThresh[key] ?? ATTEND_DEFAULTS[key]}
                                            disabled={attendSaving}
                                            onChange={e => updateAttendThresh({ [key]: parseFloat(e.target.value) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>
                                                    {v.toFixed(2)}{v === ATTEND_DEFAULTS[key] ? ' (default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {(attendThresh.review_threshold ?? ATTEND_DEFAULTS.review_threshold) >=
                         (attendThresh.auto_present_threshold ?? ATTEND_DEFAULTS.auto_present_threshold) && (
                            <div style={{ marginTop: 12, fontSize: 12, color: theme.danger }}>
                                ⚠ Review threshold must be lower than auto-present threshold.
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── FAISS Recognition Thresholds ───────────────────────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>FAISS Recognition Thresholds</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                            Controls the live tracked-attendance FAISS matching pipeline (top-k voting,
                            recognition threshold, re-verify cache). Changes apply to the next recognition
                            call — no restart needed.
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={triggerFaissRebuild}
                            disabled={faissRebuilding}
                            style={{
                                ...styles.button,
                                background: 'transparent',
                                border: `1px solid ${theme.border}`,
                                color: theme.text,
                                padding: '4px 10px',
                                fontSize: 12,
                                opacity: faissRebuilding ? 0.6 : 1,
                            }}
                        >
                            {faissRebuilding ? 'Rebuilding...' : 'Rebuild Index'}
                        </button>
                        <span style={{ fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                            Run role: Model Pipeline card above
                        </span>
                    </div>
                </div>

                {faissLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !faissConfig ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load FAISS config.</div>
                ) : (
                    <>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16, padding: '8px 10px', background: theme.bg, borderRadius: 6 }}>
                            The Top-K candidates / Recognition threshold below are used wherever FAISS
                            runs — the live tracked pipeline, and its primary/shadow roles selected on
                            the Model Pipeline card above.
                        </div>
                        {/* Group 1 — Matching */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Matching
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                            {['top_k', 'recog_threshold'].map(key => {
                                const meta = FAISS_LABELS[key];
                                const opts = FAISS_OPTIONS[key];
                                const isFloat = key !== 'top_k';
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                        <select
                                            value={faissConfig[key] ?? FAISS_DEFAULTS[key]}
                                            disabled={faissSaving}
                                            onChange={e => updateFaissConfig({ [key]: isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>
                                                    {isFloat ? v.toFixed(2) : v}{v === FAISS_DEFAULTS[key] ? ' (default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Group 2 — Re-verify cache */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Re-verify Cache
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {['reverify_high_score', 'reverify_high_ttl', 'reverify_med_score', 'reverify_med_ttl', 'reverify_low_score', 'reverify_low_ttl'].map(key => {
                                const meta = FAISS_LABELS[key];
                                const opts = FAISS_OPTIONS[key];
                                const isScore = key.endsWith('_score');
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                        <select
                                            value={faissConfig[key] ?? FAISS_DEFAULTS[key]}
                                            disabled={faissSaving}
                                            onChange={e => updateFaissConfig({ [key]: isScore ? parseFloat(e.target.value) : parseInt(e.target.value, 10) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>
                                                    {isScore ? v.toFixed(2) : v}{v === FAISS_DEFAULTS[key] ? ' (default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {(() => {
                            const high = faissConfig.reverify_high_score ?? FAISS_DEFAULTS.reverify_high_score;
                            const med  = faissConfig.reverify_med_score  ?? FAISS_DEFAULTS.reverify_med_score;
                            const low  = faissConfig.reverify_low_score  ?? FAISS_DEFAULTS.reverify_low_score;
                            if (high > med && med > low) return null;
                            return (
                                <div style={{ marginTop: 12, fontSize: 12, color: theme.danger }}>
                                    ⚠ Score tiers must satisfy High &gt; Medium &gt; Low ({high.toFixed(2)} / {med.toFixed(2)} / {low.toFixed(2)}).
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>

            {/* ── Max-of-K Shadow Comparison (Hungarian batch matching) ────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Max-of-K Matching (Comparison)</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                            Scores clusters against each student&rsquo;s top-K individually stored
                            embeddings (max-similarity) instead of one mean vector. Whether it runs
                            as the primary decision-maker or a middle-run comparison is selected on
                            the Model Pipeline card above; the K used in either role is set here.
                        </div>
                    </div>
                    <span style={{ fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                        Run role: Model Pipeline card above
                    </span>
                </div>

                {maxKLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !maxKConfig ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load Max-of-K config.</div>
                ) : (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18,
                    }}>
                        {['top_k'].map(key => {
                            const meta = MAX_K_LABELS[key];
                            const opts = MAX_K_OPTIONS[key];
                            return (
                                <div key={key}>
                                    <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                    <select
                                        value={maxKConfig[key] ?? MAX_K_DEFAULTS[key]}
                                        disabled={maxKSaving}
                                        onChange={e => updateMaxKConfig({ [key]: parseInt(e.target.value, 10) })}
                                        style={styles.select}
                                    >
                                        {opts.map(v => (
                                            <option key={v} value={v}>
                                                {v}{v === MAX_K_DEFAULTS[key] ? ' (default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── AdaFace Recognition (Comparison) ─────────────────────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>AdaFace Model</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                            AdaFace is a second, independent face-recognition model — its own embeddings,
                            its own storage, entirely separate from InsightFace. The subsystem toggle
                            here controls AdaFace embedding <strong>generation</strong> during enrollment;
                            whether AdaFace runs at attendance time (primary or middle-run comparison)
                            is selected on the Model Pipeline card above.
                            {adafaceConfig && !adafaceConfig.model_loaded && (
                                <>{' '}<span style={{ color: theme.warning }}>● No AdaFace ONNX model loaded — see README_ADAFACE.md.</span></>
                            )}
                        </div>
                    </div>
                    {adafaceConfig && (
                        <Toggle
                            checked={!!adafaceConfig.enabled}
                            disabled={adafaceSaving}
                            onChange={(val) => updateAdafaceConfig({ enabled: val })}
                            label={adafaceConfig.enabled ? 'Subsystem on' : 'Subsystem off'}
                        />
                    )}
                </div>

                {adafaceLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !adafaceConfig ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load AdaFace config.</div>
                ) : (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18,
                        opacity: adafaceConfig.enabled ? 1 : 0.45, pointerEvents: adafaceConfig.enabled ? 'auto' : 'none',
                    }}>
                        {['top_k', 'recog_threshold'].map(key => {
                            const meta = ADAFACE_LABELS[key];
                            const opts = ADAFACE_OPTIONS[key];
                            const isFloat = key === 'recog_threshold';
                            return (
                                <div key={key}>
                                    <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                    <select
                                        value={adafaceConfig[key] ?? ADAFACE_DEFAULTS[key]}
                                        disabled={adafaceSaving || !adafaceConfig.enabled}
                                        onChange={e => updateAdafaceConfig({ [key]: isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10) })}
                                        style={styles.select}
                                    >
                                        {opts.map(v => (
                                            <option key={v} value={v}>
                                                {isFloat ? v.toFixed(2) : v}{v === ADAFACE_DEFAULTS[key] ? ' (default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Liveness / Anti-Spoofing section ───────────────────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Liveness / Anti-Spoofing</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                            Rejects photos or screens held up to the camera during attendance.{' '}
                            {config.onnx_model_loaded
                                ? <span style={{ color: theme.success }}>● ONNX model active</span>
                                : <span style={{ color: theme.warning }}>● Heuristic mode (no ONNX model loaded)</span>}
                        </div>
                    </div>
                    <Toggle
                        checked={config.enabled}
                        disabled={saving}
                        onChange={(val) => updateConfig({ enabled: val })}
                        label={config.enabled ? 'Enabled' : 'Disabled'}
                    />
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18,
                    opacity: config.enabled ? 1 : 0.45, pointerEvents: config.enabled ? 'auto' : 'none',
                    transition: 'opacity 0.2s',
                }}>
                    <div>
                        <label style={styles.label}>Heuristic threshold</label>
                        <select
                            value={config.heuristic_threshold}
                            disabled={saving}
                            onChange={(e) => updateConfig({ heuristic_threshold: parseFloat(e.target.value) })}
                            style={styles.select}
                        >
                            {HEURISTIC_OPTIONS.map(v => (
                                <option key={v} value={v}>{v.toFixed(2)} {v === 0.15 ? '(default)' : ''}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                            Used when no ONNX model is loaded. Lower = stricter rejection, higher = more lenient.
                        </div>
                    </div>

                    <div>
                        <label style={styles.label}>ONNX model threshold</label>
                        <select
                            value={config.onnx_threshold}
                            disabled={saving}
                            onChange={(e) => updateConfig({ onnx_threshold: parseFloat(e.target.value) })}
                            style={styles.select}
                        >
                            {ONNX_OPTIONS.map(v => (
                                <option key={v} value={v}>{v.toFixed(2)} {v === 0.50 ? '(default)' : ''}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                            Minimum "live" probability required. Only used if an ONNX model file is present.
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={styles.label}>Save rejected crops</label>
                        <Toggle
                            checked={config.save_rejected_crops}
                            disabled={saving}
                            onChange={(val) => updateConfig({ save_rejected_crops: val })}
                            label={config.save_rejected_crops ? 'Saving to ml-data/liveness_rejected/' : 'Not saving'}
                        />
                        <div style={{ fontSize: 11, color: theme.textMuted }}>
                            Keep this on to review rejection accuracy below.
                        </div>
                    </div>
                </div>

                {typeof config.rejected_this_run === 'number' && (
                    <div style={{ marginTop: 16, fontSize: 12, color: theme.textMuted }}>
                        Rejected so far (current process lifetime): <strong style={{ color: theme.text }}>{config.rejected_this_run}</strong>
                    </div>
                )}
            </div>

        </div>
    );
}
