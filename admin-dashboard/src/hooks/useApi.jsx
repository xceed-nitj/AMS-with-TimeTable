import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for API data fetching with loading, error, and refresh states.
 *
 * @param {Function} apiFn - The async API function to call
 * @param {Object} options
 * @param {any} options.fallback - Fallback data if API fails (default: null)
 * @param {boolean} options.immediate - Fetch immediately on mount (default: true)
 * @param {number} options.refreshInterval - Auto-refresh in ms (0 = disabled)
 * @param {Array} options.deps - Dependencies that trigger refetch
 */
export default function useApi(apiFn, options = {}) {
  const {
    fallback = null,
    immediate = true,
    refreshInterval = 0,
    deps = [],
  } = options

  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const mountedRef = useRef(true)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      if (mountedRef.current) {
        setData(result)
        setLoading(false)
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Something went wrong')
        setLoading(false)
        // Keep showing existing data or fallback
        if (data === null && fallback !== null) {
          setData(fallback)
        }
      }
      return null
    }
  }, [apiFn, fallback])

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true
    if (immediate) {
      execute()
    }
    return () => { mountedRef.current = false }
  }, [...deps])

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        execute()
      }, refreshInterval)
      return () => clearInterval(intervalRef.current)
    }
  }, [refreshInterval, execute])

  const refresh = useCallback(() => execute(), [execute])

  return { data, loading, error, refresh, execute }
}

/**
 * Loading skeleton component
 */
export function LoadingSkeleton({ rows = 5, type = 'table' }) {
  if (type === 'cards') {
    return (
      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="stat-card" style={{ opacity: 0.5 }}>
            <div style={{ width: 60, height: 28, background: 'var(--border-light)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 100, height: 12, background: 'var(--border-light)', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border-light)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: `${60 + Math.random() * 30}%`, height: 12, background: 'var(--border-light)', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: `${40 + Math.random() * 20}%`, height: 10, background: 'var(--border-light)', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Error state component with retry button
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        Failed to load data
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        {message}
      </div>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
