import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import useApi, { LoadingSkeleton } from '../hooks/useApi'
import { getAlerts, getAlertSummary, getAlertRules, resolveAlert, dismissAlert, updateAlertRule } from '../services/dashboardApi'

const tabs = ['Active', 'Critical', 'Warning', 'Info', 'Resolved']

const FALLBACK_ALERTS = {
  total: 11,
  alerts: [
    { _id: '1', type: 'critical', title: 'Unidentified person detected at Main Entry Gate', time: '12:38', tag: 'unknown face' },
    { _id: '2', type: 'critical', title: 'Spoofing attempt blocked at Block A Entry', time: '12:07', tag: 'spoof attempt' },
    { _id: '3', type: 'critical', title: 'CAM-007 (Block B Corridor) has gone offline', time: '11:38', tag: 'cam offline' },
    { _id: '4', type: 'warning', title: 'Kavya Reddy attendance dropped below 65% threshold', time: '11:12', tag: 'low attendance' },
    { _id: '5', type: 'warning', title: 'Dev Malhotra marked absent for 5 consecutive days', time: '10:40', tag: 'low attendance' },
    { _id: '6', type: 'warning', title: 'CAM-012 running at reduced FPS (8fps) — check lighting', time: '10:02', tag: 'cam degraded' },
    { _id: '7', type: 'warning', title: '3 students from ME/Sec-C below 75% — review required', time: '09:38', tag: 'low attendance' },
    { _id: '8', type: 'info', title: 'Daily backup completed successfully — 2.3 GB synced', time: '09:09', tag: 'system' },
    { _id: '9', type: 'info', title: "Model accuracy recalibrated: 98.9% on today's samples", time: '08:35', tag: 'system' },
    { _id: '10', type: 'info', title: 'Low light detected on Block C Lab cameras — accuracy impacted', time: '08:13', tag: 'low light' },
    { _id: '11', type: 'info', title: 'SIS sync completed — attendance exported to ERP system', time: '07:33', tag: 'system' },
  ],
}

const FALLBACK_SUMMARY = { critical: 3, warnings: 5, info: 3, resolved: 4, total: 15 }

const FALLBACK_RULES = {
  rules: [
    { _id: '1', name: 'Unknown face detected', severity: 'CRITICAL', enabled: true },
    { _id: '2', name: 'Spoof attempt blocked', severity: 'CRITICAL', enabled: true },
    { _id: '3', name: 'Camera offline >5min', severity: 'CRITICAL', enabled: true },
    { _id: '4', name: 'Student below 75%', severity: 'WARNING', enabled: true },
    { _id: '5', name: 'Student absent 3 days', severity: 'WARNING', enabled: true },
    { _id: '6', name: 'Camera degraded FPS', severity: 'WARNING', enabled: true },
    { _id: '7', name: 'Daily backup complete', severity: 'INFO', enabled: true },
    { _id: '8', name: 'SIS sync complete', severity: 'INFO', enabled: true },
  ],
}

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('Active')

  const alerts = useApi(() => getAlerts({ type: activeTab.toLowerCase() }), {
    fallback: FALLBACK_ALERTS, deps: [activeTab],
  })
  const summary = useApi(getAlertSummary, { fallback: FALLBACK_SUMMARY })
  const rules = useApi(getAlertRules, { fallback: FALLBACK_RULES })

  const alertList = alerts.data?.alerts?.length ? alerts.data.alerts : FALLBACK_ALERTS.alerts
  const sumData = summary.data || FALLBACK_SUMMARY
  const ruleList = rules.data?.rules?.length ? rules.data.rules : FALLBACK_RULES.rules

  const handleResolve = async (id) => {
    try { await resolveAlert(id); alerts.refresh(); summary.refresh() } catch (e) { console.error(e) }
  }
  const handleDismiss = async (id) => {
    try { await dismissAlert(id); alerts.refresh(); summary.refresh() } catch (e) { console.error(e) }
  }
  const handleRuleToggle = async (rule) => {
    try { await updateAlertRule(rule._id, { enabled: !rule.enabled }); rules.refresh() } catch (e) { console.error(e) }
  }

  return (
    <>
      <PageHeader title="Alerts" />
      <div className="page-content">
        <div className="flex-between mb-16">
          <div className="tab-group" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {tabs.map(t => (
              <div key={t} className={`tab-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
            ))}
          </div>
          <div className="flex gap-8">
            <button className="btn btn-outline">Resolve All</button>
            <button className="btn btn-primary">Alert Rules</button>
          </div>
        </div>

        <div className="grid-2-1">
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Alerts ({alertList.length})
            </div>
            {alerts.loading && !alertList.length ? <div style={{ padding: 20 }}><LoadingSkeleton rows={6} /></div> : (
              alertList.map((a, i) => (
                <div key={a._id || i} className="alert-item">
                  <div className={`alert-icon ${a.type}`}>
                    {a.type === 'critical' ? '!' : a.type === 'warning' ? '⚠' : 'i'}
                  </div>
                  <div className="alert-content">
                    <div className="alert-title">{a.title}</div>
                    <div className="alert-meta">{a.time} · {a.tag}</div>
                  </div>
                  <div className="alert-actions">
                    <button className="btn btn-outline" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => handleResolve(a._id)}>Resolve</button>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => handleDismiss(a._id)}>Dismiss</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <div className="card mb-16">
              <div className="card-title">Alert Summary</div>
              {[
                { label: 'Critical (unresolved)', count: sumData.critical, badge: 'critical' },
                { label: 'Warnings (unresolved)', count: sumData.warnings, badge: 'warning' },
                { label: 'Info (unresolved)', count: sumData.info, badge: 'info' },
                { label: 'Resolved today', count: sumData.resolved, badge: 'online' },
                { label: 'Total today', count: sumData.total, badge: 'dept' },
              ].map((s, i) => (
                <div key={i} className="info-row">
                  <span className="info-label">{s.label}</span>
                  <span className={`badge ${s.badge}`}>{s.count}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Alert Rules</div>
              {ruleList.map((r, i) => (
                <div key={r._id || i} className="setting-row" style={{ padding: '12px 0' }}>
                  <div>
                    <div className="setting-label" style={{ fontSize: 13 }}>{r.name}</div>
                    <span className={`badge ${r.severity === 'CRITICAL' ? 'critical' : r.severity === 'WARNING' ? 'warning' : 'info'}`} style={{ marginTop: 4 }}>
                      {r.severity}
                    </span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={r.enabled} onChange={() => handleRuleToggle(r)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
