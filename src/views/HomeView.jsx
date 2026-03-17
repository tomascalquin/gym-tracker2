import { DAY_ORDER, DAY_META, ROUTINE } from "../data/routine";
import { getSessionKey, todayStr } from "../utils/storage";
import { getWeekNumber } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";

/**
 * Vista principal: selector de día, stats y navegación.
 */
export default function HomeView({ logs, sessionDate, setSessionDate, onStartSession, onNavigate }) {
  const today = todayStr();

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "28px 18px" }}>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "#1e1e2e", marginBottom: 4 }}>
          HYPERTROPHY TRACKER
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: -1, color: "#f8fafc" }}>
            Tomás
          </h1>
          <span style={{ color: "#60a5fa", fontSize: 28, animation: "blink 1.4s infinite" }}>_</span>
        </div>
        <div style={{ fontSize: 11, color: "#2a2a3e", marginTop: 2 }}>
          {Object.keys(logs).length} sesiones · semana {getWeekNumber()}
        </div>
      </div>

      {/* Stats por día */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 22 }}>
        {DAY_ORDER.map((d) => {
          const c = DAY_META[d];
          const n = Object.keys(logs).filter((k) => k.startsWith(d + "__")).length;
          return (
            <div key={d} className="card" style={{ padding: "10px 6px", textAlign: "center", borderLeft: `2px solid ${c.accent}` }}>
              <div style={{ fontSize: 20, fontWeight: 400, color: c.accent }}>{n}</div>
              <div style={{ fontSize: 8, color: "#2a2a3e", letterSpacing: 1, marginTop: 2 }}>{d}</div>
            </div>
          );
        })}
      </div>

      {/* Selector de fecha */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#2a2a3e", marginBottom: 5 }}>FECHA</div>
        <input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          style={{
            background: "#0e0e1a", border: "1px solid #1a1a2a", color: "#94a3b8",
            padding: "9px 12px", borderRadius: 8, fontSize: 12,
            width: "100%", fontFamily: "inherit", outline: "none",
          }}
        />
      </div>

      {/* Cards de días */}
      {DAY_ORDER.map((day) => {
        const c = DAY_META[day];
        const hasLog = !!logs[getSessionKey(day, sessionDate)];
        const exCount = ROUTINE[day].exercises.length;
        const setCount = ROUTINE[day].exercises.reduce((a, e) => a + e.sets.length, 0);
        return (
          <button
            key={day}
            onClick={() => onStartSession(day)}
            style={{
              width: "100%",
              background: hasLog ? c.dim + "55" : "#0e0e1a",
              border: `1px solid ${hasLog ? c.accent + "44" : "#1a1a2a"}`,
              borderLeft: `3px solid ${c.accent}`,
              borderRadius: 10,
              padding: "13px 16px",
              cursor: "pointer",
              textAlign: "left",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 9, letterSpacing: 2, color: c.accent }}>{c.tag}</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: "#f1f5f9" }}>{day}</span>
                {hasLog && (
                  <span style={{ fontSize: 8, background: c.accent + "22", color: c.accent, padding: "2px 7px", borderRadius: 10 }}>
                    LOGGED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "#2a2a3e" }}>
                {exCount} ejercicios · {setCount} series
              </div>
            </div>
            <span style={{ color: c.accent }}>›</span>
          </button>
        );
      })}

      {/* Nav */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        <button onClick={() => onNavigate("history")} className="nbtn" style={{ border: "1px solid #1a1a2a", color: "#475569", padding: "10px", borderRadius: 8, fontSize: 9, letterSpacing: 2 }}>
          HISTORIAL
        </button>
        <button onClick={() => onNavigate("progress")} className="nbtn" style={{ border: "1px solid #1a1a2a", color: "#475569", padding: "10px", borderRadius: 8, fontSize: 9, letterSpacing: 2 }}>
          PROGRESO
        </button>
      </div>
      <button
        onClick={() => exportToExcel(logs)}
        className="nbtn"
        style={{ marginTop: 8, width: "100%", border: "1px solid #1a3a1a", color: "#22c55e", padding: "10px", borderRadius: 8, fontSize: 9, letterSpacing: 2 }}
      >
        ↓ EXPORTAR EXCEL
      </button>
    </div>
  );
}
