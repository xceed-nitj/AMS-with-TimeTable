import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { Moon, Maximize } from 'lucide-react'

export default function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
