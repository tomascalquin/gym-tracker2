import { useState, useMemo } from "react";
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
      background: allDone ? accent + "0d" : "var(--bg2)",
      border: `1px solid ${allDone ? accent + "44" : "var(--border)"}`,
      borderLeft: `3px solid ${allDone ? accent : "var(--border)"}`,
      borderRadius: 12, marginBottom: 6, overflow: "hidden",
      transition: "all 0.2s ease",
    }}>
      {/* Header compacto */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Nombre */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, color: allDone ? accent : "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 0.2s",
          }}>{exercise.name}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
            {firstSet.weight}kg × {firstSet.reps} · {sets.length} series
          </div>
        </div>

        {/* Sets como cuadrados */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
          {sets.map((_, si) => {
            const done = !!completedSets[`${exIndex}-${si}`];
            return (
              <div
                key={si}
                onClick={e => { e.stopPropagation(); handleToggle(si); }}
                style={{
                  width: 28, height: 28,
                  borderRadius: 6,
                  background: done ? accent : "var(--bg3)",
                  border: `1.5px solid ${done ? accent : "var(--border)"}`,
                  color: done ? "#000" : "var(--text3)",
                  fontSize: 11, cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: done ? `0 0 8px ${accent}55` : "none",
                  fontFamily: "inherit",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >{done ? "✓" : si + 1}</div>
            );
          })}
          <div style={{ fontSize: 13, color: "var(--text3)", paddingLeft: 2 }}>
            {expanded ? "▲" : "▼"}
          </div>
        </div>
      </div>

      {/* Expandido: inputs completos */}
      {expanded && (
        <div style={{ padding: "6px 12px 10px", borderTop: "1px solid var(--border)", animation: "slideDown 0.15s ease" }}>
          {/* Aproximamiento inline */}
          <WarmupInline sets={sets} accent={accent} />
          {/* Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 32px 28px", gap: 4, marginBottom: 5 }}>
            {["", "NOTA", "KG", "REPS", "✓", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 1, textAlign: i > 1 ? "center" : "left" }}>{h}</span>
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
                <span style={{ fontSize: 10, color: "var(--text3)", textAlign: "center" }}>{si + 1}</span>
                <input value={set.note || ""} onChange={e => onUpdateSet(exIndex, si, "note", e.target.value)}
                  placeholder="nota..."
                  style={{
                    background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text3)",
                    padding: "8px 8px", borderRadius: 8, fontSize: 12,
                    fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <input type="number" value={set.weight}
                  onChange={e => onUpdateSet(exIndex, si, "weight", parseFloat(e.target.value) || 0)}
                  style={{
                    background: "var(--bg3)", border: "1px solid var(--border)", color: accent,
                    padding: "8px 4px", borderRadius: 8, fontSize: 15, fontWeight: 300,
                    textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <input type="number" value={set.reps}
                  onChange={e => onUpdateSet(exIndex, si, "reps", parseInt(e.target.value) || 0)}
                  style={{
                    background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)",
                    padding: "8px 4px", borderRadius: 8, fontSize: 15, fontWeight: 300,
                    textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <button onClick={() => handleToggle(si)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: done ? "#14532d" : "var(--bg3)",
                  border: `1.5px solid ${done ? "#22c55e" : "var(--border)"}`,
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
            border: "1px dashed var(--border)", color: "var(--text3)",
            padding: "5px", borderRadius: 7, fontSize: 9,
            letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
          }}>+ SERIE</button>
        </div>
      )}
    </div>
  );
}

// ─── Aproximamiento inline ────────────────────────────────────────────────────
function WarmupInline({ sets, accent }) {
  const [open, setOpen] = useState(false);
  const workingSet = sets?.[0];
  const weight = workingSet?.weight || 0;
  const reps   = workingSet?.reps   || 8;

  const warmup = useMemo(() => {
    if (!weight) return [];
    return calcWarmup(weight, reps);
  }, [weight, reps]);

  if (!weight || !warmup.length) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", background: open ? accent + "11" : "transparent",
          border: `1px solid ${open ? accent + "44" : "var(--border)"}`,
          color: open ? accent : "var(--text3)",
          padding: "5px 10px", borderRadius: 7,
          fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
          cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          transition: "all 0.15s",
        }}
      >
        <span>🔥 APROXIMAMIENTO — {weight}kg × {reps}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          background: "var(--bg3)", border: "1px solid var(--border)",
          borderTop: "none", borderRadius: "0 0 7px 7px",
          padding: "8px 10px", animation: "slideDown 0.15s ease",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 44px 52px", gap: 5, marginBottom: 5 }}>
            {["TIPO", "KG", "REPS", "%1RM"].map(h => (
              <span key={h} style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 1, textAlign: h !== "TIPO" ? "center" : "left" }}>{h}</span>
            ))}
          </div>
          {warmup.map((w, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 52px 44px 52px", gap: 5, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "var(--text)" }}>{w.label}</span>
              <span style={{ textAlign: "center", fontSize: 14, fontWeight: 300, color: accent }}>{w.weight}</span>
              <span style={{ textAlign: "center", fontSize: 13, color: "var(--text)" }}>{w.reps}</span>
              <span style={{ textAlign: "center" }}>
                <span style={{ fontSize: 9, background: accent + "22", color: accent, padding: "2px 6px", borderRadius: 99 }}>{w.pct}%</span>
              </span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 5, borderTop: "1px solid var(--border)", paddingTop: 5 }}>
            💡 1-2 min descanso entre aproximaciones
          </div>
        </div>
      )}
    </div>
  );
}
