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
  const allDone  = doneSets === sets.length && sets.length > 0;
  const firstSet = sets[0] || { weight: 0, reps: 0 };

  // Siempre glass oscuro — cuando allDone solo cambia el borde/acento
  const cardBg     = "rgba(255,255,255,0.07)";
  const cardBorder = allDone
    ? `1px solid ${accent}55`
    : "1px solid rgba(255,255,255,0.10)";

  function handleToggle(si) {
    haptics.light();
    onToggleSet(exIndex, si);
  }

  const inputStyle = (focused) => ({
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(240,240,240,0.85)",
    padding: "6px 4px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    textAlign: "center", fontFamily: "DM Mono, monospace", width: "100%", outline: "none",
  });

  return (
    <div style={{
      background: cardBg,
      backdropFilter: "blur(40px) saturate(180%)",
      WebkitBackdropFilter: "blur(40px) saturate(180%)",
      border: cardBorder,
      borderRadius: 18, overflow: "hidden",
      transition: "border-color 0.3s ease",
      boxShadow: allDone ? `0 0 20px ${accent}18` : "none",
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
        {/* Done indicator left strip */}
        {allDone && (
          <div style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0, width: 3,
            background: accent,
            borderRadius: "18px 0 0 18px",
          }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: allDone ? accent : "rgba(240,240,240,0.90)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 0.2s",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {allDone && <span style={{ fontSize: 11 }}>✓</span>}
            {exercise.name}
          </div>
          <div style={{
            fontSize: 10, color: "rgba(240,240,240,0.35)",
            marginTop: 3, display: "flex", alignItems: "center", gap: 6,
          }}>
            <span className="mono">{firstSet.weight}kg × {firstSet.reps} · {sets.length} series</span>
            {!allDone && (() => {
              const zone = getHypertrophyZone(firstSet.reps);
              if (!zone) return null;
              const zoneColors = {
                "HIPERTROFIA": { bg: "rgba(26,107,58,0.25)",  color: "#4ade80", border: "rgba(74,222,128,0.25)" },
                "FUERZA":      { bg: "rgba(26,74,138,0.25)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
                "RESISTENCIA": { bg: "rgba(184,134,11,0.25)", color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
                "CARDIO":      { bg: "rgba(192,57,43,0.25)",  color: "#f87171", border: "rgba(248,113,113,0.25)" },
              };
              const zc = zoneColors[zone.label] || { bg: "rgba(255,255,255,0.08)", color: "rgba(240,240,240,0.40)", border: "rgba(255,255,255,0.12)" };
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

        {/* Progress bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 48, flexShrink: 0 }}>
          {sets.map((_, si) => {
            const done = !!completedSets[`${exIndex}-${si}`];
            return (
              <div
                key={si}
                onClick={e => { e.stopPropagation(); handleToggle(si); }}
                style={{
                  height: 4, borderRadius: 2,
                  background: done ? accent : "rgba(255,255,255,0.10)",
                  transition: "background 0.2s",
                  cursor: "pointer",
                  boxShadow: done ? `0 0 6px ${accent}66` : "none",
                }}
              />
            );
          })}
          <div style={{
            fontSize: 9, marginTop: 2, textAlign: "right",
            color: allDone ? accent : "rgba(240,240,240,0.30)",
            fontWeight: allDone ? 700 : 400,
          }}>
            {doneSets}/{sets.length}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "rgba(240,240,240,0.25)", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div style={{
          padding: "6px 14px 12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          animation: "slideDown 0.15s ease",
          background: "rgba(0,0,0,0.15)",
        }}>
          <WarmupInline sets={sets} accent={accent} />

          {/* Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 32px 28px", gap: 4, marginBottom: 6 }}>
            {["", "NOTA", "KG", "REPS", "✓", ""].map((h, i) => (
              <span key={i} style={{
                fontSize: 8, color: "rgba(240,240,240,0.25)",
                letterSpacing: 1.5, fontWeight: 700,
                textAlign: i > 1 ? "center" : "left",
              }}>{h}</span>
            ))}
          </div>

          {sets.map((set, si) => {
            const done = !!completedSets[`${exIndex}-${si}`];
            return (
              <div key={si} style={{
                display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 32px 28px",
                gap: 4, alignItems: "center", marginBottom: 6,
                opacity: done ? 0.45 : 1, transition: "opacity 0.2s",
              }}>
                <span className="mono" style={{ fontSize: 10, color: "rgba(240,240,240,0.25)", textAlign: "center" }}>
                  {si + 1}
                </span>
                <input
                  value={set.note || ""}
                  onChange={e => onUpdateSet(exIndex, si, "note", e.target.value)}
                  placeholder="nota..."
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(240,240,240,0.50)",
                    padding: "6px 8px", borderRadius: 8, fontSize: 11,
                    fontFamily: "inherit", width: "100%", outline: "none",
                  }}
                />
                <input
                  type="number" value={set.weight}
                  onChange={e => onUpdateSet(exIndex, si, "weight", parseFloat(e.target.value) || 0)}
                  className="mono"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1px solid rgba(255,255,255,0.10)`,
                    color: accent,
                    padding: "6px 4px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                    textAlign: "center", fontFamily: "DM Mono, monospace", width: "100%", outline: "none",
                  }}
                />
                <input
                  type="number" value={set.reps}
                  onChange={e => onUpdateSet(exIndex, si, "reps", parseInt(e.target.value) || 0)}
                  className="mono"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(240,240,240,0.90)",
                    padding: "6px 4px", borderRadius: 8, fontSize: 14,
                    textAlign: "center", fontFamily: "DM Mono, monospace", width: "100%", outline: "none",
                  }}
                />
                <button onClick={() => handleToggle(si)} style={{
                  width: 32, height: 32, borderRadius: 8, minHeight: 0,
                  background: done ? `${accent}25` : "rgba(255,255,255,0.06)",
                  border: `1.5px solid ${done ? accent : "rgba(255,255,255,0.12)"}`,
                  color: done ? accent : "rgba(240,240,240,0.30)",
                  cursor: "pointer", fontSize: 13, padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", fontFamily: "inherit",
                  boxShadow: done ? `0 0 8px ${accent}44` : "none",
                }}>{done ? "✓" : "○"}</button>
                <button onClick={() => onRemoveSet(exIndex, si)} disabled={sets.length <= 1} style={{
                  width: 28, height: 28, borderRadius: 7, minHeight: 0,
                  background: "transparent",
                  border: sets.length <= 1 ? "1px solid transparent" : "1px solid rgba(248,113,113,0.20)",
                  color: sets.length <= 1 ? "transparent" : "rgba(248,113,113,0.60)",
                  cursor: sets.length <= 1 ? "default" : "pointer",
                  fontSize: 11, display: "flex", alignItems: "center",
                  justifyContent: "center", fontFamily: "inherit",
                }}>✕</button>
              </div>
            );
          })}
          <button onClick={() => onAddSet(exIndex)} style={{
            width: "100%", background: "transparent",
            border: "1px dashed rgba(255,255,255,0.12)",
            color: "rgba(240,240,240,0.30)",
            padding: "6px", borderRadius: 8, fontSize: 9,
            letterSpacing: 1.5, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}>+ SERIE</button>
        </div>
      )}
    </div>
  );
}

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
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(240,240,240,0.35)",
          padding: "6px 10px", borderRadius: 8,
          fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
          fontFamily: "inherit", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span>APROXIMAMIENTO — <span className="mono">{weight}kg × {reps}</span></span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          background: "rgba(0,0,0,0.20)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderTop: "none", borderRadius: "0 0 8px 8px",
          padding: "8px 10px", animation: "slideDown 0.15s ease",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 44px 52px", gap: 5, marginBottom: 6 }}>
            {["TIPO", "KG", "REPS", "%1RM"].map(h => (
              <span key={h} style={{
                fontSize: 8, letterSpacing: 1.5, fontWeight: 700,
                color: "rgba(240,240,240,0.25)",
                textAlign: h !== "TIPO" ? "center" : "left",
              }}>{h}</span>
            ))}
          </div>
          {warmup.map((w, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 52px 44px 52px", gap: 5, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(240,240,240,0.55)" }}>{w.label}</span>
              <span className="mono" style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: accent }}>{w.weight}</span>
              <span className="mono" style={{ textAlign: "center", fontSize: 12, color: "rgba(240,240,240,0.60)" }}>{w.reps}</span>
              <span style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: 1,
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(240,240,240,0.40)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: "2px 6px", borderRadius: 99,
                }}>{w.pct}%</span>
              </span>
            </div>
          ))}
          <div style={{
            fontSize: 9, color: "rgba(240,240,240,0.25)", marginTop: 6,
            borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6,
          }}>
            1-2 min descanso entre aproximaciones
          </div>
        </div>
      )}
    </div>
  );
}
