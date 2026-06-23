import React, { useEffect, useState } from 'react';
import { API_BASE, theme as T, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

const CSS = `
  ${cssReset}
  @keyframes toastIn { from { opacity:0; transform:translateY(-20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes modalIn { from { opacity:0; transform:translateY(-8px) scale(0.99); } to { opacity:1; transform:translateY(0) scale(1); } }

  .session-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; animation: fadeIn .4s ease both; }
  .session-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(26,31,60,0.05); margin-bottom: 20px; animation: fadeIn .4s ease both; }
  .session-card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid ${T.border}; background: ${T.surfaceAlt}; }
  .session-grid { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; padding: 20px; }
  .form-control { display: flex; flex-direction: column; gap: 6px; }

  .term-date-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid ${T.border}; gap: 20px; }
  .term-date-row:last-child { border-bottom: none; }

  .native-input, .native-select {
    width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid ${T.border};
    background: #f8f9fd; color: ${T.text}; font-family: ${T.fontBody}; font-size: 14px; outline: none; transition: border-color 0.2s;
  }
  .native-input:focus, .native-select:focus { border-color: ${T.borderFocus}; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

  .native-btn {
    padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px;
    cursor: pointer; font-family: ${T.fontBody}; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center;
  }
  .native-btn:hover { opacity: 0.88; }
  .native-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .monthly-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 14px;
    padding: 20px;
  }
  .month-container {
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .month-title {
    font-size: 12px;
    font-weight: 600;
    color: ${T.accent};
    border-bottom: 1px solid ${T.border};
    padding-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  .holiday-item-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    background: ${T.bg};
    border-radius: 8px;
    border: 1px solid ${T.border};
  }
  .holiday-display-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .badge-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .icon-btn {
    width: 24px; height: 24px; border-radius: 5px; border: 1px solid;
    background: ${T.surface};
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0; cursor: pointer; transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .icon-btn:hover { opacity: 0.75; }
  .icon-btn-edit   { border-color: ${T.accent}; color: ${T.accent}; }
  .icon-btn-delete { border-color: ${T.danger}; color: ${T.danger}; }

  .floating-toast-container {
    position: fixed;
    top: 96px; left: 50%; transform: translateX(-50%);
    z-index: 9000;
    padding: 14px 22px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    display: flex; align-items: center; gap: 12px;
    font-size: 13.5px; font-weight: 700;
    color: #ffffff !important;
    animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .custom-global-modal-overlay {
    position: fixed !important;
    top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(15, 23, 42, 0.45) !important;
    backdrop-filter: blur(5px) !important;
    -webkit-backdrop-filter: blur(5px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999999 !important;
    margin: 0 !important;
    padding: 20px !important;
    box-sizing: border-box !important;
  }
  .custom-global-modal-box {
    background: ${T.surface} !important;
    border: 1px solid ${T.border} !important;
    border-radius: 12px !important;
    padding: 24px !important;
    max-width: 440px !important;
    width: 100% !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15) !important;
    animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both !important;
    box-sizing: border-box !important;
  }


  @media (max-width: 768px) {
    .session-grid { grid-template-columns: 1fr; }
    .term-date-row { flex-direction: column; align-items: flex-start; gap: 12px; }
    .monthly-cards-grid { grid-template-columns: 1fr; }
    .floating-toast-container { left: 16px; right: 16px; top: 96px; transform: none; }
    .ams-tabs { overflow-x: auto; }
  }

  .ams-table tbody .batch-row:hover td {
    background: transparent !important;
  }

.degree-selector{
  min-width:220px;
}

.degree-actions{
  display:flex;
  gap:10px;
  align-items:center;
}

.degree-table{
  width:100%;
  border-collapse:collapse;
}

.degree-table th{
  background:${T.surfaceAlt};
  color:${T.textMuted};
  text-transform:uppercase;
  font-size:11px;
  letter-spacing:.08em;
  padding:14px 18px;
  border-bottom:1px solid ${T.border};
}

.degree-table td{
  padding:16px 18px;
  border-bottom:1px solid ${T.border};
  font-size:14px;
}

.degree-table tbody tr:hover td{
  background:#fafbff;
}

.not-configured{
  color:${T.textMuted};
  font-style:italic;
}

.degree-badge{
  display:inline-flex;
  padding:5px 12px;
  border-radius:999px;
  background:${T.surfaceAlt};
  border:1px solid ${T.border};
  font-size:12px;
  font-weight:600;
  color:${T.accent};
}
`;

export default function DegreeManagement() {
  const [degrees, setDegrees] = useState([]);
  const [editingData, setEditingData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDegree, setSelectedDegree] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const deptRes = await fetch(`${API_BASE}/departments`, {
        credentials: 'include',
      });
      const deptData = await deptRes.json();
      const departs = deptData.departments.map((d) => d.dept);
      setDepartments(departs);
      const degRes = await fetch(
        `${apiUrl}/attendancemodule/settings/batches/degrees`,
        { credentials: 'include' },
      );
      const degData = await degRes.json();
      const allDegrees = degData.degrees || [];
      setDegrees(allDegrees);
      setEditingData(JSON.parse(JSON.stringify(allDegrees)));
      if (allDegrees.length) {
        setSelectedDegree(allDegrees[0].degreeName);
      }
    } 
    catch (err) {
      console.log(err);
      setSaveMsg({
        type: 'error',
        text: 'Failed to fetch data',
      });
    } 
    finally {
      setLoading(false);
    }
  };

  const currentDegree = editingData.find(
    (d) => d.degreeName === selectedDegree,
  );

  const getBranch = (dept) => {
    return currentDegree?.branches?.find((b) => b.dept === dept);
  };

  const handleBranchChange = (dept, value) => {
    setEditingData((prev) =>
      prev.map((d) => {
        if (d.degreeName !== selectedDegree) return d;

        const idx = d.branches.findIndex((b) => b.dept === dept);

        let branches = [...d.branches];

        if (idx !== -1) {
          branches[idx] = {
            dept,
            branchName: value,
          };
        } else {
          branches.push({
            dept,
            branchName: value,
          });
        }
        return {
          ...d,
          branches,
        };
      }),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(
        `${apiUrl}/attendancemodule/settings/batches/degrees`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            degrees: editingData,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setDegrees(JSON.parse(JSON.stringify(editingData)));
      setIsEditing(false);
      setSaveMsg({
        type: 'success',
        text: 'Saved globally',
      });
    } catch {
      setSaveMsg({
        type: 'error',
        text: 'Save Failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDegree = () => {
    const degree = prompt('Enter Degree Name');
    if (!degree) return;
    const normalized = degree.toUpperCase().trim();
    if (editingData.some((d) => d.degreeName === normalized)) {
      alert('Degree Exists');
      return;
    }
    const newDegree = {
      degreeName: normalized,
      branches: [],
    };
    setEditingData((prev) => [...prev, newDegree]);
    setDegrees((prev) => [...prev, newDegree]);
    setSelectedDegree(normalized);
    setIsEditing(true);
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ padding: 20 }}>
        {saveMsg && (
          <div
            className="floating-toast-container"
            style={{background: saveMsg.type === 'success' ? '#10b981' : '#ef4444'}}>
            {saveMsg.text}
          </div>
        )}

        <div className="session-header">
          <div>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 24}}>
              Degree Management
            </h2>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4}}>
              Manage degree programs globally
            </div>
          </div>

          <select className="native-select degree-selector" value={selectedDegree} onChange={(e) => setSelectedDegree(e.target.value)}>
            {editingData.map((d) => (
              <option key={d.degreeName} value={d.degreeName}>
                {d.degreeName}
              </option>
            ))}
          </select>
        </div>

        <div className="session-card">
          <div className="session-card-header">
            <div>
              <span
                style={{ fontSize: 11, color: T.textMuted, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700}}>
                Degree Configuration
              </span>

              <div style={{ marginTop: 8 }}>
                <span className="degree-badge">{selectedDegree}</span>
              </div>
            </div>

            <div className="degree-actions">
              {isEditing ? (
                <>
                  <button
                    className="native-btn"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.border}`,
                      color: T.textMuted,
                    }}
                    onClick={() => {
                      setEditingData(JSON.parse(JSON.stringify(degrees)));

                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="native-btn"
                    style={{
                      background: T.success,
                      color: '#fff',
                    }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="native-btn"
                    style={{
                      background: T.accent,
                      color: '#fff',
                    }}
                    onClick={handleAddDegree}
                  >
                    + Add Degree
                  </button>

                  <button
                    className="native-btn"
                    style={{
                      background: '#fff',
                      border: `1px solid ${T.border}`,
                      color: T.text,
                    }}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Degrees
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: 50,
                textAlign: 'center',
                color: T.textMuted,
              }}
            >
              Loading...
            </div>
          ) : (
            <table className="ams-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Department</th>

                  <th style={{ textAlign: 'center', width: '50%' }}>
                    Branch Name
                  </th>
                </tr>
              </thead>

              <tbody>
                {departments.map((dept) => {
                  const branch = getBranch(dept);

                  return (
                    <tr key={dept}>
                      <td style={{textAlign: "left"}}>
                        <strong>{dept}</strong>
                      </td>

                      <td style={{textAlign: "left"}}>
                        {isEditing ? (
                          <input
                            className="native-input"
                            value={branch?.branchName || ''}
                            onChange={(e) =>
                              handleBranchChange(dept, e.target.value)
                            }
                          />
                        ) : (
                          branch?.branchName || (
                            <span className="not-configured">
                              Not Configured
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: T.textMuted,
          }}
        >
          Changes are saved globally for all batches.
        </div>
      </div>
    </>
  );
}
