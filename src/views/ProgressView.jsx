import { useState } from "react";
import { DAY_ORDER, DAY_META, ROUTINE } from "../data/routine";
import { calc1RM, bestSet } from "../utils/fitness";
import ExerciseChart from "../components/ExerciseChart";

/**
 * Vista de progreso: gráfico + tabla de PRs por ejercicio y día.
 */
export default function ProgressView({ logs, onBack }) {
  const [progressDay, setProgressDay] = useState("Upper A");
  const [progressEx, setProgressEx] = useState(ROUTINE["Upper A"].exercises[0].name);

  function handleDayChange(day) {
    setProgressDay(day);
    setProgressEx(ROUTINE[day].exercises[0].name);
  }

  // Construir tabla de PRs
  const prRows = Object.values(logs)
    .filter((s) => s.day === progressDay)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const ei = ROUTINE[progressDay].exercises.findIndex((e) => e.name === progressEx);
      const sets = s.sets[ei];
      if (!sets?.length) return null;
      const best = bestSet(sets);
      return { date: s.date, weight: best.weight, reps: best.reps, rm: calc1RM(best.weight, best.reps) };
    })
    .filter(Boolean);

  const maxRM = prRows.length ? Math.max(...prRows.map((r) => r.rm)) : 0;
  const accent = DAY_META[progressDay].accent;

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 11, letterSpacing: 1 }}>
          ← HOME
        </button>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>
          PROGRESO
        </h2>
      </div>

      {/* Selector de día */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 14 }}>
        {DAY_ORDER.map((d) => {
          const c = DAY_META[d];
          const active = progressDay === d;
          return (
            <button
              key={d}
              onClick={() => handleDayChange(d)}
              style={{
                background: active ? c.dim : "#0e0e1a",
                border: `1px solid ${active ? c.accent : "#1a1a2a"}`,
                color: active ? c.accent : "#334155",
                padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Selector de ejercicio */}
      <select
        value={progressEx}
        onChange={(e) => setProgressEx(e.target.value)}
        style={{
          width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
          color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
          fontSize: 12, fontFamily: "inherit", outline: "none", marginBottom: 14,
        }}
      >
        {ROUTINE[progressDay].exercises.map((ex) => (
          <option key={ex.name} value={ex.name}>{ex.name}</option>
        ))}
      </select>

      {/* Gráfico */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: 10, color: accent, marginBottom: 12, letterSpacing: 1 }}>
          {progressEx}
        </div>
        <ExerciseChart exName={progressEx} dayName={progressDay} logs={logs} accent={accent} />
        <div style={{ fontSize: 8, color: "#2a2a3e", marginTop: 8, textAlign: "center" }}>
          — — peso real &nbsp;·&nbsp; —— 1RM Epley
        </div>
      </div>

      {/* Tabla de PRs */}
      {prRows.length > 0 && (
        <div className="card" style={{ marginTop: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#2a2a3e", marginBottom: 10 }}>
            HISTORIAL SETS
          </div>
          {prRows.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 10, color: "#334155" }}>{r.date}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.weight}kg × {r.reps}</span>
              <span style={{ fontSize: 11, color: r.rm === maxRM ? "#fbbf24" : accent, fontWeight: r.rm === maxRM ? 700 : 400 }}>
                {r.rm} {r.rm === maxRM ? "🏆" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
