import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Buffers Vite's own console output (startup/HMR/build-error messages) and
// serves it at /__console-logs on the dev server's own origin, so the React
// Console page can show it the same way the Python ML service exposes its
// own /logs endpoint. Dev-only — this plugin only runs under `vite dev`.
function consoleBufferPlugin() {
  const MAX_LINES = 500
  const buffer = []

  function push(level, message) {
    buffer.push({ timestamp: new Date().toISOString(), level, logger: 'vite', message })
    if (buffer.length > MAX_LINES) buffer.shift()
  }

  return {
    name: 'console-buffer',
    configureServer(server) {
      const logger = server.config.logger
      const original = {
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
      }
      logger.info = (msg, options) => { push('INFO', msg); original.info(msg, options) }
      logger.warn = (msg, options) => { push('WARN', msg); original.warn(msg, options) }
      logger.error = (msg, options) => { push('ERROR', msg); original.error(msg, options) }

      server.middlewares.use('/__console-logs', (req, res) => {
        const url = new URL(req.url, 'http://internal')
        const limit = parseInt(url.searchParams.get('limit'), 10) || 200
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify({ logs: buffer.slice(-limit), total: buffer.length }))
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), consoleBufferPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
    },
  },
})
