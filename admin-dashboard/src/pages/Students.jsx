import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import useApi, { LoadingSkeleton } from '../hooks/useApi'
import { getStudents, createStudent } from '../services/dashboardApi'

const FALLBACK = {
  total: 36,
  students: [
    { _id: '1', name: 'Aarav Sharma', email: 'aarav.1@college.edu', rollNo: 'CSE/2024/001', dept: 'CSE', sem: 1, attendancePercent: 80, riskLevel: 'LOW', lastSeen: '15:10', status: 'ACTIVE' },
    { _id: '2', name: 'Priya Patel', email: 'priya.1@college.edu', rollNo: 'ECE/2024/002', dept: 'ECE', sem: 1, attendancePercent: 76, riskLevel: 'LOW', lastSeen: '06:54', status: 'ACTIVE' },
    { _id: '3', name: 'Rohit Verma', email: 'rohit.1@college.edu', rollNo: 'ME/2024/003', dept: 'ME', sem: 1, attendancePercent: 72, riskLevel: 'MEDIUM', lastSeen: '22:38', status: 'ACTIVE' },
    { _id: '4', name: 'Ananya Singh', email: 'ananya.1@college.edu', rollNo: 'CE/2024/004', dept: 'CE', sem: 1, attendancePercent: 79, riskLevel: 'LOW', lastSeen: '14:23', status: 'ACTIVE' },
    { _id: '5', name: 'Vikram Rao', email: 'vikram.1@college.edu', rollNo: 'IT/2024/005', dept: 'IT', sem: 1, attendancePercent: 73, riskLevel: 'MEDIUM', lastSeen: '06:07', status: 'ACTIVE' },
    { _id: '6', name: 'Meera Joshi', email: 'meera.1@college.edu', rollNo: 'CSE/2024/006', dept: 'CSE', sem: 1, attendancePercent: 80, riskLevel: 'LOW', lastSeen: '21:51', status: 'ACTIVE' },
    { _id: '7', name: 'Arjun Nair', email: 'arjun.1@college.edu', rollNo: 'ECE/2024/007', dept: 'ECE', sem: 1, attendancePercent: 76, riskLevel: 'LOW', lastSeen: '13:35', status: 'ACTIVE' },
    { _id: '8', name: 'Sneha Gupta', email: 'sneha.1@college.edu', rollNo: 'ME/2024/008', dept: 'ME', sem: 1, attendancePercent: 74, riskLevel: 'MEDIUM', lastSeen: '05:19', status: 'ACTIVE' },
    { _id: '9', name: 'Kavya Reddy', email: 'kavya.1@college.edu', rollNo: 'CE/2024/009', dept: 'CE', sem: 1, attendancePercent: 78, riskLevel: 'LOW', lastSeen: '21:03', status: 'ACTIVE' },
    { _id: '10', name: 'Dev Malhotra', email: 'dev.2@college.edu', rollNo: 'IT/2023/010', dept: 'IT', sem: 3, attendancePercent: 77, riskLevel: 'LOW', lastSeen: '12:47', status: 'ACTIVE' },
    { _id: '11', name: 'Riya Mehta', email: 'riya.2@college.edu', rollNo: 'CSE/2023/011', dept: 'CSE', sem: 3, attendancePercent: 71, riskLevel: 'MEDIUM', lastSeen: '04:31', status: 'ACTIVE' },
    { _id: '12', name: 'Karan Kumar', email: 'karan.2@college.edu', rollNo: 'ECE/2023/012', dept: 'ECE', sem: 3, attendancePercent: 77, riskLevel: 'LOW', lastSeen: '20:16', status: 'ACTIVE' },
    { _id: '13', name: 'Pooja Iyer', email: 'pooja.2@college.edu', rollNo: 'ME/2023/013', dept: 'ME', sem: 3, attendancePercent: 74, riskLevel: 'MEDIUM', lastSeen: '12:00', status: 'ACTIVE' },
    { _id: '14', name: 'Amit Chauhan', email: 'amit.2@college.edu', rollNo: 'CE/2023/014', dept: 'CE', sem: 3, attendancePercent: 79, riskLevel: 'LOW', lastSeen: '03:44', status: 'ACTIVE' },
  ],
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase()
}

const avatarColors = ['green', 'orange', 'blue', 'accent', 'red']

export default function Students() {
  const [filters, setFilters] = useState({ dept: '', search: '' })
  const students = useApi(() => getStudents(filters), { fallback: FALLBACK, deps: [filters.dept] })
  const data = students.data?.students?.length ? students.data : FALLBACK
  const total = students.data?.total || FALLBACK.total

  const handleSearch = (e) => {
    const val = e.target.value
    setFilters(f => ({ ...f, search: val }))
  }

  // Client-side search filter (works with both API and fallback data)
  const filtered = data.students.filter(s => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      <PageHeader title="Students" />
      <div className="page-content">
        <div className="flex-between mb-16">
          <div className="flex gap-8 items-center">
            <input className="filter-input" placeholder="Search name or roll no..." value={filters.search} onChange={handleSearch} />
            <select className="filter-select" value={filters.dept} onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))}>
              <option value="">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
              <option value="CE">CE</option>
              <option value="IT">IT</option>
            </select>
            <select className="filter-select"><option>All Years</option></select>
            <select className="filter-select"><option>All Risk</option></select>
          </div>
          <div className="flex gap-8 items-center">
            <span className="filter-count">{total} students</span>
            <button className="btn btn-outline">Export CSV</button>
            <button className="btn btn-primary">+ Enroll Student</button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {students.loading && !data.students.length ? <LoadingSkeleton rows={8} /> : (
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Roll No.</th><th>Dept</th><th>Year / Sec</th><th>Attendance</th><th>Risk</th><th>Last Seen</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s._id || i}>
                    <td>
                      <div className="flex gap-8 items-center">
                        <div className={`avatar ${avatarColors[i % avatarColors.length]}`}>{getInitials(s.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{s.email || s.mailID}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{s.rollNo}</td>
                    <td><span className="badge dept">{s.dept}</span></td>
                    <td>Year {Math.ceil(s.sem / 2)} / {['A', 'B', 'C'][i % 3]}</td>
                    <td>
                      <div className="flex gap-8 items-center">
                        <div className="progress-bar-track" style={{ width: 80 }}>
                          <div className={`progress-bar-fill ${(s.attendancePercent || 75) >= 80 ? 'green' : (s.attendancePercent || 75) >= 75 ? 'accent' : 'orange'}`}
                            style={{ width: `${s.attendancePercent || 75}%` }} />
                        </div>
                        <span className="mono" style={{ fontSize: 12 }}>{s.attendancePercent != null ? `${s.attendancePercent}%` : '—'}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${(s.riskLevel || 'LOW') === 'LOW' ? 'online' : 'warning'}`}>{s.riskLevel || 'LOW'}</span></td>
                    <td className="mono text-muted">{s.lastSeen || '—'}</td>
                    <td><span className="badge active">{s.status || 'ACTIVE'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
