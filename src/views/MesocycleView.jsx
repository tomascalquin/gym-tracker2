import { useState, useEffect } from "react";
import { planMesocycle, saveMesocycle, loadMesocycle, clearMesocycle, GOALS, FREQUENCIES, LEVELS } from "../utils/mesocycle";
import { MUSCLE_RANGES } from "../utils/intelligence";
import { haptics } from "../utils/haptics";
import ContextTooltip from "../components/ContextTooltip";

export default function MesocycleView({ user, logs, routine, onBack }) {
  const [step, setStep]         = useState("config"); // config | plan | week
  const [plan, setPlan]         = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [generating, setGenerating] = useState(false);

  // Config
  const [goal, setGoal]         = useState("hypertrophy");
  const [weeks, setWeeks]       = useState(5);
  const [daysPerWeek, setDays]  = useState(4);
  const [level, setLevel]       = useState("intermediate");
  const [bodyweight, setBW]     = useState("");

  // Cargar plan existente
  useEffect(() => {
    const saved = loadMesocycle(user.uid);
    if (saved?.mesocycle) { setPlan(saved); setStep("plan"); }
  }, [user.uid]);

  function handleGenerate() {
    setGenerating(true);
    haptics.light();
    setTimeout(() => {
      const result = planMesocycle({
        goal, weeks, daysPerWeek, level,
        bodyweight: bodyweight ? parseFloat(bodyweight) : null,
        logs, routine,
      });
      saveMesocycle(user.uid, result);
      setPlan(result);
      setStep("plan");
      setActiveWeek(1);
      setGenerating(false);
    }, 800); // dar sensación de que "calcula"
  }

  function handleReset() {
    clearMesocycle(user.uid);
    setPlan(null);
    setStep("config");
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ fontSize: 22, color: "rgba(240,240,240,0.50)", padding: "0 4px" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>PLANIFICACIÓN</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.8 }}>Mesociclo 📅</div>
          </div>
          {step === "plan" && (
            <button onClick={handleReset} style={{
              background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)",
              color: "#f87171", padding: "6px 12px", borderRadius: 10,
              fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", minHeight: 0,
            }}>NUEVO PLAN</button>
          )}
        </div>

        {step === "plan" && (
          <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
            {plan.mesocycle.map(w => (
              <button key={w.week} onClick={() => setActiveWeek(w.week)} style={{
                flex: 1, background: "none", border: "none",
                borderBottom: `2px solid ${activeWeek === w.week ? "rgba(255,255,255,0.80)" : "transparent"}`,
                color: w.isDeload
                  ? (activeWeek === w.week ? "#fbbf24" : "rgba(251,191,36,0.40)")
                  : (activeWeek === w.week ? "#fff" : "rgba(240,240,240,0.30)"),
                padding: "8px 2px", cursor: "pointer",
                fontSize: 9, letterSpacing: 1, fontWeight: 700,
                fontFamily: "inherit",
              }}>
                {w.isDeload ? "DLD" : `S${w.week}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 20px 120px" }}>

        {/* ── CONFIGURAR ── */}
        {step === "config" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            <ContextTooltip uid={user.uid} hintId="mesocycle" icon="📅"
              text="Un mesociclo planifica 4-8 semanas con progresión automática de volumen e intensidad, y deload incluido en la última semana." />

            {/* Objetivo */}
            <div>
              <div style={S.label}>OBJETIVO</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(GOALS).map(([k, g]) => (
                  <button key={k} onClick={() => setGoal(k)} style={{
                    background: goal === k ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid ${goal === k ? "rgba(167,139,250,0.40)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 16, padding: "13px 16px",
                    textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{g.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: goal === k ? "#a78bfa" : "#fff" }}>{g.label}</div>
                        <div style={{ fontSize: 11, color: "rgba(240,240,240,0.40)", marginTop: 2 }}>{g.desc}</div>
                      </div>
                      {goal === k && <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duración */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={S.label}>DURACIÓN DEL MESOCICLO</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{weeks} sem</div>
              </div>
              <input type="range" min={4} max={8} step={1} value={weeks}
                onChange={e => setWeeks(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>4 sem (corto)</span>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>8 sem (largo)</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(240,240,240,0.35)", marginTop: 6, textAlign: "center" }}>
                Incluye {1} semana de deload en la semana {weeks}
              </div>
            </div>

            {/* Días */}
            <div>
              <div style={S.label}>DÍAS POR SEMANA</div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(FREQUENCIES).map(([k, f]) => (
                  <button key={k} onClick={() => setDays(Number(k))} style={{
                    flex: 1, padding: "10px 4px", borderRadius: 12, minHeight: 0,
                    background: daysPerWeek === Number(k) ? "rgba(167,139,250,0.20)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${daysPerWeek === Number(k) ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: daysPerWeek === Number(k) ? "#a78bfa" : "rgba(240,240,240,0.50)",
                    fontSize: 16, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
                  }}>{k}</button>
                ))}
              </div>
            </div>

            {/* Nivel */}
            <div>
              <div style={S.label}>NIVEL DE ENTRENAMIENTO</div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(LEVELS).map(([k, l]) => (
                  <button key={k} onClick={() => setLevel(k)} style={{
                    flex: 1, padding: "9px 4px", borderRadius: 12, minHeight: 0,
                    background: level === k ? "rgba(167,139,250,0.20)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${level === k ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: level === k ? "#a78bfa" : "rgba(240,240,240,0.50)",
                    cursor: "pointer", fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{l.label}</span>
                    <span style={{ fontSize: 8, color: "rgba(240,240,240,0.30)" }}>{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Peso corporal */}
            <div>
              <div style={S.label}>PESO CORPORAL (opcional — para nutrición)</div>
              <input type="number" value={bodyweight} onChange={e => setBW(e.target.value)}
                placeholder="ej. 75"
                style={{ ...S.input, fontFamily: "DM Mono, monospace", fontWeight: 700 }} />
            </div>

            {Object.keys(logs || {}).length < 3 && (
              <div style={{
                background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.20)",
                borderRadius: 14, padding: "12px 14px",
                fontSize: 11, color: "rgba(251,191,36,0.80)", lineHeight: 1.5,
              }}>
                💡 Con 3+ sesiones registradas el plan se personaliza con tu historial real de fatiga y estancamiento.
              </div>
            )}

            <button onClick={handleGenerate} disabled={generating} style={{
              width: "100%", padding: "16px",
              background: generating ? "rgba(255,255,255,0.07)" : "rgba(167,139,250,0.85)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: generating ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(167,139,250,0.95)",
              color: generating ? "rgba(240,240,240,0.30)" : "#fff",
              borderRadius: 18, cursor: generating ? "default" : "pointer",
              fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              boxShadow: generating ? "none" : "0 4px 24px rgba(167,139,250,0.35)",
              WebkitTapHighlightColor: "transparent",
            }}>
              {generating ? "CALCULANDO TU PLAN..." : "✦ GENERAR MESOCICLO"}
            </button>
          </div>
        )}

        {/* ── VER PLAN ── */}
        {step === "plan" && plan && (() => {
          const week = plan.mesocycle.find(w => w.week === activeWeek);
          if (!week) return null;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Info de la semana */}
              <div style={{
                background: week.isDeload ? "rgba(251,191,36,0.10)" : "rgba(167,139,250,0.10)",
                backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                border: `1px solid ${week.isDeload ? "rgba(251,191,36,0.25)" : "rgba(167,139,250,0.25)"}`,
                borderRadius: 18, padding: "16px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, marginBottom: 4,
                      color: week.isDeload ? "#fbbf24" : "#a78bfa" }}>
                      {week.isDeload ? "SEMANA DE DELOAD" : `SEMANA ${week.week} DE ${plan.mesocycle.length}`}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{week.focus}</div>
                  </div>
                  <div style={{
                    background: week.isDeload ? "rgba(251,191,36,0.20)" : "rgba(167,139,250,0.20)",
                    border: `1px solid ${week.isDeload ? "rgba(251,191,36,0.35)" : "rgba(167,139,250,0.35)"}`,
                    borderRadius: 10, padding: "6px 12px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: "rgba(240,240,240,0.40)", letterSpacing: 1 }}>RIR</div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{week.rir}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(240,240,240,0.55)", lineHeight: 1.5 }}>
                  {week.intensityNote}
                </div>
              </div>

              {/* Sesiones de la semana */}
              <div style={{ fontSize: 9, letterSpacing: 2.5, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>
                SESIONES — {week.sessions.length} DÍAS
              </div>

              {week.sessions.map((session, si) => (
                <div key={si} style={{
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 16, overflow: "hidden",
                  animation: `slideDown 0.2s ease ${si * 0.05}s both`,
                }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Día {session.day} — {session.name}</div>
                      <div style={{ fontSize: 10, color: "rgba(240,240,240,0.35)", marginTop: 2 }}>
                        {session.repRange} reps · {session.totalSets} series total
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "rgba(167,139,250,0.70)" }}>
                      {session.totalSets}s
                    </div>
                  </div>
                  <div style={{ padding: "10px 14px" }}>
                    {Object.entries(session.sets).map(([muscle, sets]) => {
                      const range = MUSCLE_RANGES[muscle];
                      const pct   = range ? Math.min(sets / range.mrv, 1) : 0;
                      return (
                        <div key={muscle} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 80, fontSize: 10, color: "rgba(240,240,240,0.60)", flexShrink: 0 }}>
                            {range?.label || muscle}
                          </div>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 99,
                              width: `${pct * 100}%`,
                              background: pct > 0.85 ? "#f87171" : pct > 0.65 ? "#fbbf24" : "#a78bfa",
                              transition: "width 0.5s ease",
                            }} />
                          </div>
                          <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,240,240,0.80)", width: 24, textAlign: "right" }}>
                            {sets}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Insights personalizados */}
              {plan.insights?.length > 0 && activeWeek === 1 && (
                <>
                  <div style={{ fontSize: 9, letterSpacing: 2.5, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginTop: 6 }}>
                    ANÁLISIS PERSONALIZADO
                  </div>
                  {plan.insights.map((ins, i) => {
                    const colors = {
                      info:      { bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.20)",  color: "#60a5fa", icon: "ℹ" },
                      warning:   { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.20)",  color: "#fbbf24", icon: "⚠" },
                      alert:     { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.20)", color: "#f87171", icon: "!" },
                      tip:       { bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.20)",  color: "#4ade80", icon: "✓" },
                      nutrition: { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.20)",  color: "#fbbf24", icon: "🥗" },
                    };
                    const c = colors[ins.type] || colors.info;
                    return (
                      <div key={i} style={{
                        background: c.bg, border: `1px solid ${c.border}`,
                        borderRadius: 14, padding: "12px 14px",
                        display: "flex", gap: 10, alignItems: "flex-start",
                        animation: `slideDown 0.2s ease ${i * 0.07}s both`,
                      }}>
                        <span style={{ fontSize: 14, color: c.color, flexShrink: 0, fontWeight: 700 }}>{c.icon}</span>
                        <div style={{ fontSize: 12, color: "rgba(240,240,240,0.75)", lineHeight: 1.6 }}>{ins.text}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

const S = {
  label: { fontSize: 9, letterSpacing: 2.5, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 8 },
  input: {
    width: "100%", background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#f0f0f0", padding: "11px 14px",
    borderRadius: 14, fontSize: 15, fontFamily: "inherit", outline: "none",
  },
};
