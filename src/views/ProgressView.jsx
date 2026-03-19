import { useState } from "react";
import { DAY_META } from "../data/routine";
import { calc1RM, bestSet } from "../utils/fitness";
import { getProgressionHistory, predictRM, daysToTarget } from "../utils/predictor";
import ExerciseChart from "../components/ExerciseChart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { tokens } from "../design";

export default function ProgressView({ logs, routine, onBack }) {
  const routineDays = Object.keys(routine || {});
  const firstDay    = routineDays[0] || "";
  const firstEx     = routine?.[firstDay]?.exercises?.[0]?.name || "";

  const [progressDay, setProgressDay] = useState(firstDay);
  const [progressEx, setProgressEx]   = useState(firstEx);
  const [tab, setTab]                 = useState("historial");
  const [targetWeight, setTargetWeight] = useState("");

  function handleDayChange(day) {
    setProgressDay(day);
    setProgressEx(routine?.[day]?.exercises?.[0]?.name || "");
  }

  const exercises  = routine?.[progressDay]?.exercises || [];
  const accent     = DAY_META[progressDay]?.accent || "#60a5fa";
  const history    = getProgressionHistory(logs, routine, progressDay, progressEx);
  const prediction = history.length >= 2 ? predictRM(history, 90) : null;
  const prRows     = history.map(h => ({ date: h.date, rm: h.rm }));
  const maxRM      = prRows.length ? Math.max(...prRows.map(r => r.rm)) : 0;

  const chartData = [
    ...history.map(h => ({ date: h.date.slice(5), rm: h.rm })),
    ...(prediction?.predictions || []).map(p => ({ date: p.date.slice(5), predicted: p.rm })),
  ];

  const target   = parseFloat(targetWeight);
  const forecast = target > 0 && history.length >= 2 ? daysToTarget(history, target) : null;

  if (!routineDays.length) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "20px 18px", fontFamily: "DM Mono, monospace" }}>
      <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, marginBottom: 20 }}>←</button>
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
        <div style={{ fontSize: 14, color: "var(--text2)" }}>Sin rutina configurada</div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>ANÁLISIS</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "var(--text)" }}>Progreso</h2>
          </div>
        </div>

        {/* Selector días — pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {routineDays.map(d => {
            const c = DAY_META[d] || { accent: "#60a5fa" };
            const active = progressDay === d;
            return (
              <button key={d} onClick={() => handleDayChange(d)} style={{
                background: active ? c.accent + "22" : "var(--bg2)",
                border: `1px solid ${active ? c.accent : "var(--border)"}`,
                color: active ? c.accent : "var(--text3)",
                padding: "6px 14px", borderRadius: 99, cursor: "pointer",
                fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
                transition: "all 0.15s",
                boxShadow: active ? `0 2px 10px ${c.accent}33` : "none",
              }}>{d}</button>
            );
          })}
        </div>

        {/* Selector ejercicio */}
        <select value={progressEx} onChange={e => setProgressEx(e.target.value)} style={{
          width: "100%", background: "var(--bg2)", border: "1px solid var(--border)",
          color: "var(--text2)", padding: "11px 14px", borderRadius: 12,
          fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 14,
        }}>
          {exercises.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
        </select>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {[
            { key: "historial", label: "HISTORIAL" },
            { key: "predictor", label: "🔮 PREDICTOR" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.key ? accent : "transparent"}`,
              color: tab === t.key ? accent : "var(--text3)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 9, letterSpacing: 2, fontFamily: "inherit",
              transition: "all 0.15s", marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>

        {/* HISTORIAL */}
        {tab === "historial" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "16px", marginBottom: 12,
            }}>
              <div style={{ fontSize: 9, color: accent, letterSpacing: 3, marginBottom: 12 }}>{progressEx}</div>
              <ExerciseChart exName={progressEx} dayName={progressDay} logs={logs} accent={accent} routine={routine} />
            </div>

            {prRows.length > 0 && (
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3, marginBottom: 12 }}>HISTORIAL 1RM</div>
                {prRows.map((r, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 8, paddingBottom: 8,
                    borderBottom: i < prRows.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>{r.date}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {r.rm === maxRM && <span style={{ fontSize: 12 }}>🏆</span>}
                      <span style={{
                        fontSize: 15, fontWeight: r.rm === maxRM ? 500 : 300,
                        color: r.rm === maxRM ? "#fbbf24" : accent,
                      }}>{r.rm} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!prRows.length && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 14, color: "var(--text2)" }}>Sin datos aún</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Registra sesiones para ver tu progreso</div>
              </div>
            )}
          </div>
        )}

        {/* PREDICTOR */}
        {tab === "predictor" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {history.length < 3 ? (
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "32px 24px", textAlign: "center",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔮</div>
                <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 6 }}>Necesitas más datos</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  Registra al menos 3 sesiones con {progressEx}
                </div>
                <div style={{
                  marginTop: 12, background: accent + "11", border: `1px solid ${accent}22`,
                  borderRadius: 10, padding: "8px 14px", display: "inline-block",
                }}>
                  <span style={{ fontSize: 13, color: accent }}>{history.length} / 3 sesiones</span>
                </div>
              </div>
            ) : (
              <>
                {/* Gráfico */}
                <div style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "16px", marginBottom: 12,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: accent, letterSpacing: 3 }}>PROYECCIÓN 90 DÍAS</div>
                    {prediction && (
                      <div style={{
                        fontSize: 10, color: prediction.r2 > 0.7 ? "var(--green)" : "var(--yellow)",
                        background: prediction.r2 > 0.7 ? "#22c55e11" : "#fbbf2411",
                        border: `1px solid ${prediction.r2 > 0.7 ? "#22c55e22" : "#fbbf2422"}`,
                        padding: "3px 8px", borderRadius: 99,
                      }}>R² {(prediction.r2 * 100).toFixed(0)}%</div>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" />
                      <XAxis dataKey="date" tick={{ fill: "#334155", fontSize: 9 }} />
                      <YAxis tick={{ fill: "#334155", fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: "#0d0d14", border: `1px solid ${accent}44`, borderRadius: 8, fontSize: 11 }} />
                      <Line type="monotone" dataKey="rm" stroke={accent} strokeWidth={2} dot={{ fill: accent, r: 3 }} name="1RM real" />
                      <Line type="monotone" dataKey="predicted" stroke={accent + "66"} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Predicción" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Proyecciones */}
                {prediction?.predictions?.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      prediction.predictions.find(p => p.label === "+7d"),
                      prediction.predictions.find(p => p.label === "+30d"),
                      prediction.predictions.find(p => p.label === "+90d"),
                    ].filter(Boolean).map((p, i) => (
                      <div key={i} style={{
                        background: accent + "0d", border: `1px solid ${accent}22`,
                        borderRadius: 12, padding: "12px 8px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 6, letterSpacing: 1 }}>{p.label}</div>
                        <div style={{ fontSize: 18, color: accent, fontWeight: 300 }}>{p.rm}</div>
                        <div style={{ fontSize: 9, color: "var(--text3)" }}>kg</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Calculadora objetivo */}
                <div style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "16px",
                }}>
                  <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3, marginBottom: 12 }}>🎯 ¿CUÁNDO LLEGO A...?</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
                      placeholder="Peso objetivo (kg)"
                      style={{
                        flex: 1, background: "var(--bg3)", border: `1px solid ${accent}44`,
                        color: "var(--text)", padding: "11px 14px", borderRadius: 12,
                        fontSize: 14, fontFamily: "inherit", outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", color: "var(--text3)", fontSize: 12, padding: "0 8px" }}>kg</div>
                  </div>

                  {forecast !== null && targetWeight && (
                    <div style={{
                      background: forecast === 0 ? "#14532d22" : accent + "0d",
                      border: `1px solid ${forecast === 0 ? "#22c55e33" : accent + "22"}`,
                      borderRadius: 12, padding: "14px", textAlign: "center",
                      animation: "scaleIn 0.2s ease",
                    }}>
                      {forecast === 0 ? (
                        <>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
                          <div style={{ fontSize: 14, color: "var(--green)" }}>¡Ya llegaste!</div>
                        </>
                      ) : prediction?.slope <= 0 ? (
                        <div style={{ fontSize: 12, color: "var(--yellow)" }}>
                          Progresión insuficiente.<br />
                          <span style={{ fontSize: 10, color: "var(--text3)" }}>Aumenta frecuencia o carga.</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, letterSpacing: 1 }}>ESTIMADO EN</div>
                          <div style={{ fontSize: 30, color: accent, fontWeight: 300 }}>{forecast.days}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>días · {forecast.date}</div>
                          {prediction?.r2 < 0.5 && (
                            <div style={{ fontSize: 10, color: "var(--yellow)", marginTop: 8 }}>
                              ⚠️ Progresión irregular — estimación aproximada
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {!targetWeight && (
                    <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
                      Ingresa un peso objetivo
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
