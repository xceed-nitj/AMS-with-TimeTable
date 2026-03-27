import api from './api'

const ADMIN = '/api/v1/admin/dashboard'

// ─── Overview ─────────────────────────────────────────────────
export const getOverviewStats = () => api.get(`${ADMIN}/overview`)
export const getLiveRecognitionFeed = () => api.get(`${ADMIN}/live-feed`)
export const getSystemHealth = () => api.get(`${ADMIN}/system-health`)
export const getTodaySchedule = () => api.get(`${ADMIN}/today-schedule`)

// ─── Students ─────────────────────────────────────────────────
export const getStudents = (params = {}) => api.get(`${ADMIN}/students`, { params })
export const createStudent = (data) => api.post(`${ADMIN}/students`, data)

// ─── Attendance ───────────────────────────────────────────────
export const getAttendanceRecords = (params = {}) => api.get(`${ADMIN}/attendance`, { params })
export const getAttendanceStats = (params = {}) => api.get(`${ADMIN}/attendance/stats`, { params })
export const overrideAttendance = (id, data) => api.put(`${ADMIN}/attendance/${id}/override`, data)
export const exportAttendance = (params = {}) =>
  api.get(`${ADMIN}/attendance/export`, { params, responseType: 'blob' })

// ─── Analytics ────────────────────────────────────────────────
export const getAttendanceTrends = (params = {}) => api.get(`${ADMIN}/analytics/trends`, { params })
export const getDepartmentAnalysis = () => api.get(`${ADMIN}/analytics/departments`)
export const getRiskDefaulters = () => api.get(`${ADMIN}/analytics/defaulters`)

// ─── Cameras ──────────────────────────────────────────────────
export const getCameras = (params = {}) => api.get(`${ADMIN}/cameras`, { params })
export const getCameraStats = () => api.get(`${ADMIN}/cameras/stats`)
export const getCameraBuildings = () => api.get(`${ADMIN}/cameras/buildings`)
export const getEdgeNodes = () => api.get(`${ADMIN}/cameras/edge-nodes`)
export const getNetworkHealth = () => api.get(`${ADMIN}/cameras/network-health`)
export const testCamera = (id) => api.post(`${ADMIN}/cameras/${id}/test`)
export const restartCamera = (id) => api.post(`${ADMIN}/cameras/${id}/restart`)

// ─── Live Monitor ─────────────────────────────────────────────
export const getLiveDetections = () => api.get(`${ADMIN}/live-monitor/detections`)
export const getEngineStatus = () => api.get(`${ADMIN}/live-monitor/engine-status`)
export const getCameraFeeds = () => api.get(`${ADMIN}/live-monitor/feeds`)

// ─── Alerts ───────────────────────────────────────────────────
export const getAlerts = (params = {}) => api.get(`${ADMIN}/alerts`, { params })
export const resolveAlert = (id) => api.put(`${ADMIN}/alerts/${id}/resolve`)
export const dismissAlert = (id) => api.put(`${ADMIN}/alerts/${id}/dismiss`)
export const getAlertSummary = () => api.get(`${ADMIN}/alerts/summary`)
export const getAlertRules = () => api.get(`${ADMIN}/alerts/rules`)
export const updateAlertRule = (id, data) => api.put(`${ADMIN}/alerts/rules/${id}`, data)

// ─── Settings ─────────────────────────────────────────────────
export const getEngineConfig = () => api.get(`${ADMIN}/settings/engine`)
export const updateEngineConfig = (data) => api.put(`${ADMIN}/settings/engine`, data)
export const getModelInfo = () => api.get(`${ADMIN}/settings/model-info`)
export const backupDatabase = () => api.post(`${ADMIN}/settings/backup`)
export const rebuildEmbeddings = () => api.post(`${ADMIN}/settings/rebuild-embeddings`)
export const exportArchive = () =>
  api.get(`${ADMIN}/settings/export-archive`, { responseType: 'blob' })
export const resetTodayRecords = () => api.post(`${ADMIN}/settings/reset-today`)

// ─── ML (existing routes) ────────────────────────────────────
export const getMlHealth = () => api.get('/api/ml/health')
export const getEnrolledStudents = () => api.get('/api/v1/ml/enrolled-students')
export const getMlStatus = () => api.get('/api/v1/ml/status')
export const startMlService = () => api.post('/api/v1/ml/start')
export const stopMlService = () => api.post('/api/v1/ml/stop')
export const reloadEmbeddings = () => api.post('/api/v1/ml/reload-embeddings')

// ─── Timetable (existing routes) ─────────────────────────────
export const getTimetable = (params = {}) => api.get('/api/v1/timetablemodule/tt', { params })
export const getFaculty = (params = {}) => api.get('/api/v1/timetablemodule/faculty', { params })
export const getSubjects = (params = {}) => api.get('/api/v1/timetablemodule/subject', { params })
