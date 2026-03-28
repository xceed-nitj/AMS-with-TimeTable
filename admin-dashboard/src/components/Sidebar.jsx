import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Eye, Link2, Users, ClipboardList,
  BarChart3, Bell, Settings, FileVideo
} from 'lucide-react'
import NitjLogo from './NitjLogo'

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
  { group: 'MODELS', items: [
    { to: '/ground-truth', icon: FileVideo, label: 'Ground Generation' },
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 72 }}>
          <NitjLogo size={72} />
        </div>
        <div>
          <div className="sidebar-title" style={{ fontSize: '13px', lineHeight: '1.3' }}>NIT Jalandhar Centralised<br/>Surveillance System</div>
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
