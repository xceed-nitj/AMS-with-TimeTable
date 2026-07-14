// QuillEditor.jsx — Image resize that round-trips via Delta (tables + normal flow)
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import QuillBetterTable from "quill-better-table";
import "quill-better-table/dist/quill-better-table.css";

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
    // Parents pass a fresh onToggleHtml every render; route calls through a
    // ref so the setup effect never has to re-run (re-runs used to destroy
    // the image resizer — including in the middle of a drag).
    const onToggleHtmlRef = useRef(onToggleHtml);
    useEffect(() => { onToggleHtmlRef.current = onToggleHtml; });

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
      if (!/^https?:\/\//i.test(s)) return s; // keep data:, mailto: etc. untouched
      try {
        const u = new URL(s);
        // encode each path segment (keeps slashes)
        u.pathname = u.pathname
          .split("/")
          .map(seg => seg === "" ? "" : encodeURIComponent(decodeURIComponent(seg)))
          .join("/");
        // encode query keys/values individually
        if (u.search) {
          const sp = new URLSearchParams(u.search);
          const sp2 = new URLSearchParams();
          for (const [k, v] of sp.entries()) sp2.set(encodeURIComponent(k), encodeURIComponent(v));
          u.search = `?${sp2.toString()}`;
        }
        return u.toString();
      } catch {
        // simple fallback
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

    // --- helpers for persisting sizes into Delta ---
    const toCssSize = (v) => {
      if (v == null) return null;
      if (typeof v === "number") return `${v}px`;
      const s = String(v).trim();
      return /^\d+$/.test(s) ? `${s}px` : s;
    };

    const applySizeToBlot = (img, { width, height }) => {
      const blot = Quill.find(img);
      if (!blot || typeof blot.format !== "function") return;
      if (width != null)  blot.format("width",  toCssSize(width)  || "");
      if (height != null) blot.format("height", toCssSize(height) || "");
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

    // --- Inline, dependency-free image resizer (writes formats so Delta saves) ---
    class ImageResizeLite {
      constructor(quill, options = {}) {
        this.quill = quill;
        this.options = { handleSize: 12, keepRatio: true, ...options };
        this.overlay = null;
        this.img = null;
        this.start = null;
        this.ratio = 1;

        this.onDown = this.onDown.bind(this);
        this.onScroll = this.reposition.bind(this);
        this.onTextChange = this.reposition.bind(this);

        // mousedown in the CAPTURE phase: inside quill-better-table cells the
        // table draws its own selection overlay on mousedown, so a later
        // "click" event no longer targets the IMG — capture runs first.
        quill.root.addEventListener("mousedown", this.onDown, true);
        quill.root.addEventListener("scroll", this.onScroll, { passive: true });
        window.addEventListener("resize", this.onScroll);
        quill.on("text-change", this.onTextChange);
      }

      destroy() {
        this.removeOverlay();
        this.quill.root.removeEventListener("mousedown", this.onDown, true);
        this.quill.root.removeEventListener("scroll", this.onScroll);
        window.removeEventListener("resize", this.onScroll);
        this.quill.off("text-change", this.onTextChange);
      }

      onDown(e) {
        const target = e.target;
        if (target && target.tagName === "IMG") {
          // Keep quill-better-table's column/row resize tool from hijacking
          // the mousedown when the image sits inside a table cell.
          e.stopPropagation();
          if (this.img === target) { this.reposition(); return; }
          this.select(target);
        } else if (!this.overlay || !this.overlay.contains(target)) {
          this.deselect();
        }
      }

      select(img) {
        this.img = img;
        const { width, height } = img.getBoundingClientRect();
        const naturalRatio =
          img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : width / height || 1;
        this.ratio = naturalRatio;

        this.createOverlay();
        this.reposition();
      }

      deselect() {
        this.img = null;
        this.removeOverlay();
      }

      createOverlay() {
        this.removeOverlay();
        // IMPORTANT: append to .ql-container (not the contentEditable .ql-editor):
        // Quill 2's MutationObserver deletes foreign nodes inside the editing
        // root instantly, so an overlay placed there never becomes visible.
        const container = this.quill.container || this.quill.root.parentNode;
        const ov = document.createElement("div");
        ov.className = "ql-ir-lite";
        ov.style.position = "absolute";
        ov.style.pointerEvents = "none";
        ov.style.zIndex = "10000";
        ov.style.boxSizing = "border-box";
        ov.style.border = "1px dashed rgba(0,0,0,.35)";

        // single SE drag handle — free dynamic sizing
        const h = document.createElement("div");
        h.className = "ql-ir-lite-handle";
        h.style.position = "absolute";
        h.style.right = "-8px";
        h.style.bottom = "-8px";
        h.style.width = "16px";
        h.style.height = "16px";
        h.style.borderRadius = "50%";
        h.style.background = "#3b82f6";
        h.style.border = "2px solid #fff";
        h.style.boxShadow = "0 1px 4px rgba(0,0,0,.4)";
        h.style.cursor = "se-resize";
        h.style.pointerEvents = "auto";

        h.addEventListener("mousedown", (ev) => { ev.stopPropagation(); this.startDrag(ev); });
        ov.appendChild(h);

        // Live size badge (updates while dragging)
        const badge = document.createElement("div");
        badge.className = "ql-ir-lite-size";
        badge.style.cssText =
          "position:absolute;top:-24px;left:0;background:#1e293b;color:#fff;font-size:11px;" +
          "padding:2px 8px;border-radius:6px;white-space:nowrap;pointer-events:none;font-family:sans-serif;";
        ov.appendChild(badge);
        this.badge = badge;

        container.appendChild(ov);
        this.overlay = ov;
      }

      removeOverlay() {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
      }

      startDrag(e) {
        e.preventDefault();
        if (!this.img) return;
        // Mute change propagation while dragging — Quill's mutation observer
        // fires on every inline style change and the resulting parent state
        // updates used to tear the editor (and this overlay) down mid-drag.
        this.quill.__irDragging = true;
        const rect = this.img.getBoundingClientRect();
        const rootRect = this.quill.root.getBoundingClientRect();

        this.start = {
          x: e.clientX,
          y: e.clientY,
          imgW: rect.width,
          imgH: rect.height,
          left: rect.left - rootRect.left + this.quill.root.scrollLeft,
          top: rect.top - rootRect.top + this.quill.root.scrollTop,
        };

        this.onMove = this.onDrag.bind(this);
        this.onUp = this.endDrag.bind(this);
        document.addEventListener("mousemove", this.onMove);
        document.addEventListener("mouseup", this.onUp);
      }

      onDrag(e) {
        if (!this.start || !this.img) return;
        const dx = e.clientX - this.start.x;
        const dy = e.clientY - this.start.y;

        let newW = Math.max(20, this.start.imgW + dx);
        let newH = this.start.imgH;

        if (this.options.keepRatio) {
          newH = Math.round(newW / this.ratio);
        } else {
          newH = Math.max(20, this.start.imgH + dy);
        }

        // While dragging: update inline styles ONLY. Writing to the Quill blot
        // here fires a full editor update per mousemove — that's what caused
        // the flicker. The size is persisted once, on mouse release.
        this.img.style.width = `${Math.round(newW)}px`;
        this.img.style.height = `${Math.round(newH)}px`;

        // Sync the overlay at most once per frame.
        if (!this._raf) {
          this._raf = requestAnimationFrame(() => {
            this._raf = null;
            this.reposition();
          });
        }
      }

      endDrag() {
        document.removeEventListener("mousemove", this.onMove);
        document.removeEventListener("mouseup", this.onUp);
        this.start = null;
        if (this._raf) {
          cancelAnimationFrame(this._raf);
          this._raf = null;
        }
        // Un-mute BEFORE the final write so the saved size reaches the parent.
        this.quill.__irDragging = false;
        // Persist the final size into the blot once, so the Delta saves it.
        if (this.img) {
          const rect = this.img.getBoundingClientRect();
          applySizeToBlot(this.img, {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
          requestAnimationFrame(() => this.reposition());
        }
      }

      reposition() {
        if (!this.overlay || !this.img) return;
        const imgRect = this.img.getBoundingClientRect();
        // Position relative to .ql-container — bounding rects already reflect
        // any internal editor scrolling, so no scroll offsets are added.
        const refEl = this.quill.container || this.quill.root.parentNode;
        const refRect = refEl.getBoundingClientRect();

        const left = imgRect.left - refRect.left;
        const top = imgRect.top - refRect.top;

        this.overlay.style.left = `${left}px`;
        this.overlay.style.top = `${top}px`;
        this.overlay.style.width = `${imgRect.width}px`;
        this.overlay.style.height = `${imgRect.height}px`;
        if (this.badge) {
          this.badge.textContent = `${Math.round(imgRect.width)} × ${Math.round(imgRect.height)}`;
        }
      }
    }

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
      // This effect re-runs whenever `onToggleHtml` changes identity (parents
      // pass a fresh callback each render) and on StrictMode remounts. The
      // cleanup below destroys the image resizer and removes the injected
      // styles while the Quill instance itself is kept — so on re-runs we must
      // RE-ATTACH them instead of returning with a dead resizer.
      if (quillRef.current) {
        const q = quillRef.current;
        if (!q.__imageResizeLite) {
          q.__imageResizeLite = new ImageResizeLite(q, { keepRatio: true });
        }
        if (!document.head.querySelector('[data-quill-fixes="1"]')) {
          document.head.appendChild(buildQuillFixesStyle());
        }
        return () => {
          try { q.__imageResizeLite?.destroy(); } catch {}
          q.__imageResizeLite = null;
          document.head.querySelector('[data-quill-fixes="1"]')?.remove();
        };
      }

      // ✅ Register modules/blots
      Quill.register({ "modules/better-table": QuillBetterTable }, true);
      Quill.register("modules/imageResizeLite", ImageResizeLite); // inline module
      registerImageBlot();                                        // custom image blot (persist w/h)

      // Quill's default align format writes ql-align-* classes, which only
      // render correctly inside elements wearing quill's own .ql-editor CSS.
      // Previews and the public conference site render the saved HTML outside
      // that scope, so center/right/justify silently had no visual effect
      // there. The style-based attributor writes inline `text-align` instead,
      // which works anywhere.
      const AlignStyle = Quill.import("attributors/style/align");
      Quill.register(AlignStyle, true);

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

      const toggleHtmlHandler = () => typeof onToggleHtmlRef.current === "function" && onToggleHtmlRef.current();

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
          // Note: the inline image resizer is instantiated manually below
          // (q.__imageResizeLite) — not via modules, to avoid double overlays.
          keyboard: {
            bindings: {
              ...QuillBetterTable.keyboardBindings,
              link: { key: "K", shortKey: true, handler() { linkHandler.call({ quill: q }, true); return false; } },
            },
          },
        },
      });

      // attach instance for cleanup
      q.__imageResizeLite = new ImageResizeLite(q, { keepRatio: true });

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
            return new Delta().insert({ image: src });
          }
        } catch {}
        return delta;
      });

      // --- Styles (overlay + tables)
      document.head.appendChild(buildQuillFixesStyle());

      q.on("text-change", () => {
        if (isPastingRef.current || q.__irDragging) return;
        onChangeDelta?.(q.getContents());
        onChange?.(q.root.innerHTML);
      });

      quillRef.current = q;

      // initial content (prefer Delta)
      if (valueDelta) setDelta(valueDelta);
      else if (value) setHTML(value);

      return () => {
        try { quillRef.current?.__imageResizeLite?.destroy(); } catch {}
        if (quillRef.current) quillRef.current.__imageResizeLite = null;
        document.head.querySelector('[data-quill-fixes="1"]')?.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Builds the injected stylesheet — kept as a function so effect re-runs
    // (StrictMode remounts, changed callbacks) can re-create it after cleanup.
    function buildQuillFixesStyle() {
      const style = document.createElement("style");
      style.setAttribute("data-quill-fixes", "1");
      style.textContent =
        `.ql-tooltip{z-index:9999}
         .ql-container{position:relative;}
         .ql-editor{position:relative;} /* ensure resize overlay positions correctly */
         /* Quill 2 renders BOTH bullet and numbered lists as <ol>, with the
            marker type in each <li>'s data-list attribute drawn via ::before
            counters. Native list-style must stay OFF or switching numbering →
            bullets shows numbers alongside the bullets. */
         .ql-editor ol,.ql-editor ul{list-style-type:none;padding-left:1.5em;counter-reset:list-0;}
         .ql-editor li[data-list]{list-style-type:none;}
         .ql-editor li[data-list]::marker{content:none;} /* beats list-style overrides from other stylesheets */
         /* Fallback markers for previews where the .ql-ui marker spans were
            stripped by sanitizing — same visuals, drawn on the li itself. */
         .ql-editor li[data-list=bullet]:not(:has(> .ql-ui))::before{content:'\\2022  ';}
         .ql-editor li[data-list=ordered]{counter-increment:list-0;}
         .ql-editor li[data-list=ordered]:not(:has(> .ql-ui))::before{content:counter(list-0) '. ';}
         /* Legacy content saved as plain lists (no data-list attributes)
            keeps native markers. */
         .ql-editor ul li:not([data-list]){list-style-type:disc;}
         .ql-editor ol li:not([data-list]){list-style-type:decimal;}
         /* Links must stay visible in previews — Chakra's global reset makes
            them inherit color with no underline. */
         .ql-editor a{color:#2563eb !important;text-decoration:underline !important;}
         .ql-editor table{table-layout:fixed;width:100%;border-collapse:collapse;}
         .ql-editor td,.ql-editor th{vertical-align:top;border:1px solid #ccc;padding:8px;}
         .ql-editor img{max-width:100%;height:auto;display:block;}
         .ql-better-table .qlbt-cell-data{overflow:visible;} /* let resize handles show in cells */
         .ql-editor table img{max-width:100%;height:auto;display:block;margin:2px 0;}
         .ql-editor table p{margin:0;padding:0;}
         .ql-editor .ql-table-cell-line{margin:0;}
         /* inline resizer overlay */
         .ql-ir-lite{z-index:10000;}
         .ql-ir-lite-handle{width:12px;height:12px;border:1px solid rgba(0,0,0,.4);background:#fff;}`;
      return style;
    }

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
