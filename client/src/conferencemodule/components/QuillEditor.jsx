import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import QuillBetterTable from "quill-better-table";
import "quill-better-table/dist/quill-better-table.css";

const QuillEditor = forwardRef(
  (
    {
      value = "",
      onChange,
      placeholder = "Write description here...",
      height = 250,
      onToggleHtml, // parent can pass a function to toggle its HTML panel
    },
    ref
  ) => {
    const toolbarRef = useRef(null);
    const containerRef = useRef(null);
    const quillRef = useRef(null);
    const isPastingRef = useRef(false);

    const isImageUrl = (url = "") => {
      const s = url.trim();
      if (/^data:image\//i.test(s)) return true;
      const base = s.split("#")[0].split("?")[0].toLowerCase();
      return /\.(png|jpe?g|gif|webp|svg)$/i.test(base);
    };

    const normalizeUrl = (url = "") => {
      const u = url.trim();
      if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
      if (/^[\w-]+(\.[\w-]+)+/.test(u)) return `https://${u}`;
      return u;
    };

    const setHTML = (html) => {
      const q = quillRef.current;
      if (!q) return;
      isPastingRef.current = true;
      q.setContents([{ insert: "\n" }], "api");
      q.clipboard.dangerouslyPasteHTML(0, html || "", "api");
      q.setSelection(q.getLength(), 0, "silent");
      isPastingRef.current = false;
    };

    const getHTML = () => (quillRef.current ? quillRef.current.root.innerHTML : "");

    useImperativeHandle(
      ref,
      () => ({
        setHTML,
        getHTML,
        insertTable: (rows = 3, cols = 3) => {
          const mod = quillRef.current?.getModule("better-table");
          mod?.insertTable(rows, cols);
        },
        getQuill: () => quillRef.current,
      }),
      []
    );

    useEffect(() => {
      if (quillRef.current) return;

      // Register better-table
      Quill.register({ "modules/better-table": QuillBetterTable }, true);

      // Sanitize links (allow bare domains)
      const Link = Quill.import("formats/link");
      Link.sanitize = (url) => {
        const s = normalizeUrl(url);
        if (/^(https?:|mailto:|tel:|#)/i.test(s)) return s;
        return "about:blank";
      };
      Quill.register(Link, true);

      // Handlers
      const linkHandler = function () {
        const q = this.quill;
        const range = q.getSelection(true);
        if (!range) return;
        const selection = range.length > 0 ? q.getText(range.index, range.length) : "";
        let url = window.prompt(
          "Enter URL",
          selection && /^https?:\/\//i.test(selection) ? selection : "https://"
        );
        if (url == null) return;
        url = normalizeUrl(url);
        if (!url) return;

        if (isImageUrl(url)) {
          if (range.length > 0) q.deleteText(range.index, range.length, "user");
          q.insertEmbed(range.index, "image", url, "user");
          q.insertText(range.index + 1, " ", "user");
          q.setSelection(range.index + 2, 0, "user");
        } else {
          if (range.length === 0) {
            q.insertText(range.index, url, { link: url }, "user");
            q.setSelection(range.index + url.length, 0, "user");
          } else {
            q.format("link", url, "user");
          }
        }
      };

      const insertTableHandler = () => {
        const r = parseInt(window.prompt("Rows?", "3") || "3", 10);
        const c = parseInt(window.prompt("Columns?", "3") || "3", 10);
        if (Number.isFinite(r) && r > 0 && Number.isFinite(c) && c > 0) {
          quillRef.current?.getModule("better-table")?.insertTable(r, c);
        }
      };

      const toggleHtmlHandler = () => {
        if (typeof onToggleHtml === "function") onToggleHtml();
      };

      // Create Quill with our custom toolbar DOM
      const q = new Quill(containerRef.current, {
        theme: "snow",
        bounds: containerRef.current,
        placeholder,
        modules: {
          toolbar: {
            container: toolbarRef.current, // use our DOM toolbar
            handlers: {
              link: linkHandler,
              insertTable: insertTableHandler,
              toggleHtml: toggleHtmlHandler,
            },
          },
          clipboard: { matchVisual: false },
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
          keyboard: {
            bindings: {
              ...QuillBetterTable.keyboardBindings,
              link: {
                key: "K",
                shortKey: true,
                handler() {
                  linkHandler.call({ quill: q }, true);
                  return false;
                },
              },
            },
          },
        },
      });

      // Convert <a href="...image..."> into image on paste
      const Delta = Quill.import("delta");
      q.clipboard.addMatcher("A", (node, delta) => {
        try {
          const href = node.getAttribute("href") || "";
          if (isImageUrl(href)) return new Delta().insert({ image: normalizeUrl(href) });
        } catch {}
        return delta;
      });

      // Keep tooltip above modals
      const style = document.createElement("style");
      style.setAttribute("data-quill-fixes", "1");
      style.textContent =
        `.ql-tooltip{z-index:9999}
         .ql-editor ul{list-style-type:disc;padding-left:1.5em;}
         .ql-editor ol{list-style-type:decimal;padding-left:1.5em;}
         .ql-editor img{max-width:100%;height:auto;}`;
      document.head.appendChild(style);

      q.on("text-change", () => {
        if (isPastingRef.current) return;
        onChange?.(q.root.innerHTML);
      });

      quillRef.current = q;

      // initial value
      if (value) setHTML(value);

      return () => {
        document.head.querySelector('[data-quill-fixes="1"]')?.remove();
      };
    }, [onToggleHtml]);

    // Sync external value
    useEffect(() => {
      const q = quillRef.current;
      if (!q) return;
      if (isPastingRef.current) return;
      const current = q.root.innerHTML || "";
      const incoming = value || "";
      if (incoming && current !== incoming) setHTML(incoming);
      if (!incoming && current && current !== "<p><br></p>") setHTML("");
    }, [value]);

    return (
      <div>
        {/* Custom Snow toolbar with a real Table icon + HTML button */}
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

          {/* Custom buttons */}
          <span className="ql-formats">
            {/* Table button with SVG icon */}
            <button className="ql-insertTable" type="button" aria-label="Insert table" title="Insert Table">
              <svg viewBox="0 0 18 18" width="18" height="18">
                <rect className="ql-stroke" height="12" width="12" x="3" y="3" fill="none" />
                <line className="ql-stroke" x1="3" x2="15" y1="7" y2="7" />
                <line className="ql-stroke" x1="3" x2="15" y1="11" y2="11" />
                <line className="ql-stroke" x1="7" x2="7" y1="3" y2="15" />
                <line className="ql-stroke" x1="11" x2="11" y1="3" y2="15" />
              </svg>
            </button>

            {/* HTML toggle button */}
            <button className="ql-toggleHtml" type="button" title="Show HTML">HTML</button>
          </span>
        </div>

        {/* Editor container */}
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
