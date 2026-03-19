import { useState } from "react";
import { calcWarmup } from "../utils/warmup";

export default function WarmupCard({ sets, accent }) {
  const [open, setOpen] = useState(false);
  const workingSet = sets?.[0];
  if (!workingSet || !workingSet.weight) return null;
  const warmup = calcWarmup(workingSet.weight, workingSet.reps);
  if (!warmup.length) return null;

  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={() => setOpen(v => !v)} className="nbtn" style={{
        width: "100%", border: `1px solid ${open ? accent + "44" : "var(--border)"}`,
        color: open ? accent : "var(--text3)", padding: "5px 10px",
        borderRadius: 7, fontSize: 10, letterSpacing: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>🔥 APROXIMAMIENTO</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          background: "var(--bg3)", border: `1px solid var(--border)`,
          borderTop: "none", borderRadius: "0 0 7px 7px", padding: "10px 12px",
        }}>
          <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 8 }}>
            Basado en {workingSet.weight}kg × {workingSet.reps} reps
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 50px 60px", gap: 6, marginBottom: 5 }}>
            {["TIPO","KG","REPS","%1RM"].map(h => (
              <span key={h} style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1, textAlign: h !== "TIPO" ? "center" : "left" }}>{h}</span>
            ))}
          </div>
          {warmup.map((w, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 50px 60px", gap: 6, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "var(--text)" }}>{w.label}</span>
              <span style={{ textAlign: "center", fontSize: 14, fontWeight: 500, color: accent }}>{w.weight}</span>
              <span style={{ textAlign: "center", fontSize: 13, color: "var(--text)" }}>{w.reps}</span>
              <span style={{ textAlign: "center" }}>
                <span style={{ fontSize: 10, background: accent + "22", color: accent, padding: "2px 6px", borderRadius: 6 }}>{w.pct}%</span>
              </span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, borderTop: `1px solid var(--border)`, paddingTop: 6 }}>
            💡 1-2 min descanso entre series de aproximamiento
          </div>
        </div>
      )}
    </div>
  );
}
