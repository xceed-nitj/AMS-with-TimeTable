import { useState, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { createMlBatch, extractMlFaces, saveMlTaggedFaces } from '../services/dashboardApi';
import { Video, Loader, Lock, CheckCircle, Unlock } from 'lucide-react';

const DEGREES = ['BTECH', 'MTECH', 'BSC', 'MSC', 'PHD'];
const DEPARTMENTS = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'ICE', 'IPE', 'IT', 'BT', 'TT', 'CHE', 'PHY', 'CHEM', 'MATH', 'HUM'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear - i));

export default function GroundTruth() {
  const [degree, setDegree] = useState('BTECH');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [videoLink, setVideoLink] = useState('');

  const [extracting, setExtracting] = useState(false);
  const [faces, setFaces] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const batchName = degree && department && year
    ? `${degree}_${department}_${year}`.toUpperCase()
    : null;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExtract = useCallback(async () => {
    if (!batchName || !videoLink.trim()) {
      showToast('Fill in all fields and provide a video link', 'error');
      return;
    }

    setExtracting(true);
    setFaces([]);

    try {
      await createMlBatch({ degree, department, year });
      const res = await extractMlFaces({ videoLink: videoLink.trim(), batch: batchName });
      const data = res.data;

      if (data.error) {
        showToast(data.error, 'error');
        return;
      }

      const extracted = (data.faces || []).map((f, i) => ({
        id: f.id || `face_${i}`,
        imageData: f.imageData,
        rollNo: '',
        confirmed: false,
        frameCount: f.frameCount || 1,
      }));

      setFaces(extracted);
      showToast(`${extracted.length} unique face(s) detected`);
    } catch (err) {
      showToast('Failed to extract faces: ' + err.message, 'error');
    } finally {
      setExtracting(false);
    }
  }, [batchName, videoLink, degree, department, year]);

  const updateRollNo = (faceId, rollNo) => {
    setFaces(prev => prev.map(f => f.id === faceId ? { ...f, rollNo } : f));
  };

  const toggleConfirm = (faceId) => {
    setFaces(prev => prev.map(f => f.id === faceId ? { ...f, confirmed: !f.confirmed } : f));
  };

  const handleSave = async () => {
    const confirmed = faces.filter(f => f.confirmed && f.rollNo.trim());
    if (confirmed.length === 0) {
      showToast('Tag and confirm at least one face before saving', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await saveMlTaggedFaces({
        batch: batchName,
        faces: confirmed.map(f => ({ rollNo: f.rollNo.trim(), imageData: f.imageData }))
      });
      showToast(`${res.data.saved} face(s) saved to ${batchName}`);
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmedCount = faces.filter(f => f.confirmed && f.rollNo.trim()).length;

  return (
    <div>
      <PageHeader title="Ground Generation" location="ML Face Extraction" />

      <div className="page-content">
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 28, zIndex: 999, padding: '12px 24px',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s',
            background: toast.type === 'error' ? 'var(--red-bg)' : 'var(--green-bg)',
            color: toast.type === 'error' ? 'var(--red-text)' : 'var(--green-text)',
            border: `1px solid ${toast.type === 'error' ? 'var(--red)' : 'var(--green)'}`,
          }}>
            {toast.msg}
          </div>
        )}

        <div className="card mb-16">
          <div className="card-title">Configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,2fr)', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Degree</label>
              <select className="filter-select" style={{ width: '100%' }} value={degree} onChange={e => setDegree(e.target.value)}>
                <option value="">Select...</option>
                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Department</label>
              <select className="filter-select" style={{ width: '100%' }} value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Year (Batch)</label>
              <select className="filter-select" style={{ width: '100%' }} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Select...</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Video Link</label>
              <input
                className="filter-input"
                style={{ width: '100%' }}
                type="text"
                placeholder="Paste classroom video URL..."
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-between">
            <div style={{ background: 'var(--bg-page)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }} className="mono">
              <span className="text-muted">Folder: </span>
              <span style={{ color: batchName ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
                ground_truth/{batchName || '...'}/
              </span>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleExtract}
              disabled={extracting || !batchName || !videoLink.trim()}
              style={{ opacity: (extracting || !batchName || !videoLink.trim()) ? 0.5 : 1, minWidth: 180, justifyContent: 'center' }}
            >
              {extracting ? <Loader size={16} className="spin" /> : <Video size={16} />}
              {extracting ? 'Extracting...' : 'Extract Faces'}
            </button>
          </div>
        </div>

        {faces.length > 0 && (
          <div>
            <div className="flex-between mb-16">
              <div className="card-title" style={{ marginBottom: 0 }}>
                {faces.length} face(s) detected — tag each with roll number
              </div>
              <div className="flex items-center gap-12">
                <span className={`badge ${confirmedCount > 0 ? 'online' : 'warning'}`}>
                  {confirmedCount}/{faces.length} confirmed
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || confirmedCount === 0}
                  style={{ opacity: (saving || confirmedCount === 0) ? 0.5 : 1 }}
                >
                  {saving ? <Loader size={14} className="spin" /> : <CheckCircle size={14} />}
                  {saving ? 'Saving...' : `Save ${confirmedCount} Face(s)`}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {faces.map((face) => (
                <div key={face.id} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: face.confirmed ? 'var(--green)' : 'var(--border-light)' }}>
                  <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--bg-page)' }}>
                    <img src={face.imageData} alt={`Face ${face.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {face.confirmed && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                        ✓
                      </div>
                    )}
                    {face.frameCount > 1 && (
                      <div style={{ position: 'absolute', bottom: 8, left: 8 }} className="badge dept">
                        {face.frameCount} frames
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="filter-input mono"
                        type="text"
                        placeholder="e.g. 23126046"
                        value={face.rollNo}
                        onChange={e => updateRollNo(face.id, e.target.value)}
                        disabled={face.confirmed}
                        style={{ flex: 1, padding: '8px 10px', fontSize: '13px', opacity: face.confirmed ? 0.6 : 1, minWidth: 0 }}
                      />
                      <button
                        className="btn"
                        onClick={() => toggleConfirm(face.id)}
                        disabled={!face.rollNo.trim() && !face.confirmed}
                        style={{
                          background: face.confirmed ? 'var(--green-bg)' : 'var(--accent-bg)',
                          color: face.confirmed ? 'var(--green-text)' : 'var(--accent)',
                          opacity: (!face.rollNo.trim() && !face.confirmed) ? 0.5 : 1
                        }}
                      >
                        {face.confirmed ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!extracting && faces.length === 0 && (
          <div className="card text-center" style={{ padding: '60px 20px', borderStyle: 'dashed' }}>
            <Video size={32} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No faces extracted yet</div>
            <div className="text-muted" style={{ fontSize: '13px' }}>
              Select degree, department, year → paste video link → click "Extract Faces"
            </div>
          </div>
        )}

        {extracting && (
          <div className="card text-center" style={{ padding: '60px 20px' }}>
            <Loader size={32} className="spin" style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Processing Video</div>
            <div className="text-muted" style={{ fontSize: '13px' }}>
              Detecting and clustering unique faces... this may take a few minutes
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
