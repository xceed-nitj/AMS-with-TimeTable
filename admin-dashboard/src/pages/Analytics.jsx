import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useApi, { LoadingSkeleton } from '../hooks/useApi'
import { getAttendanceTrends, getDepartmentAnalysis, getRiskDefaulters } from '../services/dashboardApi'

/* ===== Fallback Data ===== */
const FB_TRENDS = {
  weekly: [{ day: 'Mon', attendancePercent: 86 }, { day: 'Tue', attendancePercent: 88 }, { day: 'Wed', attendancePercent: 95 }, { day: 'Thu', attendancePercent: 78 }, { day: 'Fri', attendancePercent: 82 }, { day: 'Sat', attendancePercent: 84 }, { day: 'Sun', attendancePercent: 90 }],
  semester: [{ week: 'W1', attendancePercent: 82 }, { week: 'W2', attendancePercent: 85 }, { week: 'W3', attendancePercent: 80 }, { week: 'W4', attendancePercent: 88 }, { week: 'W5', attendancePercent: 94 }, { week: 'W6', attendancePercent: 86 }, { week: 'W7', attendancePercent: 78 }, { week: 'W8', attendancePercent: 79 }, { week: 'W9', attendancePercent: 82 }, { week: 'W10', attendancePercent: 85 }, { week: 'W11', attendancePercent: 87 }, { week: 'W12', attendancePercent: 84 }, { week: 'W13', attendancePercent: 88 }, { week: 'W14', attendancePercent: 86 }, { week: 'W15', attendancePercent: 85 }],
  bestDay: [{ day: 'Mon', percent: 91 }, { day: 'Tue', percent: 87 }, { day: 'Wed', percent: 95 }, { day: 'Thu', percent: 78 }, { day: 'Fri', percent: 88 }, { day: 'Sat', percent: 82 }, { day: 'Sun', percent: 90 }],
  hourWise: [{ hour: '8:30–9:00', percent: 12 }, { hour: '9:00–9:15', percent: 61 }, { hour: '9:15–9:30', percent: 18 }, { hour: '9:30–10:00', percent: 7 }, { hour: '10:00+', percent: 2 }],
  keyStats: { avgThisWeek: '87.3%', bestDay: '95% (Wed)', worstDay: '78% (Thu)', semesterAvg: '84.2%', recognitionAccuracy: '98.7%', spoofAttemptsBlocked: '14', unknownFacesToday: '4', parentAlertsSent: '7' },
}

const FB_DEPT = {
  departments: [
    { dept: 'CSE', enrolled: 72, present: 66, defaulters: 4, avgAttendance: '91%' },
    { dept: 'ECE', enrolled: 61, present: 52, defaulters: 7, avgAttendance: '85%' },
    { dept: 'ME', enrolled: 58, present: 46, defaulters: 10, avgAttendance: '79%' },
    { dept: 'CE', enrolled: 44, present: 33, defaulters: 9, avgAttendance: '76%' },
    { dept: 'IT', enrolled: 55, present: 48, defaulters: 5, avgAttendance: '88%' },
  ],
  sections: [{ name: 'Section A', percent: 89 }, { name: 'Section B', percent: 84 }, { name: 'Section C', percent: 78 }],
  years: [{ name: 'Year 1', percent: 88 }, { name: 'Year 2', percent: 85 }, { name: 'Year 3', percent: 80 }, { name: 'Year 4', percent: 83 }],
}

const FB_RISK = {
  totalDefaulters: 16, highRisk: 4, mediumRisk: 12,
  defaulters: [
    { name: 'Lakshmi Devi', rollNo: 'IT/2022/025', dept: 'IT', overallPercent: 60, worstSubject: 'Big Data Analytics', worstSubjectPercent: 51, riskLevel: 'HIGH' },
    { name: 'Nisha Yadav', rollNo: 'CSE/2022/021', dept: 'CSE', overallPercent: 62, worstSubject: 'Machine Learning', worstSubjectPercent: 55, riskLevel: 'HIGH' },
    { name: 'Shreya Pandey', rollNo: 'CE/2022/019', dept: 'CE', overallPercent: 63, worstSubject: 'RCC Design', worstSubjectPercent: 53, riskLevel: 'HIGH' },
    { name: 'Harsh Trivedi', rollNo: 'CSE/2021/036', dept: 'CSE', overallPercent: 64, worstSubject: 'Operating Systems', worstSubjectPercent: 54, riskLevel: 'HIGH' },
    { name: 'Preethi Nair', rollNo: 'ME/2022/023', dept: 'ME', overallPercent: 65, worstSubject: 'Manufacturing Proc.', worstSubjectPercent: 53, riskLevel: 'MEDIUM' },
    { name: 'Tarun Bose', rollNo: 'IT/2021/030', dept: 'IT', overallPercent: 68, worstSubject: 'Cybersecurity', worstSubjectPercent: 62, riskLevel: 'MEDIUM' },
    { name: 'Vineet Singh', rollNo: 'ECE/2021/032', dept: 'ECE', overallPercent: 69, worstSubject: 'Signals & Systems', worstSubjectPercent: 64, riskLevel: 'MEDIUM' },
    { name: 'Rahul Srivastava', rollNo: 'ECE/2022/022', dept: 'ECE', overallPercent: 70, worstSubject: 'Control Systems', worstSubjectPercent: 61, riskLevel: 'MEDIUM' },
  ],
  predictiveAlerts: [
    { name: 'Divya Mishra', currentPercent: 75, projectedPercent: 70, daysUntilThreshold: 5 },
    { name: 'Raj Saxena', currentPercent: 81, projectedPercent: 70, daysUntilThreshold: 5 },
    { name: 'Simran Kaur', currentPercent: 77, projectedPercent: 70, daysUntilThreshold: 5 },
  ],
}

function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase() }

function AttendanceTrends({ data }) {
  const d = data || FB_TRENDS
  const keyStats = d.keyStats || FB_TRENDS.keyStats
  const weekly = d.weekly?.length ? d.weekly : FB_TRENDS.weekly
  const semester = d.semester?.length ? d.semester : FB_TRENDS.semester
  const bestDay = d.bestDay?.length ? d.bestDay : FB_TRENDS.bestDay
  const hourWise = d.hourWise?.length ? d.hourWise : FB_TRENDS.hourWise

  const statsRows = [
    { label: 'Avg this week', value: keyStats.avgThisWeek || '—' },
    { label: 'Best day', value: keyStats.bestDay || '—' },
    { label: 'Worst day', value: keyStats.worstDay || '—' },
    { label: 'Semester avg', value: keyStats.semesterAvg || '—' },
    { label: 'Recognition accuracy', value: keyStats.recognitionAccuracy || '—' },
    { label: 'Spoof attempts blocked', value: keyStats.spoofAttemptsBlocked || '—' },
    { label: 'Unknown faces today', value: keyStats.unknownFacesToday || '—' },
    { label: 'Parent alerts sent', value: keyStats.parentAlertsSent || '—' },
  ]

  return (
    <div>
      <div className="grid-2 mb-16">
        <div className="card">
          <div className="flex-between mb-8">
            <div className="card-title" style={{ margin: 0 }}>7-Day Attendance Trend</div>
            <select className="filter-select" style={{ fontSize: 11 }}><option>Last 7 days</option></select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
              <XAxis dataKey="day" fontSize={12} stroke="#9C9590" />
              <YAxis domain={[70, 100]} fontSize={12} stroke="#9C9590" />
              <Tooltip />
              <Line type="monotone" dataKey="attendancePercent" stroke="#C4652A" strokeWidth={2.5} dot={{ fill: '#C4652A', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Semester Trend (Weekly)</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={semester}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
              <XAxis dataKey="week" fontSize={10} stroke="#9C9590" />
              <YAxis domain={[70, 100]} fontSize={12} stroke="#9C9590" />
              <Tooltip />
              <Line type="monotone" dataKey="attendancePercent" stroke="#4CAF50" strokeWidth={2} dot={{ fill: '#4CAF50', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid-3">
        <div className="card">
          <div className="card-title">Best Performing Day</div>
          {bestDay.map((d, i) => (
            <div key={i} className="progress-row">
              <span className="progress-label" style={{ minWidth: 40 }}>{d.day}</span>
              <div className="progress-bar-track"><div className={`progress-bar-fill ${d.percent >= 90 ? 'green' : d.percent >= 80 ? 'accent' : 'orange'}`} style={{ width: `${d.percent}%` }} /></div>
              <span className="progress-pct">{d.percent}%</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Hour-Wise Arrivals</div>
          {hourWise.map((h, i) => (
            <div key={i} className="progress-row">
              <span className="progress-label" style={{ minWidth: 80 }}>{h.hour}</span>
              <div className="progress-bar-track"><div className={`progress-bar-fill ${h.percent >= 40 ? 'accent' : h.percent >= 15 ? 'orange' : 'red'}`} style={{ width: `${h.percent * 1.5}%` }} /></div>
              <span className="progress-pct">{h.percent}%</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Key Stats</div>
          {statsRows.map((s, i) => (
            <div key={i} className="info-row"><span className="info-label">{s.label}</span><span className="info-value">{s.value}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DepartmentAnalysis({ data }) {
  const d = data || FB_DEPT
  const depts = d.departments?.length ? d.departments : FB_DEPT.departments
  const sections = d.sections?.length ? d.sections : FB_DEPT.sections
  const years = d.years?.length ? d.years : FB_DEPT.years
  const chartData = depts.map(x => ({ dept: x.dept, att: parseInt(x.avgAttendance) || 0 }))

  return (
    <div>
      <div className="grid-2 mb-16">
        <div className="card">
          <div className="card-title">Department-Wise Attendance</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
              <XAxis dataKey="dept" fontSize={12} stroke="#9C9590" />
              <YAxis domain={[60, 100]} fontSize={12} stroke="#9C9590" />
              <Tooltip />
              <Bar dataKey="att" fill="#C4652A" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Department Breakdown</div>
          <table className="data-table">
            <thead><tr><th>Department</th><th>Enrolled</th><th>Present</th><th>Defaulters</th><th>Avg Att.</th></tr></thead>
            <tbody>
              {depts.map((d, i) => (
                <tr key={i}>
                  <td><span className="badge dept">{d.dept}</span></td>
                  <td className="mono">{d.enrolled}</td>
                  <td className="mono text-green">{d.present || '—'}</td>
                  <td className="mono text-accent">{d.defaulters || '—'}</td>
                  <td><span className={`badge ${parseInt(d.avgAttendance) >= 85 ? 'online' : parseInt(d.avgAttendance) >= 75 ? 'warning' : 'critical'}`}>{d.avgAttendance || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Section Comparison</div>
          {sections.map((s, i) => (
            <div key={i} className="progress-row">
              <span className="progress-label">{s.name}</span>
              <div className="progress-bar-track"><div className={`progress-bar-fill ${s.percent >= 85 ? 'green' : 'accent'}`} style={{ width: `${s.percent}%` }} /></div>
              <span className="progress-pct">{s.percent}%</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Year-Wise Performance</div>
          {years.map((y, i) => (
            <div key={i} className="progress-row">
              <span className="progress-label">{y.name}</span>
              <div className="progress-bar-track"><div className={`progress-bar-fill ${y.percent >= 85 ? 'green' : 'accent'}`} style={{ width: `${y.percent}%` }} /></div>
              <span className="progress-pct">{y.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RiskDefaulters({ data }) {
  const d = data || FB_RISK
  const defaulters = d.defaulters?.length ? d.defaulters : FB_RISK.defaulters
  const predictive = d.predictiveAlerts?.length ? d.predictiveAlerts : FB_RISK.predictiveAlerts

  return (
    <div>
      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card red"><div className="stat-value">{d.totalDefaulters || 16}</div><div className="stat-label">Defaulters ({'<'}75%)</div><div className="stat-sub mono">SMS sent to all parents</div></div>
        <div className="stat-card"><div className="stat-value">{d.highRisk || 4}</div><div className="stat-label">High Risk Students</div><div className="stat-sub mono">Immediate intervention needed</div></div>
        <div className="stat-card orange"><div className="stat-value">{d.mediumRisk || 12}</div><div className="stat-label">Medium Risk</div><div className="stat-sub mono">Under monitoring</div></div>
      </div>
      <div className="grid-2-1">
        <div className="card" style={{ padding: 0 }}>
          <div className="flex-between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Defaulters List — Attendance {'<'} 75%</span>
            <button className="btn btn-outline" style={{ fontSize: 11 }}>Send Bulk SMS</button>
          </div>
          <table className="data-table">
            <thead><tr><th>Student</th><th>Dept</th><th>Overall</th><th>Worst Subject</th><th>Risk</th><th>Actions</th></tr></thead>
            <tbody>
              {defaulters.map((d, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex gap-8 items-center">
                      <div className={`avatar ${d.riskLevel === 'HIGH' ? 'red' : 'orange'}`} style={{ width: 26, height: 26, fontSize: 9 }}>{getInitials(d.name)}</div>
                      <div><div style={{ fontWeight: 500 }}>{d.name}</div><div className="text-muted" style={{ fontSize: 10 }}>{d.rollNo}</div></div>
                    </div>
                  </td>
                  <td><span className="badge dept">{d.dept}</span></td>
                  <td><span className={`badge ${d.riskLevel === 'HIGH' ? 'critical' : 'warning'}`}>{d.overallPercent}%</span></td>
                  <td><div style={{ fontSize: 12 }}>{d.worstSubject}</div><div className="text-muted" style={{ fontSize: 10 }}>{d.worstSubjectPercent}%</div></td>
                  <td><span className={`badge ${d.riskLevel === 'HIGH' ? 'high' : 'medium'}`}>{d.riskLevel}</span></td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-outline" style={{ fontSize: 10, padding: '4px 8px' }}>Alert</button>
                      <button className="btn btn-outline" style={{ fontSize: 10, padding: '4px 8px' }}>Parent SMS</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="card mb-16">
            <div className="card-title">Risk Distribution</div>
            {[
              { label: 'High Risk (<65%)', count: d.highRisk || 4, pct: '11%', badge: 'critical' },
              { label: 'Medium Risk (65–74%)', count: d.mediumRisk || 12, pct: '33%', badge: 'warning' },
              { label: 'Low Risk (≥75%)', count: 20, pct: '56%', badge: 'online' },
            ].map((r, i) => (
              <div key={i} className="info-row">
                <span className="info-label">{r.label}</span>
                <div className="flex gap-8 items-center">
                  <span className={`badge ${r.badge}`}>{r.count}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>{r.pct}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Predictive Alerts</div>
            <div style={{ background: 'var(--orange-bg)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 12, color: 'var(--orange-text)' }}>
              <strong>AI Insight:</strong> {predictive.length} students showing declining trend. At current rate, they will fall below 75% threshold within {predictive[0]?.daysUntilThreshold || 5} days.
            </div>
            {predictive.map((p, i) => (
              <div key={i} className="feed-item">
                <div className="avatar orange" style={{ width: 28, height: 28, fontSize: 10 }}>{getInitials(p.name)}</div>
                <div className="feed-item-content">
                  <div className="feed-item-name" style={{ fontSize: 12 }}>{p.name}</div>
                  <div className="feed-item-sub">{p.currentPercent}% → projected {p.projectedPercent}% in {p.daysUntilThreshold}d</div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 10, padding: '4px 10px' }}>Warn</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [tab, setTab] = useState('trends')
  const trends = useApi(getAttendanceTrends, { fallback: FB_TRENDS, immediate: true })
  const dept = useApi(getDepartmentAnalysis, { fallback: FB_DEPT, immediate: false })
  const risk = useApi(getRiskDefaulters, { fallback: FB_RISK, immediate: false })

  const handleTab = (t) => {
    setTab(t)
    if (t === 'dept' && !dept.data?.departments?.length) dept.execute()
    if (t === 'risk' && !risk.data?.defaulters?.length) risk.execute()
  }

  const tabs = [
    { key: 'trends', label: 'Attendance Trends' },
    { key: 'dept', label: 'Department Analysis' },
    { key: 'risk', label: 'Risk & Defaulters' },
  ]

  return (
    <>
      <PageHeader title="Analytics" />
      <div className="page-content">
        <div className="tab-group">
          {tabs.map(t => (
            <div key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => handleTab(t.key)}>{t.label}</div>
          ))}
        </div>
        {tab === 'trends' && (trends.loading ? <LoadingSkeleton rows={6} /> : <AttendanceTrends data={trends.data} />)}
        {tab === 'dept' && (dept.loading ? <LoadingSkeleton rows={6} /> : <DepartmentAnalysis data={dept.data} />)}
        {tab === 'risk' && (risk.loading ? <LoadingSkeleton rows={6} /> : <RiskDefaulters data={risk.data} />)}
      </div>
    </>
  )
}
