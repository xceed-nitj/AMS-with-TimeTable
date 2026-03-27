import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import '../index.css'

export default function DashboardLayout() {
  return (
    <div className="icss-dashboard">
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
