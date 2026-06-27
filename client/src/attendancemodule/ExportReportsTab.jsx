// client/src/attendancemodule/ExportReportsTab.jsx
// Export attendance reports as CSV — subject-wise or semester-wise.

import { useState, useEffect, useCallback } from 'react';
import { theme as T, styles, DEGREES } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const REPORTS_API = `${apiUrl}/attendancemodule/reports`;
const GT_API = `${apiUrl}/attendancemodule/ground-truth`;
const BATCHES_API = `${apiUrl}/attendancemodule/settings/batches`;

function statusColor(status, T) {
  if (status === 'P') return T.success;
  if (status === 'A') return T.danger;
  if (status === 'R') return T.warning;
  return T.textMuted;
}
function statusBg(status, T) {
  if (status === 'P') return T.successDim;
  if (status === 'A') return T.dangerDim;
  if (status === 'R') return T.warningDim;
  return 'transparent';
}

export default function ExportReportsTab() {
  const [degree, setDegree] = useState('BTECH');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('');
  const [departments, setDepts] = useState([]);
  const [years, setYears] = useState([]);
  const [depsLoading, setDepsLoading] = useState(false);
  const [yearsLoading, setYearsLoading] = useState(false);

  const [mode, setMode] = useState('semester'); // 'semester' | 'subject'
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all' | 'range'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjectFaculty, setSubjectFaculty] = useState({});
  const [value, setValue] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  function showMsg(text, type = 'error') {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }

  useEffect(() => {
    setYearsLoading(true);
    fetch(BATCHES_API)
      .then((r) => r.json())
      .then((d) => {
        const batchYears = (d.batches || [])
          .map((b) => b.batchYear)
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a));
        setYears(batchYears);
      })
      .catch(() => showMsg('Could not load batch years'))
      .finally(() => setYearsLoading(false));
  }, []);

  useEffect(() => {
    if (!degree) {
      setDepts([]);
      setDept('');
      return;
    }
    setDepsLoading(true);
    fetch(`${GT_API}/departments`)
      .then((r) => r.json())
      .then((d) => {
        const depts = (d.departments || [])
          .map((item) => (typeof item === 'string' ? item : item.dept))
          .filter(Boolean);
        setDepts(depts);
      })
      .catch(() => showMsg('Could not load departments'))
      .finally(() => setDepsLoading(false));
  }, [degree]);

  const batch =
    degree && dept && year
      ? `${degree}_${dept.trim().replace(/\s+/g, '_').toUpperCase()}_${year}`
      : '';

  const fetchOptions = useCallback(() => {
    if (!batch) {
      setSubjects([]);
      setSemesters([]);
      return;
    }
    setOptionsLoading(true);
    setValue('');
    setPreviewData(null);
    fetch(`${REPORTS_API}/export-options?batch=${encodeURIComponent(batch)}`)
      .then((r) => r.json())
      .then((d) => {
        setSubjects(d.subjects || []);
        setSemesters(d.semesters || []);
        setSubjectFaculty(d.subjectFaculty || {});
      })
      .catch(() => showMsg('Could not load subjects/semesters for this batch'))
      .finally(() => setOptionsLoading(false));
  }, [batch]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const options = mode === 'subject' ? subjects : semesters;

  function buildUrl(format) {
    let url = `${REPORTS_API}/export?batch=${encodeURIComponent(batch)}&mode=${mode}&value=${encodeURIComponent(value)}&format=${format}`;
    if (dateFilterMode === 'range') {
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
    }
    return url;
  }

  function validate() {
    if (!batch || !value.trim()) {
      showMsg(
        'Select batch and ' +
          (mode === 'subject' ? 'subject' : 'semester') +
          ' first.',
      );
      return false;
    }
    if (dateFilterMode === 'range' && (!fromDate || !toDate)) {
      showMsg('Pick both From and To dates, or switch to Whole Semester.');
      return false;
    }
    return true;
  }

  const handlePreview = async () => {
    if (!validate()) return;
    setPreviewing(true);
    setPreviewData(null);
    try {
      const res = await fetch(buildUrl('json'));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch preview');
      setPreviewData(data);
    } catch (err) {
      showMsg(err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (!validate()) return;
    setDownloading(true);
    try {
      const res = await fetch(buildUrl('csv'));
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Export failed');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `attendance_${mode}_${value}.csv`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showMsg('Downloaded successfully.', 'success');
    } catch (err) {
      showMsg(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{ padding: '24px 4px', width: '100%', boxSizing: 'border-box' }}
    >
      <style>{`
        .exp-toggle-btn {
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid ${T.border};
          background: ${T.surface};
          color: ${T.textMuted};
          white-space: nowrap;
        }
        .exp-toggle-btn.active {
          border-color: ${T.accent};
          background: ${T.accentDim || 'rgba(99,102,241,0.08)'};
          color: ${T.accent};
        }
        .exp-action-btn {
          flex: 1;
          padding: 12px 16px;
          font-size: 13.5px;
          font-weight: 700;
          border-radius: 9px;
          cursor: pointer;
          transition: opacity 0.15s;
          border: none;
        }
        .exp-spinner {
          width: 13px; height: 13px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: currentColor;
          display: inline-block;
          animation: exp-spin 0.7s linear infinite;
          margin-right: 7px;
          vertical-align: -2px;
        }
        @keyframes exp-spin { to { transform: rotate(360deg); } }
        .exp-date-row {
          display: flex;
          gap: 10px;
        }
        .exp-mode-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .exp-mode-row .exp-mode-btns {
          flex: 1 1 200px;
        }
        .exp-mode-row .exp-value-select {
          flex: 1 1 200px;
        }
        .exp-preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .exp-preview-table th {
          background: ${T.surfaceAlt};
          color: ${T.textMuted};
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 9px 10px;
          border-bottom: 1px solid ${T.border};
          text-align: center;
          white-space: nowrap;
        }
        .exp-preview-table th:first-child { text-align: left; }
        .exp-preview-table td {
          padding: 7px 10px;
          border-bottom: 1px solid ${T.border};
          text-align: center;
        }
        .exp-preview-table td:first-child {
          text-align: left;
          font-weight: 700;
          font-family: ${T.fontMono};
        }
        .exp-status-cell {
          display: inline-block;
          min-width: 24px;
          padding: 2px 6px;
          border-radius: 5px;
          font-weight: 700;
          font-size: 11px;
        }
      `}</style>

      <div
        style={{
          fontSize: 13,
          color: T.textMuted,
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        Export final attendance decisions (Present / Absent / Review) date-wise,
        filtered by subject or semester.
      </div>

      <div
        style={{
          ...styles.card,
          padding: 20,
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 18,
        }}
      >
        {/* Batch selectors */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <div style={{ minWidth: 120, flex: '1 1 120px' }}>
            <label style={styles.label}>Degree</label>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              style={styles.select}
            >
              {DEGREES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 200, flex: '2 1 200px' }}>
            <label style={styles.label}>Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              style={styles.select}
              disabled={!degree || depsLoading}
            >
              <option value="">
                {depsLoading ? 'Loading...' : 'Select...'}
              </option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 100, flex: '1 1 100px' }}>
            <label style={styles.label}>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={styles.select}
              disabled={!dept || yearsLoading}
            >
              <option value="">
                {yearsLoading ? 'Loading...' : 'Select...'}
              </option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode + value + date filter — ONE LINE, all labeled */}
        <div className="exp-mode-row" style={{ marginBottom: 6 }}>
          <div className="exp-mode-btns">
            <label style={styles.label}>Export Mode</label>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setValue('');
                setPreviewData(null);
              }}
              style={{ ...styles.select, width: '100%' }}
            >
              <option value="semester">Semester-wise</option>
              <option value="subject">Subject-wise</option>
            </select>
          </div>

          <div className="exp-value-select">
            <label style={styles.label}>
              {mode === 'subject' ? 'Subject' : 'Semester'}
            </label>
            <select
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setPreviewData(null);
              }}
              style={styles.select}
              disabled={!batch || optionsLoading}
            >
              <option value="">
                {!batch
                  ? 'Select batch first...'
                  : optionsLoading
                    ? 'Loading...'
                    : options.length === 0
                      ? 'No data found for this batch'
                      : `Select ${mode}...`}
              </option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="exp-mode-btns">
            <label style={styles.label}>Date Range</label>
            <select
              value={dateFilterMode}
              onChange={(e) => {
                setDateFilterMode(e.target.value);
                if (e.target.value === 'all') {
                  setFromDate('');
                  setToDate('');
                }
                setPreviewData(null);
              }}
              style={{ ...styles.select, width: '100%' }}
            >
              <option value="all">Whole Semester</option>
              <option value="range">Select Date Range</option>
            </select>
          </div>
        </div>

        {mode === 'subject' && value && subjectFaculty[value] && (
          <div style={{ marginBottom: 14, fontSize: 12, color: T.textMuted }}>
            Faculty:{' '}
            <strong style={{ color: T.text }}>{subjectFaculty[value]}</strong>
          </div>
        )}

        {batch && !optionsLoading && options.length === 0 && (
          <div style={{ marginBottom: 14, fontSize: 11.5, color: T.textMuted }}>
            No attendance has been recorded yet for this batch — the list fills
            in as classes run.
          </div>
        )}

        {dateFilterMode === 'range' && (
          <div style={{ marginBottom: 18 }}>
            <div className="exp-date-row">
              <div style={{ flex: 1 }}>
                <label style={{ ...styles.label, fontSize: 10.5 }}>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPreviewData(null);
                  }}
                  style={{
                    ...styles.input,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...styles.label, fontSize: 10.5 }}>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPreviewData(null);
                  }}
                  style={{
                    ...styles.input,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {batch && (
          <div style={{ marginBottom: 16, fontSize: 11, color: T.textMuted }}>
            Batch:{' '}
            <strong style={{ color: T.text, fontFamily: T.fontMono }}>
              {batch}
            </strong>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="exp-action-btn"
            onClick={handlePreview}
            disabled={previewing || !batch || !value}
            style={{
              background: T.surface,
              border: `1.5px solid ${T.accent}`,
              color: T.accent,
              opacity: previewing || !batch || !value ? 0.55 : 1,
            }}
          >
            {previewing ? (
              <>
                <span className="exp-spinner" />
                Loading…
              </>
            ) : (
              'Show Details'
            )}
          </button>
          <button
            className="exp-action-btn"
            onClick={handleDownload}
            disabled={downloading || !batch || !value}
            style={{
              background: T.accent,
              color: '#fff',
              opacity: downloading || !batch || !value ? 0.6 : 1,
            }}
          >
            {downloading ? (
              <>
                <span className="exp-spinner" />
                Downloading…
              </>
            ) : (
              'Download CSV'
            )}
          </button>
        </div>

        {message.text && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12.5,
              fontWeight: 600,
              color: message.type === 'error' ? T.danger : T.success,
            }}
          >
            {message.type === 'success' ? '✓ ' : ''}
            {message.text}
          </div>
        )}
      </div>

      {/* Preview table */}
      {previewData && (
        <div
          style={{
            ...styles.card,
            padding: 18,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>
            {previewData.rows.length} students · {previewData.dates.length}{' '}
            sessions
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="exp-preview-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  {previewData.dates.map((d) => (
                    <th key={d}>{d.slice(5)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row) => (
                  <tr key={row.rollNo}>
                    <td>{row.rollNo}</td>
                    {row.statuses.map((s, i) => (
                      <td key={i}>
                        {s === '-' ? (
                          <span style={{ color: T.border }}>·</span>
                        ) : (
                          <span
                            className="exp-status-cell"
                            style={{
                              background: statusBg(s, T),
                              color: statusColor(s, T),
                            }}
                          >
                            {s}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
