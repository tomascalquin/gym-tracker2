import { useState } from "react";
import { calcWarmup } from "../utils/warmup";
import { haptics } from "../utils/haptics";

/**
 * Versión compacta del ExerciseCard.
 * Muestra todos los sets en una línea horizontal.
 */
export default function ExerciseCardCompact({
  exercise, exIndex, sets, completedSets, accent,
  onUpdateSet, onToggleSet, onAddSet, onRemoveSet,
}) {
  const [expanded, setExpanded] = useState(false);

  const doneSets  = sets.filter((_, si) => completedSets[`${exIndex}-${si}`]).length;
  const allDone   = doneSets === sets.length;
  const firstSet  = sets[0] || { weight: 0, reps: 0 };

  function handleToggle(si) {
    haptics.light();
    onToggleSet(exIndex, si);
  }

  return (
    <div style={{
      background: allDone ? accent + "18" : "var(--glass-bg)",
      backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
      border: `1px solid ${allDone ? accent + "55" : "var(--glass-border)"}`,
      borderLeft: `3px solid ${allDone ? accent : "rgba(255,255,255,0.15)"}`,
      borderRadius: 16, marginBottom: 8, overflow: "hidden",
      transition: "all 0.2s ease",
    }}>
      {/* Header compacto */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: "9px 12px",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Nombre */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, color: allDone ? accent : "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 0.2s",
          }}>{exercise.name}</div>
          <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", marginTop: 1 }}>
            {firstSet.weight}kg × {firstSet.reps} · {sets.length} series
          </div>
        </div>

        {/* Sets como dots */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {sets.map((_, si) => {
            const done = !!completedSets[`${exIndex}-${si}`];
            return (
              <button
                key={si}
                onClick={e => { e.stopPropagation(); handleToggle(si); }}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: done ? accent : "var(--bg3)",
                  border: `1px solid ${done ? accent : "var(--border)"}`,
                  color: done ? "#000" : "var(--text3)",
                  fontSize: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                  boxShadow: done ? `0 0 8px ${accent}66` : "none",
                  fontFamily: "inherit",
                }}
              >{done ? "✓" : si + 1}</button>
            );
          })}
          <div style={{ fontSize: 14, color: "rgba(240,240,240,0.30)", display: "flex", alignItems: "center" }}>
            {expanded ? "▲" : "▼"}
          </div>
        </div>
      </div>

      {/* Expandido: inputs completos */}
      {expanded && (
        <div style={{ padding: "6px 12px 10px", borderTop: "1px solid var(--glass-border)", animation: "slideDown 0.15s ease" }}>
          {/* Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 32px 28px", gap: 4, marginBottom: 5 }}>
            {["", "NOTA", "KG", "REPS", "✓", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 8, color: "rgba(240,240,240,0.30)", letterSpacing: 1, textAlign: i > 1 ? "center" : "left" }}>{h}</span>
            ))}
          </div>

          {sets.map((set, si) => {
            const done = !!completedSets[`${exIndex}-${si}`];
            return (
              <div key={si} style={{
                display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 32px 28px",
                gap: 4, alignItems: "center", marginBottom: 5,
                opacity: done ? 0.45 : 1, transition: "opacity 0.2s",
              }}>
                <span style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", textAlign: "center" }}>{si + 1}</span>
                <input value={set.note || ""} onChange={e => onUpdateSet(exIndex, si, "note", e.target.value)}
                  placeholder="nota..."
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", color: "rgba(240,240,240,0.30)",
                    padding: "5px 6px", borderRadius: 7, fontSize: 11,
                    fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <input type="number" value={set.weight}
                  onChange={e => onUpdateSet(exIndex, si, "weight", parseFloat(e.target.value) || 0)}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", color: accent,
                    padding: "5px 4px", borderRadius: 7, fontSize: 13, fontWeight: 300,
                    textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <input type="number" value={set.reps}
                  onChange={e => onUpdateSet(exIndex, si, "reps", parseInt(e.target.value) || 0)}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", color: "var(--text)",
                    padding: "5px 4px", borderRadius: 7, fontSize: 13, fontWeight: 300,
                    textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <button onClick={() => handleToggle(si)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: done ? "#14532d" : "var(--bg3)",
                  border: `1px solid ${done ? "#22c55e" : "var(--border)"}`,
                  color: done ? "#22c55e" : "var(--text3)",
                  cursor: "pointer", fontSize: 13, padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", fontFamily: "inherit",
                  boxShadow: done ? "0 2px 8px #22c55e33" : "none",
                }}>{done ? "✓" : "○"}</button>
                <button onClick={() => onRemoveSet(exIndex, si)} disabled={sets.length <= 1} style={{
                  width: 28, height: 28, borderRadius: 7, background: "transparent",
                  border: sets.length <= 1 ? "1px solid transparent" : "1px solid #3f1010",
                  color: sets.length <= 1 ? "transparent" : "var(--red)",
                  cursor: sets.length <= 1 ? "default" : "pointer",
                  fontSize: 11, display: "flex", alignItems: "center",
                  justifyContent: "center", fontFamily: "inherit",
                }}>✕</button>
              </div>
            );
          })}
          <button onClick={() => onAddSet(exIndex)} style={{
            width: "100%", background: "transparent",
            border: "1px dashed var(--border)", color: "rgba(240,240,240,0.30)",
            padding: "5px", borderRadius: 7, fontSize: 9,
            letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
          }}>+ SERIE</button>
        </div>
      )}
    </div>
  );
}
