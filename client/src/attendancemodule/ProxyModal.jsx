import React from "react";
import { cssReset } from "./config";

// USE to display Proxy student information from attendanceReport.js ' s proxyStudentSchema

export default function ProxyModal({
  open,
  onClose,
  proxyStudents = [],
  theme,
  styles,
}) {
  if (!open) return null;

  const CSS = `
    ${cssReset}
    table, th, td {
      border: 1px ${theme.border} solid;
    }
  `

  return (
    <>
    <style>
      {CSS}
    </style>
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 850,
          maxHeight: "85vh",
          overflowY: "auto",
          background: theme.surface,
          borderRadius: 14,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: theme.text,
              }}
            >
              Possible Proxy Attendance
            </div>

            <div
              style={{
                marginTop: 4,
                color: theme.textMuted,
                fontSize: 13,
              }}
            >
              Students detected in more than one classroom during the same
              timeslot.
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 24,
              color: theme.textMuted,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22 }}>
          {proxyStudents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: theme.textMuted,
                padding: "40px 0",
              }}
            >
              No proxy attendance detected.
            </div>
          ) : (
            proxyStudents.map((student) => (
              <div
                key={student.rollNo}
                style={{
                  marginBottom: 22,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {/* Student Header */}
                <div
                  style={{
                    background: theme.warningDim,
                    padding: "12px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        textTransform: "uppercase",
                      }}
                    >
                      Roll Number
                    </div>

                    <div
                      style={{
                        fontFamily: theme.fontMono,
                        fontWeight: 700,
                        fontSize: 18,
                        color: theme.text,
                      }}
                    >
                      {student.rollNo}
                    </div>
                  </div>

                  <span
                    style={{
                      ...styles.badge("warning"),
                      fontSize: 12,
                    }}
                  >
                    Detected in {student.otherReports.length} oher class 
                    {student.otherReports.length > 1 ? "es" : ""}
                  </span>
                </div>

                {/* Reports */}
                <div style={{ padding: 18 }}>
                  <table style={{width: "100%", borderCollapse: "collapse"}}>
                    <thead>
                      <tr>
                        <th style={thStyle(theme)}>Room</th>
                        <th style={thStyle(theme)}>Subject</th>
                        <th style={thStyle(theme)}>Faculty</th>
                      </tr>
                    </thead>

                    <tbody>
                      {student.otherReports.map((r) => (
                        <tr key={r.reportId}>
                          <td style={tdStyle(theme)}>
                            <span
                              style={{
                                fontFamily: theme.fontMono,
                                fontWeight: 600,
                              }}
                            >
                              {r.room}
                            </span>
                          </td>

                          <td style={tdStyle(theme)}>
                            {r.subject || "—"}
                          </td>

                          <td style={tdStyle(theme)}>
                            {r.faculty || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 18,
            borderTop: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={styles.btnPrimary}
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

function thStyle(theme) {
  return {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    color: theme.textMuted,
    borderBottom: `1px solid ${theme.border}`,
    fontWeight: 600,
  };
}

function tdStyle(theme) {
  return {
    padding: "12px",
    borderBottom: `1px solid ${theme.border}`,
    color: theme.text,
    fontSize: 13,
  };
}