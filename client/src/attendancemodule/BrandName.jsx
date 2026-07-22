// client/src/attendancemodule/BrandName.jsx
// 𝑖LEED — Intelligent Learning Engagement and Entity Detection.
// Shared brand mark in STIX Two Text — the scientific/math publishing
// typeface (it's what browsers render math glyphs with). Its italic "i"
// IS the mathematical-italic 𝑖 letterform, and "LEED" uses the same
// family's bold, so both halves genuinely match: same serifs, same
// x-height, same stroke contrast. Black, minimalist. The component loads
// its own font so it renders identically on any page (dashboard, sidebar,
// standalone manual).

export const ILEED_FULL_FORM =
    'Intelligent Learning Engagement and Entity Detection';

export const ILEED_FONT = "'STIX Two Text', 'Times New Roman', serif";

export default function ILeed({ style = {} }) {
    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,700;1,500&display=swap');`}</style>
            <span
                style={{
                    whiteSpace: 'nowrap',
                    fontFamily: ILEED_FONT,
                    color: '#000',
                    ...style,
                }}
            >
                {/* STIX italic "i" = the mathematical 𝑖 letterform */}
                <em style={{ fontStyle: 'italic', fontWeight: 500, paddingRight: '0.04em' }}>i</em>
                <span style={{ fontWeight: 700, letterSpacing: '0.01em' }}>LEED</span>
            </span>
        </>
    );
}
