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
    { id: 'setup',        label: 'Getting Started',       icon: '⚙️' },
    { id: 'content',      label: 'Content Sections',      icon: '📄' },
    { id: 'participants', label: 'Participants & Payment', icon: '👥' },
    { id: 'other',        label: 'Tips & Gotchas',        icon: '🔧' },
];

// ── tab content ───────────────────────────────────────────────────────────────

function TabOverview({ setTab }) {
    return (
        <div>
            <Note type="key">
                The Conference Module is a self-service content manager for building and running an
                academic conference's public microsite and back-office records — speakers, committees,
                sponsors, schedule, venue, accommodation, and participants. It supports
                <strong> multiple independent conferences</strong> side by side, each identified by its own
                conference ID, each with its own admin panel.
            </Note>

            <SectionTitle>What This Module Does</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                    { icon: '🏛️', title: 'Multi-Conference Support', desc: 'Every conference is a separate record with its own ID. All content — speakers, sponsors, schedule, etc. — is scoped to that one conference.' },
                    { icon: '📝', title: 'Section-by-Section Content', desc: 'Sixteen content sections (tabs) cover everything from the About page to accommodation and sponsorship rates.' },
                    { icon: '🌐', title: 'No Publish Step', desc: 'There is no master "Publish" button. Each item has its own Feature/Featured toggle and Sequence number controlling whether and where it shows.' },
                    { icon: '👁️', title: 'Public Read Access', desc: 'All content is readable without logging in — only creating and deleting records requires an Event Organizer (EO) or admin login.' },
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
                    { n: 1, icon: '⚙️', label: 'Create Conference', sub: 'Name · Email', tab: 'setup' },
                    { n: 2, icon: '🏠', label: 'About & Navbar', sub: 'Core details', tab: 'setup' },
                    { n: 3, icon: '📄', label: 'Fill Content Sections', sub: 'Speakers, sponsors, schedule…', tab: 'content' },
                    { n: 4, icon: '👥', label: 'Participants & Payment', sub: 'Authors · registration link', tab: 'participants' },
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

            <SectionTitle>Roles</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                {[
                    {
                        icon: '🎓', title: 'Event Organizer (EO) / Admin', color: '#6366f1',
                        items: [
                            'Creates and deletes conferences and their content records',
                            'Fills in every content section from the admin panel',
                            'Updating existing records is generally not role-gated',
                        ],
                    },
                    {
                        icon: '🌐', title: 'Public Visitor', color: '#10b981',
                        items: [
                            'No account or login needed to read conference data',
                            'Registers/pays via the external Payment Portal link',
                            'Content visibility is controlled by Feature/Sequence, not by login',
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
                <strong>About, Navbar, and Location are one-per-conference.</strong> Trying to add a second
                record for any of these three sections is blocked — use that section's Update action instead.
            </Note>
            <Note type="info">
                The <strong>Payment Portal</strong> currently opens a fixed external registration site and
                is not specific to any one conference — treat it as a placeholder until a dedicated
                in-app payment flow is added.
            </Note>
            <Note type="tip">
                See the <strong>Tips &amp; Gotchas</strong> tab for the direct URLs to sections that aren't
                shown as clickable tabs in the admin sidebar.
            </Note>
        </div>
    );
}

function TabSetup() {
    return (
        <div>
            <SectionTitle>Step 1 — Create the Conference</SectionTitle>
            <Step n={1} title="Open Create Conference">
                Navigate to <strong>Create a New Conference</strong> (route <code>/cf/addconf</code>).
            </Step>
            <Step n={2} title="Fill in Name and Email">
                Enter the <strong>Name of the Conference</strong> and an <strong>Email</strong>, then click
                <strong> Add</strong>. Each conference must use a unique email.
            </Step>
            <Note type="warning">
                The <strong>Existing Conferences</strong> table on this same page lists <em>every</em>
                conference in the system, not just yours — don't confuse it with your own conference list
                (see Step 2 below).
            </Note>

            <SectionTitle>Step 2 — Find Your Conference</SectionTitle>
            <Step n={1} title="Open Your Dashboard">
                Go to your <strong>Dashboard</strong> (route <code>/cf/dashboard</code>) — this lists only
                the conferences that belong to you.
            </Step>
            <Step n={2} title="Open the Admin Panel">
                Click <strong>Adminpanel</strong> next to your conference to open
                <code> /cf/&lt;confid&gt;</code>, which defaults to the <strong>Home</strong> tab.
            </Step>

            <SectionTitle>Step 3 — About Conference (Home Tab)</SectionTitle>
            <Step n={1} title="Fill in Core Details">
                On the <strong>Home</strong> tab, enter: Name of the Conference, Starting/Ending Date,
                YouTube Link, Instagram Link, Facebook Link, Twitter Link, Logo, Short Name of Conference,
                Abstract Link, Registration Link, Flyer Link, Brochure Link, and Poster Link.
            </Step>
            <Step n={2} title="Add About Sections">
                Add one or more rich-text <strong>About</strong> sections (title + body). Use
                <strong> Insert Table</strong> for tabular content and <strong>Show/Hide HTML</strong> to
                edit the raw HTML directly. Use <strong>Add New About</strong> for additional sections, and
                <strong> Update</strong>/<strong>Delete</strong> to manage existing ones.
            </Step>
            <Step n={3} title="Save">
                Click <strong>Add Conference Info</strong> the first time; the button becomes
                <strong> Update Conference Info</strong> once a record already exists.
            </Step>
            <Note type="warning">
                <strong>Home info is a singleton per conference.</strong> Trying to add a second record
                triggers <em>"You cannot Add multiple values of this for one conference"</em> — edit the
                existing one instead.
            </Note>
            <Note type="tip">
                Running a recurring/annual conference? Use <strong>Import from Conference</strong> to copy
                Home fields (dates, links, etc.) from a previous conference as a starting point.
            </Note>

            <SectionTitle>Step 4 — Navbar</SectionTitle>
            <Step n={1} title="Set Up the Navbar">
                Open the <strong>Navbar</strong> tab and fill in <strong>Heading</strong>,
                <strong> Sub Heading</strong>, <strong>Name</strong>, and <strong>Url</strong>.
            </Step>
            <Note type="warning">
                Like Home, the Navbar is a <strong>singleton</strong> — only one record is allowed per
                conference; a second Add attempt is blocked.
            </Note>
        </div>
    );
}

function TabContent() {
    return (
        <div>
            <Note type="warning">
                The admin sidebar only shows clickable tabs for <strong>8</strong> of the 16 content
                sections — <strong>Committees, Sponsors, Awards, Contacts, Locations, Participants,
                Sponsorship Rates, Accommodation, Events, and Souvenir</strong> have no sidebar button and
                must be opened by typing the URL directly:
                <code> /cf/&lt;confid&gt;/&lt;section&gt;</code> (e.g. <code>/cf/&lt;confid&gt;/committee</code>,
                <code> /cf/&lt;confid&gt;/sponsors</code>, <code>/cf/&lt;confid&gt;/awards</code>).
            </Note>

            <SectionTitle>Schedule & People</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                    { title: 'Event Dates', fields: 'Title, Date, Sequence, Is Date Extended (+ New Date), Completed, Featured', desc: 'Deadlines such as abstract submission, notification, and camera-ready — supports showing an extended/updated date.' },
                    { title: 'Committees', fields: 'Type of Committee, Description (rich text), Sequence, Feature', desc: 'e.g. "Organizing Committee", "Technical Committee" — the description typically lists members.' },
                    { title: 'Speakers', fields: 'Name, Designation, Institute, Image Link, Sequence, Profile Link, Talk Type, Talk Title, Bio, Abstract, Feature', desc: 'Keynote and invited speakers, with talk details and biography.' },
                    { title: 'Contacts', fields: 'Title, Name, Designation, Institute, Profile Link, Image Link, Phone, E-mail, Fax, Sequence, Feature', desc: 'The "Contact Us" section — organizing committee contact points.' },
                ].map(c => (
                    <div key={c.title} style={{ background: '#fff', border: '1px solid #e4e8f5', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 6 }}>{c.desc}</div>
                        <div style={{ fontSize: 11.5, color: T.accent, fontFamily: 'monospace', lineHeight: 1.6 }}>{c.fields}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Venue & Logistics</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                    { title: 'Location', fields: 'Description (rich text), Address, Latitude, Longitude, Sequence, Feature', desc: 'Venue details — this is a singleton, only one Location record per conference.', warn: true },
                    { title: 'Accommodation', fields: 'Title, Description (rich text), Sequence, Feature', desc: 'Nearby hotels or on-campus stay options — repeatable entries.' },
                ].map(c => (
                    <div key={c.title} style={{ background: '#fff', border: '1px solid #e4e8f5', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>
                            {c.title} {c.warn && <span style={{ fontSize: 10, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '1px 6px', marginLeft: 6 }}>singleton</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 6 }}>{c.desc}</div>
                        <div style={{ fontSize: 11.5, color: T.accent, fontFamily: 'monospace', lineHeight: 1.6 }}>{c.fields}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Sponsorship</SectionTitle>
            <Note type="info">
                <strong>Sponsorship Rates</strong> and <strong>Sponsors</strong> are two distinct sections —
                don't confuse them.
            </Note>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                    { title: 'Sponsorship Rates', fields: 'Category, Price, Description, Sequence, Featured', desc: 'The rate card / pricing tiers offered to prospective sponsors (e.g. "Platinum Sponsor – $5000").' },
                    { title: 'Sponsors', fields: 'Name of the Sponsor, Type, Logo, Sequence, Feature', desc: 'The actual roster/logo wall of sponsors who have signed on.' },
                ].map(c => (
                    <div key={c.title} style={{ background: '#fff', border: '1px solid #e4e8f5', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 6 }}>{c.desc}</div>
                        <div style={{ fontSize: 11.5, color: T.accent, fontFamily: 'monospace', lineHeight: 1.6 }}>{c.fields}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Media & Announcements</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                    { title: 'Awards', fields: 'Title-1, Title-2, Description (rich text), Link, Sequence, Featured, Hidden, New', desc: 'Best paper / best presentation awards, or similar recognitions.' },
                    { title: 'Images', fields: 'Name, Image Link, Sequence, Featured', desc: 'A photo gallery. Click "Add New Image" — each row is saved and deleted independently, with a live thumbnail preview.' },
                    { title: 'Souvenir', fields: 'Location, Price, Description, Sequence, Feature', desc: 'Conference souvenir/memento details — pickup point and price.' },
                    { title: 'Announcements', fields: 'Title, Meta Description, Description (rich text), Link, Sequence, Featured, Hidden, New', desc: 'A two-pane list + editor: pick an announcement on the left to edit it, or click "Add Announcement"/"New Announcement" to start one.' },
                ].map(c => (
                    <div key={c.title} style={{ background: '#fff', border: '1px solid #e4e8f5', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5 }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 6 }}>{c.desc}</div>
                        <div style={{ fontSize: 11.5, color: T.accent, fontFamily: 'monospace', lineHeight: 1.6 }}>{c.fields}</div>
                    </div>
                ))}
            </div>

            <SectionTitle>Extra Pages (Common Template)</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 16,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Use the <strong>Common Template</strong> tab to build arbitrary extra pages that don't
                    fit the fixed sections above — e.g. "Call for Papers" or "Travel Info".
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Click <strong>Add New Page</strong>, enter a <strong>Page Title</strong>, and write
                    the body in the rich-text editor.</li>
                    <li>Toggle <strong>Featured</strong>, and use <strong>Show/Hide Preview</strong> or
                    <strong> Show/Hide HTML</strong> (with Apply Changes / Copy HTML) as needed.</li>
                    <li>Use <strong>Import data</strong> to copy an existing page from another conference.</li>
                    <li>Save with <strong>Add Page</strong> / <strong>Update Page</strong>, or remove it with
                    <strong> Delete Page</strong>.</li>
                </ul>
            </div>
        </div>
    );
}

function TabParticipants() {
    return (
        <div>
            <SectionTitle>Participants (Authors & Papers)</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Open <code>/cf/&lt;confid&gt;/participants</code> to maintain the roster of accepted
                    papers and authors.
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                    <li>Add a record per author with: <strong>Author Name</strong>,
                    <strong> Designation of Author</strong>, <strong>Institute of Author</strong>,
                    <strong> Title of Paper</strong>, and <strong>Paper Id</strong>.</li>
                    <li>This is maintained by the organizer <strong>after paper acceptance</strong> — it is
                    not a self-service registration form filled in by attendees themselves.</li>
                </ul>
            </div>
            <Note type="info">
                There is no self-registration flow for attendees within this module — participant records
                here represent the accepted-author roster, entered by the organizer.
            </Note>

            <SectionTitle>Payment Portal</SectionTitle>
            <div style={{
                background: '#fff7ed', border: '1px solid #fed7aa',
                borderRadius: 10, padding: '16px 20px', marginBottom: 12,
                fontSize: 13, color: '#374151', lineHeight: 1.7,
            }}>
                The <strong>Make Payment</strong> button (route <code>/payment-portal</code>) opens a
                simple instructions page with a single <strong>Payment Portal</strong> button that opens an
                external registration site in a new tab.
            </div>
            <Note type="warning">
                <strong>This is a placeholder, not an integrated payment gateway.</strong> The link is
                fixed and is <strong>not specific to the conference</strong> you came from — it does not
                vary by conference ID. Treat conference registration payment as handled outside this
                module for now.
            </Note>
        </div>
    );
}

function TabOther() {
    return (
        <div>
            <SectionTitle>Direct URLs for Hidden Sections</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    These sections have no button in the admin sidebar — replace
                    <code> &lt;confid&gt;</code> with your conference's ID:
                </div>
                <div style={{
                    background: '#0f172a', color: '#e2e8f0', borderRadius: 8,
                    padding: '14px 18px', fontFamily: 'monospace', fontSize: 12, lineHeight: 2,
                }}>
                    /cf/&lt;confid&gt;/committee&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Committees<br />
                    /cf/&lt;confid&gt;/sponsors&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Sponsors<br />
                    /cf/&lt;confid&gt;/awards&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Awards<br />
                    /cf/&lt;confid&gt;/contact&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Contacts<br />
                    /cf/&lt;confid&gt;/locations&nbsp;&nbsp;&nbsp;&nbsp;— Location<br />
                    /cf/&lt;confid&gt;/participants&nbsp;— Participants<br />
                    /cf/&lt;confid&gt;/sponsorship-rates — Sponsorship Rates<br />
                    /cf/&lt;confid&gt;/accommodation&nbsp;— Accommodation<br />
                    /cf/&lt;confid&gt;/events&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Events<br />
                    /cf/&lt;confid&gt;/souvenir&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Souvenir
                </div>
            </div>

            <SectionTitle>Visibility — Feature & Sequence, Not Publish</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                    There is no master "lock" or "publish" action anywhere in this module. Instead, every
                    content record carries its own <strong>Feature/Featured</strong> (and sometimes
                    <strong> Hidden</strong>) toggle controlling whether it appears on the public site, and
                    a <strong>Sequence</strong> number controlling its display order relative to other
                    records of the same type. Content can be edited at any time — there's nothing to
                    "unlock" first.
                </div>
            </div>

            <SectionTitle>File Upload Utility</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                    Use the general-purpose <strong>File Upload</strong> page (route <code>/fileupload</code>)
                    to upload an image or document and get back a hosted link — paste that link into any
                    Logo, Image, Poster, Flyer, or Brochure field across the module's sections.
                </div>
            </div>

            <SectionTitle>Role Gating Summary</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[
                    { action: 'Read (view any section)', color: '#10b981', desc: 'Public — no login required. This is what lets the conference website display without visitors signing in.' },
                    { action: 'Create / Delete', color: '#ef4444', desc: 'Requires the Event Organizer (EO) role, or admin.' },
                    { action: 'Update', color: '#f59e0b', desc: 'Generally not role-gated in the current implementation — be mindful of who has access to admin URLs.' },
                ].map(c => (
                    <div key={c.action} style={{
                        background: '#f8f9ff', border: '1px solid #e4e8f5',
                        borderRadius: 10, padding: '12px 16px',
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                    }}>
                        <div style={{
                            flexShrink: 0, marginTop: 2,
                            background: `${c.color}18`, border: `1px solid ${c.color}40`,
                            color: c.color, fontWeight: 700, fontSize: 11,
                            padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                        }}>{c.action}</div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{c.desc}</div>
                    </div>
                ))}
            </div>

            <Note type="tip">
                Keep <strong>Sequence</strong> numbers consistent across a section (e.g. speakers, sponsors)
                so items display in the order you intend on the public site.
            </Note>
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ConfManual({ standalone = false }) {
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
        content:      <TabContent />,
        participants: <TabParticipants />,
        other:        <TabOther />,
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
                            Conference Module — User Manual
                        </span>
                    </div>
                    {isAuthenticated && (
                        <a href="/cf/dashboard" style={{
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
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Conference Module — User Manual</div>
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
