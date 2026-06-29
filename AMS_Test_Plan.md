# AMS System — Deployment Readiness Test Plan

**Total modules:** 13 pages · 3 services (React frontend, Node.js, Python ML)  
**Priority:** P1 = blocker, P2 = important, P3 = regression/edge case

---

## Roles & Assignment

| Role | Covers |
|------|--------|
| **Tester A** — UI & Navigation | Dashboard, navigation, forms, error states |
| **Tester B** — Camera & ML Operations | Ground Truth Capture, Live Preview, Confidence Monitor, ML Fine Tuning |
| **Tester C** — Data & Reports | Attendance Reports, Live Report, Class Verification, Export |
| **Tester D** — Infrastructure & Integration | Camera Registry, Subject Embeddings, Record Stream, Scheduler, end-to-end |

---

## 1 · Dashboard — Tester A

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 1.1 | Load dashboard as admin | All stat cards render; no blank panels or JS errors in console | P1 |
| 1.2 | "All Branches Overview" chart appears above the Acquisition & Roll Assignment card | Chart is a standalone card, not nested inside the acquisition card | P1 |
| 1.3 | Ground Truth and Subject Embeddings stat cards are absent | No numeric GT/embedding cards shown (they are shown pictorially elsewhere) | P1 |
| 1.4 | ML Fine Tuning icon button (sliders icon) is visible in header | Button present; clicking navigates to /attendance/ml-fine-tuning | P1 |
| 1.5 | Acquisition Control icon button navigates correctly | Correct route loads | P2 |
| 1.6 | Session Setup icon button navigates correctly | Correct route loads | P2 |
| 1.7 | Department filter on All Branches chart | Selecting a department filters the bar chart data | P2 |
| 1.8 | Dashboard loads for dept-admin (non-superadmin) | Department-scoped data only; no cross-dept data leaks | P1 |
| 1.9 | Dashboard loads when ML service is down | Graceful degradation — ML-dependent stats show "unavailable", page does not crash | P2 |
| 1.10 | Live Report section visible on dashboard (before camera) | Live badge button appears in header; clicking expands room grid | P1 |
| 1.11 | Live badge shows active room count when a session is running | Green blinking dot + "N live" shown | P2 |
| 1.12 | Live badge shows "No active session" when nothing is running | Muted text shown; no error | P2 |
| 1.13 | Live Report auto-refreshes every 15 seconds | Room cards update without manual refresh | P2 |
| 1.14 | "Full Report →" button in Live panel navigates to /attendance/live-report | Correct page loads | P2 |
| 1.15 | Live Report NOT present as a sidebar nav item | Sidebar list does not have "Live Report" entry | P1 |

---

## 2 · Ground Truth Capture (/attendance/groundtruth/rtsp) — Tester B

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 2.1 | Select batch + room + camera; start GT capture | Stream starts; SSE events flow; face crops appear in the UI | P1 |
| 2.2 | Face crop thumbnails are saved to ml-data/ground_truth/<batch>/person_NNN/ | Folder created on server; crops written | P1 |
| 2.3 | Auto-stop triggers after new_person_timeout seconds with no new person detected | Session ends automatically; user sees "All persons reached target" message | P1 |
| 2.4 | Frame skip, target images per person, cluster threshold, min samples respect the values set in ML Fine Tuning | Verify by temporarily changing GT config and rerunning — different frame_skip results in visibly different processing rate | P2 |
| 2.5 | Same person not split into multiple person_NNN folders | After capture, each physical person appears as one folder | P1 |
| 2.6 | RTSP stream disconnect mid-capture | Service reconnects up to max retries; user sees reconnect messages; does not crash | P2 |
| 2.7 | Capture with liveness enabled — hold a printed photo to camera | Face should be rejected; not saved as a GT crop | P1 |
| 2.8 | Stop capture manually before target reached | Partial capture saved; folders contain whatever was collected | P2 |
| 2.9 | Re-run capture for same batch | New persons appended as person_NNN continuing from last serial; existing folders not overwritten | P1 |
| 2.10 | Dept prefix appears in rejected crop filenames (format: {ts}_{DEPT}_{method}{score}_det{score}.jpg) | Confirm by checking ml-data/liveness_rejected/ filenames | P2 |

---

## 3 · Roll Assignment (/attendance/groundtruth/assign) — Tester A + Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 3.1 | Load page; all GT folders listed | Each person_NNN folder shown with thumbnail | P1 |
| 3.2 | Assign a roll number to a folder | Assignment saved; folder renamed/tagged correctly | P1 |
| 3.3 | Duplicate roll number rejected | Error shown; original assignment unchanged | P1 |
| 3.4 | Unassigned folders counted and shown | Badge or count of remaining unassigned folders | P2 |
| 3.5 | Batch filter — switch batch, list updates | Only folders for that batch shown | P1 |

---

## 4 · ERP Upload (/attendance/groundtruth/upload) — Tester A + Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 4.1 | Upload valid ERP Excel/CSV with roll numbers and photos | Photos extracted; GT folders created with roll numbers as folder names | P1 |
| 4.2 | Upload malformed Excel (missing roll column) | Graceful error; user told which column is missing | P1 |
| 4.3 | Upload duplicate roll number that already exists in GT | Existing folder photos updated/merged, not duplicated | P2 |
| 4.4 | Upload very large file (>50 MB) | Progress indicator shown; does not time out | P2 |

---

## 5 · Subject Embeddings (/attendance/embeddings) — Tester B + Tester D

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 5.1 | Generate embeddings for a batch after GT capture + roll assignment | Embeddings generated; FAISS index updated; success message | P1 |
| 5.2 | SSE progress stream works during generation | Progress events appear in UI in real time | P1 |
| 5.3 | Generate button disabled while generation is running | No double-submission possible | P2 |
| 5.4 | Reload embeddings after generation | Attendance runs after this use the new embeddings | P1 |
| 5.5 | View embedding files per batch | List shows which folders are used for embeddings vs backup | P2 |
| 5.6 | Generate embeddings with det_score_floor set high (e.g. 0.7 in ML Fine Tuning) | Fewer photos accepted; verify in logs that low-score faces were skipped | P2 |

---

## 6 · Attendance Reports — Run Tab — Tester B + Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 6.1 | Select room + slot; system auto-resolves batch/subject/faculty from timetable | LockSem lookup succeeds; batch label shown; no manual input needed | P1 |
| 6.2 | Start attendance run with valid RTSP URL | SSE stream starts; live stats update (present/absent counts) | P1 |
| 6.3 | Live frame preview appears in iframe | MJPEG preview updates during run | P2 |
| 6.4 | Run completes; attendance saved to daily data file | server/ml-data/daily/ file created with present/absent/unknown breakdown | P1 |
| 6.5 | Manual batch fallback (LockSem not found for room/slot) | User can manually select degree/dept/year; run proceeds | P2 |
| 6.6 | Dual-camera mode (RTSP URL 2 filled) | Camera switches every 30 s; countdown banner visible; both cameras used | P2 |
| 6.7 | Stop run before duration ends | Run stops cleanly; partial results saved | P1 |
| 6.8 | Unknown faces captured and accessible | After run, unknown faces appear under Unknown Faces tab for that date/dept | P1 |
| 6.9 | Attendance run with liveness ON — reject photos held to camera | Faces from printed photos not counted as present | P1 |
| 6.10 | Frame snapshots saved server-side | frame-snapshots/ directory contains annotated frames from the run | P2 |

---

## 7 · Attendance Reports — Saved Reports Tab — Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 7.1 | All saved reports listed, newest first | Reports shown with date, slot, room, batch, present/absent count | P1 |
| 7.2 | Click a report → opens Report Detail tab | Full student-by-student breakdown shown | P1 |
| 7.3 | Override present/absent for a student in detail view | Override saved; report reflects change | P2 |
| 7.4 | Delete a report | Report removed from list; not recoverable from UI | P2 |
| 7.5 | "Review Unknown Faces" button in detail navigates to Unknown Faces tab | Tab switches; correct date/dept pre-filled | P2 |
| 7.6 | Filter reports by date or batch | Only matching reports shown | P2 |

---

## 8 · Attendance Reports — Unknown Faces Tab — Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 8.1 | Unknown faces load for current date | Face crop thumbnails shown | P1 |
| 8.2 | Filter by dept | Only unknowns for that dept shown | P2 |
| 8.3 | Assign an unknown face to a roll number | Face crop moved/linked to student record | P2 |
| 8.4 | No unknown faces message when folder is empty | "No unknown faces" shown, not an empty grid | P2 |

---

## 9 · Attendance Reports — Rejected Samples Tab (new) — Tester B + Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 9.1 | Tab visible next to "Unknown Faces" in tab bar | "Rejected Samples" tab present | P1 |
| 9.2 | Clicking tab loads rejected crop thumbnails | Images appear; no JS error | P1 |
| 9.3 | Dept filter dropdown appears when multiple depts have rejected crops | Dropdown visible; filtering works | P1 |
| 9.4 | Dept badge on each crop matches the dept in filename | {DEPT} label on thumbnail matches folder/batch | P2 |
| 9.5 | Refresh button reloads the list | Fresh set of images returned; count may change | P2 |
| 9.6 | "No rejected crops" message when folder empty or save-crops disabled | Informative message mentioning ML Fine Tuning setting | P2 |
| 9.7 | Rejected samples tab NOT present on ML Fine Tuning page | Old collapsible panel removed; ML Fine Tuning only has GT Acquisition + Liveness | P1 |

---

## 10 · Attendance Reports — Export Reports Tab — Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 10.1 | Export a report as Excel | Downloaded .xlsx has correct columns (roll no, name, present/absent) | P1 |
| 10.2 | Export a report as CSV | Downloaded .csv parseable; correct data | P1 |
| 10.3 | Export filtered by date range | Only reports in range included | P2 |
| 10.4 | Export with no reports matching filter | Informative message; no blank download | P2 |

---

## 11 · Live Report Page (/attendance/live-report) — Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 11.1 | Page loads; live attendance data visible (accessible via Full Report button on dashboard) | Present/absent breakdown for active sessions | P1 |
| 11.2 | Data updates in real time during an active attendance run | Counts change without page refresh | P1 |
| 11.3 | No active session — empty state message | Page does not show stale data | P2 |

---

## 12 · Class Verification (/attendance/frame-verification) — Tester B + Tester C

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 12.1 | Load saved frame snapshots for a past run | Annotated frames visible with detected faces highlighted | P1 |
| 12.2 | Filter by batch/date | Correct frames shown | P2 |
| 12.3 | Frame with no detections | Shown with "no faces" label, not blank | P2 |

---

## 13 · Camera Registry (/cameras) — Tester A + Tester D

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 13.1 | List all cameras | All registered cameras listed with room ID, stream URL | P1 |
| 13.2 | Add a new camera (valid RTSP URL) | Camera saved; appears in list; accessible from GT Capture and Record Stream | P1 |
| 13.3 | Edit camera stream URL | Updated URL used on next run | P1 |
| 13.4 | Delete a camera | Removed from list; no orphan references in active runs | P2 |
| 13.5 | Add camera with invalid RTSP URL format | Validation error shown before saving | P2 |
| 13.6 | Camera appears in Record Stream room picker after adding | Confirm room dropdown in Record Stream includes new room | P2 |

---

## 14 · Live Preview (/cameras/preview) — Tester B

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 14.1 | Select a camera; preview loads | MJPEG stream visible in browser | P1 |
| 14.2 | Switch between cameras | New stream loads; old stream stops | P2 |
| 14.3 | Camera offline — preview fails gracefully | Error message shown; browser does not hang | P2 |

---

## 15 · Record Stream (/attendance/record-stream) — Tester D

### 15a · Recording Tab

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 15.1 | Select degree/dept/year/room/period/camera | All dropdowns populate correctly in sequence | P1 |
| 15.2 | Format selector — Video + Audio → Start | Recording starts; recordings/ folder has .mp4 with both streams | P1 |
| 15.3 | Format selector — Video Only → Start | .mp4 has no audio track (verify with ffprobe or VLC) | P1 |
| 15.4 | Format selector — Audio Only → Start | .mp4 has no video track; smaller file size | P1 |
| 15.5 | Format badge shown on recording card (📹 Video Only etc.) | Label matches format selected | P1 |
| 15.6 | Stop recording | Recording stops; file size shown; status changes to "done" | P1 |
| 15.7 | Download Video button — video+audio and video-only formats | File downloads; playable in media player | P1 |
| 15.8 | Download Audio button — video+audio and audio-only formats | MP3 downloads; playable | P1 |
| 15.9 | Video download button absent for audio-only recording | Only Audio button shown | P1 |
| 15.10 | Audio download button absent for video-only recording | Only Video button shown | P1 |
| 15.11 | Download fails (file deleted from server) | Error toast with server message shown; not silent | P1 |
| 15.12 | Format selector disabled while recording is active | Cannot change format during active recording | P2 |
| 15.13 | Recording list polls every 4 s; elapsed time updates every 1 s | Timer and file size update without manual refresh | P2 |

### 15b · Scheduler Tab

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 15.14 | Select day, room, period; submit | Schedule created; appears in schedule list with "scheduled" status | P1 |
| 15.15 | Schedule with format Video Only | When recording auto-starts, file has no audio track | P1 |
| 15.16 | All-day toggle — submit | 8 schedules created (one per period); all appear in list | P1 |
| 15.17 | Past time rejected | "Scheduled time is in the past" error; not scheduled | P1 |
| 15.18 | Cancel a scheduled recording before it starts | Removed from list; timer cleared; recording does not start | P1 |
| 15.19 | Auto-start fires at correct time | At startMin, recording begins; status changes to "recording" | P1 |
| 15.20 | Auto-stop fires at correct time | At endMin, recording stops; status changes to "done" | P1 |
| 15.21 | Download buttons appear on done scheduled recordings | Video / Audio shown for done items per format | P2 |
| 15.22 | Room with no camera registered | "No camera registered for this room" error shown | P2 |

---

## 16 · ML Fine Tuning (/attendance/ml-fine-tuning) — Tester B

### 16a · GT Acquisition Thresholds (new — at top of page)

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 16.1 | Page loads; GT Acquisition card appears first (above Liveness) | Card order: GT Acquisition → Liveness → (Rejected Samples removed) | P1 |
| 16.2 | All 11 parameters load from /api/v1/ml/gt-config | Dropdowns show current saved values | P1 |
| 16.3 | Change frame_skip and save | Next GT capture processes 1 in N frames per new value (verify via log count) | P1 |
| 16.4 | Change target_imgs_per_person | Capture stops per-person at new target | P1 |
| 16.5 | Change cluster_threshold | DBSCAN eps changes; more/fewer clusters formed | P2 |
| 16.6 | Change merge_threshold | Post-cluster merge sensitivity changes | P2 |
| 16.7 | Change nms_iou_thresh | NMS deduplication threshold changes | P2 |
| 16.8 | Change det_score_floor | Embeddings generated only from faces above this score | P2 |
| 16.9 | Change new_person_timeout | Auto-stop triggers at new timeout value | P2 |
| 16.10 | embed_n cannot exceed top_n | Warning shown; save blocked if embed_n > top_n | P1 |
| 16.11 | Change top_n to value less than current embed_n | embed_n clamped automatically | P2 |
| 16.12 | det_size dropdown — toggle 320 to 640 | Next acquisition uses updated detection grid | P2 |
| 16.13 | Settings persist across page reload (stored in Python state) | After reload, values match last-saved values | P1 |
| 16.14 | "Could not load GT config" shown when ML service is down | Error text displayed; no JS crash | P2 |

### 16b · Liveness / Anti-Spoofing

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 16.15 | Enable/disable liveness toggle | Next attendance run respects enabled state | P1 |
| 16.16 | Change heuristic threshold; use a printed photo during attendance | Tighter threshold rejects photo; looser allows it | P1 |
| 16.17 | ONNX threshold shown only affects if ONNX model loaded | Status shows "Heuristic mode" or "ONNX model active" correctly | P2 |
| 16.18 | "Save rejected crops" toggle ON | Rejected face crops written to ml-data/liveness_rejected/ | P1 |
| 16.19 | "Save rejected crops" toggle OFF | No files written to rejected folder during attendance | P1 |
| 16.20 | rejected_this_run counter increments during attendance | Counter updates when liveness rejects a face | P2 |

---

## 17 · Confidence Monitor (/attendance/confidence) — Tester B

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 17.1 | Page loads; historical confidence data visible | Charts/tables render | P2 |
| 17.2 | Filter by batch/date | Data scoped correctly | P2 |

---

## 18 · Recordings Save Path (.env) — Tester D

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 18.1 | Default path (server/recordings/) used when RECORDINGS_DIR not set in .env | Files appear in server/recordings/ | P1 |
| 18.2 | Set RECORDINGS_DIR=D:\custom\path in python-ml-service/.env; restart service | Recordings written to custom path | P2 |
| 18.3 | Custom path directory auto-created if it doesn't exist | os.makedirs creates it; no crash | P2 |

---

## 19 · End-to-End Flows — Tester D

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 19.1 | Full GT pipeline: Capture → Roll Assign → Generate Embeddings → Run Attendance → View Report | Student names appear as present/absent in final report | P1 |
| 19.2 | New batch from scratch: Create batch, capture GT, assign rolls, generate embeddings, run attendance in same session | No stale data from previous batches interferes | P1 |
| 19.3 | Liveness pipeline: Enable liveness → Run attendance with real student → student marked present; with printed photo → rejected | Both cases handled correctly in same run | P1 |
| 19.4 | Scheduled recording completes → download: Create schedule → wait for auto-start/stop → download recording | File downloadable with correct format | P2 |
| 19.5 | ML service restart during active attendance run | Node.js returns error SSE event; frontend shows error; no data corruption | P2 |
| 19.6 | GT config change mid-session: Change new_person_timeout in ML Fine Tuning while capture is running | New timeout applies to the next capture (in-flight session uses value at start) | P2 |

---

## 20 · Cross-Cutting Checks — All Testers

| # | Check | Priority |
|---|-------|----------|
| 20.1 | No unhandled JS exceptions in browser console on any page | P1 |
| 20.2 | No Python Traceback in ML service console during any operation | P1 |
| 20.3 | All API error responses show a user-readable message in the UI (not raw JSON) | P1 |
| 20.4 | Authentication enforced — unauthenticated requests to all /api/v1/ routes return 401 | P1 |
| 20.5 | Department admin cannot see data from other departments | P1 |
| 20.6 | All download buttons use fetch-based error detection (not silent window.location.href) | P1 |
| 20.7 | Sidebar collapses correctly on mobile/small screens | P2 |
| 20.8 | No CORS errors when frontend and backend are on different ports | P2 |
| 20.9 | Recordings directory is NOT inside the React app's public folder (no accidental public access) | P1 |
| 20.10 | RTSP credentials in stream URLs not logged to browser console | P1 |

---

## Sign-off Checklist (Deployment Gate)

All **P1** items must pass. P2 items should have fewer than 3 open. No P3 items block deployment.

| Module | Tester | P1 Pass | P2 Pass | Sign-off |
|--------|--------|---------|---------|----------|
| Dashboard | A | [ ] | [ ] | |
| GT Capture | B | [ ] | [ ] | |
| Roll Assignment | A/C | [ ] | [ ] | |
| ERP Upload | A/C | [ ] | [ ] | |
| Subject Embeddings | B/D | [ ] | [ ] | |
| Attendance Reports | B/C | [ ] | [ ] | |
| Live Report (dashboard widget) | C | [ ] | [ ] | |
| Class Verification | B/C | [ ] | [ ] | |
| Camera Registry | A/D | [ ] | [ ] | |
| Record Stream | D | [ ] | [ ] | |
| ML Fine Tuning | B | [ ] | [ ] | |
| End-to-End Flows | D | [ ] | [ ] | |
| Cross-cutting | All | [ ] | [ ] | |
