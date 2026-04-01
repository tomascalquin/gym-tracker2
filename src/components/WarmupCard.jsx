import { useState, useMemo } from "react";
import { calcWarmup } from "../utils/warmup";

export default function WarmupCard({ sets, accent }) {
  const [open, setOpen] = useState(false);

  const workingSet = sets?.[0];
  const weight     = workingSet?.weight || 0;
  const reps       = workingSet?.reps   || 8;

  // useMemo recalcula cada vez que cambia el peso o reps
  const warmup = useMemo(() => {
    if (!weight) return [];
    return calcWarmup(weight, reps);
  }, [weight, reps]);

  if (!weight || !warmup.length) return null;

  return (
    <div style={{ marginBottom: 6 }}>
      <button onClick={() => setOpen(v => !v)} className="nbtn" style={{
        width: "100%", border: `1px solid ${open ? accent + "44" : "var(--border)"}`,
        color: open ? accent : "var(--text3)", padding: "5px 10px",
        borderRadius: 7, fontSize: 10, letterSpacing: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>🔥 APROXIMAMIENTO — {weight}kg × {reps}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
          borderTop: "none", borderRadius: "0 0 7px 7px", padding: "10px 12px",
          animation: "slideDown 0.15s ease",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 50px 60px", gap: 6, marginBottom: 6 }}>
            {["TIPO", "KG", "REPS", "%1RM"].map(h => (
              <span key={h} style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 1, textAlign: h !== "TIPO" ? "center" : "left" }}>{h}</span>
            ))}
          </div>
          {warmup.map((w, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 50px 60px", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text)" }}>{w.label}</span>
              <span style={{ textAlign: "center", fontSize: 15, fontWeight: 300, color: accent }}>{w.weight}</span>
              <span style={{ textAlign: "center", fontSize: 14, color: "var(--text)" }}>{w.reps}</span>
              <span style={{ textAlign: "center" }}>
                <span style={{ fontSize: 10, background: accent + "22", color: accent, padding: "2px 8px", borderRadius: 99 }}>{w.pct}%</span>
              </span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", marginTop: 6, borderTop: "1px solid var(--glass-border)", paddingTop: 6 }}>
            💡 1-2 min descanso entre series de aproximamiento
          </div>
        </div>
      )}
    </div>
  );
}
