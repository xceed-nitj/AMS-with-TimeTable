import { useState, useRef, useEffect } from "react";

// const API_BASE = "http://localhost:8000";
const API_BASE = "https://timetable-backend-nochromadb.onrender.com";

// const QUICK_QUERIES = [
//   "When is Rawel Singh free on Monday?",
//   "Give me timetable of Vipin Kumar",
//   "Who teaches in room CY-102 on Wednesday?",
//   "What does Vipin Kumar teach on Monday?",
// ];

function TypingDots() {
  return (
    <div style={styles.typingDots}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isBot = msg.role === "bot";
  return (
    <div style={{ ...styles.msgRow, justifyContent: isBot ? "flex-start" : "flex-end" }}>
      {isBot && (
        <div style={styles.avatar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#1a56db" />
            <circle cx="9" cy="10" r="2" fill="white" />
            <circle cx="15" cy="10" r="2" fill="white" />
            <path d="M8 15 Q12 18 16 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      )}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ ...styles.bubble, ...(isBot ? styles.botBubble : styles.userBubble) }}>
          {msg.typing ? <TypingDots /> : (
            <span style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{msg.text}</span>
          )}
        </div>
        {msg.pdfUrl && (
          <a
            href={`${API_BASE}${msg.pdfUrl}`}
            target="_blank"
            rel="noreferrer"
            style={styles.pdfBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9,15 12,18 15,15" />
            </svg>
            Download Timetable PDF
          </a>
        )}
      </div>
    </div>
  );
}

export default function TimetableChatbot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm your timetable assistant 👋\nAsk me about faculty schedules, free slots, room availability, or request a timetable PDF.",
      id: 0,
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function sendMessage(text) {
    const query = text || input.trim();
    if (!query || loading) return;
    setInput("");

    const userMsg = { role: "user", text: query, id: Date.now() };
    const typingMsg = { role: "bot", typing: true, id: Date.now() + 1 };
    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setLoading(true);

    try {
      const res  = await fetch(`${API_BASE}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query }),
      });
      const data = await res.json();

      setMessages((prev) =>
        prev
          .filter((m) => !m.typing)
          .concat({
            role:   "bot",
            text:   data.answer,
            pdfUrl: data.pdf_url || null,
            id:     Date.now() + 2,
          })
      );
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => !m.typing)
          .concat({
            role: "bot",
            text: "Sorry, I couldn't reach the server. Please make sure the backend is running.",
            id:   Date.now() + 2,
          })
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={styles.fab}
        title="Timetable Assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9"  cy="10" r="1" fill="white" />
            <circle cx="12" cy="10" r="1" fill="white" />
            <circle cx="15" cy="10" r="1" fill="white" />
          </svg>
        )}
        {/* Pulse ring */}
        {!open && <span style={styles.pulse} />}
      </button>

      {/* Chat window */}
      {open && (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="4" fill="white" fillOpacity="0.25"/>
                  <circle cx="9"  cy="10" r="2" fill="white" />
                  <circle cx="15" cy="10" r="2" fill="white" />
                  <path d="M8 15 Q12 18 16 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div>
                <div style={styles.headerTitle}>Timetable Assistant</div>
                <div style={styles.headerSub}>
                  <span style={styles.onlineDot} /> Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6"  y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick queries */}
          {/* <div style={styles.quickWrap}>
            <div style={styles.quickScroll}>
              {QUICK_QUERIES.map((q) => (
                <button key={q} style={styles.quickBtn} onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div> */}

          {/* Input */}
          <div style={styles.inputRow}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about schedules, rooms, free slots..."
              rows={1}
              style={styles.textarea}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.45 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  fab: {
    position:     "fixed",
    bottom:       28,
    right:        28,
    width:        56,
    height:       56,
    borderRadius: "50%",
    background:   "linear-gradient(135deg, #1a56db, #1e40af)",
    border:       "none",
    cursor:       "pointer",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    boxShadow:    "0 4px 20px rgba(26,86,219,0.45)",
    zIndex:       9999,
    transition:   "transform 0.2s ease, box-shadow 0.2s ease",
  },
  pulse: {
    position:     "absolute",
    width:        56,
    height:       56,
    borderRadius: "50%",
    background:   "rgba(26,86,219,0.35)",
    animation:    "pulse 2s ease-out infinite",
    pointerEvents:"none",
  },
  window: {
    position:     "fixed",
    bottom:       96,
    right:        28,
    width:        370,
    height:       520,
    borderRadius: 16,
    background:   "#ffffff",
    boxShadow:    "0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
    display:      "flex",
    flexDirection:"column",
    overflow:     "hidden",
    zIndex:       9998,
    fontFamily:   "'DM Sans', 'Segoe UI', sans-serif",
    animation:    "slideUp 0.25s ease",
  },
  header: {
    background:     "linear-gradient(135deg, #1a56db, #1e40af)",
    padding:        "14px 16px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    flexShrink:     0,
  },
  headerLeft: {
    display:    "flex",
    alignItems: "center",
    gap:        10,
  },
  headerIcon: {
    width:        36,
    height:       36,
    borderRadius: 10,
    background:   "rgba(255,255,255,0.15)",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
  },
  headerTitle: {
    color:      "white",
    fontWeight: 600,
    fontSize:   14,
    lineHeight: 1.3,
  },
  headerSub: {
    color:      "rgba(255,255,255,0.75)",
    fontSize:   11,
    display:    "flex",
    alignItems: "center",
    gap:        4,
    marginTop:  1,
  },
  onlineDot: {
    width:        6,
    height:       6,
    borderRadius: "50%",
    background:   "#4ade80",
    display:      "inline-block",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.15)",
    border:     "none",
    borderRadius: 8,
    padding:    6,
    cursor:     "pointer",
    display:    "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  messages: {
    flex:       1,
    overflowY:  "auto",
    padding:    "14px 14px 8px",
    display:    "flex",
    flexDirection: "column",
    gap:        10,
    background: "#f8fafc",
  },
  msgRow: {
    display:    "flex",
    alignItems: "flex-end",
    gap:        8,
  },
  avatar: {
    width:        28,
    height:       28,
    borderRadius: "50%",
    background:   "#e8f0fe",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    flexShrink:   0,
  },
  bubble: {
    padding:      "9px 13px",
    borderRadius: 12,
    fontSize:     13.5,
    lineHeight:   1.5,
    wordBreak:    "break-word",
  },
  botBubble: {
    background:         "white",
    color:              "#1e293b",
    borderBottomLeftRadius: 3,
    boxShadow:          "0 1px 3px rgba(0,0,0,0.07)",
  },
  userBubble: {
    background:          "linear-gradient(135deg, #1a56db, #1e40af)",
    color:               "white",
    borderBottomRightRadius: 3,
  },
  pdfBtn: {
    display:      "inline-flex",
    alignItems:   "center",
    gap:          6,
    padding:      "6px 12px",
    background:   "#1a56db",
    color:        "white",
    borderRadius: 8,
    fontSize:     12,
    fontWeight:   500,
    textDecoration: "none",
    width:        "fit-content",
    transition:   "background 0.15s",
  },
  // quickWrap: {
  //   padding:    "6px 12px 4px",
  //   background: "white",
  //   borderTop:  "1px solid #f1f5f9",
  //   flexShrink: 0,
  // },
  // quickScroll: {
  //   display:    "flex",
  //   gap:        6,
  //   overflowX:  "auto",
  //   paddingBottom: 4,
  //   scrollbarWidth: "none",
  // },
  // quickBtn: {
  //   flexShrink:   0,
  //   padding:      "5px 10px",
  //   borderRadius: 20,
  //   border:       "1px solid #e2e8f0",
  //   background:   "#f8fafc",
  //   color:        "#475569",
  //   fontSize:     11.5,
  //   cursor:       "pointer",
  //   whiteSpace:   "nowrap",
  //   transition:   "all 0.15s",
  // },
  inputRow: {
    display:    "flex",
    alignItems: "flex-end",
    gap:        8,
    padding:    "10px 12px",
    background: "white",
    borderTop:  "1px solid #f1f5f9",
    flexShrink: 0,
  },
  textarea: {
    flex:         1,
    border:       "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding:      "8px 12px",
    fontSize:     13.5,
    fontFamily:   "inherit",
    resize:       "none",
    outline:      "none",
    color:        "#1e293b",
    background:   "#f8fafc",
    lineHeight:   1.5,
    maxHeight:    80,
    overflowY:    "auto",
  },
  sendBtn: {
    width:        38,
    height:       38,
    borderRadius: 10,
    background:   "linear-gradient(135deg, #1a56db, #1e40af)",
    border:       "none",
    cursor:       "pointer",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    flexShrink:   0,
    transition:   "opacity 0.15s",
  },
  typingDots: {
    display:    "flex",
    alignItems: "center",
    gap:        4,
    height:     18,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: "50%",
    background:   "#94a3b8",
    display:      "inline-block",
    animation:    "bounce 0.9s ease-in-out infinite",
  },
};

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("chatbot-keyframes")) {
  const style = document.createElement("style");
  style.id = "chatbot-keyframes";
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0);   }
      40%           { transform: translateY(-6px); }
    }
    @keyframes pulse {
      0%   { transform: scale(1);   opacity: 0.7; }
      100% { transform: scale(1.8); opacity: 0;   }
    }
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
  `;
  document.head.appendChild(style);
}