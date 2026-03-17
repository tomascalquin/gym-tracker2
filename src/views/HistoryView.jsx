import { DAY_META } from "../data/routine";
import { sessionVolume } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";

/**
 * Vista de historial de todas las sesiones registradas.
 */
export default function HistoryView({ logs, onBack, onViewSession, onDeleteSession }) {
  const sorted = Object.entries(logs).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 11, letterSpacing: 1 }}>
          ← HOME
        </button>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>
          HISTORIAL
        </h2>
        <button
          onClick={() => exportToExcel(logs)}
          className="nbtn"
          style={{ marginLeft: "auto", border: "1px solid #1a3a1a", color: "#22c55e", padding: "5px 12px", borderRadius: 6, fontSize: 9, letterSpacing: 1 }}
        >
          ↓ XLSX
        </button>
      </div>

      {!sorted.length && (
        <div style={{ color: "#2a2a3e", fontSize: 12, textAlign: "center", padding: "40px 0" }}>
          Sin sesiones aún.
        </div>
      )}

      {sorted.map(([key, s]) => {
        const c = DAY_META[s.day];
        const vol = sessionVolume(s.sets).toLocaleString();
        const completedCount = Object.values(s.completed || {}).filter(Boolean).length;

        return (
          <div
            key={key}
            className="card"
            style={{
              borderLeft: `3px solid ${c.accent}`,
              marginBottom: 9,
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 13, color: "#f1f5f9" }}>{s.day}</span>
                <span style={{ fontSize: 10, color: "#1e1e2e" }}>·</span>
                <span style={{ fontSize: 10, color: "#475569" }}>{s.date}</span>
              </div>
              <div style={{ fontSize: 10, color: "#2a2a3e" }}>
                vol {vol} · {completedCount} sets ✓
              </div>
              {s.note && (
                <div style={{ fontSize: 10, color: "#475569", marginTop: 3, fontStyle: "italic" }}>
                  "{s.note.slice(0, 55)}{s.note.length > 55 ? "…" : ""}"
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => onViewSession(s.day, s.date)}
                style={{
                  background: "#0a0a14", border: `1px solid ${c.accent}33`, color: c.accent,
                  padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "inherit",
                }}
              >
                VER
              </button>
              <button
                onClick={() => onDeleteSession(key)}
                className="nbtn"
                style={{ border: "1px solid #3f1010", color: "#ef4444", padding: "5px 8px", borderRadius: 6, fontSize: 10 }}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
