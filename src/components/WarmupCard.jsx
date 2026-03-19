import { useState } from "react";
import { calcWarmupSets, warmupTime } from "../utils/warmup";

/**
 * Card desplegable que muestra las series de aproximamiento
 * para un ejercicio basándose en el peso de la primera serie de trabajo.
 */
export default function WarmupCard({ sets, accent }) {
  const [open, setOpen] = useState(false);

  // Tomar el peso más alto de las series como peso de trabajo
  const workingSet = sets?.reduce((best, s) =>
    (s.weight || 0) > (best.weight || 0) ? s : best
  , sets?.[0]);

  const workingWeight = workingSet?.weight || 0;
  const workingReps   = workingSet?.reps   || 5;
  const warmupSets    = calcWarmupSets(workingWeight, workingReps);

  if (!warmupSets.length) return null;

  const minutes = warmupTime(warmupSets);

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", background: open ? "#0d1117" : "transparent",
          border: `1px solid ${open ? accent + "44" : "#1a1a2a"}`,
          borderRadius: 8, padding: "7px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 11, color: open ? accent : "#475569", letterSpacing: 1 }}>
            WARM-UP SUGERIDO
          </span>
          <span style={{ fontSize: 10, color: "#334155" }}>~{minutes} min</span>
        </div>
        <span style={{ fontSize: 11, color: "#475569" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          background: "#0a0a14", border: `1px solid ${accent}22`,
          borderTop: "none", borderRadius: "0 0 8px 8px",
          padding: "10px 14px",
        }}>
          <div style={{ fontSize: 10, color: "#334155", marginBottom: 8 }}>
            Peso de trabajo: <span style={{ color: accent }}>{workingWeight} kg × {workingReps}</span>
          </div>

          {/* Columnas */}
          <div style={{ display: "grid", gridTemplateColumns: "28px 60px 50px 1fr", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: "#334155" }}>SERIE</span>
            <span style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>PESO</span>
            <span style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>REPS</span>
            <span style={{ fontSize: 9, color: "#334155" }}>NOTA</span>
          </div>

          {warmupSets.map((ws, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "28px 60px 50px 1fr",
              gap: 6, alignItems: "center", marginBottom: 6,
              opacity: 0.9,
            }}>
              <span style={{ fontSize: 10, color: "#334155", textAlign: "center" }}>{i + 1}</span>
              <div style={{
                background: "#0e0e1a", border: `1px solid ${accent}33`,
                borderRadius: 6, padding: "4px", textAlign: "center",
              }}>
                <span style={{ fontSize: 13, color: accent, fontWeight: 500 }}>{ws.weight}</span>
                <span style={{ fontSize: 9, color: "#334155" }}> kg</span>
              </div>
              <div style={{
                background: "#0e0e1a", border: "1px solid #1a1a2a",
                borderRadius: 6, padding: "4px", textAlign: "center",
              }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{ws.reps}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, color: "#334155" }}>{ws.pct}%</span>
                {ws.note && <span style={{ fontSize: 9, color: "#475569", fontStyle: "italic" }}>{ws.note}</span>}
              </div>
            </div>
          ))}

          <div style={{ fontSize: 10, color: "#334155", marginTop: 8, borderTop: "1px solid #1a1a2a", paddingTop: 8 }}>
            💡 Descansa 60-90s entre series de warm-up
          </div>
        </div>
      )}
    </div>
  );
}
