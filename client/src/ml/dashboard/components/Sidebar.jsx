import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Eye, Link2, Users, ClipboardList,
  BarChart3, Bell, Settings
} from 'lucide-react'

const navItems = [
  { group: 'DASHBOARD', items: [
    { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  ]},
  { group: 'SURVEILLANCE', items: [
    { to: '/live-monitor', icon: Eye, label: 'Live Monitor' },
    { to: '/camera-network', icon: Link2, label: 'Camera Network' },
  ]},
  { group: 'PEOPLE', items: [
    { to: '/students', icon: Users, label: 'Students' },
  ]},
  { group: 'RECORDS', items: [
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  ]},
  { group: 'INSIGHTS', items: [
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ]},
  { group: 'SYSTEM', items: [
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: 11 },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]},
]

const statusItems = [
  { label: 'ArcFace model — online', color: 'green' },
  { label: '19/24 cameras active', color: 'orange' },
  { label: 'Anti-spoof enabled', color: 'green' },
  { label: 'DB synced · API online', color: 'green' },
  { label: 'SIS integration active', color: 'green' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-title">Integrated Campus<br/>Surveillance System (ICSS)</div>
          <div className="sidebar-subtitle">ArcFace Engine</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(group => (
          <div key={group.group}>
            <div className="nav-group-label">{group.group}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-status">
        <div className="sidebar-status-title">System Status</div>
        {statusItems.map((s, i) => (
          <div key={i} className="status-item">
            <span className={`status-dot ${s.color}`} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
