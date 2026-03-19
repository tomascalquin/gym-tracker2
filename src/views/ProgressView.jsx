import { useState } from "react";
import { DAY_META } from "../data/routine";
import { calc1RM, bestSet } from "../utils/fitness";
import ExerciseChart from "../components/ExerciseChart";

export default function ProgressView({ logs, routine, onBack }) {
  const routineDays = Object.keys(routine || {});
  const firstDay    = routineDays[0] || "";
  const firstEx     = routine?.[firstDay]?.exercises?.[0]?.name || "";

  const [progressDay, setProgressDay] = useState(firstDay);
  const [progressEx, setProgressEx]   = useState(firstEx);

  function handleDayChange(day) {
    setProgressDay(day);
    setProgressEx(routine?.[day]?.exercises?.[0]?.name || "");
  }

  const exercises = routine?.[progressDay]?.exercises || [];
  // Usar colores predefinidos si existe, sino un color genérico
  const accent = DAY_META[progressDay]?.accent || "#60a5fa";
  const dimBg  = DAY_META[progressDay]?.dim    || "#1e3a5f";

  // Tabla de PRs — usar índice desde la rutina dinámica
  const prRows = Object.values(logs)
    .filter(s => s.day === progressDay)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const ei = exercises.findIndex(e => e.name === progressEx);
      if (ei === -1) return null;
      const sets = s.sets[ei];
      if (!sets?.length) return null;
      const best = bestSet(sets);
      return { date: s.date, weight: best.weight, reps: best.reps, rm: calc1RM(best.weight, best.reps) };
    })
    .filter(Boolean);

  const maxRM = prRows.length ? Math.max(...prRows.map(r => r.rm)) : 0;

  if (!routineDays.length) {
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 14, marginBottom: 20 }}>← HOME</button>
        <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
          Aún no tienes rutina configurada.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 14, letterSpacing: 1 }}>
          ← HOME
        </button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>
          PROGRESO
        </h2>
      </div>

      {/* Selector de día — dinámico desde la rutina del usuario */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(routineDays.length, 4)}, 1fr)`, gap: 6, marginBottom: 14 }}>
        {routineDays.map(d => {
          const c      = DAY_META[d] || { accent: "#60a5fa", dim: "#1e3a5f" };
          const active = progressDay === d;
          return (
            <button key={d} onClick={() => handleDayChange(d)} style={{
              background: active ? c.dim : "#0e0e1a",
              border: `1px solid ${active ? c.accent : "#1a1a2a"}`,
              color: active ? c.accent : "#334155",
              padding: "8px 4px", borderRadius: 8, cursor: "pointer",
              fontSize: 11, letterSpacing: 1, fontFamily: "inherit",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {d}
            </button>
          );
        })}
      </div>

      {/* Selector de ejercicio */}
      <select value={progressEx} onChange={e => setProgressEx(e.target.value)} style={{
        width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
        color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
        fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 14,
      }}>
        {exercises.map(ex => (
          <option key={ex.name} value={ex.name}>{ex.name}</option>
        ))}
      </select>

      {/* Gráfico */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: 13, color: accent, marginBottom: 12, letterSpacing: 1 }}>{progressEx}</div>
        <ExerciseChart exName={progressEx} dayName={progressDay} logs={logs} accent={accent} routine={routine} />
        <div style={{ fontSize: 11, color: "#475569", marginTop: 8, textAlign: "center" }}>
          — — peso real &nbsp;·&nbsp; —— 1RM Epley
        </div>
      </div>

      {/* Tabla PRs */}
      {prRows.length > 0 && (
        <div className="card" style={{ marginTop: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>HISTORIAL SETS</div>
          {prRows.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 13, color: "#475569" }}>{r.date}</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{r.weight}kg × {r.reps}</span>
              <span style={{ fontSize: 14, color: r.rm === maxRM ? "#fbbf24" : accent, fontWeight: r.rm === maxRM ? 700 : 400 }}>
                {r.rm} {r.rm === maxRM ? "🏆" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
