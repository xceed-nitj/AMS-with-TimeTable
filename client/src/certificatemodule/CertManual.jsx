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
    { id: 'overview',     label: 'Overview',              icon: '🗂️' },
    { id: 'setup',        label: 'Event Setup',           icon: '⚙️' },
    { id: 'design',       label: 'Certificate Design',    icon: '🎨' },
    { id: 'participants', label: 'Participants & Emails', icon: '📧' },
    { id: 'lock',         label: 'Lock & Public Page',     icon: '🔒' },
];

// ── tab content ───────────────────────────────────────────────────────────────

function TabOverview({ setTab }) {
    return (
        <div>
            <Note type="key">
                The Certificate Module lets an event organizer register an event, design one or more
                certificate templates for it, load a list of participants, and email each participant a
                unique, permanent link to their own personalised certificate — which they can view and
                download with <strong>no login required</strong>. Locking the event freezes everything so
                nothing can be altered further.
            </Note>

            <SectionTitle>What This Module Does</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                    { icon: '🎨', title: 'Pre-built Templates', desc: '23 ready-made certificate designs (Basic + Premium) — fill in text, logos, and signatures rather than building a layout from scratch.' },
                    { icon: '🏷️', title: 'Per-Type Designs', desc: 'Design a separate certificate for each type you plan to issue — Winner, Participant, Speaker, Organizer — each saved independently.' },
                    { icon: '🔗', title: 'Merge-Field Variables', desc: 'Insert placeholders like {{name}} and {{department}} into the certificate body — each participant\'s certificate is auto-filled with their own data.' },
                    { icon: '📧', title: 'One-Click Distribution', desc: 'Send every participant a unique certificate link by email in a single action — re-sending only reaches participants who haven\'t received theirs yet.' },
                    { icon: '✅', title: 'QR Verification', desc: 'Optionally stamp a QR code on the certificate that links back to its own public page, for third parties to verify authenticity.' },
                    { icon: '🔒', title: 'One-Way Lock', desc: 'Locking an event freezes all certificate and participant data on the backend. Only an admin can unlock it again.' },
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
                    { n: 1, icon: '⚙️', label: 'Create Event', sub: 'Name · Date · Plan', tab: 'setup' },
                    { n: 2, icon: '🎨', label: 'Design Certificate', sub: 'Per certificate type', tab: 'design' },
                    { n: 3, icon: '📧', label: 'Add & Email Participants', sub: 'Upload · send links', tab: 'participants' },
                    { n: 4, icon: '🔒', label: 'Lock the Event', sub: 'Freeze everything', tab: 'lock' },
                ].map((s, i) => (
                    <div key={s.n} style={{
                        flex: 1, padding: '16px 14px', textAlign: 'center',
                        borderRight: i < 3 ? '1px solid #e4e8f5' : 'none',
                        cursor: 'pointer',
                    }} onClick={() => setTab(s.tab)}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: T.accent }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Who Does What</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
                {[
                    {
                        icon: '🛠️', title: 'Admin', color: '#6366f1',
                        items: [
                            'Assigns events to users (auto-grants the CM role)',
                            'Can unlock or delete any event',
                            'Manages any user\'s uploaded logos and signatures',
                        ],
                    },
                    {
                        icon: '🎓', title: 'Event Organizer (CM)', color: '#10b981',
                        items: [
                            'Creates events for themselves (once they have the CM role)',
                            'Designs certificates, uploads participants, sends emails',
                            'Can lock an event — but cannot unlock it themselves',
                        ],
                    },
                    {
                        icon: '👤', title: 'Participant', color: '#f59e0b',
                        items: [
                            'No account or login needed',
                            'Receives a unique certificate link by email',
                            'Views and downloads their certificate as an image',
                        ],
                    },
                ].map(u => (
                    <div key={u.title} style={{
                        background: '#fff', border: `1px solid ${u.color}33`,
                        borderLeft: `4px solid ${u.color}`,
                        borderRadius: 10, padding: '14px 16px',
                    }}>
                        <div style={{ fontSize: 18, marginBottom: 6 }}>{u.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>{u.title}</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#6b7280', lineHeight: 1.75 }}>
                            {u.items.map(i => <li key={i}>{i}</li>)}
                        </ul>
                    </div>
                ))}
            </div>

            <SectionTitle>Important Notes</SectionTitle>
            <Note type="warning">
                <strong>One event campaign at a time.</strong> The <strong>Add New Event</strong> button on
                the CM Dashboard stays disabled until every one of your existing events is locked. Finish
                and lock the current event before starting the next one.
            </Note>
            <Note type="warning">
                <strong>Locking is one-way for the organizer.</strong> Once locked, no certificate content
                or participant data can be edited, added, or deleted — this is enforced on the server, not
                just hidden in the UI. Only an admin can unlock an event.
            </Note>
            <Note type="tip">
                Follow the steps in order — Event Setup → Certificate Design → Participants & Emails →
                Lock. Design your certificate for each type <em>before</em> uploading participants of that type,
                so the merge fields render correctly.
            </Note>
        </div>
    );
}

function TabSetup() {
    return (
        <div>
            <Note type="info">
                An event can be created in one of two ways — by an admin assigning it to a user, or by a
                user who already has the organizer (CM) role creating it themselves.
            </Note>

            <SectionTitle>Way 1 — Admin Assigns an Event</SectionTitle>
            <Step n={1} title="Open the Admin Event Console">
                Navigate to <strong>Assign Event</strong> (route <code>/cm/addevent</code>). This screen is
                only for admins.
            </Step>
            <Step n={2} title="Pick or Type the User">
                Select an existing user, or type in a new one, who will organise this event.
            </Step>
            <Step n={3} title="Fill in Event Details">
                Enter <strong>Event Name</strong>, <strong>Event Date</strong>, and <strong>Plan</strong>
                (Basic / Premium — defaults to Basic), then submit.
            </Step>
            <Note type="tip">
                Assigning an event to a user for the first time automatically grants them the
                <strong> CM (organizer)</strong> role — no separate role-management step is needed.
            </Note>

            <SectionTitle>Way 2 — Self-Service (Existing CM Users)</SectionTitle>
            <Step n={1} title="Open Create Event">
                A user who already has the CM role goes to <strong>Create Event</strong>
                (route <code>/cm/useraddevent</code>).
            </Step>
            <Step n={2} title="Fill in the Same Three Fields">
                Enter <strong>Event Name</strong>, <strong>Event Date</strong>, and <strong>Plan</strong>,
                then click <strong>Submit</strong>.
            </Step>
            <Note type="info">
                <strong>Plan</strong> (Basic/Premium) is a record-keeping field only — it does not restrict
                which of the 23 certificate templates you can pick from in the design step.
            </Note>

            <SectionTitle>CM Dashboard</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 16,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    The CM Dashboard lists all events belonging to the logged-in organizer, with columns:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li><strong>Event Name</strong> and <strong>Event Date</strong></li>
                    <li><strong>Certificates</strong> (pencil icon) — opens the Certificate Design page for this event</li>
                    <li><strong>Participants</strong> (people icon) — opens the Participants &amp; Emails page for this event</li>
                    <li><strong>Total</strong> and <strong>Issued</strong> — participant count vs. certificates emailed so far</li>
                    <li><strong>Status</strong> — a lock icon (click to lock), or "Locked on &lt;date&gt;" once locked</li>
                </ul>
            </div>

            <Note type="warning">
                The <strong>Add New Event</strong> button is disabled unless all of your existing events
                are locked (or you have none yet). If some are still unlocked, clicking it shows
                <em> "Action Required — Please lock all previous events before adding a new one."</em>
            </Note>
        </div>
    );
}

function TabDesign() {
    return (
        <div>
            <Note type="key">
                Certificate designs are saved <strong>per certificate type</strong> — Winner, Participant,
                Speaker, and Organizer each have their own independent design. Repeat this entire step once
                for every certificate type you intend to issue for the event.
            </Note>

            <SectionTitle>Step-by-Step — Designing a Certificate</SectionTitle>

            <Step n={1} title="Open Certificate Design">
                From the CM Dashboard, click the <strong>Certificates</strong> (pencil) icon for an event.
                A live preview of the certificate appears alongside the form as you fill it in.
            </Step>

            <Step n={2} title="Select Certificate Type">
                Choose <strong>Winner</strong>, <strong>Participant</strong>, <strong>Speaker</strong>, or
                <strong> Organizer</strong> from the dropdown. Everything you fill in below is saved
                against this specific type — switching the type loads (or starts) a separate design.
            </Step>

            <Step n={3} title="Name of the Institute">
                Enter one or more title lines, each with its own font size, family, color, bold, and italic
                controls. Use <strong>Add another</strong> for multi-line titles.
            </Step>

            <Step n={4} title="Select Certificate Template">
                Pick a design from the template gallery — <strong>23 pre-built templates</strong> (Basic
                and Premium styles). These are fixed layouts, not a freeform editor: the fields you fill in
                (text, logos, signatures) are injected into whichever template you choose.
            </Step>

            <Step n={5} title="Logos (up to 4)">
                Upload logo images (JPG/PNG). Each logo has its own <strong>Vertical Position</strong> and
                <strong> Size</strong> fields under "Advanced settings". The Add-another button disables
                once you have 4 logos.
            </Step>

            <Step n={6} title="Department / Club and Certificate Heading">
                Fill in one or more <strong>Department or Club</strong> header lines (same styling
                controls), then the main heading text in <strong>Certificate</strong> — e.g.
                "CERTIFICATE OF APPRECIATION".
            </Step>

            <Step n={7} title="Body of the Certificate — Using Variables">
                Write the certificate wording in the body textarea. Click <strong>See variables</strong>
                to reveal clickable chips for <code>{'{{name}}'}</code>, <code>{'{{department}}'}</code>,
                <code>{'{{college}}'}</code>, <code>{'{{teamName}}'}</code>, <code>{'{{position}}'}</code>,
                <code>{'{{title1}}'}</code>, and <code>{'{{title2}}'}</code>. Clicking a chip copies the
                placeholder to your clipboard so you can paste it into the body — it is replaced with each
                participant's own data when their certificate is rendered.
            </Step>

            <Step n={8} title="Signatures">
                Add one or more signature blocks — each with a <strong>Name</strong> and
                <strong> Position</strong> (job title, both stylable), and an image upload for the
                signature itself.
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                    <li><strong>Use existing signature with details</strong> — reuse a signature already
                    uploaded for this event instead of uploading it again.</li>
                    <li><strong>Remove Background</strong> — converts white pixels in the uploaded
                    signature image to transparent, so it blends into the certificate background.</li>
                </ul>
            </Step>

            <Step n={9} title="QR Code with Verifiable Link">
                Toggle <strong>Required</strong> to stamp a QR code onto the certificate that links back to
                its own public page — useful for third parties to verify a certificate is genuine.
            </Step>

            <Step n={10} title="Date of Issue and Save">
                Set the <strong>Date of issue</strong> (defaults to today), then click
                <strong> Save Changes</strong>. This saves the design for the selected certificate type only.
            </Step>

            <Note type="tip">
                Design and save all the certificate types you plan to use (e.g. both Winner and
                Participant) before moving on to upload participants — a participant's certificate cannot
                render correctly if no design exists yet for their assigned certificate type.
            </Note>
        </div>
    );
}

function TabParticipants() {
    return (
        <div>
            <Note type="info">
                Open the <strong>Participants</strong> (people icon) link for an event from the CM Dashboard
                to reach this page.
            </Note>

            <SectionTitle>Adding Participants — Batch Upload (Recommended for Bulk)</SectionTitle>
            <Step n={1} title="Download the Template">
                Click the download icon ("Download participants Excel template") to get the reference
                <code> .xlsx</code> file.
            </Step>
            <Step n={2} title="Fill in the Template">
                Enter one row per participant. Exact column headers, in order:
                <div style={{
                    background: '#0f172a', color: '#e2e8f0', borderRadius: 8,
                    padding: '14px 18px', fontFamily: 'monospace', fontSize: 12,
                    margin: '10px 0', lineHeight: 1.9,
                }}>
                    name | department | college | mailId | certiType | teamName | position | title1 | title2
                </div>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.9, fontSize: 13 }}>
                    <li><strong>certiType</strong> should be one of <code>winner</code>, <code>participant</code>,
                    <code>speaker</code>, or <code>organizer</code> — matching a certificate design you've
                    already saved for that type.</li>
                    <li>Sample row: <code>hari | ee | nitj | harimur@gmail.com | winner | XCEED | first | no idea | no idea</code></li>
                </ul>
            </Step>
            <Step n={3} title="Upload the File">
                Choose the completed <code>.xlsx</code> file and click the upload (arrow) icon. Each row
                becomes one participant record.
            </Step>
            <Note type="warning">
                The batch template has <strong>no "Type" column</strong>. If you need the extra "Type of the
                event" field on a participant, add or edit that participant manually instead.
            </Note>

            <SectionTitle>Adding a Participant Manually</SectionTitle>
            <Step n={1} title="Open the Manual Form">
                Click <strong>+ Add Participant Manually</strong>.
            </Step>
            <Step n={2} title="Fill in the Fields">
                Name, Department, College, Type, Team Name, Position, Title-1, Title-2, Email, and
                Certificate Type (Winner / Participant / Speaker / Organizer). Only <strong>Name</strong>,
                <strong> Certificate Type</strong>, and <strong>E-mail</strong> are required.
            </Step>
            <Step n={3} title="Save">
                Click <strong>Save New Participant Data</strong>. The new participant appears in the table below.
            </Step>

            <SectionTitle>Participants Table</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 16,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Each row shows the participant's details plus:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li><strong>Certificate Link</strong> — a "View" link to that participant's public certificate page.</li>
                    <li><strong>Mail Status</strong> — Sent (green) or Not sent (red).</li>
                    <li><strong>Actions</strong> — edit (pencil), delete (trash), and send-mail (envelope) for that one participant.</li>
                </ul>
            </div>

            <SectionTitle>Sending Certificate Emails</SectionTitle>
            <Step n={1} title="Send to Everyone at Once">
                Click the mail icon at the top of the table ("Send email to all participants"). Each
                participant receives an email with the subject
                <em> "&lt;Event Name&gt;: Your certificate is here!"</em> containing their unique certificate link.
            </Step>
            <Step n={2} title="Send to One Participant">
                Use the per-row envelope icon to (re)send the email to just that participant.
            </Step>
            <Note type="tip">
                Sending to "all participants" is <strong>idempotent</strong> — it automatically skips anyone
                whose mail status is already "Sent". You can safely re-click it after adding new participants
                without spamming everyone else again.
            </Note>
        </div>
    );
}

function TabLock() {
    return (
        <div>
            <SectionTitle>The Public Certificate Page</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Each participant's certificate email contains a unique link
                    (<code>/cm/c/&lt;eventId&gt;/&lt;participantId&gt;</code>) to a public page — no login
                    is required to view it.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>The page loads the saved design for that participant's certificate type and fills
                    in their name, department, college, and other merge-field values.</li>
                    <li>If QR verification was enabled at design time, a QR code pointing back to this same
                    page is rendered on the certificate.</li>
                    <li>A <strong>Download Image</strong> button rasterises the on-screen certificate and
                    downloads it as a PNG file.</li>
                </ul>
            </div>
            <Note type="info">
                The link itself is the only thing that keeps a certificate private-ish — anyone who has the
                link can view and download that certificate without logging in. Only share it via the
                participant's own email.
            </Note>

            <SectionTitle>Locking an Event</SectionTitle>
            <Step n={1} title="When to Lock">
                Lock an event once you've finished designing all certificate types, uploaded/added all
                participants, and sent all certificate emails.
            </Step>
            <Step n={2} title="Click the Lock Icon">
                On the CM Dashboard, click the lock icon in the Status column for the event. A confirmation
                dialog appears: <em>"Sure? You wont be able to edit any content once locked!"</em>
            </Step>
            <Step n={3} title="Confirm">
                Confirming sets the event to locked. The Status column now shows "Locked on &lt;date&gt;".
            </Step>

            <Note type="warning">
                <strong>Locking is enforced on the server, not just the UI.</strong> Once locked, every
                mutating action — editing certificate designs, and adding, editing, batch-uploading, or
                deleting participants — is rejected with "Event Locked". This is a one-way action for the
                organizer.
            </Note>

            <SectionTitle>Reversing a Lock — Admin Only</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 16,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    A CM (organizer) cannot unlock their own event. If a correction is needed after locking,
                    an admin must intervene using the following admin-only screens:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li><strong>User Events</strong> (<code>/cm/userevents/&lt;userId&gt;</code>) — unlock or
                    permanently delete any of that user's events.</li>
                    <li><strong>User Logos</strong> (<code>/cm/userimages/logos/&lt;userId&gt;</code>) — view
                    and delete any logo the user has uploaded, across all their certificates.</li>
                    <li><strong>User Signatures</strong> (<code>/cm/userimages/signatures/&lt;userId&gt;</code>)
                    — view and delete any signature the user has uploaded.</li>
                </ul>
            </div>
            <Note type="tip">
                Contact an admin if you need to reopen a locked event — they can unlock it from the
                User Events screen so you can resume editing.
            </Note>
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CertManual({ standalone = false }) {
    const [tab, setTab] = useState('overview');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (!standalone) return;
        fetch(`${getEnvironment()}/user/getuser/`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setIsAuthenticated(true); })
            .catch(() => {});
    }, [standalone]);

    const TAB_CONTENT = {
        overview:     <TabOverview setTab={setTab} />,
        setup:        <TabSetup />,
        design:       <TabDesign />,
        participants: <TabParticipants />,
        lock:         <TabLock />,
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
                            Certificate Module — User Manual
                        </span>
                    </div>
                    {isAuthenticated && (
                        <a href="/cm/dashboard" style={{
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
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Certificate Module — User Manual</div>
                        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>
                            Step-by-step guide · XCEED, NIT Jalandhar
                        </div>
                    </div>
                </div>

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
            </div>
        </>
    );
}
