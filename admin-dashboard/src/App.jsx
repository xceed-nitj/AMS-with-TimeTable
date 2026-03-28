import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Overview from './pages/Overview'
import LiveMonitor from './pages/LiveMonitor'
import CameraNetwork from './pages/CameraNetwork'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import GroundTruth from './pages/GroundTruth'

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/live-monitor" element={<LiveMonitor />} />
        <Route path="/camera-network" element={<CameraNetwork />} />
        <Route path="/students" element={<Students />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/ground-truth" element={<GroundTruth />} />
      </Route>
    </Routes>
  )
}

export default App
