import { useState, useEffect, useRef } from "react";
import { planMesocycle, saveMesocycle, loadMesocycle, clearMesocycle, GOALS, FREQUENCIES, LEVELS } from "../utils/mesocycle";
import { MUSCLE_RANGES } from "../utils/intelligence";
import { haptics } from "../utils/haptics";
import ContextTooltip from "../components/ContextTooltip";

// ─── Slider custom glassmorphism (mismo que SleepView) ────────────────────────
function GlassSlider({ min, max, step, value, onChange, color = "#a78bfa" }) {
  const trackRef   = useRef(null);
  const isDragging = useRef(false);

  function calcValue(clientX) {
    const rect   = trackRef.current.getBoundingClientRect();
    const pct    = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw    = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, parseFloat(stepped.toFixed(4))));
  }

  function onPointerDown(e) {
    e.preventDefault();
    isDragging.current = true;
    trackRef.current.setPointerCapture(e.pointerId);
    onChange(calcValue(e.clientX));
  }
  function onPointerMove(e) { if (isDragging.current) onChange(calcValue(e.clientX)); }
  function onPointerUp()    { isDragging.current = false; }

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative", height: 36, display: "flex",
        alignItems: "center", cursor: "pointer",
        userSelect: "none", WebkitUserSelect: "none", touchAction: "none",
      }}
    >
      <div style={{
        position: "absolute", left: 0, right: 0, height: 6,
        background: "rgba(255,255,255,0.08)", borderRadius: 99,
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 99,
        }} />
      </div>
      <div style={{
        position: "absolute",
        left: `calc(${pct}% - 13px)`,
        width: 26, height: 26,
        background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}aa)`,
        border: `2px solid ${color}`,
        borderRadius: "50%",
        boxShadow: `0 0 14px ${color}55, 0 2px 8px rgba(0,0,0,0.5)`,
      }} />
    </div>
  );
}

// ─── Modal de explicación del mesociclo ───────────────────────────────────────
function MesocycleExplainerModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "rgba(18,14,36,0.97)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(167,139,250,0.20)",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 40px",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)",
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, margin: "0 auto 20px" }} />

        <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 6 }}>GUÍA</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 20, letterSpacing: -0.5 }}>
          ¿Qué es un mesociclo? 📅
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <InfoBlock icon="📐" title="Definición" color="#a78bfa">
            Un mesociclo es un bloque de entrenamiento de 4 a 8 semanas con progresión planificada. En lugar de entrenar siempre igual, cada semana sube el volumen o la intensidad hasta llegar a una semana de deload (descarga) que te permite recuperarte.
          </InfoBlock>

          <InfoBlock icon="📈" title="¿Por qué funciona?" color="#60a5fa">
            Tu cuerpo se adapta al estrés en ciclos. Acumular estrés progresivo y luego reducirlo (deload) es el mecanismo base de la supercompensación — así es como progresas de verdad en fuerza e hipertrofia.
          </InfoBlock>

          <div style={{
            background: "rgba(255,255,255,0.05)", borderRadius: 16,
            padding: "14px", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, color: "rgba(240,240,240,0.30)", marginBottom: 12 }}>
              ¿CUÁNTO TIEMPO?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { weeks: "4 sem", label: "Corto", when: "Cuando quieres cambiar de objetivo pronto, eres principiante, o tienes poca tolerancia al volumen.", color: "#4ade80" },
                { weeks: "5–6 sem", label: "Intermedio", when: "El más común. Suficiente para acumular volumen y notar adaptaciones claras sin sobreentrenar.", color: "#a78bfa" },
                { weeks: "7–8 sem", label: "Largo", when: "Para avanzados con buena tolerancia al volumen. Más tiempo acumulando = más potencial de adaptación.", color: "#fbbf24" },
              ].map(({ weeks, label, when, color }) => (
                <div key={weeks} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    flexShrink: 0, background: `${color}22`,
                    border: `1px solid ${color}44`, borderRadius: 10,
                    padding: "4px 10px", minWidth: 52, textAlign: "center",
                  }}>
                    <div className="mono" style={{ fontSize: 11, fontWeight: 900, color }}>{weeks}</div>
                    <div style={{ fontSize: 7, color: `${color}99`, letterSpacing: 1 }}>{label.toUpperCase()}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(240,240,240,0.55)", lineHeight: 1.5 }}>{when}</div>
                </div>
              ))}
            </div>
          </div>

          <InfoBlock icon="🔄" title="Semana de deload" color="#fbbf24">
          La última semana siempre es un deload: baja el volumen e intensidad al ~50–60%. Esto no es perder el tiempo — es cuando el cuerpo consolida las adaptaciones. Sales más fuerte para el siguiente mesociclo.
          </InfoBlock>
        </div>

        <button onClick={onClose} style={{
          marginTop: 20, width: "100%", padding: "14px",
          background: "rgba(167,139,250,0.85)",
          border: "1px solid rgba(167,139,250,0.95)",
          color: "#fff", borderRadius: 16, cursor: "pointer",
          fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
          boxShadow: "0 4px 20px rgba(167,139,250,0.30)",
        }}>
          ENTENDIDO, CONFIGURAR
        </button>
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, color, children }) {
  return (
    <div style={{
      background: `${color}0a`, border: `1px solid ${color}25`,
      borderRadius: 14, padding: "12px 14px",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11, color: "rgba(240,240,240,0.60)", lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Modal de recomendación de rutina para nuevo mesociclo ───────────────────
function RoutineRecommendationModal({ routine, onClose, onConfirm }) {
  // Extrae ejercicios únicos de la rutina actual del usuario
  const exercises = [];
  if (routine) {
    Object.values(routine).forEach(day => {
      (day.exercises || []).forEach(ex => {
        if (ex.name && !exercises.find(e => e.name === ex.name)) {
          exercises.push(ex);
        }
      });
    });
  }

  // Agrupa ejercicios por músculo aproximado según nombre
  function guessGroup(name) {
    const n = name.toLowerCase();
    if (/sentadilla|squat|pierna|cuádr|femoral|prensa|búlgara|glúte|hip thrust|gemelo/.test(n)) return "Piernas";
    if (/press banca|pecho|apertura|apert|inclinado/.test(n)) return "Pecho";
    if (/press militar|hombro|lateral|frontal|arnold|deltoid/.test(n)) return "Hombros";
    if (/remo|jalón|dominada|pull|espalda|polea/.test(n)) return "Espalda";
    if (/bícep|curl/.test(n)) return "Bíceps";
    if (/trícep|extensión|francés|press trícep/.test(n)) return "Tríceps";
    if (/peso muerto|deadlift/.test(n)) return "Cadena posterior";
    return "General";
  }

  const groups = {};
  exercises.forEach(ex => {
    const g = guessGroup(ex.name);
    if (!groups[g]) groups[g] = [];
    groups[g].push(ex.name);
  });

  // Recomendaciones basadas en los grupos musculares detectados
  const hasLegs    = !!groups["Piernas"] || !!groups["Cadena posterior"];
  const hasUpper   = !!(groups["Pecho"] || groups["Espalda"] || groups["Hombros"]);
  const hasArms    = !!(groups["Bíceps"] || groups["Tríceps"]);

  let recommendation = "";
  let structureTip   = "";

  if (hasLegs && hasUpper) {
    if (exercises.length >= 16) {
      recommendation = "PPL (Push/Pull/Legs)";
      structureTip = "Tienes volumen alto y ejercicios variados. El split PPL te permite 6 días con máximo volumen por grupo muscular, ideal para el próximo mesociclo.";
    } else {
      recommendation = "Upper/Lower";
      structureTip = "Tu rutina actual cubre tren superior e inferior. El split Upper/Lower (4 días) es perfecto para seguir progresando con buena frecuencia por grupo muscular.";
    }
  } else if (hasUpper && !hasLegs) {
    recommendation = "Full Body";
    structureTip = "Detecté que tu rutina actual no tiene mucho trabajo de piernas. Un Full Body 3 días te permitiría incorporarlas y balancear mejor tu desarrollo.";
  } else {
    recommendation = "Full Body";
    structureTip = "Para el nuevo mesociclo te recomendamos empezar con Full Body 3 días, que es eficiente y permite alta frecuencia de entrenamiento.";
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "rgba(18,14,36,0.97)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(167,139,250,0.20)",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 40px",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)",
        }}
      >
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 6 }}>RECOMENDACIÓN</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: -0.5 }}>
          Nuevo mesociclo 🔄
        </div>
        <div style={{ fontSize: 12, color: "rgba(240,240,240,0.50)", marginBottom: 20, lineHeight: 1.5 }}>
          Basado en tu rutina actual, esto es lo que te recomendamos
        </div>

        {/* Ejercicios detectados */}
        {Object.keys(groups).length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.05)", borderRadius: 14,
            padding: "12px 14px", marginBottom: 14,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, color: "rgba(240,240,240,0.30)", marginBottom: 10 }}>
              TU RUTINA ACTUAL — {exercises.length} EJERCICIOS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(groups).map(([group, exs]) => (
                <div key={group} style={{
                  background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.20)",
                  borderRadius: 99, padding: "4px 10px",
                  fontSize: 10, color: "#a78bfa", fontWeight: 600,
                }}>
                  {group} ×{exs.length}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendación */}
        <div style={{
          background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.25)",
          borderRadius: 16, padding: "16px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, color: "rgba(167,139,250,0.60)" }}>SPLIT RECOMENDADO</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#a78bfa" }}>{recommendation}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "rgba(240,240,240,0.60)", lineHeight: 1.6 }}>
            {structureTip}
          </div>
        </div>

        <div style={{ fontSize: 11, color: "rgba(240,240,240,0.35)", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
          Podés aceptar la recomendación o configurar el mesociclo manualmente con los parámetros que quieras.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "13px",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(240,240,240,0.60)", borderRadius: 14, cursor: "pointer",
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: "inherit",
          }}>CONFIGURAR YO</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "13px",
            background: "rgba(167,139,250,0.85)", border: "1px solid rgba(167,139,250,0.95)",
            color: "#fff", borderRadius: 14, cursor: "pointer",
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: "inherit",
            boxShadow: "0 4px 20px rgba(167,139,250,0.30)",
          }}>EMPEZAR NUEVO</button>
        </div>
      </div>
    </div>
  );
}

export default function MesocycleView({ user, logs, routine, onBack }) {
  const [step, setStep]         = useState("config");
  const [plan, setPlan]         = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [goal, setGoal]         = useState("hypertrophy");
  const [weeks, setWeeks]       = useState(5);
  const [daysPerWeek, setDays]  = useState(4);
  const [level, setLevel]       = useState("intermediate");
  const [bodyweight, setBW]     = useState("");

  // Duración del mesociclo: color dinámico
  const weeksColor = weeks <= 4 ? "#4ade80" : weeks <= 6 ? "#a78bfa" : "#fbbf24";

  useEffect(() => {
    const saved = loadMesocycle(user.uid);
    if (saved?.mesocycle) { setPlan(saved); setStep("plan"); }
    else setShowExplainer(true); // Primera vez: mostrar explicación automáticamente
  }, [user.uid]);

  function handleGenerate() {
    setGenerating(true);
    haptics.light();
    setTimeout(() => {
      const result = planMesocycle({ goal, weeks, daysPerWeek, level,
        bodyweight: bodyweight ? parseFloat(bodyweight) : null, logs, routine });
      saveMesocycle(user.uid, result);
      setPlan(result);
      setStep("plan");
      setActiveWeek(1);
      setGenerating(false);
    }, 800);
  }

  function handleReset() {
    setShowResetModal(true);
  }

  function confirmReset() {
    setShowResetModal(false);
    clearMesocycle(user.uid);
    setPlan(null);
    setStep("config");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {showExplainer && <MesocycleExplainerModal onClose={() => setShowExplainer(false)} />}
      {showResetModal && (
        <RoutineRecommendationModal
          routine={routine}
          onClose={() => setShowResetModal(false)}
          onConfirm={confirmReset}
        />
      )}

      {/* Header */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ fontSize: 22, color: "rgba(240,240,240,0.50)", padding: "0 4px" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>PLANIFICACIÓN</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.8 }}>Mesociclo 📅</div>
          </div>
          <button onClick={() => setShowExplainer(true)} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(240,240,240,0.40)", padding: "6px 10px", borderRadius: 10,
            fontSize: 11, cursor: "pointer", fontFamily: "inherit", minHeight: 0,
          }}>¿Qué es?</button>
          {step === "plan" && (
            <button onClick={handleReset} style={{
              background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)",
              color: "#f87171", padding: "6px 12px", borderRadius: 10,
              fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", minHeight: 0,
            }}>NUEVO</button>
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
                fontSize: 9, letterSpacing: 1, fontWeight: 700, fontFamily: "inherit",
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

            {/* Duración — slider custom */}
            <div style={{
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 18, padding: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <div style={S.label}>DURACIÓN DEL MESOCICLO</div>
                <div className="mono" style={{ fontSize: 30, fontWeight: 900, color: weeksColor, letterSpacing: -1, transition: "color 0.2s" }}>{weeks} sem</div>
              </div>
              <GlassSlider min={4} max={8} step={1} value={weeks} onChange={setWeeks} color={weeksColor} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>4 sem (corto)</span>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>8 sem (largo)</span>
              </div>
              <div style={{
                marginTop: 12, padding: "8px 14px", borderRadius: 12,
                background: `${weeksColor}14`, border: `1px solid ${weeksColor}33`,
                fontSize: 11, color: weeksColor, textAlign: "center", transition: "all 0.2s",
              }}>
                {weeks <= 4
                  ? "Corto · Ideal para principiantes o cambio rápido de objetivo"
                  : weeks <= 6
                    ? `${weeks} semanas · La duración más recomendada · Deload en semana ${weeks}`
                    : `Largo · Para avanzados con alta tolerancia al volumen · Deload en semana ${weeks}`}
              </div>
            </div>

            {/* Días por semana */}
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
                      const barColor = pct > 0.85 ? "#f87171" : pct > 0.65 ? "#fbbf24" : "#a78bfa";
                      return (
                        <div key={muscle} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 80, fontSize: 10, color: "rgba(240,240,240,0.60)", flexShrink: 0 }}>
                            {range?.label || muscle}
                          </div>
                          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 99,
                              width: `${pct * 100}%`,
                              background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
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
