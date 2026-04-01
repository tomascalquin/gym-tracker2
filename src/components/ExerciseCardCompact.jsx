import { useState, useMemo } from "react";
import { calcWarmup } from "../utils/warmup";
import { haptics } from "../utils/haptics";
import { getHypertrophyZone } from "../utils/hypertrophyZone";

export default function ExerciseCardCompact({
  exercise, exIndex, sets, completedSets, accent,
  onUpdateSet, onToggleSet, onAddSet, onRemoveSet,
}) {
  const [expanded, setExpanded] = useState(false);

  const doneSets = sets.filter((_, si) => completedSets[`${exIndex}-${si}`]).length;
  const allDone  = doneSets === sets.length;
  const firstSet = sets[0] || { weight: 0, reps: 0 };

  function handleToggle(si) {
    haptics.light();
    onToggleSet(exIndex, si);
  }

  return (
    <div style={{
      background: allDone ? "rgba(255,255,255,0.88)" : "var(--glass-bg)",
      backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
      border: `1px solid ${allDone ? "rgba(255,255,255,0.95)" : "var(--glass-border)"}`,
      borderRadius: 18, marginBottom: 8, overflow: "hidden",
      transition: "all 0.2s ease",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: "13px 14px",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: allDone ? "var(--bg)" : "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 0.2s",
          }}>{exercise.name}</div>
          <div style={{ fontSize: 10, color: allDone ? "rgba(245,245,240,0.5)" : "var(--text3)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="mono">{firstSet.weight}kg × {firstSet.reps} · {sets.length} series</span>
            {(() => {
              const zone = getHypertrophyZone(firstSet.reps);
              if (!zone || allDone) return null;
              const zoneColors = {
                "HIPERTROFIA": { bg: "#e8f5e9", color: "#1a6b3a", border: "#1a6b3a33" },
                "FUERZA":      { bg: "#e3f0fb", color: "#1a4a8a", border: "#1a4a8a33" },
                "RESISTENCIA": { bg: "#fdf6e3", color: "#b8860b", border: "#b8860b33" },
                "CARDIO":      { bg: "#fce8e6", color: "#c0392b", border: "#c0392b33" },
              };
              const zc = zoneColors[zone.label] || { bg: "var(--bg3)", color: "rgba(240,240,240,0.30)", border: "var(--border)" };
              return (
                <span style={{
                  fontSize: 7, letterSpacing: 1.5, fontWeight: 700,
                  color: zc.color, background: zc.bg,
                  border: `1px solid ${zc.border}`,
                  padding: "1px 6px", borderRadius: 99, flexShrink: 0,
                }}>{zone.label}</span>
              );
            })()}
          </div>
        </div>

        {/* Story-style bars por set */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 56, flexShrink: 0 }}>
          {sets.map((_, si) => {
            const done = !!completedSets[`${exIndex}-${si}`];
            return (
              <div
                key={si}
                onClick={e => { e.stopPropagation(); handleToggle(si); }}
                style={{
                  height: 4, borderRadius: 2,
                  background: done
                    ? (allDone ? "rgba(245,245,240,0.8)" : "var(--text)")
                    : "var(--border)",
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
              />
            );
          })}
          <div style={{ fontSize: 9, color: allDone ? "rgba(245,245,240,0.5)" : "var(--text3)", marginTop: 2, textAlign: "right" }}>
            {doneSets}/{sets.length}
          </div>
        </div>

        <div style={{ fontSize: 12, color: allDone ? "rgba(245,245,240,0.4)" : "var(--text3)", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div style={{
          padding: "6px 14px 12px",
          borderTop: `1px solid ${allDone ? "rgba(8,8,16,0.12)" : "var(--border)"}`,
          animation: "slideDown 0.15s ease",
          background: allDone ? "var(--text)" : "var(--bg2)",
        }}>
          <WarmupInline sets={sets} allDone={allDone} />

          {/* Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 32px 28px", gap: 4, marginBottom: 6 }}>
            {["", "NOTA", "KG", "REPS", "✓", ""].map((h, i) => (
              <span key={i} style={{
                fontSize: 8, color: allDone ? "rgba(245,245,240,0.4)" : "var(--text3)",
                letterSpacing: 1.5, fontWeight: 700,
                textAlign: i > 1 ? "center" : "left"
              }}>{h}</span>
            ))}
          </div>

          {sets.map((set, si) => {
            const done = !!completedSets[`${exIndex}-${si}`];
            return (
              <div key={si} style={{
                display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 32px 28px",
                gap: 4, alignItems: "center", marginBottom: 6,
                opacity: done ? 0.5 : 1, transition: "opacity 0.2s",
              }}>
                <span className="mono" style={{ fontSize: 10, color: allDone ? "rgba(245,245,240,0.4)" : "var(--text3)", textAlign: "center" }}>{si + 1}</span>
                <input
                  value={set.note || ""}
                  onChange={e => onUpdateSet(exIndex, si, "note", e.target.value)}
                  placeholder="nota..."
                  style={{
                    background: allDone ? "rgba(8,8,16,0.25)" : "var(--bg3)",
                    border: `1px solid ${allDone ? "rgba(8,8,16,0.12)" : "var(--border)"}`,
                    color: allDone ? "rgba(245,245,240,0.6)" : "var(--text3)",
                    padding: "6px 8px", borderRadius: 8, fontSize: 11,
                    fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <input
                  type="number"
                  value={set.weight}
                  onChange={e => onUpdateSet(exIndex, si, "weight", parseFloat(e.target.value) || 0)}
                  className="mono"
                  style={{
                    background: allDone ? "rgba(8,8,16,0.25)" : "var(--bg3)",
                    border: `1px solid ${allDone ? "rgba(8,8,16,0.12)" : "var(--border)"}`,
                    color: allDone ? "rgba(245,245,240,0.9)" : "var(--text)",
                    padding: "6px 4px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                    textAlign: "center", fontFamily: "DM Mono, monospace", width: "100%", outline: "none",
                  }}
                />
                <input
                  type="number"
                  value={set.reps}
                  onChange={e => onUpdateSet(exIndex, si, "reps", parseInt(e.target.value) || 0)}
                  className="mono"
                  style={{
                    background: allDone ? "rgba(8,8,16,0.25)" : "var(--bg3)",
                    border: `1px solid ${allDone ? "rgba(8,8,16,0.12)" : "var(--border)"}`,
                    color: allDone ? "rgba(245,245,240,0.9)" : "var(--text)",
                    padding: "6px 4px", borderRadius: 8, fontSize: 14,
                    textAlign: "center", fontFamily: "DM Mono, monospace", width: "100%", outline: "none",
                  }}
                />
                <button onClick={() => handleToggle(si)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: done ? (allDone ? "rgba(8,8,16,0.15)" : "var(--text)") : "var(--bg3)",
                  border: `1.5px solid ${done ? (allDone ? "rgba(245,245,240,0.4)" : "var(--text)") : "var(--border)"}`,
                  color: done ? (allDone ? "var(--bg)" : "var(--bg)") : "var(--text3)",
                  cursor: "pointer", fontSize: 13, padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", fontFamily: "inherit",
                }}>{done ? "✓" : "○"}</button>
                <button onClick={() => onRemoveSet(exIndex, si)} disabled={sets.length <= 1} style={{
                  width: 28, height: 28, borderRadius: 7, background: "transparent",
                  border: sets.length <= 1 ? "1px solid transparent" : `1px solid ${allDone ? "rgba(8,8,16,0.15)" : "var(--border)"}`,
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
            border: `1px dashed ${allDone ? "rgba(8,8,16,0.15)" : "var(--border)"}`,
            color: allDone ? "rgba(245,245,240,0.4)" : "var(--text3)",
            padding: "6px", borderRadius: 8, fontSize: 9,
            letterSpacing: 1.5, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>+ SERIE</button>
        </div>
      )}
    </div>
  );
}

function WarmupInline({ sets, allDone }) {
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
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: `1px solid ${allDone ? "rgba(8,8,16,0.15)" : "var(--border)"}`,
          color: allDone ? "rgba(245,245,240,0.5)" : "var(--text3)",
          padding: "6px 10px", borderRadius: 8,
          fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
          fontFamily: "inherit", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span>APROXIMAMIENTO — <span className="mono">{weight}kg × {reps}</span></span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          background: allDone ? "rgba(8,8,16,0.20)" : "var(--bg3)",
          border: `1px solid ${allDone ? "rgba(245,245,240,0.1)" : "var(--border)"}`,
          borderTop: "none", borderRadius: "0 0 8px 8px",
          padding: "8px 10px", animation: "slideDown 0.15s ease",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 44px 52px", gap: 5, marginBottom: 6 }}>
            {["TIPO", "KG", "REPS", "%1RM"].map(h => (
              <span key={h} style={{
                fontSize: 8, letterSpacing: 1.5, fontWeight: 700,
                color: allDone ? "rgba(245,245,240,0.3)" : "var(--text3)",
                textAlign: h !== "TIPO" ? "center" : "left"
              }}>{h}</span>
            ))}
          </div>
          {warmup.map((w, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 52px 44px 52px", gap: 5, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: allDone ? "rgba(245,245,240,0.7)" : "var(--text2)" }}>{w.label}</span>
              <span className="mono" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: allDone ? "rgba(245,245,240,0.9)" : "var(--text)" }}>{w.weight}</span>
              <span className="mono" style={{ textAlign: "center", fontSize: 12, color: allDone ? "rgba(245,245,240,0.7)" : "var(--text2)" }}>{w.reps}</span>
              <span style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: 1,
                  background: allDone ? "rgba(8,8,16,0.12)" : "var(--bg2)",
                  color: allDone ? "rgba(245,245,240,0.6)" : "var(--text3)",
                  border: `1px solid ${allDone ? "rgba(8,8,16,0.15)" : "var(--border)"}`,
                  padding: "2px 6px", borderRadius: 99
                }}>{w.pct}%</span>
              </span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: allDone ? "rgba(245,245,240,0.3)" : "var(--text3)", marginTop: 6, borderTop: `1px solid ${allDone ? "rgba(245,245,240,0.1)" : "var(--border)"}`, paddingTop: 6 }}>
            1-2 min descanso entre aproximaciones
          </div>
        </div>
      )}
    </div>
  );
}
