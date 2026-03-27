# ICSS Admin Dashboard — Backend Integration Guide

Hello Backend Team! 👋 

This document explains what was built for the new Admin Dashboard and exactly what you need to do to connect it to the real database.

## What Was Done (Frontend)
1. **The UI is 100% Complete**: All 8 pages (Overview, Live Monitor, Camera Network, Students, Attendance, Analytics, Alerts, Settings) have been built and integrated into the main React app at `client/src/ml/dashboard`.
2. **Routing**: The dashboard is accessible at the `/ams/dashboard` route.
3. **API Service Layer**: The frontend is already wired up to fetch data from the backend using Axios (`client/src/ml/dashboard/services/dashboardApi.js`). 
4. **Fallback Data**: Right now, if the backend endpoints aren't ready, the frontend automatically displays "fallback" (fake) data so the UI doesn't break. **Once you implement the endpoints, the real data will automatically replace the fake data. You don't need to change any frontend code.**

## What You Need To Do (Backend)
I have created a complete backend module skeleton for you to fill in. 
Your **only job** is to write the MongoDB queries inside this file:
👉 `server/src/modules/adminDashboard/controllers/dashboardController.js`

### Step 1: Look at `dashboardController.js`
Inside `dashboardController.js`, you will find 30+ empty controller functions (e.g., `getOverviewStats`, `getStudents`, `getAlerts`). 

Every function has:
- A `TODO` comment explaining exactly what MongoDB query to write.
- A `res.json()` showing the exact JSON format the frontend expects.

### Step 2: Create Missing Mongoose Models
The dashboard relies on some data that might not exist in your current database yet. You will need to create Mongoose schemas for:
- `AttendanceRecord` (Stores each student's daily attendance from the face recognition engine)
- `Camera` (Stores camera details: id, location, rtsp stream url, status)
- `Alert` / `AlertRule` (Stores system warnings/errors)
- `SystemConfig` (Stores the ML engine settings like confidence threshold, anti-spoofing toggle)

*Note: The `Student` and `ClassTable` models are already imported and partially used in the controller.*

### Step 3: Implement the Endpoints
Replace the hardcoded dummy responses in `dashboardController.js` with your real database queries.
For example, in `getStudents()`:
```javascript
// Currently:
// res.json({ students: [ ...dummy data... ], pagination: ... })

// What you should write:
const students = await Student.find({ /* apply filters */ });
// (Optional: use aggregate to calculate their attendance percentage from the AttendanceRecord collection)
res.json({ students, pagination: { total: await Student.countDocuments(), page, limit } });
```

### Endpoints Overview:
- `GET /api/v1/admin/dashboard/overview` -> Daily stats
- `GET /api/v1/admin/dashboard/live-feed` -> Latest 20 face detections
- `GET /api/v1/admin/dashboard/students` -> Student registry + attendance %
- `GET /api/v1/admin/dashboard/attendance` -> Attendance logs with filters
- `GET /api/v1/admin/dashboard/analytics/trends` -> Graph data aggregated by date
- `GET /api/v1/admin/dashboard/alerts` -> Active system alerts

*All routes are already mounted in `server/src/routes.js`.*

Good luck! 🚀
