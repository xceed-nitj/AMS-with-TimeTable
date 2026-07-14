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

function RefTag({ children, color }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: `${color}15`, color, border: `1px solid ${color}40`,
        }}>{children}</span>
    );
}

function RefLabel({ children }) {
    return (
        <div style={{
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: T.textMuted, marginBottom: 3, marginTop: 10,
        }}>{children}</div>
    );
}

function Body({ children, color = '#374151' }) {
    return <div style={{ fontSize: 13, color, lineHeight: 1.7 }}>{children}</div>;
}

function TabRefCard({ title, tags = [], fields, children }) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #e4e8f5', borderRadius: 10,
            padding: '14px 18px', marginBottom: 12,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{title}</div>
                {tags.map(t => <RefTag key={t.label} color={t.color}>{t.label}</RefTag>)}
            </div>
            {children}
            {fields && (
                <>
                    <RefLabel>Details you enter</RefLabel>
                    <div style={{ fontSize: 12, color: T.accent, fontFamily: 'monospace', lineHeight: 1.7 }}>{fields}</div>
                </>
            )}
        </div>
    );
}

// ── tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview', label: 'Overview',        icon: '🗂️' },
    { id: 'setup',    label: 'Getting Started', icon: '⚙️' },
    { id: 'tabs',     label: 'Tab-by-Tab Guide', icon: '📄' },
    { id: 'editor',   label: 'Editor Guide',    icon: '✏️' },
    { id: 'tips',     label: 'Tips & FAQs',     icon: '🔧' },
];

// ── tab content ───────────────────────────────────────────────────────────────

function TabOverview({ setTab }) {
    return (
        <div>
            <Note type="key">
                The Conference Module lets you run your conference website yourself — the menu, the home
                page layout, pages, speakers, images, announcements and important dates are all managed
                from this admin panel. Whatever you save here appears on the public conference site;
                no developer is needed for day-to-day content changes.
            </Note>

            <SectionTitle>The Admin Panel at a Glance</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                    { icon: '📚', title: 'Left Sidebar', desc: 'All tabs live in the dark sidebar, grouped as Overview, Site & Content, and Tools. Use the chevron button at its top to shrink it to icons; the arrow again expands it.' },
                    { icon: '🪟', title: 'Add & Edit in Pop-ups', desc: 'Every tab has an "Add …" button in its title banner. Adding and editing happen in a pop-up form — fill it and press Add/Update. Nothing saves until you press the button.' },
                    { icon: '🃏', title: 'Cards, Ordered by You', desc: 'Speakers, Images and Event Dates display as cards. Cards are arranged by the Order number you give each entry — smaller numbers come first.' },
                    { icon: '✅', title: 'Instant Feedback', desc: 'Every save shows a green confirmation message; failures show a red one explaining why. Deleting always asks "Are you sure?" first.' },
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
                    { n: 2, icon: '🏠', label: 'Home Details', sub: 'Name · Dates · About', tab: 'setup' },
                    { n: 3, icon: '📄', label: 'Build Pages & Content', sub: 'Pages, speakers, images…', tab: 'tabs' },
                    { n: 4, icon: '🧭', label: 'Set Up the Menu', sub: 'Nav Menu · Home Layout', tab: 'tabs' },
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

            <SectionTitle>Sidebar Tabs</SectionTitle>
            <div style={{
                background: '#0f172a', color: '#e2e8f0', borderRadius: 8,
                padding: '14px 18px', fontFamily: 'monospace', fontSize: 12, lineHeight: 2, marginBottom: 20,
            }}>
                Overview&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Home<br />
                Site &amp; Content → Nav Menu · Home Layout · Customisation · Common Template · Announcements · Images · Event Dates<br />
                People&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Speakers<br />
                Tools&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ File Upload
            </div>

            <SectionTitle>Important Notes</SectionTitle>
            <Note type="info">
                The sidebar's bottom holds <strong>Make Payment</strong> and this
                <strong> Help &amp; Manual</strong>. The countdown at the top shows time remaining until
                your conference start date (from the Home tab).
            </Note>
            <Note type="tip">
                Start with <strong>Getting Started</strong> if this is your first conference, then use the
                <strong> Tab-by-Tab Guide</strong> as a reference for exactly what to type in each screen.
            </Note>
        </div>
    );
}

function TabSetup() {
    return (
        <div>
            <SectionTitle>Step 1 — Create the Conference</SectionTitle>
            <Step n={1} title="Open Create Conference">
                Navigate to <strong>Conferences</strong> (route <code>/cf/addconf</code>).
            </Step>
            <Step n={2} title="Fill in Name and Email">
                Enter the <strong>Name of the Conference</strong> (e.g. "MAC 2027") and the organiser's
                <strong> Email</strong>, then click <strong>Add</strong>. Each conference needs a unique email.
            </Step>
            <Step n={3} title="Open the Admin Panel">
                Go to your <strong>Dashboard</strong> (<code>/cf/dashboard</code>), find your conference and
                click through — the admin panel opens on the <strong>Home</strong> tab.
            </Step>

            <SectionTitle>Step 2 — Home Tab: Name, Dates &amp; About</SectionTitle>
            <Step n={1} title="Enter the basics">
                On <strong>Home</strong>, type the <strong>Name of the Conference</strong> and pick the
                <strong> Starting Date</strong> and <strong>Ending Date</strong>. Click
                <strong> Add Conference Info</strong> (later it reads <strong>Update Conference Info</strong>).
                These dates also drive the countdown timer shown on the sidebar and the public site.
            </Step>
            <Step n={2} title="Write the About sections">
                Click <strong>Add New About</strong> in the title banner. Each About section has a
                <strong> Title</strong> (e.g. "About the Conference", "About the Institute") and a rich-text
                <strong> Description</strong>. Pick a section from the left list to edit it, write in the
                editor (the right panel shows a live preview), then press
                <strong> Update About Section</strong>.
            </Step>
            <Step n={3} title="Reusing last year's content (optional)">
                Click <strong>Import from Conference</strong>, choose the earlier conference, review the
                preview (it shows the name, dates, and how many About sections come along), and press
                <strong> Apply Import</strong>. Both the details <em>and</em> the About sections are
                brought in — review everything and save.
            </Step>

            <SectionTitle>Step 3 — Build Your Pages</SectionTitle>
            <Step n={1} title="Create pages in Common Template">
                Every extra page of your site — Tracks, Committees, Registration Fee, Travel Info — is
                created in <strong>Common Template</strong>. Click <strong>Add New Page</strong>, give it a
                <strong> Page Title</strong>, write the content, press <strong>Add Page</strong>.
            </Step>
            <Step n={2} title="Add other content">
                Fill in <strong>Speakers</strong>, <strong>Images</strong>, <strong>Event Dates</strong>,
                and <strong>Announcements</strong> from their tabs — each is a simple "Add" pop-up form.
                Details for every field are in the <strong>Tab-by-Tab Guide</strong>.
            </Step>

            <SectionTitle>Step 4 — Wire Up the Site Menu</SectionTitle>
            <Step n={1} title="Add menu items">
                In <strong>Nav Menu</strong>, click <strong>Add Menu Item</strong>. Give it a
                <strong> Label</strong> (what visitors see), pick where it links to (for your own pages just
                choose the page by <em>name</em> from the dropdown), set an <strong>Order</strong> number,
                and save. The phone-shaped <strong>Mobile Preview</strong> beside the tables shows exactly
                how your menu will look.
            </Step>
            <Step n={2} title="Turn the live menu on">
                In the Nav Menu title banner, switch <strong>Backend-driven</strong> ON. From that moment
                the public site builds its menu from what you configured here. Leave it OFF while you're
                still experimenting — the site keeps its old menu until you flip the switch.
            </Step>
            <Step n={3} title="Arrange the home page">
                In <strong>Home Layout</strong>, drag/move the home page sections into the order you want
                and switch individual sections on or off (e.g. show the Speakers strip once speakers are
                announced). Press <strong>Save</strong>.
            </Step>
        </div>
    );
}

function TabTabs() {
    return (
        <div>
            <Note type="info">
                Every tab works the same way: press the <strong>Add …</strong> button in the title banner,
                fill the pop-up form, press <strong>Add</strong>. To change an entry press
                <strong> Edit</strong> on its card or row; to remove it press <strong>Delete</strong> and
                confirm. An <strong>Order</strong> number on an entry decides its position — smaller
                numbers appear first.
            </Note>

            <SectionTitle>Home</SectionTitle>
            <TabRefCard title="Home" tags={[{ label: 'one per conference', color: '#92400e' }]}
                fields="Conference Name · Starting Date · Ending Date · About sections (Title + rich-text Description)">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    The conference's name and its start/end dates, plus one or more <strong>About</strong>
                    sections. Type the name exactly as it should appear on the site. Save with
                    <strong> Add / Update Conference Info</strong>. For About sections: pick one from the
                    left-hand list (or <strong>Add New About</strong>), write in the editor while watching
                    the live preview, then <strong>Update About Section</strong>.
                </Body>
                <RefLabel>Good to know</RefLabel>
                <Body color="#92400e">
                    <strong>Import from Conference</strong> copies the name, dates and all About sections
                    from a previous conference — it fills the screen for review; save to keep it.
                </Body>
            </TabRefCard>

            <SectionTitle>Nav Menu — the Site's Navigation Bar</SectionTitle>
            <TabRefCard title="Nav Menu"
                fields="Label · Link (choose type below) · Order · 'Show as highlighted button' · optional dropdown sub-items">
                <RefLabel>Title banner switches</RefLabel>
                <Body>
                    <strong>Backend-driven</strong> — ON means the public site uses this menu; OFF keeps
                    the site's built-in menu. <strong>Split left/right</strong> — turn ON only if your
                    site shows two menu groups (some items on the left of the bar, others on the right);
                    it adds a Left/Right choice to each item. Most sites leave it OFF.
                </Body>
                <RefLabel>Adding an item — choosing the link</RefLabel>
                <Body>
                    In the pop-up, after typing the <strong>Label</strong>, pick the <strong>Link Type</strong>:
                    <br />• <strong>Existing page (Common Template)</strong> — the default. Simply pick one
                    of your pages <em>by name</em> from the dropdown. Use this for Tracks, Committees,
                    Registration Fee and any page you built in Common Template.
                    <br />• <strong>Custom internal path</strong> — type a path that exists on your site,
                    e.g. <code>/speakers</code>. Use this for special pages the site provides ready-made.
                    <br />• <strong>External URL</strong> — a full address like
                    <code> https://forms.gle/…</code>; it opens in a new tab.
                </Body>
                <RefLabel>Dropdown menus</RefLabel>
                <Body>
                    To make an item like "Committees ▾" with entries underneath, add
                    <strong> Sub-items</strong> inside the pop-up — each sub-item has its own label and
                    link, chosen exactly the same way. An item with sub-items acts as the dropdown heading.
                </Body>
                <RefLabel>Register button</RefLabel>
                <Body>
                    Tick <strong>"Show as a highlighted button"</strong> on one item (e.g. "Register") to
                    display it as the standout button at the end of the bar instead of a normal link.
                </Body>
                <RefLabel>Choosing a speaker page design</RefLabel>
                <Body>
                    The site offers more than one ready-made design for the Speakers page. To pick one:
                    add (or edit) the Speakers menu item, choose <strong>Custom internal path</strong> as
                    the Link Type, and type the design's path — <code>/speakers1</code> for design 1,
                    <code> /speakers2</code> for design 2, and so on. Whichever path you save is the design
                    visitors get. You can switch designs at any time by editing the item and changing the
                    path — no other changes needed.
                </Body>
                <RefLabel>Good to know</RefLabel>
                <Body color="#92400e">
                    Exact duplicates are rejected with a "Duplicate entry" message. Use the ↑ ↓ arrows on
                    each row to reorder without editing. The <strong>Mobile Preview</strong> phone on the
                    right always shows the current result — tap a dropdown in it to peek inside.
                </Body>
            </TabRefCard>

            <SectionTitle>Home Layout — What Shows on the Home Page</SectionTitle>
            <TabRefCard title="Home Layout"
                fields="Per section: Show/Hide switch · position in the list">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    A list of the home page's building blocks — Hero Slider, About Conference, Timeline,
                    About Institute, Countdown, About Department, Speakers, Sponsors, and the CMT notice.
                    Move sections up or down to change the order they appear on the home page, and use each
                    section's switch to show or hide it. Press <strong>Save</strong> to apply.
                </Body>
                <RefLabel>Good to know</RefLabel>
                <Body color="#92400e">
                    <strong>Speakers</strong> and <strong>Sponsors</strong> start hidden — switch them on
                    when you're ready to show them. The Speakers one can also be switched from the Speakers
                    tab's own "Show on home screen" toggle; it's the same setting in both places.
                </Body>
            </TabRefCard>

            <SectionTitle>Customisation — Pick Component Designs</SectionTitle>
            <TabRefCard title="Customisation"
                fields="Per home page component: pick Design 1, 2, 3 or 4 · Save Customisation">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    Some home page components — currently the <strong>Countdown timer</strong> and the
                    <strong> Important Dates / Timeline</strong> — come in several ready-made looks. Each
                    component shows numbered design tiles; click the design you want (a tick marks the
                    selected one, and the badge beside the component name shows the current choice), then
                    press <strong>Save Customisation</strong>. Use <strong>Discard</strong> to undo
                    unsaved picks.
                </Body>
                <RefLabel>Good to know</RefLabel>
                <Body color="#92400e">
                    Nothing changes on the site until you press Save — the Save button stays disabled
                    while there's nothing new to save. The design numbers match the variants built into
                    the public site, so the easiest way to choose is: pick a design, save, and check the
                    site's home page — then adjust if it isn't the look you wanted.
                </Body>
            </TabRefCard>

            <SectionTitle>Common Template — Your Site's Pages</SectionTitle>
            <TabRefCard title="Common Template"
                fields="Page Title · Description (rich text) · Featured (Yes/No)">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    One entry per page of your site. Click <strong>Add New Page</strong>, type a
                    <strong> Page Title</strong> (e.g. "Registration Fee"), write the content in the
                    editor, choose Featured, and press <strong>Add Page</strong>. To edit later, pick the
                    page from the left-hand list, make changes, press <strong>Update Page</strong> — the
                    button shows a spinner while saving. <strong>Show Preview</strong> opens a side-by-side
                    live preview.
                </Body>
                <RefLabel>Putting a page in the menu</RefLabel>
                <Body>
                    After saving, open <strong>Nav Menu</strong>, add an item, keep the default
                    <strong> "Existing page"</strong> link type, and pick this page by name from the
                    dropdown. That's all — no technical details needed.
                </Body>
                <RefLabel>Good to know</RefLabel>
                <Body color="#92400e">
                    <strong>Import data</strong> copies a single page from another conference and saves it
                    immediately as a new page here — repeat for each page you want to reuse.
                </Body>
            </TabRefCard>

            <SectionTitle>Announcements</SectionTitle>
            <TabRefCard title="Announcements"
                fields="Title · Meta Description (one-line summary) · Description (rich text) · Link · Order · Featured · Hidden · New">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    News items like "Registration Now Open". <strong>Title</strong> is the headline;
                    <strong> Meta Description</strong> is the one-line summary shown in lists;
                    <strong> Description</strong> is the full text; <strong>Link</strong> is where the
                    announcement points when clicked (paste any address, or <code>#</code> for none).
                    Use <strong>New</strong> to show a "new" tag on the site and <strong>Hidden</strong> to
                    take an announcement down without deleting it. Pick an announcement from the left list
                    to edit; the right panel previews it live.
                </Body>
            </TabRefCard>

            <SectionTitle>Images</SectionTitle>
            <TabRefCard title="Images"
                fields="Name · Image (upload a file or paste a link) · Order · Featured">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    Gallery and banner pictures. Click <strong>Add Image</strong>; in the pop-up, either
                    press <strong>Choose file → Upload</strong> (the link fills itself and a thumbnail
                    appears) or paste a picture's address into the link box. Give it a short
                    <strong> Name</strong> and an <strong>Order</strong> number. Saved images appear as
                    cards with their picture on top.
                </Body>
            </TabRefCard>

            <SectionTitle>Event Dates</SectionTitle>
            <TabRefCard title="Event Dates"
                fields="Title · Date · Order · Is Date Extended (+ New Date) · Completed · Featured">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    Every deadline and milestone — abstract submission, notification, camera-ready,
                    registration close, the conference days themselves. One entry each, with a
                    <strong> Title</strong>, the <strong>Date</strong>, and an <strong>Order</strong> number.
                </Body>
                <RefLabel>When a deadline moves</RefLabel>
                <Body color="#92400e">
                    Don't overwrite the original date. Set <strong>Is Date Extended</strong> to Yes and put
                    the new deadline in <strong>New Date</strong> — the card then shows the old date struck
                    out with the new one beside it, exactly as visitors will see it. Mark
                    <strong> Completed</strong> once a milestone has passed (its card dims).
                </Body>
            </TabRefCard>

            <SectionTitle>Speakers</SectionTitle>
            <TabRefCard title="Speakers"
                fields="Name · Designation · Institute · Photo (upload or link) · Order · Profile Link · Talk Type · Talk Title · Bio · Abstract · Feature">
                <RefLabel>What to enter</RefLabel>
                <Body>
                    One entry per speaker. <strong>Name</strong>, <strong>Designation</strong> and
                    <strong> Institute</strong> appear on the card; add the <strong>photo</strong> by
                    uploading a file (press <strong>Upload</strong> and the link fills itself) or pasting a
                    picture address — a preview thumbnail confirms it worked. <strong>Profile Link</strong>
                    is the speaker's homepage (optional). <strong>Bio</strong> and <strong>Abstract</strong>
                    are rich-text. <strong>Feature</strong> = No hides the speaker from the site without
                    deleting them.
                </Body>
                <RefLabel>Talk Type — invited speakers</RefLabel>
                <Body color="#92400e">
                    Enter <strong>1</strong> as the Talk Type to mark someone as an <strong>Invited
                    Speaker</strong> — the site shows them under a separate "Invited Speakers" tab. Any
                    other value (or blank) lists them under "Our Speakers".
                </Body>
                <RefLabel>Show on home screen</RefLabel>
                <Body>
                    The switch in the title banner puts a Speakers strip on the site's home page (the same
                    setting as the Speakers row in Home Layout). Turn it on once your speaker list is ready
                    to show.
                </Body>
            </TabRefCard>

            <SectionTitle>File Upload</SectionTitle>
            <TabRefCard title="File Upload"
                fields="Choose a file · press Upload">
                <RefLabel>What it's for</RefLabel>
                <Body>
                    A general store for files — pictures, PDFs, brochures. Pick a file (its type shows as a
                    badge), press <strong>Upload</strong>, and it appears as a card with a preview. Press
                    <strong> Copy</strong> on a card to copy its link, then paste that link into any image
                    or link box anywhere in the module. The ↗ button opens the file in a new tab.
                </Body>
            </TabRefCard>
        </div>
    );
}

function TabEditor() {
    return (
        <div>
            <Note type="key">
                The same rich-text editor is used everywhere you write formatted content — About sections,
                Common Template pages, Announcements, speaker Bios. Everything below applies in all of them.
            </Note>

            <SectionTitle>Writing &amp; Formatting</SectionTitle>
            <Step n={1} title="The toolbar">
                All buttons are always visible: bold/italic/underline, bullet and numbered lists,
                paragraph styles and text size, colours, alignment, indent, table, link, image,
                horizontal line, undo/redo, and full-screen. Hover any button for its name.
            </Step>
            <Step n={2} title="Lists">
                Select your lines and press the bullet or numbered list button. To switch a list from
                numbers to bullets (or back), <strong>select all its lines first</strong>, then press the
                other list button — with only the cursor placed on one line, only that line converts.
            </Step>
            <Step n={3} title="Links">
                Select the text, press the link button, paste the address. Links show blue and underlined
                in the preview.
            </Step>

            <SectionTitle>Tables</SectionTitle>
            <Step n={1} title="Insert a table">
                Press the table button and choose the size. Cells have visible borders while editing so
                empty cells are easy to click into.
            </Step>
            <Step n={2} title="Add / remove rows and columns">
                Click inside any cell — a small menu appears offering Insert Row Above/Below, Insert
                Column Left/Right, Merge/Unmerge Cells, Delete Row/Column/Table.
            </Step>

            <SectionTitle>Pictures — Inserting &amp; Resizing</SectionTitle>
            <Step n={1} title="Insert">
                Press the image button and pick a file, or paste a picture link. New pictures come in at a
                sensible size rather than full-size.
            </Step>
            <Step n={2} title="Resize by dragging">
                Click directly <strong>on the picture</strong> — a dashed frame appears with a round blue
                handle at its bottom-right corner and a size readout on top. Drag the handle until the
                readout shows the size you want, then release. This works the same for pictures
                <strong> inside table cells</strong>; a picture can't be dragged wider than its cell.
            </Step>
            <Step n={3} title="Save">
                Sizes and all edits are kept when you press the screen's own Add/Update button —
                remember the editor content is only stored when the form is saved.
            </Step>

            <Note type="tip">
                The <strong>Show HTML</strong> button (where available) reveals the raw markup for
                copy-pasting between pages — most users never need it.
            </Note>
        </div>
    );
}

function TabTips() {
    return (
        <div>
            <SectionTitle>Order &amp; Visibility — How Display Is Controlled</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
                fontSize: 13, color: '#374151', lineHeight: 1.8,
            }}>
                There is no master "publish" button. Two per-entry settings do everything:
                <br />• <strong>Order</strong> (also called Sequence) — position among entries of the same
                kind; smaller numbers first. Leave gaps (10, 20, 30…) so you can slot items in later.
                <br />• <strong>Feature / Featured</strong> — Yes shows the entry on the public site; No
                hides it without deleting. Announcements additionally have <strong>Hidden</strong> and
                <strong> New</strong> flags.
            </div>

            <SectionTitle>Frequently Asked</SectionTitle>
            <Note type="tip">
                <strong>My change isn't on the site.</strong> Check three things: you pressed the pop-up's
                Add/Update button (a green message confirms), the entry's Feature is Yes, and — for menu
                changes — the Nav Menu's <strong>Backend-driven</strong> switch is ON.
            </Note>
            <Note type="tip">
                <strong>I want a different Speakers page look.</strong> Edit the Speakers item in Nav Menu,
                set Link Type to <strong>Custom internal path</strong> and type <code>/speakers1</code>,
                <code> /speakers2</code>, etc. — each path is a different ready-made design.
            </Note>
            <Note type="tip">
                <strong>A deadline was extended.</strong> In Event Dates, edit the entry: set Is Date
                Extended = Yes and fill New Date. Don't replace the original date — the site shows both.
            </Note>
            <Note type="tip">
                <strong>Uploading a picture.</strong> Anywhere you see a Choose-file box with an Upload
                button (Speakers, Images), uploading fills the link automatically. For everything else,
                upload on the <strong>File Upload</strong> page, press Copy on the card, and paste.
            </Note>
            <Note type="warning">
                <strong>Deletes are permanent.</strong> The confirmation box is your only safety net —
                prefer switching Feature to No when you might need the entry again.
            </Note>

            <SectionTitle>Older Sections (No Sidebar Button)</SectionTitle>
            <div style={{
                background: '#f8f9ff', border: '1px solid #e4e8f5',
                borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            }}>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>
                    Some rarely-used sections were removed from the sidebar but still work — open them by
                    typing the address, replacing <code>&lt;confid&gt;</code> with your conference's ID
                    (the code visible in your browser's address bar on any admin page):
                </div>
                <div style={{
                    background: '#0f172a', color: '#e2e8f0', borderRadius: 8,
                    padding: '14px 18px', fontFamily: 'monospace', fontSize: 12, lineHeight: 2,
                }}>
                    /cf/&lt;confid&gt;/committee&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Committees<br />
                    /cf/&lt;confid&gt;/sponsors&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Sponsors<br />
                    /cf/&lt;confid&gt;/sponsorship-rates — Sponsorship Rates<br />
                    /cf/&lt;confid&gt;/awards&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Awards<br />
                    /cf/&lt;confid&gt;/contact&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Contacts<br />
                    /cf/&lt;confid&gt;/locations&nbsp;&nbsp;&nbsp;&nbsp;— Location<br />
                    /cf/&lt;confid&gt;/participants&nbsp;— Participants<br />
                    /cf/&lt;confid&gt;/accommodation&nbsp;— Accommodation<br />
                    /cf/&lt;confid&gt;/events&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Events<br />
                    /cf/&lt;confid&gt;/souvenir&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Souvenir
                </div>
            </div>

            <SectionTitle>Payment Portal</SectionTitle>
            <Note type="warning">
                The <strong>Make Payment</strong> button in the sidebar opens a fixed external registration
                site — it is a placeholder, not an integrated payment gateway, and is not specific to your
                conference.
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
        overview: <TabOverview setTab={setTab} />,
        setup:    <TabSetup />,
        tabs:     <TabTabs />,
        editor:   <TabEditor />,
        tips:     <TabTips />,
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
