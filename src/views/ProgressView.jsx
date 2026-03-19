import { useState } from "react";
import { DAY_META } from "../data/routine";
import { calc1RM, bestSet } from "../utils/fitness";
import { getProgressionHistory, predictRM, daysToTarget } from "../utils/predictor";
import ExerciseChart from "../components/ExerciseChart";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

export default function ProgressView({ logs, routine, onBack }) {
  const routineDays = Object.keys(routine || {});
  const firstDay    = routineDays[0] || "";
  const firstEx     = routine?.[firstDay]?.exercises?.[0]?.name || "";

  const [progressDay, setProgressDay] = useState(firstDay);
  const [progressEx, setProgressEx]   = useState(firstEx);
  const [tab, setTab]                 = useState("historial"); // historial | predictor
  const [targetWeight, setTargetWeight] = useState("");

  function handleDayChange(day) {
    setProgressDay(day);
    setProgressEx(routine?.[day]?.exercises?.[0]?.name || "");
  }

  const exercises = routine?.[progressDay]?.exercises || [];
  const accent    = DAY_META[progressDay]?.accent || "#60a5fa";

  // Historial de 1RM
  const history = getProgressionHistory(logs, routine, progressDay, progressEx);
  const prediction = history.length >= 2 ? predictRM(history, 90) : null;

  // PRs table
  const prRows = history.map(h => {
    const session = Object.values(logs).find(s => s.day === progressDay && s.date === h.date);
    return { date: h.date, rm: h.rm };
  });
  const maxRM = prRows.length ? Math.max(...prRows.map(r => r.rm)) : 0;

  // Datos para el gráfico de predicción (histórico + futuro)
  const chartData = [
    ...history.map(h => ({ date: h.date.slice(5), rm: h.rm, type: "real" })),
    ...(prediction?.predictions || []).map(p => ({ date: p.date.slice(5), predicted: p.rm, type: "predicted" })),
  ];

  // Días hasta objetivo
  const target   = parseFloat(targetWeight);
  const forecast = target > 0 && history.length >= 2 ? daysToTarget(history, target) : null;

  if (!routineDays.length) {
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 14, marginBottom: 20 }}>← HOME</button>
        <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
          Aún no tienes rutina configurada.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 14, letterSpacing: 1 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>PROGRESO</h2>
      </div>

      {/* Selector día */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(routineDays.length, 4)}, 1fr)`, gap: 6, marginBottom: 14 }}>
        {routineDays.map(d => {
          const c = DAY_META[d] || { accent: "#60a5fa", dim: "#1e3a5f" };
          const active = progressDay === d;
          return (
            <button key={d} onClick={() => handleDayChange(d)} style={{
              background: active ? c.dim : "#0e0e1a",
              border: `1px solid ${active ? c.accent : "#1a1a2a"}`,
              color: active ? c.accent : "#334155",
              padding: "8px 4px", borderRadius: 8, cursor: "pointer",
              fontSize: 11, letterSpacing: 1, fontFamily: "inherit",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{d}</button>
          );
        })}
      </div>

      {/* Selector ejercicio */}
      <select value={progressEx} onChange={e => setProgressEx(e.target.value)} style={{
        width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
        color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
        fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 14,
      }}>
        {exercises.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
      </select>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {[
          { key: "historial",  label: "HISTORIAL" },
          { key: "predictor",  label: "🔮 PREDICTOR" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "#0e0e1a" : "transparent",
            border: `1px solid ${tab === t.key ? accent + "66" : "#1a1a2a"}`,
            color: tab === t.key ? accent : "#475569",
            padding: "8px", borderRadius: 8, cursor: "pointer",
            fontSize: 11, letterSpacing: 1, fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── HISTORIAL ── */}
      {tab === "historial" && (
        <>
          <div className="card" style={{ padding: "16px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: accent, marginBottom: 12, letterSpacing: 1 }}>{progressEx}</div>
            <ExerciseChart exName={progressEx} dayName={progressDay} logs={logs} accent={accent} routine={routine} />
            <div style={{ fontSize: 10, color: "#334155", marginTop: 8, textAlign: "center" }}>
              — — peso real &nbsp;·&nbsp; —— 1RM Epley
            </div>
          </div>

          {prRows.length > 0 && (
            <div className="card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>HISTORIAL SETS</div>
              {prRows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>{r.date}</span>
                  <span style={{ fontSize: 14, color: r.rm === maxRM ? "#fbbf24" : accent, fontWeight: r.rm === maxRM ? 700 : 400 }}>
                    {r.rm} kg {r.rm === maxRM ? "🏆" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PREDICTOR ── */}
      {tab === "predictor" && (
        <div>
          {history.length < 3 ? (
            <div className="card" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔮</div>
              <div style={{ fontSize: 13, color: "#f1f5f9", marginBottom: 6 }}>Necesitas más datos</div>
              <div style={{ fontSize: 11, color: "#475569" }}>
                Registra al menos 3 sesiones con {progressEx} para ver la predicción.
              </div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>
                Tienes {history.length} sesión{history.length !== 1 ? "es" : ""}.
              </div>
            </div>
          ) : (
            <>
              {/* Gráfico histórico + predicción */}
              <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: accent, letterSpacing: 1 }}>PROYECCIÓN 90 DÍAS</div>
                  {prediction && (
                    <div style={{ fontSize: 10, color: prediction.r2 > 0.7 ? "#22c55e" : "#f59e0b" }}>
                      R² {(prediction.r2 * 100).toFixed(0)}% {prediction.r2 > 0.7 ? "✓" : "~"}
                    </div>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" />
                    <XAxis dataKey="date" tick={{ fill: "#334155", fontSize: 9 }} />
                    <YAxis tick={{ fill: "#334155", fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ background: "#0d0d14", border: `1px solid ${accent}44`, borderRadius: 6, fontSize: 11 }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Line type="monotone" dataKey="rm" stroke={accent} strokeWidth={2} dot={{ fill: accent, r: 3 }} name="1RM real" />
                    <Line type="monotone" dataKey="predicted" stroke={accent + "66"} strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Predicción" />
                  </LineChart>
                </ResponsiveContainer>

                <div style={{ fontSize: 10, color: "#334155", marginTop: 8, textAlign: "center" }}>
                  —— histórico &nbsp;·&nbsp; - - - predicción
                </div>
              </div>

              {/* Stats de predicción */}
              {prediction && prediction.predictions.length > 0 && (
                <div className="card" style={{ padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>PROYECCIONES</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      prediction.predictions.find(p => p.label === "+7d"),
                      prediction.predictions.find(p => p.label === "+30d"),
                      prediction.predictions.find(p => p.label === "+90d"),
                    ].filter(Boolean).map((p, i) => (
                      <div key={i} style={{ textAlign: "center", background: "#0a0a14", borderRadius: 8, padding: "10px 6px" }}>
                        <div style={{ fontSize: 10, color: "#334155", marginBottom: 4 }}>{p.label}</div>
                        <div style={{ fontSize: 16, color: accent, fontWeight: 500 }}>{p.rm}</div>
                        <div style={{ fontSize: 9, color: "#334155" }}>kg</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calculadora de objetivo */}
              <div className="card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>
                  🎯 ¿CUÁNDO LLEGO A...?
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={e => setTargetWeight(e.target.value)}
                    placeholder="Peso objetivo (kg)"
                    style={{
                      flex: 1, background: "#0a0a14", border: `1px solid ${accent}44`,
                      color: "#f1f5f9", padding: "9px 12px", borderRadius: 8,
                      fontSize: 14, fontFamily: "inherit", outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", color: "#475569", fontSize: 12, padding: "0 8px" }}>kg</div>
                </div>

                {forecast !== null && targetWeight && (
                  <div style={{
                    background: forecast === 0 ? "#14532d" : "#0a0a14",
                    border: `1px solid ${forecast === 0 ? "#22c55e" : accent + "33"}`,
                    borderRadius: 8, padding: "12px 14px", textAlign: "center",
                  }}>
                    {forecast === 0 ? (
                      <>
                        <div style={{ fontSize: 22 }}>🏆</div>
                        <div style={{ fontSize: 13, color: "#22c55e", marginTop: 4 }}>¡Ya llegaste a ese peso!</div>
                      </>
                    ) : prediction?.slope <= 0 ? (
                      <div style={{ fontSize: 12, color: "#f59e0b" }}>
                        Tu progresión actual no alcanza ese objetivo.<br />
                        <span style={{ fontSize: 10, color: "#475569" }}>Aumenta la frecuencia o la carga.</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Estimado en</div>
                        <div style={{ fontSize: 24, color: accent, fontWeight: 500 }}>{forecast.days} días</div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{forecast.date}</div>
                        {prediction && prediction.r2 < 0.5 && (
                          <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 6 }}>
                            ⚠️ Progresión irregular — estimación aproximada
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!targetWeight && (
                  <div style={{ fontSize: 11, color: "#334155", textAlign: "center" }}>
                    Ingresa un peso objetivo para ver la estimación.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
