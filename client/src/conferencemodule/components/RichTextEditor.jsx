import React, { forwardRef, useMemo } from "react";
import JoditEditorImport from 'jodit-react';
// Vite/UMD interop: the default import can resolve to the module wrapper
// ({ default: Component }) instead of the component itself.
const JoditEditor = JoditEditorImport.default ?? JoditEditorImport;

// Fixes rendering conflicts between the app's global CSS and Jodit content:
// duplicated list markers ("extra dot" next to numbers), missing bullets and
// unreadable table borders while editing.
const editorContentStyles = `
.jodit-wysiwyg ul,
.jodit-wysiwyg ol { padding-left: 1.6em !important; margin: 0.4em 0 !important; }
.jodit-wysiwyg ul { list-style-type: disc !important; }
.jodit-wysiwyg ol { list-style-type: decimal !important; }
.jodit-wysiwyg ul ul { list-style-type: circle !important; }
.jodit-wysiwyg ol ol { list-style-type: lower-alpha !important; }
.jodit-wysiwyg ul li { list-style-type: inherit !important; }
.jodit-wysiwyg ol li { list-style-type: inherit !important; }
/* Kill decorative ::before markers injected by app-wide styles — the source
   of the double dot beside ordered-list numbers. */
.jodit-wysiwyg li::before { content: none !important; }
.jodit-wysiwyg table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
.jodit-wysiwyg table td,
.jodit-wysiwyg table th { border: 1px solid #cbd5e1; padding: 6px 10px; min-width: 42px; min-height: 28px; }
.jodit-wysiwyg table th { background: #f1f5f9; font-weight: 600; }
/* Let explicit width/height set via the resizer or the image-properties
   dialog take effect — only cap images at their container's width. Never
   force height:auto here, or manual sizes would be ignored. */
.jodit-wysiwyg img { max-width: 100%; }
.jodit-wysiwyg table td img { max-width: 100%; display: inline-block; }
/* Keep Jodit popups (color pickers, table grid, dropdowns) above Chakra modals. */
.jodit-popup, .jodit-popup__content, .jodit-dialog { z-index: 100002 !important; }
/* The image drag-resize frame is a separate floating element — without this
   it renders behind modal overlays and the handles are invisible. */
.jodit-resizer { z-index: 100003 !important; }
.jodit-resizer > i { z-index: 100004 !important; }
`;

// Shared rich-text editor for the conference module. All toolbar options are
// always visible, popups stay above modals, and pasted content is cleaned.
const RichTextEditor = forwardRef(({ value, onBlur, onChange, height = 300, placeholder, ...rest }, ref) => {
    const config = useMemo(() => ({
        height,
        minHeight: 200,
        placeholder: placeholder || "Start typing…",
        // Chakra modals sit around z-index 1400 — keep every Jodit popup above them.
        zIndex: 100000,
        // Show the full toolbar instead of collapsing buttons into "...".
        toolbarAdaptive: false,
        toolbarSticky: false,
        statusbar: true,
        spellcheck: true,
        // Skip the annoying paste dialogs and just keep clean HTML.
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: "insert_clear_html",
        // Make the image button work without a server-side uploader.
        uploader: { insertImageAsBase64URI: true },
        // Image sizing: newly inserted images start at a sane width, and the
        // drag-resizer writes explicit width/height attributes (shown live)
        // so the size sticks — including for images placed inside tables.
        imageDefaultWidth: 300,
        resizer: {
            showSize: true,
            forImageChangeAttributes: true,
            min_width: 20,
            min_height: 20,
        },
        buttons: [
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'ul', 'ol', '|',
            'paragraph', 'fontsize', 'brush', '|',
            'superscript', 'subscript', '|',
            'align', 'outdent', 'indent', '|',
            'table', 'link', 'image', 'hr', '|',
            'undo', 'redo', 'eraser', '|',
            'source', 'fullsize',
        ],
        // Reasonable table defaults; cell/row/column actions live in the
        // in-table popup that appears when you click inside a table.
        createAttributes: {
            table: { style: 'border-collapse:collapse;width:100%;' },
        },
    }), [height, placeholder]);

    return (
        <>
            <style>{editorContentStyles}</style>
            <JoditEditor
                ref={ref}
                value={value}
                config={config}
                onBlur={onBlur}
                onChange={onChange}
            />
        </>
    );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
