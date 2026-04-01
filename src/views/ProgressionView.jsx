import { useState } from "react";
import { calcDoubleProgression, calcLinearProgression, analyzeProgression } from "../utils/progression";
import { DAY_META } from "../data/routine";
import { tokens } from "../design";

export default function ProgressionView({ logs, routine, onBack }) {
  const [mode, setMode]     = useState("double");
  const [tab, setTab]       = useState("calc");
  const [dpWeight, setDpWeight]     = useState("");
  const [dpReps, setDpReps]         = useState("");
  const [dpFloor, setDpFloor]       = useState("8");
  const [dpCeiling, setDpCeiling]   = useState("12");
  const [dpIncrement, setDpIncrement] = useState("2.5");
  const [lpWeight, setLpWeight]     = useState("");
  const [lpReps, setLpReps]         = useState("");
  const [lpTarget, setLpTarget]     = useState("8");
  const [lpIncrement, setLpIncrement] = useState("2.5");
  const [lpFails, setLpFails]       = useState("0");
  const [selDay, setSelDay] = useState(Object.keys(routine || {})[0] || "");
  const [selEx, setSelEx]   = useState(routine?.[Object.keys(routine || {})[0]]?.exercises?.[0]?.name || "");

  const routineDays = Object.keys(routine || {});
  const exercises   = routine?.[selDay]?.exercises || [];
  const accent      = DAY_META[selDay]?.accent || "#60a5fa";

  const dpResult = dpWeight && dpReps
    ? calcDoubleProgression(parseFloat(dpWeight), parseInt(dpReps), parseInt(dpFloor), parseInt(dpCeiling), parseFloat(dpIncrement))
    : null;
  const lpResult = lpWeight && lpReps
    ? calcLinearProgression(parseFloat(lpWeight), parseInt(lpReps), parseInt(lpTarget), parseFloat(lpIncrement), parseInt(lpFails))
    : null;
  const analysis = selEx && selDay ? analyzeProgression(logs, routine, selDay, selEx) : null;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3 }}>ANÁLISIS</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: "var(--text)" }}>Progresión</h2>
          </div>
        </div>

        {/* Tabs principales */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--glass-border)" }}>
          {[
            { key: "calc",    label: "🧮 CALCULADORA" },
            { key: "analyze", label: "🔍 ANALIZAR" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.key ? "#fb923c" : "transparent"}`,
              color: tab === t.key ? "#fb923c" : "var(--text3)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 9, letterSpacing: 2, fontFamily: "inherit",
              transition: "all 0.15s", marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>

        {/* CALCULADORA */}
        {tab === "calc" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {/* Modo selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { key: "double", label: "DOBLE PROGRESIÓN", desc: "Rango de reps" },
                { key: "linear", label: "PROGRESIÓN LINEAL", desc: "Peso fijo por sesión" },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)} style={{
                  background: mode === m.key ? "#fb923c18" : "var(--bg2)",
                  border: `1px solid ${mode === m.key ? "#fb923c44" : "var(--border)"}`,
                  borderRadius: 12, padding: "12px", cursor: "pointer",
                  textAlign: "left", fontFamily: "inherit",
                  transition: "all 0.15s",
                  boxShadow: mode === m.key ? "0 2px 12px #fb923c11" : "none",
                }}>
                  <div style={{ fontSize: 10, color: mode === m.key ? "#fb923c" : "var(--text3)", letterSpacing: 1, marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)" }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Info */}
            <div style={{
              background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 11, color: "rgba(240,240,240,0.30)", lineHeight: 1.6,
            }}>
              {mode === "double"
                ? "📖 Trabaja en un rango (ej: 8-12). Al llegar al techo → sube peso. Ideal para hipertrofia."
                : "📖 Sube peso cada sesión. Si fallas → repite. 3 fallos → deload. Ideal para fuerza."}
            </div>

            {/* Inputs doble progresión */}
            {mode === "double" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <InputField label="PESO ACTUAL (kg)" value={dpWeight} onChange={setDpWeight} placeholder="80" accent="#fb923c" />
                  <InputField label="REPS LOGRADAS"    value={dpReps}   onChange={setDpReps}   placeholder="10" accent="#fb923c" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  <InputField label="PISO"       value={dpFloor}     onChange={setDpFloor}     placeholder="8"   />
                  <InputField label="TECHO"      value={dpCeiling}   onChange={setDpCeiling}   placeholder="12"  />
                  <InputField label="INCREMENTO" value={dpIncrement} onChange={setDpIncrement} placeholder="2.5" />
                </div>
                {dpResult && <ResultCard result={dpResult} />}
              </div>
            )}

            {/* Inputs lineal */}
            {mode === "linear" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <InputField label="PESO ACTUAL (kg)" value={lpWeight}    onChange={setLpWeight}    placeholder="80" accent="#fb923c" />
                  <InputField label="REPS LOGRADAS"    value={lpReps}      onChange={setLpReps}      placeholder="6"  accent="#fb923c" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  <InputField label="OBJETIVO" value={lpTarget}    onChange={setLpTarget}    placeholder="8"   />
                  <InputField label="INCR."    value={lpIncrement} onChange={setLpIncrement} placeholder="2.5" />
                  <InputField label="FALLOS"   value={lpFails}     onChange={setLpFails}     placeholder="0"   />
                </div>
                {lpResult && <ResultCard result={lpResult} />}
              </div>
            )}
          </div>
        )}

        {/* ANALIZAR */}
        {tab === "analyze" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {/* Pills días */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {routineDays.map(d => {
                const c = DAY_META[d] || { accent: "#60a5fa" };
                return (
                  <button key={d} onClick={() => { setSelDay(d); setSelEx(routine[d]?.exercises?.[0]?.name || ""); }} style={{
                    background: selDay === d ? c.accent + "22" : "var(--bg2)",
                    border: `1px solid ${selDay === d ? c.accent : "var(--border)"}`,
                    color: selDay === d ? c.accent : "var(--text3)",
                    padding: "6px 14px", borderRadius: 99, cursor: "pointer",
                    fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}>{d}</button>
                );
              })}
            </div>

            <select value={selEx} onChange={e => setSelEx(e.target.value)} style={{
              width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
              color: "rgba(240,240,240,0.55)", padding: "11px 14px", borderRadius: 12,
              fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16,
            }}>
              {exercises.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
            </select>

            {!analysis ? (
              <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)", borderRadius: 14, padding: "32px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 14, color: "rgba(240,240,240,0.55)", marginBottom: 6 }}>Sin suficientes datos</div>
                <div style={{ fontSize: 12, color: "rgba(240,240,240,0.30)" }}>Necesitas al menos 2 sesiones con {selEx}</div>
              </div>
            ) : (
              <div>
                {/* Tendencia */}
                <div style={{
                  background: analysis.trend === "up" ? "#22c55e0d" : analysis.trend === "down" ? "#ef44440d" : "var(--bg2)",
                  border: `1px solid ${analysis.trend === "up" ? "#22c55e22" : analysis.trend === "down" ? "#ef444422" : "var(--border)"}`,
                  borderLeft: `3px solid ${analysis.trend === "up" ? "#22c55e" : analysis.trend === "down" ? "#ef4444" : "var(--yellow)"}`,
                  borderRadius: 14, padding: "14px 16px", marginBottom: 12,
                  animation: "scaleIn 0.2s ease",
                }}>
                  <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3, marginBottom: 8 }}>TENDENCIA — {selEx}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 400, color: analysis.trend === "up" ? "#22c55e" : analysis.trend === "down" ? "#ef4444" : "var(--yellow)" }}>
                        {analysis.trend === "up" ? "↑" : analysis.trend === "down" ? "↓" : "→"}
                        {" "}{analysis.rmGain > 0 ? "+" : ""}{analysis.rmGain} kg 1RM
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", marginTop: 3 }}>
                        {analysis.history.length} sesiones · {analysis.rmPerSession > 0 ? "+" : ""}{analysis.rmPerSession} kg/sesión
                      </div>
                    </div>
                    <div style={{ fontSize: 32 }}>
                      {analysis.trend === "up" ? "💪" : analysis.trend === "down" ? "😤" : "😐"}
                    </div>
                  </div>
                </div>

                {/* Estancamiento */}
                {analysis.stagnant && (
                  <div style={{
                    background: "#1c110022", border: "1px solid #f59e0b33",
                    borderLeft: "3px solid var(--yellow)", borderRadius: 14,
                    padding: "12px 16px", marginBottom: 12, animation: "slideDown 0.2s ease",
                  }}>
                    <div style={{ fontSize: 12, color: "var(--yellow)", marginBottom: 6 }}>⚠️ ESTANCAMIENTO DETECTADO</div>
                    <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", lineHeight: 1.7 }}>
                      • Intenta subir reps antes de subir peso<br />
                      • Agrega una serie extra de volumen<br />
                      • Verifica que entrenas cerca del fallo (RIR 0-2)<br />
                      • Revisa recuperación y nutrición
                    </div>
                  </div>
                )}

                {/* Historial */}
                <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3, marginBottom: 12 }}>ÚLTIMAS SESIONES</div>
                  {analysis.history.map((h, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginBottom: 8, paddingBottom: 8,
                      borderBottom: i < analysis.history.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <span style={{ fontSize: 12, color: "rgba(240,240,240,0.30)" }}>{h.date}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "rgba(240,240,240,0.30)" }}>{h.weight}kg × {h.reps}</span>
                        <span style={{
                          fontSize: 13, fontWeight: i === analysis.history.length - 1 ? 500 : 300,
                          color: i === analysis.history.length - 1 ? accent : "var(--text3)",
                        }}>{h.rm} kg</span>
                        {i === analysis.history.length - 1 && <span style={{ fontSize: 10, color: accent }}>←</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sugerencia */}
                {analysis.last && (
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3, marginBottom: 10 }}>SUGERENCIA PRÓXIMA SESIÓN</div>
                    <ResultCard result={calcDoubleProgression(analysis.last.weight, analysis.last.reps, 6, 12, 2.5)} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, accent }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 1, marginBottom: 5 }}>{label}</div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
        color: accent || "var(--text)", padding: "10px", borderRadius: 10,
        fontSize: 16, fontFamily: "inherit", outline: "none",
        textAlign: "center", fontWeight: 400, transition: "border-color 0.15s",
      }} />
    </div>
  );
}

function ResultCard({ result }) {
  const color = result.color || (result.action === "up" ? "var(--green)" : result.action === "deload" ? "var(--red)" : "var(--yellow)");
  const rawColor = result.color || (result.action === "up" ? "#22c55e" : result.action === "deload" ? "#ef4444" : "#fbbf24");
  return (
    <div style={{
      background: rawColor + "0d", border: `1px solid ${rawColor}33`,
      borderLeft: `3px solid ${rawColor}`, borderRadius: 14, padding: "16px",
      animation: "scaleIn 0.2s ease",
      boxShadow: `0 2px 12px ${rawColor}11`,
    }}>
      <div style={{ fontSize: 9, color: rawColor, letterSpacing: 3, marginBottom: 8 }}>{result.type}</div>
      <div style={{ fontSize: 13, color: "rgba(240,240,240,0.55)", marginBottom: 14, lineHeight: 1.6 }}>{result.message}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "PRÓXIMO PESO", value: `${result.nextWeight}`, unit: "kg" },
          { label: "PRÓXIMAS REPS", value: `${result.nextReps}`, unit: "reps" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", marginBottom: 6, letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 22, color: rawColor, fontWeight: 300 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)" }}>{s.unit}</div>
          </div>
        ))}
      </div>
      {result.progress !== undefined && (
        <div style={{ marginTop: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 5, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: rawColor,
              width: `${result.progress}%`, transition: "width 0.5s ease",
              boxShadow: `0 0 8px ${rawColor}66`,
            }} />
          </div>
          <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", textAlign: "right", marginTop: 4 }}>
            {result.progress}% hacia el techo
          </div>
        </div>
      )}
    </div>
  );
}
