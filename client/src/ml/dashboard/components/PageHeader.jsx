import { Moon, Maximize } from 'lucide-react'

export default function PageHeader({ title, children }) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        <div className="page-date">{dateStr} · Central Campus — Building Complex</div>
      </div>
      <div className="header-badges">
        {children || (
          <>
            <span className="header-badge"><span className="dot" /> 72% present today</span>
            <span className="header-badge">24 cameras</span>
            <span className="header-badge">36 students enrolled</span>
            <button className="header-icon-btn"><Moon size={16} /></button>
            <button className="header-icon-btn"><Maximize size={16} /></button>
          </>
        )}
      </div>
    </div>
  )
}
