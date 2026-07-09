import { useState, useEffect } from 'react';
import { theme, cssReset } from './config';
import getEnvironment from '../getenvironment';
import DEV_CYCLE from './devCycleData';

const T = theme;

// ── helpers ──────────────────────────────────────────────────────────────────

function Step({ n, title, children }) {
    return (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                background: T.accent, color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, marginTop: 2,
            }}>{n}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: '#444c6e', lineHeight: 1.7 }}>{children}</div>
            </div>
        </div>
    );
}

function Note({ type = 'info', children }) {
    const map = {
        info:    { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ', color: '#1d4ed8' },
        tip:     { bg: '#f0fdf4', border: '#bbf7d0', icon: '✓', color: '#15803d' },
        warning: { bg: '#fffbeb', border: '#fde68a', icon: '⚠', color: '#b45309' },
        dept:    { bg: '#faf5ff', border: '#e9d5ff', icon: '🏢', color: '#7c3aed' },
        key:     { bg: '#f0fdf4', border: '#86efac', icon: '🔑', color: '#15803d' },
    };
    const s = map[type];
    return (
        <div style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderLeft: `4px solid ${s.color}`, borderRadius: 8,
            padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12,
        }}>
            <span style={{ fontSize: 16, color: s.color, flexShrink: 0 }}>{s.icon}</span>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{children}</div>
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div style={{
            fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 18,
            paddingBottom: 10, borderBottom: '2px solid #e4e8f5',
        }}>{children}</div>
    );
}

function FlowCard({ n, icon, title, sub, accent, wide }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            minWidth: wide ? 110 : 90,
        }}>
            <div style={{
                width: 56, height: 56, borderRadius: 14, background: accent + '18',
                border: `2px solid ${accent}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24,
            }}>{icon}</div>
            <div style={{
                width: 22, height: 22, borderRadius: '50%', background: accent,
                color: '#fff', fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -4,
            }}>{n}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'center' }}>{title}</div>
            <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center' }}>{sub}</div>
        </div>
    );
}

function Arrow() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 32, color: '#c7d2fe', fontSize: 20 }}>
            →
        </div>
    );
}

// ── tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview',    label: 'Overview',              icon: '🗂️' },
    { id: 'groundtruth', label: 'Ground Truth Capture',  icon: '📹' },
    { id: 'erp',         label: 'ERP Photo Upload',      icon: '🖼️' },
    { id: 'rollassign',  label: 'Roll Assignment',        icon: '🏷️' },
    { id: 'embeddings',  label: 'Subject Embeddings',    icon: '🧠' },
    { id: 'attendance',  label: 'Running Attendance',    icon: '✅' },
    { id: 'other',       label: 'Other Features',        icon: '🔧' },
];

// ── tab content ───────────────────────────────────────────────────────────────

function TabOverview({ setTab }) {
    return (
        <div>
            {/* hero */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: 12, padding: '28px 32px', marginBottom: 28, color: '#fff',
            }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                    AI Attendance Management System
                </div>
                <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.75, maxWidth: 640 }}>
                    AMS automates attendance using face recognition from existing CCTV / RTSP cameras.
                    Ground truth is captured in the <strong>same physical environment</strong> where attendance runs —
                    same cameras, same angles, same lighting — producing significantly better recognition accuracy
                    than using generic studio photos.
                </div>
            </div>

            {/* key insight */}
            <Note type="key">
                <strong>Why capture ground truth from RTSP cameras?</strong><br />
                Studio or passport photos look very different from how a student appears seated in a classroom under
                CCTV. By capturing ground truth directly from the same cameras used for attendance, the model learns
                faces in the exact conditions it will encounter — improving accuracy substantially.
            </Note>

            {/* workflow */}
            <SectionTitle>Full Workflow — Step by Step</SectionTitle>
            <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 4, flexWrap: 'wrap',
                background: '#f8f9ff', borderRadius: 12, padding: '24px 20px',
                border: '1px solid #e4e8f5', marginBottom: 28,
            }}>
                <FlowCard n={1} icon="⚙️" title="Configure Batches" sub="Admin Settings" accent="#6366f1" />
                <Arrow />
                <FlowCard n={2} icon="📹" title="RTSP Capture" sub="Dept incharge — live environment" accent="#0ea5e9" wide />
                <Arrow />
                <FlowCard n={3} icon="🖼️" title="ERP Verification" sub="Dept incharge — verify & edit photos" accent="#f472b6" wide />
                <Arrow />
                <FlowCard n={4} icon="🏷️" title="Roll Assignment" sub="Auto-match + incharge verification" accent="#10b981" wide />
                <Arrow />
                <FlowCard n={5} icon="🧠" title="Subject Embeddings" sub="Dept incharge — map students per subject" accent="#f59e0b" wide />
                <Arrow />
                <FlowCard n={6} icon="✅" title="Attendance" sub="Live recognition" accent="#14b8a6" />
            </div>

            {/* role cards */}
            <SectionTitle>Who Does What</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                {[
                    {
                        icon: '🎓', title: 'Admin / Coordinator', color: '#6366f1',
                        items: [
                            'Configure batches, cameras, and session dates',
                            'Configure capture settings (target images, frame skip, detection size)',
                            'Run attendance and review reports',
                            'System-level access to all modules',
                        ],
                    },
                    {
                        icon: '🏢', title: 'Dept. Incharge', color: '#10b981',
                        items: [
                            'Run RTSP ground truth capture for their department',
                            'Verify and manage ERP photos in Manage Photos tab',
                            'Perform roll assignment — map clusters to roll numbers',
                            'Approve assignments for the department',
                            'Generate and manage subject embeddings for their department',
                        ],
                    },
                ].map(u => (
                    <div key={u.title} style={{
                        background: '#fff', border: `1px solid ${u.color}33`,
                        borderLeft: `4px solid ${u.color}`,
                        borderRadius: 10, padding: '16px 18px',
                    }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{u.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 10 }}>{u.title}</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
                            {u.items.map(i => <li key={i}>{i}</li>)}
                        </ul>
                    </div>
                ))}
            </div>

            {/* nav cards */}
            <SectionTitle>Jump to a Section</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                    { tab: 'groundtruth', icon: '📹', title: 'Ground Truth Capture',  color: '#0ea5e9', desc: 'Live RTSP stream capture from classroom cameras' },
                    { tab: 'erp',         icon: '🖼️', title: 'ERP Photo Upload',      color: '#f472b6', desc: 'Upload official student photos as identification reference' },
                    { tab: 'rollassign',  icon: '🏷️', title: 'Roll Assignment',       color: '#10b981', desc: 'Dept incharges map face clusters to roll numbers' },
                    { tab: 'embeddings',  icon: '🧠', title: 'Subject Embeddings',     color: '#f59e0b', desc: 'Dept incharge maps registered students per subject to enable targeted recognition' },
                    { tab: 'attendance',  icon: '✅', title: 'Running Attendance',    color: '#14b8a6', desc: 'Live recognition, session reports, frame verification' },
                ].map(m => (
                    <div key={m.tab} style={{
                        background: '#fff', border: '1px solid #e4e8f5', borderRadius: 10,
                        padding: '14px 16px', cursor: 'pointer',
                        transition: 'box-shadow .15s, border-color .15s',
                    }}
                        onClick={() => setTab(m.tab)}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,.12)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 18 }}>{m.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{m.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{m.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TabGroundTruth() {
    return (
        <div>
            <Note type="key">
                <strong>Ground truth is captured exclusively via live RTSP cameras.</strong> This is a deliberate design
                choice — capturing faces in the same environment (same cameras, same angles, same lighting) as the actual
                attendance sessions significantly improves recognition accuracy. The system automatically cycles through
                all cameras covering a room so that every student in the class is captured.
            </Note>

            <SectionTitle>How It Works — Automatic Camera Switching</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 12, padding: '20px 24px', marginBottom: 24,
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, marginBottom: 16 }}>
                    {[
                        { icon: '📹', label: 'Camera 1', sub: 'Front-left of room', color: '#0ea5e9' },
                        { icon: '⏱', label: '5 min', sub: 'auto-switch', color: '#6366f1' },
                        { icon: '📹', label: 'Camera 2', sub: 'Front-right of room', color: '#0ea5e9' },
                        { icon: '⏱', label: '5 min', sub: 'auto-switch', color: '#6366f1' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            padding: '10px 6px',
                            borderRight: i < 3 ? '1px dashed #c7d2fe' : 'none',
                        }}>
                            <span style={{ fontSize: 22 }}>{s.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</span>
                            <span style={{ fontSize: 11, color: T.textMuted, textAlign: 'center' }}>{s.sub}</span>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                    When you select a <strong>room</strong>, the system fetches every camera registered for that room
                    from the Camera Registry. During capture, it streams from <strong>Camera 1 for 5 minutes</strong>,
                    then automatically stops it and switches to <strong>Camera 2 for 5 minutes</strong>, and so on —
                    cycling through all cameras until you click Stop. This ensures students on every side of the room
                    are captured without any manual intervention.
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
                {[
                    { n: '1', title: 'Frames extracted', desc: 'Video frames are pulled from the RTSP stream at regular intervals (controlled by Frame Skip setting).' },
                    { n: '2', title: 'Faces detected', desc: 'Each frame is scanned for faces. Faces below the minimum size threshold (distant students) are filtered out.' },
                    { n: '3', title: 'Clusters formed', desc: 'Detected faces across all cameras are grouped into clusters — one cluster per unique individual.' },
                ].map(c => (
                    <div key={c.n} style={{
                        background: '#fff', border: '1px solid #e4e8f5',
                        borderRadius: 10, padding: '14px 16px',
                    }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: '50%', background: T.accent,
                            color: '#fff', fontWeight: 800, fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 10,
                        }}>{c.n}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{c.desc}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Step-by-Step — Running a Capture Session</SectionTitle>

            <Step n={1} title="Navigate to Ground Truth Capture">
                In the left sidebar, click <strong>Ground Truth Capture</strong>.
            </Step>

            <Step n={2} title="Select Batch — Degree, Department, Year">
                Choose the <strong>Degree</strong>, <strong>Department</strong>, and <strong>Year</strong>.
                These must correspond to a batch configured in Settings (e.g., BTECH → CSE → 2021).
                Once a department is selected, the system automatically loads the rooms where this
                batch has scheduled sessions from the timetable.
            </Step>

            <Step n={3} title="Select Room">
                Choose the <strong>Room</strong> from the dropdown. The system looks up all cameras
                registered for that room in the Camera Registry. You do not need to select individual cameras —
                the system handles the switching automatically.
            </Step>

            <Step n={4} title="Configure Capture Settings (Admin only)">
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li><strong>Target Images per Person:</strong> How many face images to collect per student (recommended: 15 — gives 5 for embedding + 10 backup for diversity).</li>
                    <li><strong>Frame Skip:</strong> Frames skipped between captures. Higher = lighter CPU load. Recommended: 10 for live streams.</li>
                    <li><strong>Min Detection Size:</strong> Filters out very small/distant faces. Use 320 (Fast) for clear footage, 640 (Accurate) for large rooms with distant students.</li>
                </ul>
            </Step>

            <Step n={5} title="Start Capture — While Students Are Present">
                Click <strong>Start Room Capture</strong>. The system begins streaming from the first camera.
                A live preview shows the current feed with detection zones highlighted.
                A countdown timer shows when the next automatic camera switch will occur (every 5 minutes).
            </Step>

            <Step n={6} title="Monitor Progress — Per-Person Cards">
                As faces are detected, a card appears for each unique person detected showing their
                image count with a progress bar. Cards turn green when the target is reached.
                The system continues cycling through cameras until you click <strong>Stop</strong>.
            </Step>

            <Step n={7} title="Stop and Verify">
                Click <strong>Stop</strong> when you are satisfied with coverage. Check the cluster count
                in the summary — it should roughly match the number of students present.
                If significantly fewer clusters than expected, re-run capture (it accumulates, not overwrites).
            </Step>


            <Note type="warning">
                <strong>Capture while students are actively present and seated.</strong> Running capture on an empty
                room, or when students are standing/moving between seats, produces noisy clusters that degrade
                recognition accuracy.
            </Note>

            <Note type="tip">
                Good frontal lighting and students facing forward produce the cleanest face clusters.
            </Note>

            <SectionTitle>After Capture — What's Next?</SectionTitle>
            <div style={{
                display: 'flex', gap: 0, background: '#f8f9ff', borderRadius: 10,
                border: '1px solid #e4e8f5', overflow: 'hidden',
            }}>
                {[
                    { n: 'A', label: 'Upload ERP Photos', desc: 'Upload official student photos for the batch so the dept incharge can use them as visual reference when assigning roll numbers to clusters.', color: '#f472b6' },
                    { n: 'B', label: 'Roll Assignment', desc: 'Dept incharge compares each cluster against ERP reference photos to identify the student and assigns the roll number.', color: '#10b981' },
                    { n: 'C', label: 'Subject Embeddings', desc: 'Once roll assignment is complete, register each student\'s roll number per subject to reduce matching effort during attendance.', color: '#f59e0b' },
                ].map((s, i) => (
                    <div key={s.n} style={{
                        flex: 1, padding: '16px 18px',
                        borderRight: i < 2 ? '1px solid #e4e8f5' : 'none',
                    }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8, background: s.color,
                            color: '#fff', fontWeight: 800, fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                        }}>{s.n}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</div>
                    </div>
                ))}
            </div>

            <Note type="tip" style={{ marginTop: 16 }}>
                <strong>Run capture on multiple days</strong> to collect varied photos of each student — different
                clothing, lighting conditions, and head positions. A richer ground truth set improves recognition
                accuracy across different sessions.
            </Note>
        </div>
    );
}

function TabERP() {
    return (
        <div>
            <Note type="info">
                <strong>ERP photos are reference photos, not ground truth.</strong> They are uploaded so that department
                incharges can visually identify which face cluster belongs to which student during the roll assignment step.
                ERP photos are <em>not</em> used directly for attendance recognition — only RTSP-captured ground truth is used for that.
            </Note>

            <SectionTitle>Why Upload ERP Photos?</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '18px 20px', marginBottom: 24,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
            }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>
                        Without ERP Photos
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
                        <li>Incharge sees a cluster of CCTV face images</li>
                        <li>Has no visual reference to identify the student</li>
                        <li>Must rely on memory alone — error-prone</li>
                    </ul>
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>
                        With ERP Photos
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#10b981', lineHeight: 1.8 }}>
                        <li>Cluster shown alongside the ERP photo for each roll number</li>
                        <li>Incharge quickly matches cluster to the correct student</li>
                        <li>Faster, more accurate, and auditable</li>
                    </ul>
                </div>
            </div>

            <SectionTitle>Step-by-Step — Uploading ERP Photos</SectionTitle>

            <Step n={1} title="Navigate to ERP Image Upload">
                In the sidebar, click <strong>ERP Image Upload</strong>. You will see a <strong>Summary</strong> tab and
                an <strong>Upload</strong> tab.
            </Step>

            <Step n={2} title="Select the Batch">
                Choose the batch (Degree / Department / Year) for which you are uploading photos.
                Upload must be done per batch.
            </Step>

            <Step n={3} title="Upload via ZIP (Recommended for bulk upload)">
                Prepare a ZIP file where each photo is named after the student's roll number. The folder
                inside the ZIP should contain flat photo files — one file per student — named with the roll number:
                <div style={{
                    background: '#0f172a', color: '#e2e8f0', borderRadius: 8,
                    padding: '14px 18px', fontFamily: 'monospace', fontSize: 12,
                    marginTop: 10, lineHeight: 1.8,
                }}>
                    CSE_2021.zip<br />
                    &nbsp;&nbsp;21CS001.jpg<br />
                    &nbsp;&nbsp;21CS002.jpg<br />
                    &nbsp;&nbsp;21CS003.jpg
                </div>
                Click <strong>Upload ZIP</strong>, select the file, and confirm. The system extracts and stores the photos, using the filename as the roll number.
            </Step>

            <Step n={4} title="Or Upload Individual Photos">
                Use <strong>Upload Single Photo</strong> to add or replace one student's photo at a time.
                Enter the roll number, select the image, and confirm.
            </Step>

            <Step n={5} title="Verify Photos in Manage Photos Tab (Mandatory)">
                <Note type="warning" style={{ margin: '6px 0 10px 0' }}>
                    This step is <strong>mandatory</strong> before proceeding to Roll Assignment.
                </Note>
                Open the <strong>Manage Photos</strong> tab and select the batch. The system displays all
                photos currently in the batch folder. Each photo is shown with its filename (which is the roll number).
                Verify that:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li>Every student in the batch has a photo present.</li>
                    <li>Each photo file is correctly named with the student's roll number (e.g., <code>21CS001.jpg</code>).</li>
                    <li>There are no duplicate filenames or incorrectly named files.</li>
                </ul>
                Edit, add, or delete photos as needed before moving on. Roll assignment relies on these photos
                being correct — a missing or misnamed photo means the incharge cannot identify that student's cluster.
            </Step>

            <Step n={6} title="Review the Summary Tab">
                Switch to the <strong>Summary</strong> tab to see all batches grouped by department with photo counts
                and embedding status. The <strong>Regenerate</strong> button forces a full rebuild of ERP embeddings
                for a batch — use this only when matching is not working correctly for many students, not as a routine action.
            </Step>

            <Note type="warning">
                ERP photos are for <strong>visual identification only</strong>. The face recognition model uses
                the RTSP-captured ground truth clusters — not the ERP photos — to recognise students during attendance.
            </Note>
        </div>
    );
}

function TabRollAssign() {
    return (
        <div>
            <Note type="dept">
                <strong>Who performs this step?</strong> Department Incharges — after completing ground truth
                capture and verifying ERP photos. Roll assignment is a <strong>one-time exercise per batch</strong> and
                is very crucial: errors here directly affect every attendance session for that batch.
            </Note>

            <SectionTitle>How It Works</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, marginBottom: 24, borderRadius: 10, border: '1px solid #e4e8f5', overflow: 'hidden' }}>
                {[
                    { label: 'Unprocessed', desc: 'Clusters from RTSP capture — identity unknown', color: '#6366f1', icon: '📂' },
                    { label: 'Auto-Match', desc: 'System compares clusters against ERP embeddings', color: '#0ea5e9', icon: '🔍' },
                    { label: 'Pending Review', desc: 'Matched — incharge verifies each one manually', color: '#f59e0b', icon: '👁' },
                    { label: 'Approved', desc: 'Confirmed correct — locked for embedding generation', color: '#10b981', icon: '✓' },
                ].map((s, i) => (
                    <div key={s.label} style={{
                        padding: '14px 16px', background: '#f8f9ff',
                        borderRight: i < 3 ? '1px solid #e4e8f5' : 'none',
                    }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: s.color, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Step-by-Step</SectionTitle>

            <Step n={1} title="Navigate to Roll Assignment">
                Click <strong>Roll Assignment</strong> in the sidebar.
            </Step>

            <Step n={2} title="Select Department and Batch">
                Choose the <strong>Department</strong> and <strong>Batch</strong> (Year) from the dropdowns.
                The page loads all clusters currently in the <strong>Unprocessed</strong> section for that batch.
            </Step>

            <Step n={3} title="Click Match with ERP Photos">
                Click the <strong>Match with ERP Photos</strong> button. The system automatically compares
                every unprocessed cluster against the ERP photo embeddings. The roll number is
                auto-fetched from the ERP photo filename — no manual entry required.
                A progress indicator shows matching status. When complete, a success banner confirms how many
                clusters moved to <strong>Pending Review</strong>.
            </Step>

            <Step n={4} title="Verify Each Match in Pending Review">
                Click any card in the <strong>Pending Review</strong> section. A popup opens showing:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li>All face images in the cluster (captured from the live RTSP stream)</li>
                    <li>The ERP reference photo of the student the system matched it to</li>
                    <li>The auto-assigned roll number (editable if the match is correct but the roll number needs correction)</li>
                </ul>
                Compare the cluster images against the ERP photo and decide:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li><strong>Confirm</strong> — the match is correct. The cluster moves to the Approved section.</li>
                    <li><strong>Flag as Incorrect</strong> — the match is wrong. The cluster moves to the Flagged section.</li>
                </ul>
                There is no bulk approve — each card must be reviewed individually. Work through all
                Pending Review cards until none remain.
            </Step>

            <Step n={5} title="Handle Flagged (Incorrect) Matches">
                Clusters in the <strong>Flagged</strong> section were matched incorrectly by the system.
                These students need a <strong>separate ground truth capture session</strong> — run capture
                again for those specific students, then re-run the match.
            </Step>

            <Step n={6} title="Manage Approved Assignments">
                In the <strong>Approved</strong> section you can:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li><strong>Delete</strong> a wrongly approved assignment — it returns to Unprocessed so it can be re-matched.</li>
                    <li><strong>Swap images between Embedding and Backup</strong> — only the top 5 images are used for
                    attendance comparison (embedding images). The remaining captured images are kept as backup.
                    If a student's attendance is coming out wrong, promote a backup image to embedding or
                    demote a poor-quality embedding image to backup to improve accuracy.</li>
                </ul>
            </Step>

            <Note type="warning">
                <strong>This is a one-time exercise and is very crucial.</strong> These cluster-to-roll-number
                mappings become the identity ground truth for all future attendance sessions for this batch.
                Verify every match carefully before confirming.
            </Note>

            <Note type="tip">
                After all matches are approved, the dept incharge should proceed to the <strong>Subject Embeddings</strong> tab
                to generate embeddings for their subjects. Attendance cannot be run until embeddings reflect the approved assignments.
            </Note>
        </div>
    );
}

function TabEmbeddings() {
    return (
        <div>
            <Note type="dept">
                <strong>Who performs this step?</strong> Department Incharges — after completing roll assignment
                for their batch, incharges generate subject embeddings for each subject in their department.
                This is not an admin task.
            </Note>

            <Note type="info">
                <strong>What are Subject Embeddings?</strong> Subject Embeddings map the roll numbers of students
                registered for a specific subject. During attendance, the system only compares detected faces
                against students enrolled in that subject — rather than the entire batch. This significantly
                reduces computational effort and speeds up recognition.
            </Note>

            <SectionTitle>Why This Step is Needed</SectionTitle>
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24,
            }}>
                {[
                    {
                        title: 'Without Subject Embeddings',
                        color: '#ef4444', bg: '#fef2f2',
                        items: [
                            'Every detected face compared against all students in the batch',
                            'Higher computation time per attendance run',
                            'Irrelevant students included in matching',
                        ],
                    },
                    {
                        title: 'With Subject Embeddings',
                        color: '#10b981', bg: '#f0fdf4',
                        items: [
                            'Only students registered for that subject are matched',
                            'Faster recognition with less computation',
                            'More accurate results — fewer false positives from unrelated students',
                        ],
                    },
                ].map(c => (
                    <div key={c.title} style={{
                        background: c.bg, border: `1px solid ${c.color}33`,
                        borderRadius: 10, padding: '14px 16px',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: c.color, marginBottom: 8 }}>{c.title}</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                            {c.items.map(i => <li key={i}>{i}</li>)}
                        </ul>
                    </div>
                ))}
            </div>

            <Note type="key">
                This step must be done <strong>after roll assignment is complete for all students</strong> in the batch.
                Subject embeddings are set up once per subject per semester.
            </Note>

            <SectionTitle>Step-by-Step</SectionTitle>

            <Step n={1} title="Navigate to Subject Embeddings">
                Click <strong>Embeddings</strong> in the sidebar. You will see two tabs:
                <strong> Generate</strong> and <strong>View Embeddings</strong>.
            </Step>

            <Step n={2} title="Select Department, Semester, and Subject">
                In the <strong>Generate</strong> tab, choose the department, semester, and subject.
                The system shows the current embedding status for that subject.
            </Step>

            <Step n={3} title="Enter Roll Numbers for the Subject">
                Provide the roll numbers of students registered for this subject. You can either:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li><strong>Paste directly</strong> into the text box — one roll number per line, or comma/space-separated.</li>
                    <li><strong>Upload a file</strong> containing the roll number list.</li>
                </ul>
                This tells the system exactly which students to include in matching for this subject.
            </Step>

            <Step n={4} title="Click Generate Embeddings">
                Click <strong>Generate Embeddings</strong>. The system creates a subject-specific embedding
                file containing only the enrolled students' ground truth face data.
                A real-time status panel shows per-student progress and any errors.
            </Step>

            <Step n={5} title="Verify in View Embeddings Tab">
                Switch to <strong>View Embeddings</strong> to confirm the file was created.
                An <strong>Incomplete</strong> badge means some enrolled students have no ground truth
                images yet — their roll assignment may not be complete.
            </Step>

            <Note type="warning">
                Subject embeddings must be set up for each subject before running attendance for that subject.
                If a student is missing from the subject embedding, they will not be recognised during attendance
                even if their ground truth was captured correctly.
            </Note>
        </div>
    );
}

function TabAttendance() {
    return (
        <div>
            <Note type="info">
                Before running attendance, confirm: ground truth captured ✓, ERP photos uploaded ✓,
                roll assignments approved ✓, embeddings generated ✓, and session dates configured ✓.
            </Note>

            <SectionTitle>Step 1 — Configure Session Dates</SectionTitle>

            <Step n={1} title="Open Session Setup">
                From the Dashboard, click the <strong>Session Setup</strong> quick-action card.
            </Step>
            <Step n={2} title="Set Semester Dates for Each Batch">
                For each batch, enter the semester start and end dates. The system uses these to validate
                which dates are valid for attendance marking.
            </Step>
            <Step n={3} title="Configure Time Slots">
                Define the daily time slots (periods) — e.g., Slot 1: 09:00–10:00, Slot 2: 10:00–11:00.
                These slots are linked to the timetable for automatic subject/faculty lookup when running attendance.
            </Step>


            <div style={{ borderTop: '1px solid #e4e8f5', margin: '28px 0' }} />
            <SectionTitle>Step 2 — Run Live Attendance</SectionTitle>

            <Step n={1} title="Navigate to Attendance Reports">
                Click <strong>Attendance Reports</strong> in the sidebar.
            </Step>
            <Step n={2} title="Select Room, Date, and Time Slot">
                Choose the <strong>Room</strong> (links to an RTSP camera), the <strong>Date</strong>, and the
                <strong> Time Slot</strong>. The system auto-looks up the timetable to identify the batch,
                subject, and faculty for that slot.
            </Step>
            <Step n={3} title="Run Attendance">
                Click <strong>Run Attendance</strong>. The system pulls frames from the room's RTSP feed,
                detects faces, compares them against the batch's stored embeddings, and assigns each student
                a status: <strong>P</strong> (Present), <strong>A</strong> (Absent), or <strong>R</strong> (Review).
            </Step>
            <Step n={4} title="Monitor Live Progress">
                A stats panel shows live counts of Present / Absent / Review as frames are processed.
                The run can be stopped at any time and restarted — each run is saved separately.
            </Step>
            <Step n={5} title="Review and Override">
                When the run completes, a student table shows each roll number with ML status, confidence score,
                first-seen timestamp, and final status. Use the <strong>P / A / R</strong> override buttons
                to manually correct misclassifications before finalising.
            </Step>


            <div style={{ borderTop: '1px solid #e4e8f5', margin: '28px 0' }} />
            <SectionTitle>Attendance Status Reference</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                    { status: 'P — Present', desc: 'Face detected and matched with high confidence against stored embeddings.', color: T.success, bg: '#f0fdf4' },
                    { status: 'A — Absent', desc: 'No matching face detected for this student across the entire session.', color: T.danger, bg: '#fef2f2' },
                    { status: 'R — Review', desc: 'Face detected but confidence is below threshold. Requires manual verification before finalising.', color: T.warning, bg: '#fffbeb' },
                ].map(s => (
                    <div key={s.status} style={{
                        background: s.bg, border: `1px solid ${s.color}33`,
                        borderRadius: 8, padding: '14px 16px',
                    }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: s.color, marginBottom: 6 }}>{s.status}</div>
                        <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6 }}>{s.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TabOther() {
    return (
        <div>
            <Note type="info">
                These tools are available in the sidebar for auditing and monitoring purposes.
                They are independent of the core attendance workflow.
            </Note>

            <SectionTitle>Frame Verification</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>
                    Frame Verification lets you inspect the raw CCTV frames captured during any attendance
                    session. Each frame is shown with bounding boxes drawn around detected faces, and the
                    identified roll number labelled above each box. Use this to audit disputed attendance
                    or diagnose why a student was missed or misidentified.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Click <strong>Frame Verification</strong> in the sidebar.</li>
                    <li>Select the <strong>Room</strong>, <strong>Date</strong>, and <strong>Period</strong> to filter frames.</li>
                    <li>The <strong>Annotated Frames</strong> tab opens by default — it shows frames with detection
                    boxes and roll numbers. Switch to <strong>Raw Frames</strong> to see the unprocessed images.</li>
                    <li>Frames where no faces were detected appear without annotations.</li>
                    <li>Use this to verify detection quality and support disputes over attendance records.</li>
                </ul>
            </div>

            <SectionTitle>Frame Retention Policy</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>
                    To control storage growth, a nightly cleanup job (production only) automatically prunes
                    old session frames:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li><strong>Less than 7 days old:</strong> left completely untouched — all raw and annotated frames remain available.</li>
                    <li><strong>7 days or older:</strong> all <strong>raw frames are deleted</strong>. For annotated frames, only the
                    <strong> single best-shot frame per camera</strong> is kept (the one with the highest detected face
                    count) — every other annotated frame for that camera is deleted.</li>
                    <li>For a period covered by 2 cameras, this means 2 annotated frames remain in total after 7 days
                    (1 best frame from each camera) — not 2 per camera.</li>
                </ul>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginTop: 12 }}>
                    Plan attendance audits and dispute resolution involving raw frames within this 7-day window —
                    after that, only the one best annotated frame per camera is retrievable via Frame Verification.
                </div>
            </div>

            <SectionTitle>Camera Live Preview</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>
                    Camera Live Preview shows real-time feeds from the RTSP cameras registered for a room.
                    Select a room and both camera feeds start simultaneously side by side, letting you
                    verify camera angle, coverage, and connectivity before or during a capture session.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Click <strong>Camera Preview</strong> in the sidebar.</li>
                    <li>Select a <strong>Room</strong> from the dropdown. Both cameras registered for that room start streaming automatically.</li>
                    <li>Each feed shows the camera status (Online / Offline / Maintenance) alongside the live image.</li>
                    <li>Use this to check camera angles and confirm feeds are working before running ground truth capture or attendance.</li>
                </ul>
            </div>
        </div>
    );
}

// ── developers tab ────────────────────────────────────────────────────────────
// Commits scoped to: client/src/attendancemodule/, server/src/modules/attendanceModule/,
//                    server/src/models/attendanceModule/, python-ml-service/

const AMS_DEVS_BY_YEAR = {
    2026: {
        metric: 'commits',
        devs: [
            { name: 'Dr. D. Harimurugan', github: 'harimurugan1989', count: 75              },
            { name: 'Samiksha Khaire',    github: null,               count: 28              },
            { name: 'Anmoldeep Kaur',     github: 'anmolkaur92',     count: 27              },
            { name: 'Mukal Markanda',     github: 'CodewithMukal',   count: 22              },
            { name: 'Pallvi Saini',       github: null,               count: 19              },
            { name: 'Karan Gupta',        github: 'guptakaran0720',  count: 16              },
            { name: 'Amit Mallick',       github: 'amit837-design',  count: 11, prs: 4      },
            { name: 'Gulshan',            github: 'Gulshan-heap',    count: 10, prs: 1      },
            { name: 'Javin Chutani',      github: 'javin1106',       count: 9               },
        ],
    },
    2023: {
        metric: 'PRs merged',
        devs: [
            { name: 'Aanchal', github: null, count: 1 },
        ],
    },
};

function DevCard({ dev, rank, metric }) {
    const isFirst = rank === 0;
    const accentColor = isFirst ? '#7c3aed' : '#374151';
    const bgColor     = isFirst ? '#faf5ff' : '#f9fafb';
    const borderColor = isFirst ? '#e9d5ff' : '#e5e7eb';

    return (
        <div style={{
            background: bgColor, border: `1px solid ${borderColor}`,
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'box-shadow .15s',
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
            <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: isFirst ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#6b7280,#9ca3af)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#fff',
            }}>
                {dev.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>{dev.name}</span>
                    {dev.prs && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                            background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe',
                        }}>{dev.prs} PR{dev.prs !== 1 ? 's' : ''}</span>
                    )}
                </div>
                {dev.github ? (
                    <a href={`https://github.com/${dev.github}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontFamily: 'monospace' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >@{dev.github}</a>
                ) : (
                    <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>—</span>
                )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{dev.count}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{metric}</div>
            </div>
        </div>
    );
}

function TabDevelopers() {
    const years = Object.keys(AMS_DEVS_BY_YEAR).map(Number).sort((a, b) => b - a);
    const allDevs = years.flatMap(y => AMS_DEVS_BY_YEAR[y].devs);
    const totalDevs = new Set(allDevs.map(d => d.name)).size;

    return (
        <div>
            <SectionTitle>Developers & Contributors</SectionTitle>
            <Note type="info">
                Scoped to attendance module files — frontend, backend controllers/models, and Python ML service.
                Sorted by contributions per year, newest year first.
            </Note>

            {years.map(year => {
                const { metric, devs } = AMS_DEVS_BY_YEAR[year];
                const yearTotal = devs.reduce((s, d) => s + d.count, 0);
                return (
                    <div key={year} style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{
                                fontSize: 13, fontWeight: 800, color: '#6366f1',
                                background: '#eef2ff', padding: '3px 12px',
                                borderRadius: 20, border: '1px solid #c7d2fe',
                            }}>{year}</div>
                            <div style={{ flex: 1, height: 1, background: '#e4e8f5' }} />
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                {devs.length} contributor{devs.length !== 1 ? 's' : ''} · {yearTotal} {metric}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                            {devs.map((d, i) => <DevCard key={d.name} dev={d} rank={i} metric={metric} />)}
                        </div>
                    </div>
                );
            })}

            <div style={{ padding: '10px 16px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                {totalDevs} unique contributors to this module
            </div>
        </div>
    );
}

// ── Development Cycle — weekly feature log from main-branch commits ───────────
// Data lives in devCycleData.js (auto-generated from git log; see its header
// for the regeneration command). Weeks are Monday–Sunday, newest first.

function TabDevCycle() {
    const totalItems = DEV_CYCLE.reduce((s, w) => s + w.items.length, 0);
    return (
        <div>
            <SectionTitle>Development Cycle</SectionTitle>
            <Note type="info">
                What changed, week by week (newest first) — features merged to the main branch from
                March {DEV_CYCLE.length ? DEV_CYCLE[DEV_CYCLE.length - 1].week.slice(-4) : ''} to date, written in
                plain language ({totalItems} features across {DEV_CYCLE.length} weeks; internal
                technical changes are not listed).
            </Note>

            {DEV_CYCLE.map(({ week, items }) => (
                <div key={week} style={{ marginBottom: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{
                            fontSize: 12, fontWeight: 800, color: '#6366f1',
                            background: '#eef2ff', padding: '3px 12px',
                            borderRadius: 20, border: '1px solid #c7d2fe', whiteSpace: 'nowrap',
                        }}>{week}</div>
                        <div style={{ flex: 1, height: 1, background: '#e4e8f5' }} />
                        <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {items.length} change{items.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {items.map((it, i) => (
                            <li key={i} style={{ fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>
                                {it.subject}
                                {' — '}
                                <a
                                    href={`https://github.com/${it.author}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#9ca3af', fontSize: 11, textDecoration: 'none' }}
                                    onMouseOver={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                                >
                                    {it.author}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Manual({ standalone = false }) {
    const [tab, setTab] = useState('overview');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showDevs, setShowDevs] = useState(false);
    const [showDevCycle, setShowDevCycle] = useState(false);

    useEffect(() => {
        if (!standalone) return;
        fetch(`${getEnvironment()}/user/getuser/`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setIsAuthenticated(true); })
            .catch(() => {});
    }, [standalone]);

    const TAB_CONTENT = {
        overview:    <TabOverview setTab={setTab} />,
        groundtruth: <TabGroundTruth />,
        erp:         <TabERP />,
        rollassign:  <TabRollAssign />,
        embeddings:  <TabEmbeddings />,
        attendance:  <TabAttendance />,
        other:       <TabOther />,
    };

    return (
        <>
            <style>{cssReset}</style>
            {standalone && (
                <div style={{
                    position: 'sticky', top: 0, zIndex: 100,
                    background: '#1e1b4b', borderBottom: '1px solid #312e81',
                    padding: '10px 28px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15,
                        }}>📖</div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#e0e7ff' }}>
                            AMS — Help & Manual
                        </span>
                    </div>
                    {isAuthenticated && (
                        <a href="/attendance" style={{
                            fontSize: 13, fontWeight: 600, color: '#a5b4fc',
                            textDecoration: 'none', padding: '6px 14px',
                            border: '1px solid #4338ca', borderRadius: 7,
                            transition: 'background .15s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = '#312e81'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            ← Go to Dashboard
                        </a>
                    )}
                </div>
            )}
            <div style={{
                padding: '24px 28px', maxWidth: 900, margin: '0 auto',
                fontFamily: T.fontBody,
            }}>
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20,
                    }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Help & User Manual</div>
                        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>
                            Step-by-step guide for the AI Attendance Management System
                        </div>
                    </div>
                    <button
                        onClick={() => { setShowDevs(v => !v); setShowDevCycle(false); }}
                        style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                            fontSize: 12, fontWeight: 700,
                            background: showDevs ? '#6366f1' : '#f5f3ff',
                            color: showDevs ? '#fff' : '#6366f1',
                            border: `1.5px solid ${showDevs ? '#6366f1' : '#c4b5fd'}`,
                            transition: 'all .15s',
                        }}
                    >
                        👥 Developers
                    </button>
                    <button
                        onClick={() => { setShowDevCycle(v => !v); setShowDevs(false); }}
                        style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                            fontSize: 12, fontWeight: 700,
                            background: showDevCycle ? '#6366f1' : '#f5f3ff',
                            color: showDevCycle ? '#fff' : '#6366f1',
                            border: `1.5px solid ${showDevCycle ? '#6366f1' : '#c4b5fd'}`,
                            transition: 'all .15s',
                        }}
                    >
                        🔄 Development Cycle
                    </button>
                </div>

                {showDevs || showDevCycle ? (
                    <div style={{
                        background: '#fff', borderRadius: 12,
                        border: '1px solid #e4e8f5',
                        padding: '28px 32px',
                        boxShadow: '0 1px 6px rgba(26,31,60,0.05)',
                    }}>
                        {showDevs ? <TabDevelopers /> : <TabDevCycle />}
                    </div>
                ) : (<>

                {/* Step navigator */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
                    {TABS.map((t, i) => {
                        const active = tab === t.id;
                        const done = TABS.findIndex(x => x.id === tab) > i;
                        const accent = active ? T.accent : done ? '#10b981' : '#cbd5e1';
                        const labelColor = active ? T.accent : done ? '#10b981' : T.textMuted;
                        const bgColor = active ? T.accent : done ? '#10b981' : '#f1f5f9';
                        const numColor = active || done ? '#fff' : '#94a3b8';
                        return (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', flex: i < TABS.length - 1 ? 1 : 'none', minWidth: 0 }}>
                                <div
                                    onClick={() => setTab(t.id)}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: 72, flexShrink: 0 }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: bgColor,
                                        border: active ? `2px solid ${T.accent}` : done ? '2px solid #10b981' : '2px solid #e2e8f0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 800, color: numColor,
                                        transition: 'all .2s', flexShrink: 0,
                                        boxShadow: active ? `0 0 0 4px ${T.accent}18` : 'none',
                                    }}>
                                        {done ? '✓' : i === 0 ? '★' : i}
                                    </div>
                                    <div style={{
                                        marginTop: 6, fontSize: 10, fontWeight: active ? 700 : 500,
                                        color: labelColor, textAlign: 'center', lineHeight: 1.3,
                                        maxWidth: 68, wordBreak: 'break-word',
                                    }}>
                                        {t.label}
                                    </div>
                                </div>
                                {i < TABS.length - 1 && (
                                    <div style={{
                                        flex: 1, height: 2, marginTop: 17, minWidth: 12,
                                        background: done ? '#10b981' : '#e2e8f0',
                                        transition: 'background .2s',
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{
                    background: '#fff', borderRadius: 12,
                    border: '1px solid #e4e8f5',
                    padding: '28px 32px',
                    boxShadow: '0 1px 6px rgba(26,31,60,0.05)',
                }}>
                    {TAB_CONTENT[tab]}
                </div>
                </>)}
            </div>
        </>
    );
}
