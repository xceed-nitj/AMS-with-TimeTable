import { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';

// ── design tokens ─────────────────────────────────────────────────────────────
const T = {
    text: '#1a1f3c', textMuted: '#7b84ab', accent: '#6366f1',
    border: '#e4e8f5', bg: '#f5f6fb', fontBody: "'Inter', system-ui, sans-serif",
    success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
};

const cssReset = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${T.bg}; }
    code { font-family: 'IBM Plex Mono', monospace; font-size: 12px; background: #eef0fb; padding: 1px 5px; border-radius: 4px; }
`;

// ── helpers ───────────────────────────────────────────────────────────────────

function Step({ n, title, children }) {
    return (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: T.accent,
                    color: '#fff', fontWeight: 800, fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{n}</div>
                <div style={{ width: 2, flex: 1, background: '#e4e8f5', marginTop: 4 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 6, paddingTop: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.75 }}>{children}</div>
            </div>
        </div>
    );
}

function Note({ type = 'info', children }) {
    const cfg = {
        info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: 'ℹ' },
        warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '⚠' },
        tip:     { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', icon: '💡' },
        key:     { bg: '#faf5ff', border: '#e9d5ff', color: '#6b21a8', icon: '🔑' },
    };
    const s = cfg[type] || cfg.info;
    return (
        <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 14px', marginBottom: 16,
            display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <div style={{ fontSize: 13, color: s.color, lineHeight: 1.65 }}>{children}</div>
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: T.textMuted,
            borderBottom: `1px solid ${T.border}`,
            paddingBottom: 6, marginBottom: 16, marginTop: 28,
        }}>{children}</div>
    );
}

// ── tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview',   label: 'Overview',         icon: '🗂️' },
    { id: 'setup',      label: 'Setup',             icon: '⚙️' },
    { id: 'allotment',  label: 'Allotment',         icon: '📅' },
    { id: 'lock',       label: 'Lock & Print',      icon: '🔒' },
    { id: 'other',      label: 'Other Features',    icon: '🔧' },
];

// ── tab content ───────────────────────────────────────────────────────────────

function TabOverview({ setTab }) {
    return (
        <div>
            <Note type="key">
                The Timetable Module digitalises the complete process of timetable preparation at NITJ.
                It is <strong>not</strong> an automatic slot generator — it assists the timetable incharge
                in setting up and publishing a consistent, institute-wide timetable with minimal effort.
            </Note>

            <SectionTitle>What This Module Does</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                    { icon: '🏛️', title: 'Centralised Room Control', desc: 'Centrally allotted rooms are managed by ITTC. Departments see real-time slot availability for all shared rooms and faculty.' },
                    { icon: '📄', title: 'Auto PDF Generation', desc: 'After locking the timetable, generate semester, faculty, and room PDFs in one click — all in a uniform institute-wide format.' },
                    { icon: '⚡', title: 'Instant Updates', desc: 'Minor changes (room swap, faculty change) can be made and re-locked in minutes without restarting the process.' },
                    { icon: '🌐', title: 'Public Transparency', desc: 'Locked timetables are linked to the institute website. Anyone can view all department, faculty, and room timetables via Master View.' },
                    { icon: '⚠️', title: 'Slot Conflict Warnings', desc: 'The system warns when a faculty or room is already occupied in a slot, but the incharge can still override and save.' },
                    { icon: '👥', title: 'Multi-Department Support', desc: 'View other departments\' faculty and room usage when scheduling shared resources. First-year slots are managed centrally by ITTC.' },
                ].map(c => (
                    <div key={c.title} style={{
                        background: '#fff', border: '1px solid #e4e8f5',
                        borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12,
                    }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{c.title}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{c.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            <SectionTitle>Workflow at a Glance</SectionTitle>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: '#f8f9ff', borderRadius: 12,
                border: '1px solid #e4e8f5', overflow: 'hidden', marginBottom: 24,
            }}>
                {[
                    { n: 1, icon: '⚙️', label: 'Setup', sub: 'Sem · Subject · Room · Faculty' },
                    { n: 2, icon: '📅', label: 'Allotment', sub: 'Assign subject/room/faculty per slot' },
                    { n: 3, icon: '🔒', label: 'Lock TT', sub: 'Freeze · generate PDFs' },
                    { n: 4, icon: '🌐', label: 'Publish', sub: 'Go live on XCEED · notify faculty' },
                ].map((s, i) => (
                    <div key={s.n} style={{
                        flex: 1, padding: '16px 14px', textAlign: 'center',
                        borderRight: i < 3 ? '1px solid #e4e8f5' : 'none',
                        cursor: 'pointer',
                    }} onClick={() => setTab(['overview','setup','allotment','lock'][i])}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: T.accent }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Important Notes</SectionTitle>
            <Note type="warning">
                <strong>One timetable per session per department.</strong> You cannot create more than one
                timetable link for the same session. All edits must be done within the same link.
            </Note>
            <Note type="info">
                Centralised rooms (classrooms managed by ITTC) can only be allotted to a department by ITTC.
                Departments can directly add rooms and labs they share with other departments.
            </Note>
            <Note type="tip">
                Follow the steps in order — Setup → Allotment → Lock → Print. Skipping setup steps
                will cause missing data in the dropdowns during allotment.
            </Note>
        </div>
    );
}

function TabSetup() {
    return (
        <div>
            <Note type="info">
                All four setup steps must be completed before starting allotment.
                After each step, return to the Allotment page to continue.
            </Note>

            <SectionTitle>Step 1 — Add Semester</SectionTitle>
            <Step n={1} title="Open Add Semester">
                Click the <strong>Add Semester</strong> button on the allotment page.
            </Step>
            <Step n={2} title="Select and Add Semesters">
                Select the semesters (e.g., B.Tech-CSE-3, B.Tech-CSE-5) for which you want to set the
                timetable and add them. If a required semester is not available (e.g., M.Tech semesters),
                contact ITTC to have it added to the master database.
            </Step>
            <Step n={3} title="Return to Allotment Page">
                Come back to the allotment page after adding all necessary semesters.
            </Step>
            <Note type="warning">
                The semester name must match <strong>exactly</strong> when used in subject upload files —
                including spaces, hyphens, and capitalisation (e.g., <code>B.Tech-EE-3</code>).
                Any mismatch will cause upload failure.
            </Note>

            <SectionTitle>Step 2 — Add Subjects</SectionTitle>
            <Step n={1} title="Open Add Subject">
                Click the <strong>Add Subject</strong> button on the allotment page.
            </Step>
            <Step n={2} title="Download the Subject Template">
                Download the subject template file. Prepare your subject data in this format — all
                semesters (including M.Tech) can be prepared in the same file and uploaded in one go.
            </Step>
            <Step n={3} title="Prepare the Template File">
                Fill in the template with one row per subject/lab/tutorial group. Key columns:
                <div style={{
                    background: '#0f172a', color: '#e2e8f0', borderRadius: 8,
                    padding: '14px 18px', fontFamily: 'monospace', fontSize: 12,
                    margin: '10px 0', lineHeight: 1.9,
                }}>
                    SubjectFullName | subName | subCode | subType | credits | semester | studentCount
                </div>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9, fontSize: 13 }}>
                    <li>Do not modify the first (header) row.</li>
                    <li><strong>subName</strong> is the abbreviation — must be unique within a semester.</li>
                    <li>The <strong>semester</strong> value must exactly match the semester name added in Step 1.</li>
                    <li>For tutorial and lab groups, add separate rows (e.g., subType: Tutorial, Lab).</li>
                </ul>
            </Step>
            <Step n={4} title="Upload the File">
                Upload the prepared file. Uploaded subjects appear in a table with edit and delete options.
                To add a single subject after bulk upload, use the <strong>Add Subject</strong> button and fill in the form manually.
            </Step>

            <SectionTitle>Step 3 — Add Room</SectionTitle>
            <Step n={1} title="Open Add Room">
                Click the <strong>Add Room</strong> button. Centrally allotted classrooms and department
                rooms are automatically added when the timetable is created based on data shared by the department.
            </Step>
            <Step n={2} title="Add Shared or Additional Rooms">
                To add rooms/labs shared with other departments, use the dropdown in the Add Room page.
                For any typos, new rooms, or rooms deleted by mistake, contact ITTC.
            </Step>
            <Step n={3} title="View Room Allotment">
                Click <strong>View Allotted Rooms</strong> to see your centrally allotted rooms and the
                slots assigned to them. A separate table shows open elective room allotments.
            </Step>
            <Note type="info">
                Use <strong>View Master Room</strong> to see room details across all departments — the
                search dynamically filters results. For labs, enter the room number in the Room column
                and the lab name in the Type column. Avoid long names — they take up more space in the PDF.
            </Note>
            <Note type="warning">
                Centralised rooms are under the purview of ITTC. Only ITTC can allot or re-add a centralised
                room to a department. If you accidentally deleted one, contact ITTC.
            </Note>

            <SectionTitle>Step 4 — Add Faculty</SectionTitle>
            <Step n={1} title="Open Add Faculty">
                Click the <strong>Add Faculty</strong> button on the allotment page.
            </Step>
            <Step n={2} title="Add Faculty Per Semester">
                Select the semester and add faculty members teaching that semester using the checkbox list.
                Faculty appear grouped by semester in the table. You can expand or collapse each semester group.
            </Step>
            <Step n={3} title="Add Guest Faculty or New Faculty">
                If the faculty member is not available in the checkbox list, use the <strong>Edit Faculty</strong>
                button on the allotment page dashboard. This opens the Edit Faculty page where you can add
                new faculty (including guest faculty) directly to your department's faculty list, edit existing
                entries, or delete faculty who are no longer part of the department.
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li>Click <strong>Add New Faculty</strong> in the Edit Faculty page and fill in the name, designation, faculty ID, email, and type.</li>
                    <li>For guest faculty, use the actual name if confirmed, or a placeholder like <em>Guest Faculty-1</em> and update it later.</li>
                    <li>Once added, the faculty will appear in the checkbox list in Add Faculty.</li>
                </ul>
            </Step>
            <Note type="tip">
                Use the Edit Faculty page from the dashboard to manage your department's faculty list —
                add new or guest faculty, update details, or remove faculty who have left.
                No need to contact ITTC for department-level faculty changes.
            </Note>
        </div>
    );
}

function TabAllotment() {
    return (
        <div>
            <Note type="info">
                Allotment can begin once all four setup steps are complete. You can save partial data —
                it is not mandatory to fill all three fields (subject, room, faculty) in a cell before saving.
            </Note>

            <SectionTitle>Importing Data from a Previous Session</SectionTitle>
            <div style={{
                background: '#fff7ed', border: '1px solid #fed7aa',
                borderRadius: 10, padding: '16px 20px', marginBottom: 12,
                fontSize: 13, color: '#374151', lineHeight: 1.7,
            }}>
                If the timetable structure is largely the same as a previous session, use <strong>Import Data</strong>
                (yellow button in the Quick Actions section of the dashboard) to copy the entire timetable
                from that session into the current one. This saves significant time at the start of allotment.
            </div>
            <Step n={1} title="Use Only at the Very Start">
                Import Data should be the <strong>first action</strong> taken — before making any manual
                allotments. Select the session you want to copy from and confirm.
            </Step>
            <Step n={2} title="Confirm the Warning">
                A confirmation dialog will appear before the import proceeds. Read it carefully —
                importing <strong>replaces all existing data</strong> in the current session with the
                selected session's timetable. This action <strong>cannot be undone</strong>.
            </Step>
            <Step n={3} title="Review and Adjust After Import">
                After importing, go through each semester and update any slots that have changed —
                new faculty, room changes, added or removed subjects. Save each semester after editing.
            </Step>
            <Note type="warning">
                <strong>Do not use Import Data after you have already started allotment.</strong> It will
                overwrite everything — all your current entries will be permanently lost with no way to recover them.
            </Note>

            <SectionTitle>Making the Timetable</SectionTitle>
            <Step n={1} title="Select the Semester">
                On the allotment page, select the semester for which you want to set the timetable.
            </Step>
            <Step n={2} title="Add a Slot — Click the + Button">
                Click the <strong>+</strong> button in any cell to open the slot assignment form.
                You will see dropdowns for <strong>Subject</strong>, <strong>Room</strong>, and <strong>Faculty</strong>.
                Only subjects and faculty added for that semester will appear in the dropdowns.
            </Step>
            <Step n={3} title="Check Slot Availability">
                As you select options, the system shows:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li><strong style={{ color: T.success }}>Slot available</strong> — the room and faculty are free in this slot.</li>
                    <li><strong style={{ color: T.danger }}>Slot not available</strong> — a conflict exists. Check faculty and room availability for details.</li>
                </ul>
            </Step>
            <Step n={4} title="Override if Required">
                The slot availability message is a <strong>warning only</strong> — you can still save the
                data even if the slot is not available. Shared rooms and faculty will show both classes in
                the same slot. Always confirm with the concerned department before using shared resources.
            </Step>
            <Step n={5} title="Save the Semester Data">
                Click <strong>Save</strong> after completing each semester. The last saved timestamp appears
                above the semester. Data must be saved before switching to another semester — unsaved changes will be lost.
            </Step>

            <SectionTitle>Checking Faculty and Room Availability</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 16, fontSize: 13, color: '#374151', lineHeight: 1.7,
            }}>
                Use the dropdowns below the timetable grid on the allotment page to check faculty or room
                availability across departments. Only saved data is shown here (not locked data). This is
                useful for checking if another department's faculty, whose name you have added in Add Faculty,
                is already occupied in a given slot.
            </div>

            <Note type="warning">
                Room allotment between departments is <strong>not first-come-first-served</strong>. Saving a
                slot with a shared room does not prevent another department from saving the same room in the
                same slot. The system only warns — it does not block. Always coordinate with the other department.
            </Note>
            <Note type="tip">
                You can start allotment as soon as subjects are fixed, even before rooms and faculty are
                confirmed. Save with only the subject filled in, and come back later to add the room and faculty.
                This is useful for entries like Major Project where no room or faculty may be needed.
            </Note>

            <SectionTitle>First Year Allotment</SectionTitle>
            <Note type="info">
                First year timetable slots are fixed centrally by ITTC — departments only allot their
                faculty to pre-assigned slots. Locking is also done by ITTC, not by the department.
            </Note>
            <Step n={1} title="Open First Year Page">
                Click the <strong>First Year</strong> button in the Quick Actions section of the allotment
                page dashboard. This opens the First Year allotment page.
            </Step>
            <Step n={2} title="Review Available Subjects">
                At the top of the page, all subjects being taught by your department to first year students
                are listed, grouped by department. Each card shows the subject name, code, and type.
                Verify the list is correct — if any subject is missing or wrong, contact ITTC.
            </Step>
            <Step n={3} title="Add First Year Faculty">
                Click <strong>Add First Year Faculty</strong> to add the faculty members who will teach
                first year classes. This follows the same process as regular Add Faculty — select the
                first year semester and add faculty using the checkbox list.
            </Step>
            <Step n={4} title="Allot Faculty to Slots">
                Select the first year semester from the dropdown. The timetable grid appears with the
                slots pre-filled by ITTC. Dropdowns are available only for your department's subjects —
                assign the appropriate faculty to each slot.
            </Step>
            <Step n={5} title="Save Before Switching Semesters">
                Click <strong>Save</strong> (via the timetable grid) before switching to another first
                year semester. Unsaved changes are lost on semester switch.
            </Step>
            <Step n={6} title="Lock the First Year Timetable">
                Click <strong>Lock First Year Time Table</strong> on the page. This locks only the first
                year timetable for your department. Locking here is done by the department — it is
                separate from the main department timetable lock.
            </Step>
            <Note type="info">
                The <strong>Lock First Year Time Table</strong> button on the First Year page is available
                to the department. Locking makes the first year allotments visible in Master View for your
                department. Save all semester data before locking.
            </Note>
        </div>
    );
}

function TabLock() {
    return (
        <div>
            <Note type="key">
                The timetable will <strong>not appear on the XCEED Timetable page</strong> until it is
                published. Lock makes the data available internally (Master View, PDFs); Publish is what
                makes it visible to everyone and sends email notifications to all faculty.
            </Note>

            <SectionTitle>Status Cards on the Dashboard</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                    { color: '#3b82f6', label: 'Last Saved Time', desc: 'Shows when the current semester data was last saved. If this is more recent than Last Locked, the live version does not reflect your latest changes.' },
                    { color: '#f97316', label: 'Last Locked Time', desc: 'Shows when the timetable was last locked. The locked version is what appears in Master View and the PDFs.' },
                    { color: '#8b5cf6', label: 'Published Date', desc: 'Shows when the timetable was published and faculty emails were sent. Publish is a one-time action — the button is disabled after publishing.' },
                    { color: '#ef4444', label: 'Clash Detection', desc: 'Automatically scans for faculty and room clashes when the page loads. Shows green (no clashes) or red (clashes found) with a count. Click "View Clashes" to see details.' },
                ].map(c => (
                    <div key={c.label} style={{
                        background: '#fff', border: `2px solid ${c.color}30`,
                        borderLeft: `4px solid ${c.color}`,
                        borderRadius: 10, padding: '12px 16px',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: c.color, marginBottom: 5 }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.65 }}>{c.desc}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Action Icons — Next to Semester Selector</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                    { color: '#f97316', icon: '🔒', label: 'Lock Timetable', desc: 'Freezes the current saved data as the live version. All departments, faculty, and students see this locked version in Master View and PDFs. If the timetable was already published, you will be asked whether to notify faculty about the changes by email.' },
                    { color: '#10b981', icon: '✓', label: 'Publish Timetable', desc: 'Makes the timetable visible on the XCEED Timetable page and sends a notification email to all faculty. The timetable will NOT appear publicly until this is clicked. One-time action — button is disabled once published.' },
                    { color: '#3b82f6', icon: '👁', label: 'View Summary', desc: 'Opens the locked timetable summary in a new tab. Shows all semester, faculty, and room timetables based on the last locked version. Includes PDF download per semester, faculty, or room, and a Batch Download option for all PDFs at once.' },
                    { color: '#f59e0b', icon: '👤', label: 'Student Normalised Faculty Load', desc: 'Opens a detailed faculty load report normalised by student count. Shows how the teaching workload is distributed across faculty using Teaching Work Units (TWU). Useful for verifying equitable load distribution before submission.' },
                    { color: '#ec4899', icon: '👤', label: 'Subject Wise Faculty Load', desc: 'Opens the load allocation view showing each faculty member\'s subjects, hours, and load summary across all semesters. Used for official load allocation records.' },
                    { color: '#06b6d4', icon: '⬇', label: 'Download PDF', desc: 'Opens the PDF generation page in a new tab. Select a semester, faculty, or room and generate individual PDFs, or use Batch Download to get all timetable PDFs at once.' },
                ].map(c => (
                    <div key={c.label} style={{
                        background: '#f8f9ff', border: '1px solid #e4e8f5',
                        borderRadius: 10, padding: '12px 16px',
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                    }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                            background: `${c.color}18`, border: `1px solid ${c.color}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, color: c.color, fontWeight: 800,
                        }}>{c.icon}</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{c.label}</div>
                            <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.65 }}>{c.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            <SectionTitle>Lock → Publish Workflow</SectionTitle>
            <Step n={1} title="Save All Semesters">
                Ensure all semester data is saved. Unsaved data will not appear in the locked version.
                Check that Last Saved time on the dashboard reflects your most recent changes.
            </Step>
            <Step n={2} title="Lock the Timetable">
                Click the <strong>Lock icon</strong> (orange). The locked version is immediately visible
                in Master View and can be used to generate PDFs. Lock can be done multiple times —
                each lock overwrites the previous live version.
            </Step>
            <Step n={3} title="Review in View Summary">
                Click the <strong>View icon</strong> (blue) to review the locked timetable before
                publishing. Verify all semesters, check faculty load reports using the yellow and pink
                icons, and confirm the data is correct.
            </Step>
            <Step n={4} title="Publish — Make It Live on XCEED">
                Click the <strong>Publish icon</strong> (green ✓) on the allotment page dashboard.
                Publishing does two things simultaneously:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li>Makes the timetable visible on the <strong>XCEED Timetable page</strong> (xceed/timetable) for all students and faculty.</li>
                    <li>Sends a timetable notification <strong>email to all faculty</strong> in the department.</li>
                </ul>
                This is a <strong>one-time action</strong> — the Publish button is disabled once clicked.
                Confirm carefully before publishing. The Published Date card on the dashboard will show the timestamp once done.
            </Step>
            <Step n={5} title="Re-locking After Publish">
                If you need to make changes after publishing, update the slots, save, and lock again.
                When locking an already-published timetable, the system will ask:
                <em> "Do you want to inform the teachers about the timetable changes?"</em> — confirm
                Yes to send a change notification email to all faculty.
            </Step>

            <Note type="warning">
                After adding or modifying lunch slots, lock the timetable again —
                they will not appear in the locked view or PDFs until relocked.
            </Note>
            <Note type="key">
                Lock alone is not enough. The timetable only becomes publicly visible on
                xceed/timetable after you click <strong>Publish</strong>.
            </Note>

            <SectionTitle>PDF Output</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                    { title: 'Semester Timetable', desc: 'All slots for a semester — subject, room, and faculty per slot. One page per semester.', icon: '📘' },
                    { title: 'Faculty Timetable', desc: 'Full weekly schedule for a single faculty member across all subjects and semesters.', icon: '👤' },
                    { title: 'Room Timetable', desc: 'All classes scheduled in a room across all departments and semesters.', icon: '🏫' },
                ].map(c => (
                    <div key={c.title} style={{
                        background: '#f8f9ff', border: '1px solid #e4e8f5',
                        borderRadius: 10, padding: '14px 16px',
                    }}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{c.desc}</div>
                    </div>
                ))}
            </div>
            <Note type="tip">
                All PDFs use a uniform institute-wide format. Keep room and faculty names concise —
                long names increase column width and reduce readability in the printed output.
            </Note>
        </div>
    );
}

function TabOther() {
    return (
        <div>
            <SectionTitle>Clash Detection</SectionTitle>
            <div style={{
                background: '#fff5f5', border: '1px solid #fecaca',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    The dashboard automatically scans for faculty and room clashes every time the page
                    loads. The <strong>Clash Detection</strong> card on the dashboard shows the result
                    in real time — it starts as <em>"Searching…"</em> and updates to either
                    <strong style={{ color: '#10b981' }}> No Clashes Found</strong> or
                    <strong style={{ color: '#ef4444' }}> X Clash(es) Found</strong>.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>A <strong>clash</strong> occurs when the same faculty member or room is assigned to two different classes in the same slot.</li>
                    <li>If clashes are found, a <strong>View Clashes</strong> button appears on the card. Click it to open the Clashes page in a new tab.</li>
                    <li>The Clashes page shows clashes grouped by department and session. Select a session to see which slots, faculty, and rooms are in conflict.</li>
                    <li>Departments with incomplete timetables (empty semesters) are listed separately under a <em>Needs Attention</em> section.</li>
                    <li>Resolve clashes by going back to the allotment page and correcting the conflicting assignments, then lock again.</li>
                </ul>
            </div>
            <Note type="warning">
                Clash detection runs on <strong>saved</strong> data, not locked data. Fix all clashes
                before locking — the locked version is what faculty and students see.
            </Note>

            <SectionTitle>Master View</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Master View lets you see the <strong>locked</strong> timetable of any department, faculty,
                    or room across the institute for a session — not just your own department.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Select the <strong>Session</strong> and <strong>Department</strong>, then choose a semester, faculty, or room.</li>
                    <li>Only locked slots are shown — data that is saved but not locked will not appear here.</li>
                    <li>The allotment page shows data based on saved state; this page shows based on locked state — there may be differences.</li>
                    <li>PDF download is available directly from this page.</li>
                </ul>
            </div>

            <SectionTitle>Add Note</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Notes can be attached to a semester and/or faculty. A note entered for both a semester
                    and faculty will appear in both the semester timetable and the faculty timetable PDFs.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Click <strong>Add Note</strong> on the allotment page.</li>
                    <li>Select the semester and/or faculty, enter the note text, and save.</li>
                    <li>Existing notes appear in a table with edit and delete options.</li>
                </ul>
            </div>

            <SectionTitle>Add Common Load</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Common Load adds faculty workload for activities that don't appear as a slot in the
                    semester timetable — such as Major Project, Minor Project, or dissertation supervision.
                    The load is added to the faculty's load summary table.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Click <strong>Add Common Load</strong> on the allotment page.</li>
                    <li>Select the faculty, enter the subject code, name, type, semester, and number of hours.</li>
                    <li>Added entries appear in the common load table and can be deleted.</li>
                </ul>
            </div>

            <SectionTitle>Lunch Slot Allotment</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Lunch slots allow additional load to be allotted during lunch hours — not part of the
                    regular timetable grid.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Click <strong>Add Lunch Slot</strong> on the allotment page.</li>
                    <li>Select the semester, then click <strong>Add Lunch Slot</strong>. Choose the day, subject, room, and faculty.</li>
                    <li>Multiple lunch slots can be added. Entries can be deleted.</li>
                    <li>Click <strong>Submit</strong> to save for that semester. Save each semester before switching to another.</li>
                    <li><strong>Lock the timetable again</strong> after adding lunch slots for them to appear in the locked view and PDF.</li>
                </ul>
            </div>

            <SectionTitle>First Year Faculty Allotment</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    First year timetable slots are fixed by ITTC. Departments can allot their faculty to
                    those pre-fixed slots. Only the faculty column is editable — subject, room, and slot
                    are controlled by ITTC.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Click <strong>First Year</strong> on the allotment page.</li>
                    <li>The top section shows subjects being offered to first year students — verify and contact ITTC for any discrepancies.</li>
                    <li>Click <strong>Add First Year Faculty</strong> to add faculty semester-wise (same process as regular Add Faculty).</li>
                    <li>Select the first year semester from the dropdown. The timetable grid appears with dropdowns only for subjects taught by your department's faculty.</li>
                    <li>Allot faculty in the available slots and <strong>save</strong> before moving to the next semester.</li>
                    <li>Click <strong>Lock First Year Time Table</strong> on the First Year page to lock the allotment. This is done by the department — it is separate from the main timetable lock. Once locked, the first year allotments are visible in Master View.</li>
                </ul>
            </div>

            <SectionTitle>Open Elective Allotment</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Open elective courses are allotted differently depending on the department type.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li><strong>Engineering branches</strong>: Allot open elective subjects in the relevant semester timetable (e.g., 6th sem OE in the 6th sem TT). Select the room allotted for open elective in the concerned slot. Do not use an open elective classroom for any other slot — these rooms are allotted to other departments in other slots.</li>
                    <li><strong>Physics, Chemistry, Mathematics, Humanities</strong>: A separate semester named <strong>Open Elective</strong> is created for your department. Use that semester to allot open elective slots.</li>
                </ul>
            </div>

            <Note type="warning">
                Open elective rooms are allotted centrally by ITTC for specific slots. Using an open elective
                classroom in a different slot will conflict with another department's allocation.
            </Note>

            <SectionTitle>Email Notifications</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[
                    {
                        trigger: 'On Publish',
                        color: '#10b981',
                        desc: 'When you click the Publish icon (green ✓) on the allotment page, an email is automatically sent to every faculty member in the department. The email contains their individual timetable so they know their schedule without having to look it up.',
                    },
                    {
                        trigger: 'On Re-lock After Publish',
                        color: '#f97316',
                        desc: 'If you lock the timetable again after it has already been published (e.g., to fix a slot), the system will ask: "Do you want to inform the teachers about the timetable changes?" Selecting Yes sends a change notification email to all faculty. Selecting No locks silently without any email.',
                    },
                ].map(c => (
                    <div key={c.trigger} style={{
                        background: '#f8f9ff', border: '1px solid #e4e8f5',
                        borderRadius: 10, padding: '12px 16px',
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                    }}>
                        <div style={{
                            flexShrink: 0, marginTop: 2,
                            background: `${c.color}18`, border: `1px solid ${c.color}40`,
                            color: c.color, fontWeight: 700, fontSize: 11,
                            padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                        }}>{c.trigger}</div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{c.desc}</div>
                    </div>
                ))}
            </div>
            <Note type="tip">
                Always lock the timetable and verify it in View Summary before publishing.
                The publish email goes out immediately — faculty cannot be un-notified once the email is sent.
            </Note>
        </div>
    );
}

// ── developers tab ────────────────────────────────────────────────────────────
// Commits scoped to: client/src/timetableadmin/, server/src/modules/timetableModule/,
//                    server/src/models/timetableModule/

const TT_DEVS_BY_YEAR = {
    2023: {
        metric: 'commits',
        devs: [
            { name: 'Dr. D. Harimurugan', github: 'harimurugan1989', count: 219, prs: 9  },
            { name: 'Akshika Garg',       github: 'Akshikagarg',     count: 34,  prs: 22 },
            { name: 'pihu24',             github: 'pihu24',          count: 33,  prs: 23 },
            { name: 'Dhruv Bhardwaj',     github: 'dhruv064',        count: 19,  prs: 12 },
            { name: 'Maddy',              github: 'Maddy091',         count: 4,   prs: 3  },
            { name: 'Sourabh Parihar',    github: 'sourabh-parihar', count: 4,   prs: 2  },
            { name: 'Gautam Singla',      github: 'ggsingla',        count: 1,   prs: 1  },
            { name: 'sDaman830',          github: null,               count: 0,   prs: 2  },
            { name: 'Kashish Mangal',     github: 'Kashish-gitt',    count: 0,   prs: 1  },
        ],
    },
    2024: {
        metric: 'commits',
        devs: [
            { name: 'Dr. D. Harimurugan', github: 'harimurugan1989', count: 43,  prs: 1  },
            { name: 'Akshika Garg',       github: 'Akshikagarg',     count: 11,  prs: 7  },
            { name: 'Ankit',              github: 'i-ankit-here',    count: 10              },
            { name: 'Jagjit',             github: 'Jagjit0306',      count: 9,   prs: 1  },
            { name: 'pihu24',             github: 'pihu24',          count: 4,   prs: 4  },
            { name: 'Dhruv Bhardwaj',     github: 'dhruv064',        count: 2,   prs: 1  },
            { name: 'Maddy',              github: 'Maddy091',         count: 1,   prs: 1  },
            { name: 'Gautam Singla',      github: 'ggsingla',        count: 1,   prs: 1  },
            { name: 'Sumit Teerthani',    github: 'SumitTeerthani',  count: 0,   prs: 2  },
            { name: 'Ajay Kumar Yadav',   github: 'Ajay1105',        count: 0,   prs: 1  },
            { name: 'Ayush Kumar',        github: 'Akdest',          count: 0,   prs: 1  },
            { name: 'Anurag Varshney',    github: 'AnuragVar',       count: 0,   prs: 1  },
        ],
    },
    2025: {
        metric: 'commits',
        devs: [
            { name: 'Dr. D. Harimurugan', github: 'harimurugan1989',    count: 51 },
            { name: 'Saksham Kaushish',   github: null,                  count: 15 },
            { name: 'Pallvi Saini',       github: null,                  count: 6  },
            { name: 'One Eyed Reaper',    github: 'PiercedBySanity1410', count: 6  },
            { name: 'Anshika',            github: 'Anshika5618',         count: 6  },
            { name: 'Vaibhav Verma',      github: 'vaibhav0047',        count: 5  },
            { name: 'Sritiz Sahu',        github: 'sritiz',              count: 4  },
            { name: 'Pranjal Singla',     github: 'pranjal-singla-15',  count: 2  },
            { name: 'Ishan Jain',         github: 'Ishannjain',          count: 1  },
            { name: 'Jashandeep Singh',   github: null,                  count: 1  },
        ],
    },
    2026: {
        metric: 'commits',
        devs: [
            { name: 'Dr. D. Harimurugan', github: 'harimurugan1989',    count: 71 },
            { name: 'One Eyed Reaper',    github: 'PiercedBySanity1410', count: 7  },
            { name: 'Pallvi Saini',       github: null,                  count: 6  },
            { name: 'Vaibhav Verma',      github: 'vaibhav0047',        count: 5  },
            { name: 'Sritiz Sahu',        github: 'sritiz',              count: 4  },
            { name: 'Samiksha Khaire',    github: null,                  count: 4  },
            { name: 'Manik Dureja',       github: 'manikdureja',        count: 2  },
            { name: 'Anmoldeep Kaur',     github: 'anmolkaur92',        count: 1  },
        ],
    },
};

function TTDevCard({ dev, rank, metric }) {
    const isFirst = rank === 0;
    const accentColor = isFirst ? '#6366f1' : '#374151';
    const bgColor     = isFirst ? '#eef2ff' : '#f9fafb';
    const borderColor = isFirst ? '#c7d2fe' : '#e5e7eb';

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
                background: isFirst ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#6b7280,#9ca3af)',
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
            {dev.count > 0 && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{dev.count}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{metric}</div>
                </div>
            )}
        </div>
    );
}

function TabDevelopers() {
    const years = Object.keys(TT_DEVS_BY_YEAR).map(Number).sort((a, b) => b - a);
    const allDevs = years.flatMap(y => TT_DEVS_BY_YEAR[y].devs);
    const totalDevs = new Set(allDevs.map(d => d.name)).size;

    return (
        <div>
            <SectionTitle>Developers & Contributors</SectionTitle>
            <Note type="key">
                Scoped to timetable module files — frontend, backend controllers/models.
                Ordered by commits; PR badge shown where available.
            </Note>

            {years.map(year => {
                const { metric, devs } = TT_DEVS_BY_YEAR[year];
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
                            {devs.map((d, i) => <TTDevCard key={d.name} dev={d} rank={i} metric={metric} />)}
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

// ── main component ────────────────────────────────────────────────────────────

export default function TTManual({ standalone = false }) {
    const [tab, setTab] = useState('overview');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showDevs, setShowDevs] = useState(false);

    useEffect(() => {
        if (!standalone) return;
        fetch(`${getEnvironment()}/user/getuser/`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setIsAuthenticated(true); })
            .catch(() => {});
    }, [standalone]);

    const TAB_CONTENT = {
        overview:  <TabOverview setTab={setTab} />,
        setup:     <TabSetup />,
        allotment: <TabAllotment />,
        lock:      <TabLock />,
        other:     <TabOther />,
    };

    const activeIdx = TABS.findIndex(t => t.id === tab);

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
                            Timetable Module — User Manual
                        </span>
                    </div>
                    {isAuthenticated && (
                        <a href="/tt/dashboard" style={{
                            fontSize: 13, fontWeight: 600, color: '#a5b4fc',
                            textDecoration: 'none', padding: '6px 14px',
                            border: '1px solid #4338ca', borderRadius: 7,
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
                {/* Header */}
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20,
                    }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Timetable Module — User Manual</div>
                        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>
                            Step-by-step guide · XCEED, NIT Jallandhar
                        </div>
                    </div>
                    <button
                        onClick={() => setShowDevs(v => !v)}
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
                </div>

                {showDevs ? (
                    <div style={{
                        background: '#fff', borderRadius: 12,
                        border: '1px solid #e4e8f5',
                        padding: '28px 32px',
                        boxShadow: '0 1px 6px rgba(26,31,60,0.05)',
                    }}>
                        <TabDevelopers />
                    </div>
                ) : (<>

                {/* Step navigator */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
                    {TABS.map((t, i) => {
                        const active = tab === t.id;
                        const done = activeIdx > i;
                        const bgColor = active ? T.accent : done ? '#10b981' : '#f1f5f9';
                        const numColor = active || done ? '#fff' : '#94a3b8';
                        const labelColor = active ? T.accent : done ? '#10b981' : T.textMuted;
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

                {/* Content */}
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
