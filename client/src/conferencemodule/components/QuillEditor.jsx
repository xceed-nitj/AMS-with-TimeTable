// QuillEditor.jsx — Fixed version with image resize (tables + normal flow)
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import QuillBetterTable from "quill-better-table";
import "quill-better-table/dist/quill-better-table.css";
import ImageResize from "quill-image-resize-module--fix-imports-error";
const QuillEditor = forwardRef(
  (
    {
      // ✅ Source of truth for round-trip:
      valueDelta,                 // object OR JSON string
      onChangeDelta,              // (delta) => void

      // Optional HTML (preview/export only; not for round-trip):
      value = "",
      onChange,                   // (html) => void

      placeholder = "Write description here...",
      height = 400,
      onToggleHtml,
    },
    ref
  ) => {
    const toolbarRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const quillRef = useRef(null);
    const isPastingRef = useRef(false);

    // ---------- helpers ----------
    const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

    const normalizeUrl = (url = "") => {
      const u = (url || "").trim();
      if (/^(mailto:|tel:|#|data:image\/)/i.test(u)) return u;
      if (/^https?:\/\//i.test(u)) return u;
      if (/^[\w-]+(\.[\w-]+)+/.test(u)) return `https://${u}`;
      return u;
    };

    const normalizeImageSrc = (src = "") => {
      const s = (src || "").trim();
      if (!/^https?:\/\//i.test(s)) return s;
      try {
        const u = new URL(s);
        u.pathname = u.pathname
          .split("/")
          .map(seg => seg === "" ? "" : encodeURIComponent(decodeURIComponent(seg)))
          .join("/");
        if (u.search) {
          const sp = new URLSearchParams(u.search);
          const sp2 = new URLSearchParams();
          for (const [k, v] of sp.entries()) sp2.set(encodeURIComponent(k), encodeURIComponent(v));
          u.search = `?${sp2.toString()}`;
        }
        return u.toString();
      } catch {
        return s.replace(/\s/g, "%20");
      }
    };

    const isImageUrl = (url = "") => {
      const s = (url || "").trim();
      if (/^data:image\//i.test(s)) return true;
      const base = s.split("#")[0].split("?")[0].toLowerCase();
      return /\.(png|jpe?g|gif|webp|svg)$/i.test(base) || /^https?:\/\/.*\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(s);
    };

    const getTableLineFormats = (q, index) => {
      const fmt = q.getFormat(index, 1) || {};
      const out = {};
      for (const k of Object.keys(fmt)) {
        if (k === "table" || k === "table-row" || k === "table-col" || k === "table-cell-line" || k.startsWith("table")) {
          out[k] = fmt[k];
        }
      }
      return out;
    };

    const isInsideCell = (q, index) => {
      const [leaf] = q.getLeaf(index) || [];
      let node = leaf ? leaf.domNode : null;
      while (node && node !== q.root) {
        if (node.tagName === "TD" || node.tagName === "TH") return true;
        node = node.parentNode;
      }
      return false;
    };

    const insertCellNewline = (q, index) => {
      const lineFormats = getTableLineFormats(q, index);
      q.insertText(index, "\n", lineFormats, "user");
      q.setSelection(index + 1, 0, "silent");
    };

    // ✅ NEW: Custom Image blot to PERSIST width/height in Delta
    const registerImageBlot = () => {
      const BaseImage = Quill.import("formats/image");
      class ImageFormat extends BaseImage {
        static formats(domNode) {
          const formats = super.formats(domNode) || {};
          if (domNode.getAttribute("alt")) formats.alt = domNode.getAttribute("alt");
          if (domNode.style.width)  formats.width  = domNode.style.width;
          if (domNode.style.height) formats.height = domNode.style.height;
          return formats;
        }
        format(name, value) {
          if (name === "alt") {
            if (value) this.domNode.setAttribute("alt", value);
            else this.domNode.removeAttribute("alt");
          } else if (name === "width" || name === "height") {
            if (value) this.domNode.style[name] = value;
            else this.domNode.style[name] = "";
          } else {
            super.format(name, value);
          }
        }
        static value(domNode) {
          return domNode.getAttribute("src");
        }
      }
      Quill.register(ImageFormat, true);
    };

    // ✅ FIXED: Enhanced setDelta function with table cell format restoration
    const setDelta = (deltaObj) => {
      const q = quillRef.current;
      if (!q || !deltaObj) return;
      const delta = typeof deltaObj === "string" ? safeParse(deltaObj) : deltaObj;
      if (!delta || !delta.ops) return;

      isPastingRef.current = true;
      q.setContents(delta, "api");

      // Walk ops to re-apply table line formats around embeds/newlines
      let index = 0;
      for (const op of delta.ops) {
        if (op.insert) {
          if (typeof op.insert === "string") {
            const length = op.insert.length;
            if (op.attributes) {
              const tableAttrs = {};
              for (const [key, value] of Object.entries(op.attributes)) {
                if (key.startsWith("table") || key === "table") tableAttrs[key] = value;
              }
              if (Object.keys(tableAttrs).length > 0) q.formatText(index, length, tableAttrs, "silent");
            }
            index += length;
          } else {
            // embeds (images, videos, etc.) count as length 1
            if (op.attributes) {
              const tableAttrs = {};
              for (const [key, value] of Object.entries(op.attributes)) {
                if (key.startsWith("table") || key === "table") tableAttrs[key] = value;
              }
              if (Object.keys(tableAttrs).length > 0) q.formatLine(index, 1, tableAttrs, "silent");
            }
            index += 1;
          }
        } else if (op.retain) {
          index += op.retain;
        }
      }

      // Force table refresh
      setTimeout(() => {
        const betterTable = q.getModule("better-table");
        if (betterTable && betterTable.updateTableWidth) {
          try { betterTable.updateTableWidth(); } catch {}
        }
        q.update("silent");
      }, 100);

      q.setSelection(q.getLength(), 0, "silent");
      isPastingRef.current = false;
    };

    const setHTML = (html) => {
      const q = quillRef.current;
      if (!q) return;
      isPastingRef.current = true;
      q.setContents([{ insert: "\n" }], "api");
      q.clipboard.dangerouslyPasteHTML(0, html || "", "api");

      setTimeout(() => {
        const betterTable = q.getModule("better-table");
        if (betterTable && betterTable.updateTableWidth) {
          try { betterTable.updateTableWidth(); } catch {}
        }
        q.update("silent");
      }, 100);

      q.setSelection(q.getLength(), 0, "silent");
      isPastingRef.current = false;
    };

    const getDelta = () => quillRef.current?.getContents() ?? null;
    const getHTML  = () => quillRef.current?.root?.innerHTML ?? "";

    useImperativeHandle(ref, () => ({
      setDelta, getDelta, setHTML, getHTML,
      insertTable: (rows = 3, cols = 3) => quillRef.current?.getModule("better-table")?.insertTable(rows, cols),
      getQuill: () => quillRef.current,
    }), []);

    useEffect(() => {
      if (quillRef.current) return;

      // ✅ Register modules/blots
      Quill.register({ "modules/better-table": QuillBetterTable }, true);
      Quill.register("modules/imageResize", ImageResize);   // ✅ NEW: Register the image resize module
      registerImageBlot();                                   // ✅ NEW: Register custom image blot for persistence

      // Sanitize links
      const Link = Quill.import("formats/link");
      Link.sanitize = (url) => {
        const u = normalizeUrl(url);
        return /^(https?:|mailto:|tel:|#|data:image\/)/i.test(u) ? u : "about:blank";
      };
      Quill.register(Link, true);

      // --- handlers
      const linkHandler = function () {
        const q = this.quill;
        const range = q.getSelection(true);
        if (!range) return;
        const selection = range.length > 0 ? q.getText(range.index, range.length) : "";
        let url = window.prompt("Enter URL", selection && /^https?:\/\//i.test(selection) ? selection : "https://");
        if (url == null) return;
        url = normalizeUrl(url);
        if (!url) return;

        if (isImageUrl(url)) {
          const imgSrc = normalizeImageSrc(url);
          if (range.length > 0) q.deleteText(range.index, range.length, "user");
          const insideCell = isInsideCell(q, range.index);
          const cellLineFormats = insideCell ? getTableLineFormats(q, range.index) : null;
          q.insertEmbed(range.index, "image", imgSrc, "user");
          if (insideCell && cellLineFormats) {
            q.formatLine(range.index, 1, cellLineFormats, "silent");
          }
          q.setSelection(range.index + 1, 0, "silent");
        } else {
          if (range.length === 0) {
            q.insertText(range.index, url, { link: url }, "user");
            q.setSelection(range.index + url.length, 0, "silent");
          } else {
            q.format("link", url, "user");
          }
        }
      };

      const imageHandler = function () {
        let input = fileInputRef.current;
        if (!input) {
          input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          fileInputRef.current = input;
        }
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            const q = quillRef.current;
            const range = q.getSelection(true) || { index: q.getLength(), length: 0 };
            const insideCell = isInsideCell(q, range.index);
            const cellLineFormats = insideCell ? getTableLineFormats(q, range.index) : null;
            q.insertEmbed(range.index, "image", dataUrl, "user");
            if (insideCell && cellLineFormats) {
              q.formatLine(range.index, 1, cellLineFormats, "silent");
            }
            q.setSelection(range.index + 1, 0, "silent");
          };
          reader.readAsDataURL(file);
          input.value = "";
        };
        input.click();
      };

      const insertTableHandler = () => {
        const r = parseInt(window.prompt("Rows?", "3") || "3", 10);
        const c = parseInt(window.prompt("Columns?", "3") || "3", 10);
        if (Number.isFinite(r) && r > 0 && Number.isFinite(c) && c > 0) {
          quillRef.current?.getModule("better-table")?.insertTable(r, c);
        }
      };

      const toggleHtmlHandler = () => typeof onToggleHtml === "function" && onToggleHtml();

      // --- create editor
      const q = new Quill(containerRef.current, {
        theme: "snow",
        bounds: containerRef.current,
        placeholder,
        modules: {
          toolbar: {
            container: toolbarRef.current,
            handlers: { link: linkHandler, image: imageHandler, insertTable: insertTableHandler, toggleHtml: toggleHtmlHandler },
          },
          clipboard: { matchVisual: true },
          "better-table": {
            operationMenu: {
              items: {
                insertColumnRight: { text: "Insert Column Right" },
                insertColumnLeft: { text: "Insert Column Left" },
                insertRowUp: { text: "Insert Row Above" },
                insertRowDown: { text: "Insert Row Below" },
                mergeCells: { text: "Merge Cells" },
                unmergeCells: { text: "Unmerge Cells" },
                deleteColumn: { text: "Delete Column" },
                deleteRow: { text: "Delete Row" },
                deleteTable: { text: "Delete Table" },
              },
            },
          },
          // ✅ NEW: Enable image resize module (works inside/outside tables)
          imageResize: {
            displaySize: true,  // Show size overlay during resize
            parchment: Quill.import("parchment"),
            modules: ["Resize", "DisplaySize", "Toolbar"],  // Enable resize handles, size display, and toolbar
          },
          keyboard: {
            bindings: {
              ...QuillBetterTable.keyboardBindings,
              link: { key: "K", shortKey: true, handler() { linkHandler.call({ quill: q }, true); return false; } },
            },
          },
        },
      });

      // ENTER (and Shift+ENTER) inside a cell: keep the line in the same cell
      q.keyboard.addBinding({ key: 13 }, (range) => {
        if (!range) return true;
        if (!isInsideCell(q, range.index)) return true;
        insertCellNewline(q, range.index);
        return false;
      });
      q.keyboard.addBinding({ key: 13, shiftKey: true }, (range) => {
        if (!range) return true;
        if (!isInsideCell(q, range.index)) return true;
        insertCellNewline(q, range.index);
        return false;
      });

      // --- Clipboard matchers
      const Delta = Quill.import("delta");

      // <br> → newline
      q.clipboard.addMatcher("BR", () => new Delta().insert("\n"));

      // <img> → embed; capture width/height so Delta keeps resize
      q.clipboard.addMatcher("IMG", (node) => {
        const raw = node.getAttribute("src") || "";
        const src = /^https?:\/\//i.test(raw) ? normalizeImageSrc(raw) : raw;
        const attrs = {};
        const w = node.style.width || node.getAttribute("width");
        const h = node.style.height || node.getAttribute("height");
        if (w) attrs.width = typeof w === "string" && /^\d+$/.test(w) ? `${w}px` : w;
        if (h) attrs.height = typeof h === "string" && /^\d+$/.test(h) ? `${h}px` : h;
        const alt = node.getAttribute("alt");
        if (alt) attrs.alt = alt;
        return Object.keys(attrs).length
          ? new Delta().insert({ image: src }, attrs)
          : new Delta().insert({ image: src });
      });

      // <a href="...image..."> → <img> with size if present
      q.clipboard.addMatcher("A", (node, delta) => {
        try {
          const href = node.getAttribute("href") || "";
          if (isImageUrl(href)) {
            const src = /^https?:\/\//i.test(href) ? normalizeImageSrc(href) : href;
            // we cannot read width/height from <a>, so just insert image
            return new Delta().insert({ image: src });
          }
        } catch {}
        return delta;
      });

      // --- Styles (overlay + tables)
      const style = document.createElement("style");
      style.setAttribute("data-quill-fixes", "1");
      style.textContent =
        `.ql-tooltip{z-index:9999}
         .ql-container{position:relative;} /* ensure resize overlay positions correctly */
         .ql-editor ul{list-style:disc;padding-left:1.5em;}
         .ql-editor ol{list-style:decimal;padding-left:1.5em;}
         .ql-editor table{table-layout:fixed;width:100%;border-collapse:collapse;}
         .ql-editor td,.ql-editor th{vertical-align:top;border:1px solid #ccc;padding:8px;}
         .ql-editor img{max-width:100%;height:auto;display:block;}
         .ql-better-table .qlbt-cell-data{overflow:visible;} /* ✅ let resize handles show in cells */
         .ql-editor table img{max-width:100%;height:auto;display:block;margin:2px 0;}
         .ql-editor table p{margin:0;padding:0;}
         .ql-editor .ql-table-cell-line{margin:0;}
         /* ✅ NEW: image-resize overlay: keep above table ui */
         .ql-image-resize{z-index:10000;}
         .ql-image-resize .ql-image-handle{width:10px;height:10px;border:1px solid rgba(0,0,0,.4);background:#fff;}
         .ql-image-resize .ql-image-size{font:12px/1.2 sans-serif;padding:2px 4px;background:rgba(0,0,0,.65);color:#fff;border-radius:3px;}`;
      document.head.appendChild(style);

      q.on("text-change", () => {
        if (isPastingRef.current) return;
        onChangeDelta?.(q.getContents());
        onChange?.(q.root.innerHTML);
      });

      quillRef.current = q;

      // initial content (prefer Delta)
      if (valueDelta) setDelta(valueDelta);
      else if (value) setHTML(value);

      return () => {
        document.head.querySelector('[data-quill-fixes="1"]')?.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onToggleHtml]);

    // sync incoming Delta
    useEffect(() => {
      const q = quillRef.current;
      if (!q || !valueDelta || isPastingRef.current) return;
      const incoming = typeof valueDelta === "string" ? safeParse(valueDelta) : valueDelta;
      if (!incoming || !incoming.ops) return;

      const current = q.getContents();
      const same =
        Array.isArray(current?.ops) &&
        Array.isArray(incoming?.ops) &&
        current.ops.length === incoming.ops.length &&
        current.ops.every((op, i) => JSON.stringify(op) === JSON.stringify(incoming.ops[i]));

      if (!same) setDelta(incoming);
    }, [valueDelta]);

    // sync HTML only if no Delta is provided
    useEffect(() => {
      const q = quillRef.current;
      if (!q || !value || valueDelta || isPastingRef.current) return;
      const current = q.root.innerHTML || "";
      const incoming = value || "";
      if (incoming && current !== incoming) setHTML(incoming);
      if (!incoming && current && current !== "<p><br></p>") setHTML("");
    }, [value, valueDelta]);

    return (
      <div>
        {/* Toolbar */}
        <div ref={toolbarRef} className="ql-toolbar ql-snow">
          <span className="ql-formats">
            <select className="ql-header" defaultValue="">
              <option value="1" />
              <option value="2" />
              <option value="3" />
              <option value="4" />
              <option value="5" />
              <option value="6" />
              <option value="" />
            </select>
          </span>
          <span className="ql-formats">
            <button className="ql-bold" />
            <button className="ql-italic" />
            <button className="ql-underline" />
            <button className="ql-strike" />
          </span>
          <span className="ql-formats">
            <select className="ql-color" />
            <select className="ql-background" />
          </span>
          <span className="ql-formats">
            <button className="ql-script" value="sub" />
            <button className="ql-script" value="super" />
          </span>
          <span className="ql-formats">
            <button className="ql-blockquote" />
            <button className="ql-code-block" />
          </span>
          <span className="ql-formats">
            <button className="ql-list" value="ordered" />
            <button className="ql-list" value="bullet" />
            <button className="ql-indent" value="-1" />
            <button className="ql-indent" value="+1" />
          </span>
          <span className="ql-formats">
            <select className="ql-align" />
          </span>
          <span className="ql-formats">
            <button className="ql-link" />
            <button className="ql-image" />
            <button className="ql-video" />
          </span>
          <span className="ql-formats">
            <button className="ql-clean" />
          </span>
          <span className="ql-formats">
            <button className="ql-insertTable" type="button" aria-label="Insert table" title="Insert Table">
              <svg viewBox="0 0 18 18" width="18" height="18">
                <rect className="ql-stroke" height="12" width="12" x="3" y="3" fill="none" />
                <line className="ql-stroke" x1="3" x2="15" y1="7" y2="7" />
                <line className="ql-stroke" x1="3" x2="15" y1="11" y2="11" />
                <line className="ql-stroke" x1="7" x2="7" y1="3" y2="15" />
                <line className="ql-stroke" x1="11" x2="11" y1="3" y2="15" />
              </svg>
            </button>
            <button className="ql-toggleHtml" type="button" title="Show HTML">HTML</button>
          </span>
        </div>

        {/* Editor */}
        <div
          ref={containerRef}
          style={{
            height: typeof height === "number" ? `${height}px` : height,
            border: "1px solid #ccc",
            borderRadius: "5px",
            backgroundColor: "#fff",
          }}
        />
      </div>
    );
  }
);

export default QuillEditor;