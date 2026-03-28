# ICSS Admin Dashboard - Developer & Backend Integration Guide

## 1. What Has Been Built (Frontend Overview)
A fully functional, premium Admin Dashboard has been seamlessly integrated into the college's main React repository. 

**Key Features Made:**
- **UI/UX:** A state-of-the-art "Integrated Campus Surveillance System" (ICSS) interface featuring modern dark-mode aesthetics, custom color tokens, glassmorphism layers, and the official NIT Jalandhar logo.
- **8 Core Pages:** 
  1. `Overview`: Real-time stats, camera feed previews, and today's schedule.
  2. `Live Monitor`: Configurable grid of 16 live feed boxes with ArcFace detection statuses.
  3. `Camera Network`: Registry of all cameras, mapped to buildings with live RTSP stream tracking.
  4. `Students`: Searchable registry of all enrolled students synced with the DB.
  5. `Attendance`: A master log of all detected face logs and class attendances.
  6. `Analytics`: Deep-dive graphs utilizing Recharts for attendance trends and defaulter risks.
  7. `Ground Generation`: A tool to extract faces from classroom video links, lock them to roll numbers, and save them for ML training.
  8. `Alerts & Settings`: System configuration panels for spoof-detection barriers, confidence thresholds, and system health.

## 2. What Has Been Changed (Architecture)
The dashboard was originally built as a standalone Vite application but has now been embedded directly into the main website infrastructure as requested by Professor Hari:

- **Moved Files:** All pages, reusable components (like `Sidebar.jsx`, `PageHeader.jsx`), and API fetchers (`useApi.jsx`) are now securely placed in `client/src/ml/dashboard/`.
- **CSS Isolation:** The dashboard's complex CSS (`index.css`) has been scoped explicitly to the `.icss-dashboard` wrapper. This guarantees that none of our custom dark-mode styling leaks out and breaks the rest of the college website!
- **Routing Setup:** Added to `client/src/App.jsx`. The dashboard now correctly runs natively at the `xceed.nitj.ac.in/ams/dashboard` route.
- **Assets:** The official NITJ image logo (`image.png`) was added to `client/src/ml/dashboard/assets/`.

---

## 3. How to Connect the Backend (Action Required for Backend Developers)

The frontend is **100% complete** and waiting for data. It currently uses a failsafe mechanism that displays "dummy data" because the backend endpoints are currently returning placeholders. 

### Your Mission
All frontend Dashboard pages make HTTP requests to exactly one unified location on the server. Your job is to fill in those controller functions with real MongoDB queries.

**The Magic File You Need to Edit:**
👉 `server/src/modules/adminDashboard/controllers/dashboardController.js`

### Step-by-Step Backend Guide:

1. **Open the Controller File:**
   Inside `dashboardController.js`, we have already defined 30+ empty endpoints for you (e.g., `getStudents`, `getOverviewStats`, `getCameras`).

2. **Understand the Contract:**
   Every single function in that file contains:
   - A `TODO` comment explaining exactly what Mongoose query you need to write.
   - A perfectly structured `res.json(...)` payload showing you the exact data shape the frontend React code is expecting.

3. **Database Schemas Needed:**
   You will need to ensure MongoDB holds this data. You may need to create or expand the following Mongoose models:
   - `Camera` (Needs fields: `id`, `name`, `building`, `status`, `rtspUrl`)
   - `Alert` (Needs fields: `severity`, `title`, `message`, `timestamp`)
   - `AttendanceRecord` (Needs fields for linking a recognized face log to a `Student` and a `ClassTable`)
   - `SystemConfig` (Needs fields to track settings like "ArcFace Confidence Threshold")

4. **Example of What to Change:**
   Open the `getStudents` function. You will see:
   ```javascript
   // What is currently there:
   exports.getStudents = async (req, res) => {
       // TODO: Replace with `await Student.find({ ... })`
       res.json({ students: [ { name: "Dummy", rollNo: "123" } ], pagination: { total: 1 } });
   }
   ```
   **What you must change it to:**
   ```javascript
   exports.getStudents = async (req, res) => {
       try {
           const students = await Student.find({}, 'name rollNo dept sem gender mailID');
           const count = await Student.countDocuments();
           res.json({ students, pagination: { total: count, page: 1, limit: 50 } });
       } catch(err) {
           res.status(500).json({ error: "Failed to fetch students" });
       }
   }
   ```

5. **API Routing is Already Handled!**
   You **do not** need to edit `server/src/routes.js`. We have already mounted your entire backend module securely at `/api/v1/admin/dashboard`. Just write the Mongoose queries in the controller, save the file, and the React frontend will instantly light up with real data!

**Good luck, Backend Team! 🚀**
