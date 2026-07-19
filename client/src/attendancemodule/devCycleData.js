// client/src/attendancemodule/devCycleData.js
// CURATED from `git log origin/main --since=2026-03-01 --no-merges`
// (generated 2026-07-19). Scoped to the Attendance Management System (IAMS)
// ONLY — changes to other XCEED modules (timetable, certificates, conference,
// review, guide, …) are deliberately excluded, as are internal refactors,
// merge fixes, package chores and reverts. Each item is a plain-language
// FEATURE description a non-developer can understand. Weekly buckets run
// Monday–Sunday, newest week first. Authors are the commit usernames.

const DEV_CYCLE = [
  {
    "week": "Jul 13 – Jul 19, 2026",
    "items": [
      { "author": "amit837-design", "subject": "Sidebar pages can be opened in a new tab from the attendance dashboard" },
      { "author": "CodewithMukal", "subject": "Live Preview opening in a new tab fixed" },
      { "author": "Javin Chutani", "subject": "Ground Truth Capture now loads its camera list from the camera registry" },
      { "author": "Gulshan-heap", "subject": "Hardcoded camera names removed — camera details come from the registry" },
      { "author": "guptakaran0720", "subject": "Automatic email alerts added for attendance notifications" }
    ]
  },
  {
    "week": "Jul 06 – Jul 12, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "ERP sync page with live status indication, a scheduler, and manual control of retry attempts and intervals" },
      { "author": "harimurugan1989", "subject": "ERP override tracking with background checks used to improve the recognition model" },
      { "author": "harimurugan1989", "subject": "RetinaFace face detector added with a frontend toggle; ONNX model status shown on the dashboard" },
      { "author": "guptakaran0720", "subject": "FAISS index now auto-generates; RetinaFace ONNX models integrated" },
      { "author": "Javin Chutani", "subject": "ML attendance writes secured with a service secret" },
      { "author": "harimurugan1989", "subject": "Automated testing pipeline added for the attendance module" },
      { "author": "amit837-design", "subject": "Extra-class and class-alteration scheduling with conflict detection and a replace flow" },
      { "author": "Gulshan-heap", "subject": "First-year subjects' branches are now detected automatically, with a new dynamic embedding generation dashboard" },
      { "author": "harimurugan1989", "subject": "ML service on the GPU server can now be restarted from the admin page" },
      { "author": "harimurugan1989", "subject": "FAISS and AdaFace models now run alongside the main model during attendance for side-by-side comparison" },
      { "author": "harimurugan1989", "subject": "FAISS recognition thresholds are adjustable from the ML Fine Tuning page" },
      { "author": "harimurugan1989", "subject": "FAISS model made stateless so it runs correctly on a separate GPU server" }
    ]
  },
  {
    "week": "Jun 29 – Jul 05, 2026",
    "items": [
      { "author": "Gulshan-heap", "subject": "Subject-to-department mapping added for ERP sync" },
      { "author": "guptakaran0720", "subject": "Each identified student's cropped face is now shown next to their ground-truth photo for easy comparison" },
      { "author": "harimurugan1989", "subject": "Weekly embedding progress summary email to coordinators/heads" },
      { "author": "harimurugan1989", "subject": "Role-based access tightened across all attendance pages" },
      { "author": "amit837-design", "subject": "New semester and subject lookup routes for ERP integration (dept+sem structured data, subject abbreviations)" },
      { "author": "harimurugan1989", "subject": "Daily/weekly HOD attendance summary emails improved" },
      { "author": "harimurugan1989", "subject": "Frontend and backend server consoles are now viewable inside the app" },
      { "author": "Gulshan-heap", "subject": "Session Setup page interface improved" },
      { "author": "harimurugan1989", "subject": "Model Analytics dashboard with accuracy and override graphs" },
      { "author": "CodewithMukal", "subject": "Possible proxy students (same student marked present in two rooms) are detected and flagged in attendance reports" },
      { "author": "guptakaran0720", "subject": "Saved reports view and status display improved" }
    ]
  },
  {
    "week": "Jun 22 – Jun 28, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "More varied (different-pose) photos are now chosen when building each student's face embeddings" },
      { "author": "harimurugan1989", "subject": "Recording, fine-tuning and threshold controls improved" },
      { "author": "guptakaran0720", "subject": "Live Report page for watching scheduled attendance sessions in real time" },
      { "author": "Gulshan-heap", "subject": "ML Fine Tuning dashboard with live threshold sync and review of rejected face samples" },
      { "author": "Javin Chutani", "subject": "Role-aware dashboard progress graphs backed by ERP department stats" },
      { "author": "Anmoldeep Kaur", "subject": "Saved frame snapshots are annotated with student roll numbers" },
      { "author": "amit837-design", "subject": "Attendance export subject-wise/semester-wise with CSV download and preview" },
      { "author": "harimurugan1989", "subject": "Help & Manual updated, with a Developers & Contributors page" },
      { "author": "CodewithMukal", "subject": "Recorded files can be previewed and streamed from the app" },
      { "author": "Anmoldeep Kaur", "subject": "RTSP recordings can be scheduled, managed and downloaded" },
      { "author": "CodewithMukal", "subject": "ML data folder storage size is visible from the dashboard" },
      { "author": "Gulshan-heap", "subject": "Age and gender are collected during attendance runs and validated against student records" },
      { "author": "amit837-design", "subject": "Email alerts can be routed per role with individual checkboxes" },
      { "author": "CodewithMukal", "subject": "Branch names are managed per degree, with degree deletion support" },
      { "author": "Gulshan-heap", "subject": "Department role isolation — each department sees only its own data and routes" },
      { "author": "Anmoldeep Kaur", "subject": "\"Search Institute Wise\" checkbox — ground-truth lookup can span all departments or stay within one" }
    ]
  },
  {
    "week": "Jun 15 – Jun 21, 2026",
    "items": [
      { "author": "amit837-design", "subject": "Email notification system introduced for attendance alerts" },
      { "author": "CodewithMukal", "subject": "Batch management screens — batch year, degree and branches" },
      { "author": "Samiksha Khaire", "subject": "Attendance run page auto-fetches acquisition settings and slot labels" },
      { "author": "Anmoldeep Kaur", "subject": "Department menu visibility is configurable per role (Dept Menu Config)" },
      { "author": "guptakaran0720", "subject": "ERP upload page improvements" },
      { "author": "guptakaran0720", "subject": "Automatic face clustering after each attendance session" },
      { "author": "guptakaran0720", "subject": "Detected face crops are shown with their confidence levels" },
      { "author": "harimurugan1989", "subject": "RTSP capture, embeddings and attendance made stateless — ML service runs on a separate server" },
      { "author": "Gulshan-heap", "subject": "Old frame snapshots are cleaned up automatically, keeping the 2 best shots per period" },
      { "author": "amit837-design", "subject": "Confidence Monitor improvements — dropdown filters, semester grouping, confidence-band split" },
      { "author": "Anmoldeep Kaur", "subject": "ERP photo summary updates automatically when photos are added, deleted or renamed" },
      { "author": "guptakaran0720", "subject": "Service health monitoring with alerts and improved health indicators" },
      { "author": "Anmoldeep Kaur", "subject": "Subject embeddings update automatically when a student's ground-truth images change" },
      { "author": "Pallvi Saini", "subject": "Roll assignment sped up using ERP photo embeddings; unmatched clusters shown on the assignment page" },
      { "author": "amit837-design", "subject": "Per-student confidence drift monitor — spot students whose recognition quality is degrading" },
      { "author": "Javin Chutani", "subject": "GPU metrics monitor with ML service status visibility" },
      { "author": "guptakaran0720", "subject": "Unknown (unrecognized) faces are captured and handled for review" },
      { "author": "Gulshan-heap", "subject": "Active learning — best session crops saved as backup photos per student (capped, pose-diverse)" }
    ]
  },
  {
    "week": "Jun 08 – Jun 14, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "User manual added for the attendance system (IAMS)" },
      { "author": "Gulshan-heap", "subject": "Rooms are fetched automatically from active session allotments with cascading filters" },
      { "author": "harimurugan1989", "subject": "Feature pages rearranged; embeddings page frontend improved" },
      { "author": "guptakaran0720", "subject": "ERP photo upload improvements (degree suffixes preserved)" },
      { "author": "Gulshan-heap", "subject": "Session Setup redesigned as compact chronological monthly cards" },
      { "author": "amit837-design", "subject": "Camera preview in the sidebar, room selector, and dual auto-start camera feeds" },
      { "author": "Javin Chutani", "subject": "Users can optionally be assigned to a department" },
      { "author": "Javin Chutani", "subject": "Faculty-scoped department admin access" },
      { "author": "guptakaran0720", "subject": "ERP photos generate embeddings automatically" },
      { "author": "Anmoldeep Kaur", "subject": "Excel (.xlsx) upload option for roll numbers on the embeddings page" },
      { "author": "Javin Chutani", "subject": "Frame Verification module — review class frames against attendance" },
      { "author": "Samiksha Khaire", "subject": "Acquisition Control page added" },
      { "author": "harimurugan1989", "subject": "Ground-truth acquisition with room selection; multiple rooms can acquire simultaneously" },
      { "author": "Anmoldeep Kaur", "subject": "Embeddings page improvements; past generation history fixed" }
    ]
  },
  {
    "week": "Jun 01 – Jun 07, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "Photo edit page updated; roll assignment page improved" },
      { "author": "harimurugan1989", "subject": "Frame snapshots stored under the shared ml-data folder" }
    ]
  },
  {
    "week": "May 18 – May 24, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "Video-file-based ground truth acquisition removed — live RTSP capture is the single path" },
      { "author": "harimurugan1989", "subject": "Captured images save on the server instead of the local machine" },
      { "author": "harimurugan1989", "subject": "Room view fixed" }
    ]
  },
  {
    "week": "May 11 – May 17, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "Ground truth and attendance pipelines made stateless — the ML service can run on a different machine" }
    ]
  },
  {
    "week": "May 04 – May 10, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "Ground truth handling updated" }
    ]
  },
  {
    "week": "Apr 27 – May 03, 2026",
    "items": [
      { "author": "Samiksha Khaire", "subject": "Dashboard links all pages together with camera preview" },
      { "author": "harimurugan1989", "subject": "Attendance report improvements" }
    ]
  },
  {
    "week": "Apr 20 – Apr 26, 2026",
    "items": [
      { "author": "Javin Chutani", "subject": "Cameras show live online/offline status with automatic probing" },
      { "author": "Anmoldeep Kaur", "subject": "Direct embedding-file (.pkl) upload with missed roll number tracking" },
      { "author": "Samiksha Khaire", "subject": "Camera RTSP addresses auto-fetched from the camera registry" },
      { "author": "Anmoldeep Kaur", "subject": "Frontend page for embedding generation; embeddings load from cache for speed" },
      { "author": "Samiksha Khaire", "subject": "Attendance reports merge consistently with embedding generation" }
    ]
  },
  {
    "week": "Apr 13 – Apr 19, 2026",
    "items": [
      { "author": "Javin Chutani", "subject": "Camera registry — add cameras and view live feeds" },
      { "author": "Anmoldeep Kaur", "subject": "Reports from camera 1 and camera 2 merge into one attendance report" },
      { "author": "Samiksha Khaire", "subject": "Automatic switching between two cameras during capture" },
      { "author": "Anmoldeep Kaur", "subject": "Embedding file names and roll number lists stored in the database" },
      { "author": "Samiksha Khaire", "subject": "Multiple sessions in one slot combine into a single attendance report" },
      { "author": "harimurugan1989", "subject": "Clearer folder naming for clustered student faces" }
    ]
  },
  {
    "week": "Apr 06 – Apr 12, 2026",
    "items": [
      { "author": "Samiksha Khaire", "subject": "Automated attendance with a scheduler — runs start themselves on the timetable" },
      { "author": "Anmoldeep Kaur", "subject": "Captured face image quality improved" },
      { "author": "harimurugan1989", "subject": "Face clustering quality improvements" },
      { "author": "Pallvi Saini", "subject": "Roll assignment flag logic corrected; recognition model improved" },
      { "author": "Samiksha Khaire", "subject": "Attendance preview and reports based on the class roll-number list" },
      { "author": "harimurugan1989", "subject": "Detected faces are saved and segregated per student automatically" }
    ]
  },
  {
    "week": "Mar 30 – Apr 05, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "ERP photo matching with match-quality categories" },
      { "author": "harimurugan1989", "subject": "Ground-truth capture improved with continuous face cropping from the stream" },
      { "author": "harimurugan1989", "subject": "Attendance pages rebuilt on a faster React interface" },
      { "author": "harimurugan1989", "subject": "ML data folders reorganised; ERP photos updated" }
    ]
  },
  {
    "week": "Mar 23 – Mar 29, 2026",
    "items": [
      { "author": "harimurugan1989", "subject": "ERP functionalities added — student photos linked from the ERP" },
      { "author": "harimurugan1989", "subject": "Roll number assignment workflow completed" },
      { "author": "harimurugan1989", "subject": "Ground-truth capture workflow completed" },
      { "author": "Claude", "subject": "Critical and high security vulnerabilities fixed" },
      { "author": "Samiksha Khaire", "subject": "Per-student folder generation and model testing" }
    ]
  },
  {
    "week": "Mar 16 – Mar 22, 2026",
    "items": [
      { "author": "Pallvi Saini", "subject": "Facial recognition ML module added to the project" },
      { "author": "Samiksha Khaire", "subject": "Python ML service created with a public-dataset testing pipeline" }
    ]
  }
];

export default DEV_CYCLE;
