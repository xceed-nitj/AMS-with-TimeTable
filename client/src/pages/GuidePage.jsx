import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import getEnvironment from '../getenvironment';

/* Tab accent colours — one per tab, cycles if more tabs added */
const TAB_COLORS = [
  { active: '#7c3aed', border: '#7c3aed', bg: '#f5f3ff', pill: '#ede9fe', text: '#5b21b6' },
  { active: '#0891b2', border: '#0891b2', bg: '#ecfeff', pill: '#cffafe', text: '#155e75' },
  { active: '#d97706', border: '#d97706', bg: '#fffbeb', pill: '#fef3c7', text: '#92400e' },
  { active: '#be185d', border: '#be185d', bg: '#fdf2f8', pill: '#fce7f3', text: '#9d174d' },
];

const color = (idx) => TAB_COLORS[idx % TAB_COLORS.length];

const CONTENT_CSS = `
/* ── base ── */
.gc { font-family: 'Inter', 'Segoe UI', sans-serif; }

/* ── headings ── */
.gc h2 {
  font-size: 1.75rem; font-weight: 800; color: #1e1b4b;
  margin: 0 0 1.25rem;
  padding-bottom: .6rem;
  border-bottom: 3px solid #7c3aed;
}
.gc h3 {
  font-size: 1.1rem; font-weight: 700; color: #1e1b4b;
  margin: 2.25rem 0 .65rem;
  display: flex; align-items: center; gap: 8px;
}
.gc h3::before {
  content: '';
  display: inline-block; width: 4px; height: 1.1em;
  background: #7c3aed;
  border-radius: 2px; flex-shrink: 0;
}
.gc h4 {
  font-size: .8rem; font-weight: 700; color: #7c3aed;
  margin: 1.75rem 0 .5rem;
  text-transform: uppercase; letter-spacing: .08em;
}

/* ── body text ── */
.gc p  { color: #1e293b; margin-bottom: .8rem; line-height: 1.75; }
.gc ul, .gc ol { color: #1e293b; padding-left: 1.5rem; margin-bottom: .8rem; }
.gc li { margin-bottom: .4rem; line-height: 1.7; }
.gc strong { color: #1e1b4b; font-weight: 700; }

/* ── inline code ── */
.gc code {
  background: #ede9fe; color: #5b21b6;
  padding: 2px 7px; border-radius: 5px;
  font-size: .84em; font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-weight: 500;
}

/* ── code blocks ── */
.gc pre {
  background: #1e1b4b;
  color: #c4b5fd;
  border-left: 4px solid #7c3aed;
  border-radius: 10px;
  padding: 16px 20px; margin: 1.1rem 0; overflow-x: auto;
  box-shadow: 0 4px 16px rgba(124,58,237,.15);
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: .83rem; line-height: 1.7;
}
.gc pre code {
  background: transparent; padding: 0;
  color: #c4b5fd;
  font-size: .83rem; line-height: 1.7;
}

/* ── tables ── */
.gc table {
  width: 100%; border-collapse: collapse;
  margin: 1.1rem 0; font-size: .875rem;
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,.07);
}
.gc table th {
  background: #7c3aed;
  color: #fff; font-weight: 700;
  padding: 11px 16px; text-align: left;
}
.gc table td {
  padding: 9px 16px; color: #1e293b;
  border-bottom: 1px solid #e0e7ff;
  vertical-align: top;
}
.gc table tr:nth-child(even) td { background: #f5f3ff; }
.gc table tr:hover td { background: #ede9fe; transition: background .15s; }

/* ── lists in table cells ── */
.gc table td ul { margin: 0; padding-left: 1rem; }
`;

const EDITOR_CSS = `
.html-editor {
  width: 100%; min-height: 560px; resize: vertical;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px; line-height: 1.65; color: #1e293b;
  background: #fafafa; border: 2px solid #e0e7ff;
  border-radius: 10px; padding: 16px 18px;
  outline: none; box-sizing: border-box;
  tab-size: 2;
}
.html-editor:focus { border-color: #7c3aed; background: #fff; }
`;

export default function GuidePage() {
  const apiUrl = getEnvironment();

  const [tabs, setTabs]               = useState([]);
  const [activeIdx, setActiveIdx]     = useState(0);
  const [editing, setEditing]         = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [fetchError, setFetchError]   = useState('');
  const [updatedAt, setUpdatedAt]     = useState(null);

  useEffect(() => {
    const init = async () => {
      const [guideRes, userRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/v1/guide`),
        fetch(`${apiUrl}/user/getuser/`, { credentials: 'include' }),
      ]);

      if (guideRes.status === 'fulfilled' && guideRes.value.ok) {
        const data = await guideRes.value.json();
        const sorted = [...data.tabs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setTabs(sorted);
        setUpdatedAt(data.updatedAt);
      } else {
        setFetchError('Failed to load documentation. Please refresh.');
      }

      if (userRes.status === 'fulfilled' && userRes.value.ok) setIsLoggedIn(true);
      setLoading(false);
    };
    init();
  }, [apiUrl]);

  const switchTab = (idx) => { setActiveIdx(idx); setEditing(false); setSaveError(''); };
  const handleEdit = () => { setEditContent(tabs[activeIdx]?.content ?? ''); setEditing(true); setSaveError(''); };
  const handleCancel = () => { setEditing(false); setSaveError(''); };

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    try {
      const newTabs = tabs.map((t, i) => i === activeIdx ? { ...t, content: editContent } : t);
      const res = await fetch(`${apiUrl}/api/v1/guide`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tabs: newTabs }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTabs([...data.tabs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setUpdatedAt(data.updatedAt);
      setEditing(false);
    } catch { setSaveError('Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #7c3aed',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin .7s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#7c3aed', fontWeight: 600 }}>Loading documentation…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  const currentTab = tabs[activeIdx];
  const c = color(activeIdx);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{CONTENT_CSS}{EDITOR_CSS}</style>

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1e1b4b',
        padding: '40px 24px 0',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,.12)', borderRadius: 20,
                padding: '4px 14px', marginBottom: 12,
              }}>
                <span style={{ fontSize: 13, color: '#c4b5fd', fontWeight: 600, letterSpacing: '.05em' }}>
                  AMS with TimeTable
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>
                Developer Documentation
              </h1>
              {updatedAt && !editing && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#a5b4fc' }}>
                  Last updated {new Date(updatedAt).toLocaleString()}
                </p>
              )}
            </div>

            {isLoggedIn && !editing && (
              <button
                onClick={handleEdit}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
                  background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
                  color: '#fff', borderRadius: 8, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  backdropFilter: 'blur(6px)', transition: 'background .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}
              >
                <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L7.5 19.212l-4.5 1.5 1.5-4.5L16.862 3.487z" />
                </svg>
                Edit Tab
              </button>
            )}
          </div>

          {/* ── Tab bar ──────────────────────────────────────────────────────── */}
          {!editing && (
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {tabs.map((tab, i) => {
                const tc = color(i);
                const isActive = i === activeIdx;
                return (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(i)}
                    style={{
                      flexShrink: 0,
                      padding: '10px 22px',
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                      borderRadius: '8px 8px 0 0',
                      border: 'none', cursor: 'pointer',
                      transition: 'all .2s',
                      background: isActive ? '#fff' : 'rgba(255,255,255,.1)',
                      color: isActive ? tc.active : 'rgba(255,255,255,.7)',
                      borderBottom: isActive ? `3px solid ${tc.active}` : '3px solid transparent',
                      boxShadow: isActive ? '0 -2px 12px rgba(0,0,0,.1)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.2)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
                  >
                    <span style={{
                      marginRight: 8, fontSize: 11, fontWeight: 700,
                      background: isActive ? tc.pill : 'rgba(255,255,255,.2)',
                      color: isActive ? tc.active : 'rgba(255,255,255,.8)',
                      borderRadius: 10, padding: '1px 7px',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {tab.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>

        {fetchError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            color: '#b91c1c', borderRadius: 10, padding: '12px 18px',
            marginBottom: 24, fontSize: 14,
          }}>
            {fetchError}
          </div>
        )}

        {/* ── Edit mode ────────────────────────────────────────────────────── */}
        {editing ? (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 16, padding: '10px 16px',
              background: c.pill, borderRadius: 8,
              borderLeft: `4px solid ${c.active}`,
            }}>
              <span style={{ fontSize: 13, color: c.text, fontWeight: 600 }}>
                Editing:
              </span>
              <span style={{ fontSize: 14, color: c.active, fontWeight: 700 }}>
                {currentTab?.title}
              </span>
            </div>

            <textarea
              className="html-editor"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              spellCheck={false}
            />

            {saveError && (
              <p style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{saveError}</p>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: c.active,
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '10px 28px', fontSize: 14, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? .6 : 1,
                  boxShadow: `0 4px 14px rgba(124,58,237,.3)`,
                }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  background: '#f1f5f9', color: '#334155',
                  border: '1px solid #e2e8f0', borderRadius: 8,
                  padding: '10px 24px', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ─────────────────────────────────────────────────── */
          currentTab ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              border: `1px solid ${c.pill}`,
              padding: '40px 48px',
              boxShadow: `0 4px 32px rgba(124,58,237,.08), 0 1px 3px rgba(0,0,0,.04)`,
            }}>
              <div
                className="gc"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentTab.content) }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#7c3aed', fontWeight: 600 }}>
              No content yet.
            </div>
          )
        )}
      </div>
    </div>
  );
}
