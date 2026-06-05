const Guide = require("../../../models/guide");

// ─── Default Tab Content ────────────────────────────────────────────────────

const TAB_SETUP = `<h2>Server Startup Guide</h2>

<h3>Overview</h3>
<p>This project has <strong>three servers</strong> that must all be running at the same time. Each one runs in its own terminal window.</p>
<table>
  <thead><tr><th>Service</th><th>Technology</th><th>Port</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>Client</td><td>React / Vite</td><td>5173</td><td>Frontend UI</td></tr>
    <tr><td>Server</td><td>Node.js / Express</td><td>8010</td><td>API, database, auth</td></tr>
    <tr><td>Python ML Service</td><td>FastAPI / uvicorn</td><td>8000</td><td>Face recognition AI</td></tr>
  </tbody>
</table>

<h3>Environment File (.env)</h3>
<p>The <code>.env</code> file is only needed by the <strong>Node.js server</strong>. Place it at exactly this path:</p>
<pre><code>AMS-with-TimeTable/server/.env</code></pre>
<p>Required variables:</p>
<pre><code>MONGO_URL='mongodb+srv://&lt;user&gt;:&lt;password&gt;@cluster.mongodb.net/'
MAIL_USER=noreplytestxceed@gmail.com
MAIL_PASS=&lt;your-gmail-app-password&gt;
MAIL_HOST='smtp.gmail.com'
MAIL_PORT=587
JWT_SECRET=&lt;your-random-secret-key&gt;

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=&lt;your-cloud-name&gt;
CLOUDINARY_API_KEY=&lt;your-api-key&gt;
CLOUDINARY_API_SECRET=&lt;your-api-secret&gt;</code></pre>

<h3>1 — Client (React / Vite)</h3>
<p><strong>Directory:</strong> <code>AMS-with-TimeTable/client/</code></p>
<pre><code>cd client
yarn              # install dependencies (only needed once, or after package changes)
yarn dev          # starts on http://localhost:5173</code></pre>

<h3>2 — Server (Node.js / Express)</h3>
<p><strong>Directory:</strong> <code>AMS-with-TimeTable/server/</code></p>
<pre><code>cd server
yarn              # install dependencies
yarn dev          # development — auto-restarts on file changes (nodemon)
yarn start        # production — plain node</code></pre>

<h3>3 — Python ML Service (FastAPI)</h3>
<p><strong>Directory:</strong> <code>AMS-with-TimeTable/python-ml-service/</code></p>
<p><strong>Windows:</strong></p>
<pre><code>cd python-ml-service
python -m venv venv          # only needed once
venv\\Scripts\\activate
pip install -r requirements.txt
python ml_service.py         # starts on http://localhost:8000</code></pre>
<p><strong>macOS / Linux:</strong></p>
<pre><code>cd python-ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python ml_service.py</code></pre>
<p>The ML service loads the InsightFace model on startup — allow 10–30 seconds before it is ready.</p>

<h3>Quick Start Cheat Sheet (3 terminals)</h3>
<table>
  <thead><tr><th>Terminal</th><th>Commands</th></tr></thead>
  <tbody>
    <tr><td>1 — Client</td><td><code>cd client &amp;&amp; yarn &amp;&amp; yarn dev</code></td></tr>
    <tr><td>2 — Server</td><td><code>cd server &amp;&amp; yarn &amp;&amp; yarn dev</code></td></tr>
    <tr><td>3 — Python ML</td><td><code>cd python-ml-service → activate venv → pip install -r requirements.txt → python ml_service.py</code></td></tr>
  </tbody>
</table>`;

const TAB_ATTENDANCE = `<h2>Facial Recognition Attendance System</h2>
<p>A real-time, camera-based attendance system. It reads live RTSP video from classroom IP cameras, detects faces using <strong>InsightFace buffalo_l</strong>, compares them against pre-built face embeddings for each student, and records attendance in MongoDB. The system integrates with the timetable module to auto-resolve which class is running in a given room at a given time.</p>

<h3>The 5-Phase Workflow</h3>
<p>Attendance capture is a one-time setup (phases 1–3) followed by daily capture (phase 4).</p>

<h4>Phase 1 — Ground Truth Acquisition</h4>
<p>Before the system can recognise anyone, it must collect face photos for every enrolled student. An administrator points an RTSP camera at a classroom and captures faces from the stream.</p>
<ul>
  <li>Page: <code>/attendance/groundtruth/rtsp</code></li>
  <li>Select a batch name (e.g. <code>BTECH_CSE_2023</code>) and enter the camera's RTSP URL</li>
  <li>The Python ML service reads frames, detects faces using multi-zoom detection (see below), crops and saves each face image</li>
  <li>Faces are written to disk at <code>server/ml-data/ground_truth/{batch}/person_XXX/face_001.jpg</code></li>
  <li>A <code>_info.json</code> file per student tracks which photos are approved for embedding generation</li>
</ul>

<h4>Phase 2 — Cluster-to-Roll Assignment</h4>
<p>Each detected face cluster is initially named <code>person_001</code>, <code>person_002</code>, etc. This phase matches those anonymous clusters to actual student roll numbers.</p>
<ul>
  <li>Page: <code>/attendance/groundtruth/assign</code></li>
  <li>Click "Auto-Match": the Python service compares each cluster's embedding against ERP student photos</li>
  <li>Top-K matching candidates are shown in the UI; an operator approves or flags each one</li>
  <li>On finalisation, folders are renamed from <code>person_XXX</code> → <code>CSE001</code> (actual roll number)</li>
  <li>Match decisions are persisted to the <code>ClusterMatch</code> MongoDB collection for audit purposes</li>
</ul>

<h4>Phase 3 — Embedding Generation</h4>
<p>Approved ground-truth photos are processed into a compact face-database file (<code>.pkl</code>) that the Python ML service loads into memory for instant lookup.</p>
<ul>
  <li>Page: <code>/attendance/embeddings</code></li>
  <li>Select a semester and subject — the system auto-fetches enrolled students from the timetable database</li>
  <li>For each student: load approved photos → extract 512-dimensional face vectors via InsightFace → compute mean vector</li>
  <li>All vectors bundled into one file named <code>{sem}_{subject}.pkl</code> (e.g. <code>6_Digital_Electronics.pkl</code>)</li>
  <li>File is immediately reloaded into Python ML service memory via <code>/reload-embeddings</code></li>
</ul>

<h4>Phase 4 — Live Attendance Capture</h4>
<p>With embeddings loaded, the system takes attendance from a live classroom camera in real time.</p>
<ul>
  <li>Page: <code>/attendance/reports</code></li>
  <li>Enter a room number — the server auto-looks up the currently scheduled class from the LockSem timetable (batch, subject, faculty are all resolved automatically)</li>
  <li>Provide the RTSP URL, or pick the camera from the registry (pre-registered cameras auto-fill the URL by room)</li>
  <li>Python ML service reads frames, detects faces, and computes <strong>cosine similarity</strong> against every student embedding in the loaded <code>.pkl</code></li>
  <li>Each student gets a confidence score → mapped to a status (see Confidence Thresholds below)</li>
  <li>Report is saved to the <code>AttendanceReport</code> MongoDB collection with per-student breakdown, summary stats, and a <code>finalisedStatus</code> per student</li>
</ul>

<h4>Phase 5 — Review and Finalisation</h4>
<ul>
  <li>Students marked <strong>Review</strong> require an operator check before the report is finalised</li>
  <li>Operators can override any individual student's status from the reports page</li>
  <li>Incorrectly matched face clusters can be re-assigned at <code>/attendance/groundtruth/flagged</code></li>
  <li>Once approved, report status changes from <code>draft</code> → <code>finalized</code></li>
</ul>

<h3>Technology Stack</h3>
<table>
  <thead><tr><th>Layer</th><th>Technology</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>Face Model</td><td>InsightFace buffalo_l</td><td>Face detection + 512-d embedding extraction</td></tr>
    <tr><td>ML Service</td><td>Python / FastAPI / uvicorn</td><td>Frame processing, RTSP reading, embedding matching</td></tr>
    <tr><td>Backend</td><td>Node.js / Express</td><td>API, MongoDB persistence, SSE proxying, timetable lookup</td></tr>
    <tr><td>Database</td><td>MongoDB / Mongoose</td><td>Attendance reports, cluster matches, camera registry</td></tr>
    <tr><td>Frontend</td><td>React / Vite / Tailwind + Chakra</td><td>Dashboard, live progress, operator review UI</td></tr>
    <tr><td>Camera input</td><td>RTSP streams (IP cameras)</td><td>Live video feed from classroom cameras</td></tr>
  </tbody>
</table>

<h3>Face Detection — Multi-Zoom Strategy</h3>
<p>Standard face detection fails in classrooms because students in the back rows appear very small in the frame. The system uses a custom multi-zoom, multi-pass strategy implemented in <code>clustering_service.py</code>:</p>
<ul>
  <li><strong>7 zoom levels:</strong> 1× (full frame, front row visible) → 7× (tight crop of back rows)</li>
  <li>Each zoom level tiles the frame at multiple focal centers (left, center, right, top-left, etc.)</li>
  <li><strong>CLAHE contrast enhancement</strong> is applied per tile to handle uneven classroom lighting</li>
  <li>A UI mask blacks out timestamp/logo overlays on the camera feed before detection</li>
  <li><strong>NMS</strong> (Non-Maximum Suppression at 0.35 IoU) deduplicates overlapping bounding boxes across zoom levels</li>
  <li>Quality filters: minimum Laplacian sharpness, face size ≥ 5px in zoomed frame, eye distance &gt; 20px, detection score &gt; 0.60</li>
</ul>

<h3>Confidence Thresholds</h3>
<p>Cosine similarity between a detected face embedding and a stored student embedding determines attendance status:</p>
<table>
  <thead><tr><th>Zone</th><th>Cosine Similarity</th><th>Status</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>High</td><td>≥ 0.60</td><td>PRESENT</td><td>Marked automatically</td></tr>
    <tr><td>Medium</td><td>0.40 – 0.60</td><td>REVIEW</td><td>Operator must confirm</td></tr>
    <tr><td>Low</td><td>&lt; 0.40</td><td>ABSENT</td><td>Marked automatically</td></tr>
  </tbody>
</table>
<p>For dual-camera setups (large halls), the system runs two cameras and merges results: if a student is Present in any camera run, the final status is Present.</p>

<h3>Frontend Pages</h3>
<p>All attendance pages are wrapped in <code>AMSLayout.jsx</code> which provides the sidebar navigation. The layout is mounted under the <code>/attendance</code> route in <code>App.jsx</code>.</p>
<table>
  <thead><tr><th>React Route</th><th>File</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>/attendance</td><td>AMSDashboard.jsx</td><td>Hub with 6 module cards and live stats (camera count, embedding count, etc.)</td></tr>
    <tr><td>/attendance/groundtruth/rtsp</td><td>groundtruthgen_rtsp.jsx</td><td>Capture ground truth face photos from an RTSP stream. Select batch, enter URL, choose duration, then stream starts and face crops are saved to disk in real time via SSE.</td></tr>
    <tr><td>/attendance/groundtruth/assign</td><td>rollassign.jsx</td><td>Match anonymous person_XXX clusters to student roll numbers. Shows ERP candidate thumbnails. Operator approves/flags each match.</td></tr>
    <tr><td>/attendance/groundtruth/flagged</td><td>flaggedassign.jsx</td><td>Review previously flagged face-cluster assignments and re-assign them to the correct roll number.</td></tr>
    <tr><td>/attendance/groundtruth/photos</td><td>photoedit.jsx</td><td>Browse the ground truth photo library by batch and student. Delete bad photos.</td></tr>
    <tr><td>/attendance/embeddings</td><td>EmbeddingGeneration.jsx</td><td>Three tabs: (1) Generate embeddings by selecting dept + sem + subject — shows per-student progress via SSE. (2) Upload a pre-built .pkl directly. (3) View embedding history.</td></tr>
    <tr><td>/attendance/reports</td><td>AttendanceReport.jsx</td><td>Main attendance-taking page. Enter room → auto-fills class info from timetable. Click Run Attendance → live SSE stream shows per-frame stats. Operator can override individual students and finalise the report.</td></tr>
    <tr><td>/attendance/model</td><td>modelperformance.jsx</td><td>Display model stats: enrolled student count, detection thresholds, .pkl file details.</td></tr>
    <tr><td>/cameras</td><td>camera.jsx</td><td>Register and manage classroom IP cameras. Each camera entry stores room ID, RTSP URL, position (front-left / front-right), and health status.</td></tr>
    <tr><td>/camera/preview</td><td>cameraPreview.jsx</td><td>Live MJPEG preview of a registered camera stream, proxied through the Node.js backend.</td></tr>
  </tbody>
</table>

<h3>Backend API Routes</h3>
<p>All routes are under the Express router registered at <code>/api/v1/attendancemodule</code> (see <code>server/src/routes.js</code>).</p>

<h4>Ground Truth — <code>/ground-truth</code></h4>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>GET</td><td>/batches</td><td>List all batch folders from the ground_truth directory</td></tr>
    <tr><td>POST</td><td>/create-batch</td><td>Create a new batch folder (sanitises dept name)</td></tr>
    <tr><td>GET</td><td>/batches/:batch/students</td><td>List students in a batch with photo counts per category</td></tr>
    <tr><td>POST</td><td>/extract-rtsp-stream</td><td>SSE: Connect to RTSP, detect faces, stream crop_save events to client; Node intercepts and writes files to disk</td></tr>
    <tr><td>POST</td><td>/stop-rtsp-stream</td><td>Stop an in-progress RTSP capture</td></tr>
    <tr><td>GET</td><td>/rtsp-preview</td><td>Proxy MJPEG live preview stream from Python service</td></tr>
    <tr><td>GET</td><td>/student-ground-truth/:batch/:rollNo</td><td>Get student's photos split by category (embedding_files, backup_files)</td></tr>
    <tr><td>POST</td><td>/update-embedding</td><td>Rebuild a student's embedding from a selected subset of photos</td></tr>
    <tr><td>POST</td><td>/approve-photos</td><td>Mark newly captured photos as approved for the embedding set</td></tr>
    <tr><td>DELETE</td><td>/student/:batch/:rollNo</td><td>Delete an entire student folder (use with care)</td></tr>
    <tr><td>DELETE</td><td>/photo/:batch/:rollNo/:filename</td><td>Delete a single photo file</td></tr>
  </tbody>
</table>

<h4>Roll Assignment — <code>/roll-assign</code></h4>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>GET</td><td>/clusters/:batch</td><td>List unmatched person_XXX cluster folders</td></tr>
    <tr><td>GET</td><td>/all-clusters/:batch</td><td>List ALL clusters including already-matched ones</td></tr>
    <tr><td>POST</td><td>/auto-match/:batch</td><td>SSE: For each cluster, call Python to rank ERP candidates by embedding similarity. Streams match_result events.</td></tr>
    <tr><td>POST</td><td>/save-match-result</td><td>Persist one match decision (called during SSE stream)</td></tr>
    <tr><td>POST</td><td>/auto-assign-all</td><td>Finalise all approved matches — renames folders from person_XXX to rollNo, saves ClusterMatch records to DB</td></tr>
    <tr><td>GET</td><td>/matches/:batch</td><td>Retrieve all ClusterMatch records for a batch</td></tr>
    <tr><td>POST</td><td>/approve</td><td>Operator approves a single match</td></tr>
    <tr><td>POST</td><td>/flag</td><td>Flag a match as incorrect for later review</td></tr>
    <tr><td>GET</td><td>/flagged/:batch</td><td>List all flagged matches awaiting resolution</td></tr>
    <tr><td>POST</td><td>/resolve-flag</td><td>Resolve a flagged match by supplying the correct roll number</td></tr>
  </tbody>
</table>

<h4>Embeddings — <code>/embeddings</code></h4>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>GET</td><td>/enrolled-roll-nos/:sem/:dept</td><td>Fetch enrolled students for a semester + department from the timetable Student collection</td></tr>
    <tr><td>GET</td><td>/resolve-file/:sem/:subject</td><td>Show which .pkl file would be generated/overwritten for this subject</td></tr>
    <tr><td>POST</td><td>/generate</td><td>SSE: For each student load ground truth photos, call Python /update-student-embedding, then call /build-embeddings-sync to write the .pkl, then reload into ML memory</td></tr>
    <tr><td>GET</td><td>/list-files</td><td>List all .pkl files on disk with metadata from StudentEmbedding collection</td></tr>
    <tr><td>POST</td><td>/upload-pkl</td><td>Upload a pre-built .pkl file directly (bypasses photo pipeline)</td></tr>
    <tr><td>DELETE</td><td>/:id</td><td>Delete a StudentEmbedding record</td></tr>
  </tbody>
</table>

<h4>ML Service Control — <code>/api/v1/ml</code></h4>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>POST</td><td>/run-attendance-rtsp</td><td>SSE: Full attendance run from RTSP. Auto-resolves batch/subject/faculty from LockSem by room+slot+date. Saves report to DB on completion.</td></tr>
    <tr><td>POST</td><td>/build-embeddings</td><td>SSE: Build .pkl embedding database from ground truth photos</td></tr>
    <tr><td>POST</td><td>/reload-embeddings</td><td>Force Python service to reload .pkl into memory</td></tr>
    <tr><td>GET</td><td>/enrolled-students</td><td>List students currently loaded in ML service memory</td></tr>
    <tr><td>GET</td><td>/health</td><td>Check if Python ML service is alive and model is loaded</td></tr>
    <tr><td>POST</td><td>/start</td><td>Start the Python ML service subprocess</td></tr>
    <tr><td>POST</td><td>/stop</td><td>Stop the Python ML service subprocess</td></tr>
    <tr><td>POST</td><td>/restart</td><td>Restart the Python ML service</td></tr>
    <tr><td>GET</td><td>/attendance-daily-data</td><td>List saved daily attendance JSON files</td></tr>
    <tr><td>GET</td><td>/rtsp-frame-preview</td><td>Proxy MJPEG stream from Python for live camera preview</td></tr>
  </tbody>
</table>

<h4>Attendance Reports — <code>/reports</code></h4>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>POST</td><td>/save</td><td>Save or update an attendance report after an ML run completes</td></tr>
    <tr><td>GET</td><td>/</td><td>List reports — supports filters: batch, date, faculty, subject, status</td></tr>
    <tr><td>GET</td><td>/by-date/:batch/:date</td><td>All reports for a batch on a given date</td></tr>
    <tr><td>GET</td><td>/student/:batch/:rollNo</td><td>Full attendance history for one student across all sessions</td></tr>
    <tr><td>POST</td><td>/:id/finalize</td><td>Mark report as finalized (locks it from further edits)</td></tr>
    <tr><td>PATCH</td><td>/:id/student/:rollNo</td><td>Manually override one student's attendance status</td></tr>
    <tr><td>DELETE</td><td>/:id</td><td>Delete a draft report</td></tr>
    <tr><td>GET</td><td>/lookup-context</td><td>Auto-lookup batch, subject, faculty from ?room=X&amp;slot=Y&amp;date=Z (integrates with timetable LockSem)</td></tr>
    <tr><td>POST</td><td>/start-session</td><td>Start a multi-run session (polls timetable every 5 min, auto-runs attendance for each class)</td></tr>
  </tbody>
</table>

<h4>Camera Registry — <code>/cameras</code></h4>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>POST</td><td>/</td><td>Register a new camera (stores RTSP URL, room ID, position, etc.)</td></tr>
    <tr><td>GET</td><td>/</td><td>List all cameras; supports ?roomId=X filter</td></tr>
    <tr><td>PATCH</td><td>/:id</td><td>Update camera details or stream URL</td></tr>
    <tr><td>DELETE</td><td>/:id</td><td>Remove a camera from the registry</td></tr>
    <tr><td>PATCH</td><td>/:id/health</td><td>Update camera health status (online/offline/maintenance)</td></tr>
    <tr><td>GET</td><td>/preview/stream</td><td>Proxy live MJPEG preview from the Python service</td></tr>
  </tbody>
</table>

<h3>Python ML Service Files</h3>
<p>All files are in <code>python-ml-service/</code>. Start with <code>python ml_service.py</code>.</p>
<table>
  <thead><tr><th>File</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>ml_service.py</td><td>FastAPI app entry point. Loads InsightFace model and embeddings_db.pkl on startup. Registers all route modules.</td></tr>
    <tr><td>clustering_service.py</td><td>Core face detection. Implements multi-zoom tiling, CLAHE enhancement, NMS deduplication, and quality filtering.</td></tr>
    <tr><td>rtsp_routes.py</td><td>Two main SSE endpoints: (1) extract_rtsp_stream — ground truth photo capture. (2) run_attendance_rtsp — live attendance with dual-camera support.</td></tr>
    <tr><td>ground_truth_routes.py</td><td>Routes for managing ground truth photos: extract, preview, approve, delete.</td></tr>
    <tr><td>clustering_routes.py</td><td>Cluster-to-ERP matching: compare cluster embeddings to ERP student photos and return ranked candidates.</td></tr>
    <tr><td>build_embeddings_db.py</td><td>Build a .pkl embedding database from a ground_truth folder: load approved photos per student, extract mean embedding, save dict.</td></tr>
    <tr><td>video_processing.py</td><td>Process pre-recorded video files for attendance (alternative to live RTSP).</td></tr>
    <tr><td>face_utils.py</td><td>Shared utilities: cosine similarity, face crop + resize, CLAHE contrast enhancement.</td></tr>
    <tr><td>state.py</td><td>Global in-memory state: face_app (InsightFace), embeddings_db dict, current_det_size.</td></tr>
    <tr><td>models.py</td><td>Pydantic request/response schemas for all FastAPI endpoints.</td></tr>
  </tbody>
</table>

<h3>MongoDB Data Models</h3>

<h4>AttendanceReport</h4>
<pre><code>{
  batch, department, semester, subject, faculty,
  room, date, timeSlot, locksemId,
  slotResults: [{ slot, students: [{ rollNo, status, avgConfidence, finalStatus }], summary }],
  finalReport:  [{ rollNo, finalStatus: "P" | "A" | "R" }],
  summary: { present, absent, review, attendancePct },
  status: "draft" | "finalized" | "live"
}</code></pre>

<h4>ClusterMatch</h4>
<pre><code>{
  batch,
  folderName,      // "person_001" — immutable, original cluster name
  currentFolder,   // "CSE001" — after roll assignment rename
  rollNo, status, approved,
  candidates: [{ rollNo, confidence, erpPhoto }],   // top-K ERP candidates
  imageFiles, embeddingFiles, imageCount
}</code></pre>

<h4>StudentEmbedding</h4>
<pre><code>{
  sem, dept, subject, subjectCode,
  embeddingFile,       // e.g. "6_Digital_Electronics.pkl"
  rollNos: [],         // students included in this .pkl
  missedRollNos: [{ rollNo, reason }],
  status: "pending" | "done" | "failed",
  studentsTotal, studentsSuccess, studentsFailed
}</code></pre>

<h4>Camera</h4>
<pre><code>{
  cameraId, roomId, building,
  position: "front-left" | "front-right",
  streamUrl,        // RTSP URL
  ipAddress, port, fps,
  resolution: { width, height },
  status: "online" | "offline" | "maintenance"
}</code></pre>

<h3>Disk Directory Structure</h3>
<pre><code>server/ml-data/
├── ground_truth/
│   └── BTECH_CSE_2023/
│       ├── person_001/          &lt;-- before roll assignment
│       │   ├── face_001.jpg
│       │   └── _info.json
│       └── CSE001/              &lt;-- after roll assignment (renamed)
│           ├── face_001.jpg
│           └── _info.json
├── embeddings/
│   └── 6_Digital_Electronics.pkl   &lt;-- { rollNo: 512-d vector }
└── erp_photos/
    ├── CSE/                     &lt;-- department folder
    │   ├── CSE001.jpg           &lt;-- roll number as filename
    │   └── CSE002.jpg
    ├── ECE/
    │   └── ECE001.jpg
    └── ...                      &lt;-- one sub-folder per department</code></pre>

<h3>SSE Streaming Pattern</h3>
<p>All long-running operations (ground truth capture, embedding generation, attendance run, cluster matching) use Server-Sent Events so the user sees live progress without polling.</p>
<ol>
  <li>Frontend opens an <code>EventSource</code> connection to the Node.js endpoint</li>
  <li>Node.js calls the Python ML service with axios and streams the response body</li>
  <li>Python emits SSE lines: <code>data: {"type":"progress","payload":{...}}\n\n</code></li>
  <li>Node.js intercepts file-system events (<code>mkdir</code>, <code>crop_save</code>) and writes files to disk; all other events are proxied to the frontend unchanged</li>
  <li>Frontend parses each event, updates progress bar, per-student status rows, and debug output in real time</li>
  <li>On the final <code>done</code> event, Node.js saves the result to MongoDB and closes the stream</li>
</ol>

<h3>LockSem Auto-Lookup</h3>
<p>When running attendance from the Reports page, the operator only needs to enter the room number. The system auto-resolves the class context by:</p>
<ol>
  <li>Querying <code>LockSem</code> for the given room + current time slot + today's date</li>
  <li>Extracting semester, subject, and faculty from the matched timetable slot</li>
  <li>Deriving the batch: degree + dept + year (computed from semester number)</li>
  <li>Loading the correct <code>{sem}_{subject}.pkl</code> embedding file into ML memory</li>
</ol>
<p>If no LockSem match is found, the operator enters the context manually.</p>`;

const TAB_RTSP = `<h2>Local RTSP Stream from Video File</h2>
<p>During development you won't always have a live IP camera available. You can simulate one by serving a local video file as an RTSP stream using <strong>FFmpeg</strong> and a lightweight RTSP server (<strong>MediaMTX</strong>). The rest of the system — ground truth capture, attendance run, camera preview — behaves identically to a real camera.</p>

<h3>Prerequisites</h3>
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Download</th></tr></thead>
  <tbody>
    <tr><td><strong>FFmpeg</strong></td><td>Reads the video file and pushes it to the RTSP server</td><td>ffmpeg.org/download.html</td></tr>
    <tr><td><strong>MediaMTX</strong></td><td>Lightweight RTSP server that listens on port 8554</td><td>github.com/bluenviron/mediamtx/releases</td></tr>
  </tbody>
</table>
<p>After downloading MediaMTX, just run the executable — no configuration needed. It starts an RTSP server on <code>rtsp://127.0.0.1:8554/</code> by default.</p>

<h3>Step 1 — Start MediaMTX</h3>
<p>Open a terminal and run the MediaMTX binary:</p>
<pre><code># Windows
mediamtx.exe

# macOS / Linux
./mediamtx</code></pre>
<p>You should see output like <code>INF [RTSP] listener opened on :8554</code>. Leave this terminal running.</p>

<h3>Step 2 — Push the Video File as RTSP</h3>
<p>Open a second terminal and run this FFmpeg command, replacing the video path with your own file:</p>
<pre><code>ffmpeg -re -stream_loop -1 -i "C:\\Users\\harim\\Videos\\RecForth\\20260402101435.mp4" -c copy -rtsp_transport tcp -pkt_size 1200 -f rtsp rtsp://127.0.0.1:8554/live</code></pre>
<p>The stream is now live at <code>rtsp://127.0.0.1:8554/live</code> and will loop the video indefinitely until you press <kbd>Ctrl+C</kbd>.</p>

<h3>Command Parameter Reference</h3>
<table>
  <thead><tr><th>Flag</th><th>Value</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><code>-re</code></td><td>—</td><td>Read input at its native frame rate (real-time). Without this FFmpeg sends all frames instantly instead of simulating live video.</td></tr>
    <tr><td><code>-stream_loop -1</code></td><td><code>-1</code> = infinite</td><td>Loop the video file forever so the stream never ends. Change to <code>0</code> to play once only.</td></tr>
    <tr><td><code>-i</code></td><td>path to video</td><td>Input file. Supports .mp4, .avi, .mkv, or any format FFmpeg can read.</td></tr>
    <tr><td><code>-c copy</code></td><td>—</td><td>Stream copy — no re-encoding. Passes video and audio codec data through unchanged. Fast and CPU-friendly.</td></tr>
    <tr><td><code>-rtsp_transport tcp</code></td><td><code>tcp</code></td><td>Use TCP instead of UDP for transport. More reliable on a local network; matches the flag used in the Python ML service.</td></tr>
    <tr><td><code>-pkt_size 1200</code></td><td>bytes</td><td>Sets the maximum RTP packet size. 1200 bytes avoids fragmentation on most networks.</td></tr>
    <tr><td><code>-f rtsp</code></td><td>—</td><td>Force output format to RTSP.</td></tr>
    <tr><td><code>rtsp://127.0.0.1:8554/live</code></td><td>stream path</td><td>The URL clients connect to. <code>/live</code> is the stream name — you can change it to anything (e.g. <code>/cam1</code>, <code>/lt103</code>).</td></tr>
  </tbody>
</table>

<h3>Step 3 — Use the Stream URL in the Application</h3>
<p>Once FFmpeg is running, paste the RTSP URL into any field in the app that asks for a camera URL:</p>
<pre><code>rtsp://127.0.0.1:8554/live</code></pre>
<p>This works for:</p>
<ul>
  <li><strong>Ground Truth Capture</strong> — <code>/attendance/groundtruth/rtsp</code> → RTSP URL field</li>
  <li><strong>Attendance Run</strong> — <code>/attendance/reports</code> → RTSP URL field</li>
  <li><strong>Camera Registry</strong> — <code>/cameras</code> → Stream URL when registering a camera</li>
  <li><strong>Camera Preview</strong> — <code>/camera/preview</code></li>
</ul>

<h3>Verify the Stream (Optional)</h3>
<p>You can confirm the stream is working before using it in the app by opening it in VLC or running a quick FFmpeg probe:</p>
<pre><code># Play in VLC (GUI)
vlc rtsp://127.0.0.1:8554/live

# Or probe with FFmpeg (terminal)
ffprobe rtsp://127.0.0.1:8554/live</code></pre>
<p>You should see the video playing. If it fails, check that MediaMTX is still running in the other terminal.</p>

<h3>Multiple Streams (Dual-Camera Testing)</h3>
<p>The attendance system supports two cameras per room. To simulate both, run two FFmpeg commands pointing to different stream paths:</p>
<pre><code># Terminal 2 — camera 1
ffmpeg -re -stream_loop -1 -i "C:\\Users\\harim\\Videos\\cam1.mp4" -c copy -rtsp_transport tcp -f rtsp rtsp://127.0.0.1:8554/cam1

# Terminal 3 — camera 2
ffmpeg -re -stream_loop -1 -i "C:\\Users\\harim\\Videos\\cam2.mp4" -c copy -rtsp_transport tcp -f rtsp rtsp://127.0.0.1:8554/cam2</code></pre>
<p>Then enter <code>rtsp://127.0.0.1:8554/cam1</code> as RTSP URL and <code>rtsp://127.0.0.1:8554/cam2</code> as RTSP URL 2 on the attendance run page.</p>

<h3>Troubleshooting</h3>
<table>
  <thead><tr><th>Problem</th><th>Likely cause</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>FFmpeg exits immediately</td><td>MediaMTX is not running</td><td>Start MediaMTX first, then run FFmpeg</td></tr>
    <tr><td>Connection refused on 8554</td><td>MediaMTX port blocked or not started</td><td>Check firewall rules; confirm MediaMTX output shows <code>listener opened on :8554</code></td></tr>
    <tr><td>Python ML service times out</td><td>RTSP URL unreachable from the ML service</td><td>Ensure the ML service and FFmpeg are on the same machine; use <code>127.0.0.1</code> not <code>localhost</code></td></tr>
    <tr><td>Video plays too fast / out of sync</td><td>Missing <code>-re</code> flag</td><td>Always include <code>-re</code> to match real-time playback speed</td></tr>
    <tr><td>Stream stops after one play</td><td>Missing <code>-stream_loop -1</code></td><td>Add <code>-stream_loop -1</code> before the <code>-i</code> flag</td></tr>
  </tbody>
</table>`;

const DEFAULT_TABS = [
  { id: "setup",      title: "Setup & Run",                    content: TAB_SETUP,      order: 0 },
  { id: "attendance", title: "Facial Recognition Attendance",  content: TAB_ATTENDANCE, order: 1 },
  { id: "rtsp",       title: "Local RTSP Stream",              content: TAB_RTSP,       order: 2 },
];

// ─── Controller functions ───────────────────────────────────────────────────

const SCHEMA_VERSION = 5;

const getGuide = async (req, res) => {
  try {
    let guide = await Guide.findOne();
    const needsReset =
      !guide ||
      !Array.isArray(guide.tabs) ||
      guide.tabs.length === 0 ||
      (guide.schemaVersion ?? 1) < SCHEMA_VERSION;

    if (needsReset) {
      if (guide) await Guide.deleteOne({ _id: guide._id });
      guide = await Guide.create({ tabs: DEFAULT_TABS, schemaVersion: SCHEMA_VERSION });
    }
    res.status(200).json({ tabs: guide.tabs, updatedAt: guide.updatedAt });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch guide." });
  }
};

const updateGuide = async (req, res) => {
  try {
    const { tabs } = req.body;
    if (!Array.isArray(tabs) || tabs.length === 0)
      return res.status(400).json({ error: "tabs array is required." });

    let guide = await Guide.findOne();
    if (!guide) {
      guide = await Guide.create({ tabs, updatedAt: Date.now(), schemaVersion: SCHEMA_VERSION });
    } else {
      guide.tabs = tabs;
      guide.updatedAt = Date.now();
      guide.schemaVersion = SCHEMA_VERSION;
      await guide.save();
    }
    res.status(200).json({ tabs: guide.tabs, updatedAt: guide.updatedAt });
  } catch (error) {
    res.status(500).json({ error: "Failed to update guide." });
  }
};

module.exports = { getGuide, updateGuide };
