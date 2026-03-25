import { useState } from "react";
import { buildWeeklySummaryData, buildWeeklySummaryPrompt, calcFatigue, detectStagnation, MUSCLE_RANGES, calcWeeklyVolumeByMuscle } from "../utils/intelligence";
import { callClaude } from "../utils/callClaude";
import { tokens } from "../design";

const FATIGUE_CONFIG = {
  low:      { label: "BAJA",     color: "#22c55e", bg: "#14532d22", border: "#22c55e33" },
  moderate: { label: "MODERADA", color: "#f59e0b", bg: "#78350f22", border: "#f59e0b33" },
  high:     { label: "ALTA",     color: "#ef4444", bg: "#7f1d1d22", border: "#ef444433" },
  spike:    { label: "SPIKE ⚠️", color: "#ff4444", bg: "#7f1d1d44", border: "#ef444488" },
};

export default function WeeklySummaryView({ logs, routine, onBack }) {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState("summary");

  const data       = buildWeeklySummaryData(logs, routine);
  const fatigue    = calcFatigue(logs);
  const stagnation = detectStagnation(logs, routine);
  const muscleSets = calcWeeklyVolumeByMuscle(logs, routine);
  const fc         = FATIGUE_CONFIG[fatigue.fatigueLevel];

  async function generateSummary() {
    setLoading(true);
    setSummary(null);
    setError(null);
    try {
      const prompt = buildWeeklySummaryPrompt(data);
      const text   = await callClaude(prompt, { maxTokens: 600 });
      setSummary(text.trim());
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease" }}>
      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>INTELIGENCIA</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "var(--text)" }}>Semana actual</h2>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
          {[
            { key: "summary",   label: "🤖 RESUMEN IA" },
            { key: "fatigue",   label: "⚡ FATIGA" },
            { key: "stagnation",label: "📊 PLATEAU" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.key ? "#a78bfa" : "transparent"}`,
              color: tab === t.key ? "#a78bfa" : "var(--text3)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 8, letterSpacing: 2, fontFamily: "inherit",
              transition: "all 0.15s", marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 18px 100px" }}>

        {/* ── TAB: RESUMEN IA ─────────────────────────────────────────────── */}
        {tab === "summary" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {/* Stats rápidas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { label: "SESIONES", value: data.sessionCount, sub: `vs ${data.prevSessionCount}` },
                { label: "TONELAJE", value: `${(data.totalVolume/1000).toFixed(1)}t`, sub: data.volumeChangePct !== null ? `${data.volumeChangePct > 0 ? "+" : ""}${data.volumeChangePct}%` : "—" },
                { label: "PRs", value: data.prs.length, sub: "esta semana" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: tokens.radius.md, padding: "12px 10px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 300, color: "var(--text)" }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* PRs de la semana */}
            {data.prs.length > 0 && (
              <div style={{
                background: "#14532d22", border: "1px solid #22c55e33",
                borderRadius: tokens.radius.md, padding: "12px 14px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 9, color: "#22c55e", letterSpacing: 2, marginBottom: 8 }}>🏆 PRs ESTA SEMANA</div>
                {data.prs.map((pr, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{pr.name}</span>
                    <span style={{ fontSize: 12, color: "#22c55e" }}>
                      {pr.rm}kg <span style={{ fontSize: 10, color: "var(--text3)" }}>(antes {pr.prev}kg)</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Alerta estancamiento si existe */}
            {stagnation.length > 0 && (
              <div style={{
                background: "#78350f22", border: "1px solid #f59e0b44",
                borderRadius: tokens.radius.md, padding: "10px 14px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 2, marginBottom: 4 }}>
                  ⚠️ {stagnation.length} PLATEAU{stagnation.length > 1 ? "S" : ""} DETECTADO{stagnation.length > 1 ? "S" : ""}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {stagnation.map(s => s.exName).join(", ")} — ve a la pestaña Plateau
                </div>
              </div>
            )}

            {/* Alerta fatiga */}
            {(fatigue.fatigueLevel === "high" || fatigue.fatigueLevel === "spike") && (
              <div style={{
                background: fc.bg, border: `1px solid ${fc.border}`,
                borderRadius: tokens.radius.md, padding: "10px 14px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 9, color: fc.color, letterSpacing: 2, marginBottom: 4 }}>
                  ⚡ FATIGA {fc.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{fatigue.alert}</div>
              </div>
            )}

            {/* Resumen IA */}
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: tokens.radius.lg, padding: "16px",
              marginBottom: 14,
            }}>
              {loading && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: 2, animation: "blink 1.2s infinite" }}>
                    ANALIZANDO...
                  </div>
                </div>
              )}
              {!loading && error && (
                <div>
                  <div style={{ fontSize: 9, color: "#ef4444", letterSpacing: 2, marginBottom: 8 }}>⚠️ ERROR</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12, lineHeight: 1.6 }}>{error}</div>
                  <button onClick={generateSummary} style={{
                    width: "100%", background: "transparent",
                    border: "1px dashed var(--border)", color: "var(--text3)",
                    padding: "8px", borderRadius: 8,
                    fontSize: 10, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer",
                  }}>↺ REINTENTAR</button>
                </div>
              )}
              {!loading && !error && summary && (
                <div>
                  <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: 2, marginBottom: 10 }}>🤖 ANÁLISIS IA</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{summary}</div>
                </div>
              )}
              {!loading && !error && !summary && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12, lineHeight: 1.6 }}>
                    Genera un resumen personalizado de tu semana con recomendaciones basadas en evidencia.
                  </div>
                  <button onClick={generateSummary} style={{
                    background: "#a78bfa22", border: "1px solid #a78bfa44",
                    color: "#a78bfa", padding: "10px 24px", borderRadius: tokens.radius.md,
                    fontSize: 11, letterSpacing: 2, fontFamily: "inherit", cursor: "pointer",
                  }}>🤖 GENERAR RESUMEN</button>
                </div>
              )}
            </div>

            {summary && !error && (
              <button onClick={generateSummary} disabled={loading} style={{
                width: "100%", background: "transparent",
                border: "1px dashed var(--border)", color: "var(--text3)",
                padding: "10px", borderRadius: tokens.radius.md,
                fontSize: 10, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer",
              }}>↺ REGENERAR</button>
            )}
          </div>
        )}

        {/* ── TAB: FATIGA ─────────────────────────────────────────────────── */}
        {tab === "fatigue" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {/* Nivel */}
            <div style={{
              background: fc.bg, border: `1px solid ${fc.border}`,
              borderRadius: tokens.radius.lg, padding: "20px 18px", marginBottom: 16,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: fc.color, letterSpacing: 3, marginBottom: 8 }}>FATIGA SEMANAL</div>
              <div style={{ fontSize: 36, fontWeight: 300, color: fc.color, marginBottom: 4 }}>{fc.label}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                {fatigue.sessionCount} sesiones · {fatigue.weekSets} series esta semana
              </div>
            </div>

            {/* Comparativa */}
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: tokens.radius.md, padding: "14px 16px", marginBottom: 14,
            }}>
              <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2, marginBottom: 12 }}>TONELAJE COMPARATIVO</div>
              {["Esta semana", "Semana pasada"].map((label, i) => {
                const vol = i === 0 ? fatigue.currentWeekVolume : fatigue.prevWeekVolume;
                const maxVol = Math.max(fatigue.currentWeekVolume, fatigue.prevWeekVolume) || 1;
                const pct = Math.round((vol / maxVol) * 100);
                const color = i === 0 ? "#a78bfa" : "var(--text3)";
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: i === 0 ? "var(--text)" : "var(--text3)" }}>{label}</span>
                      <span style={{ fontSize: 11, color }}>{(vol / 1000).toFixed(1)}t</span>
                    </div>
                    <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
              {fatigue.prevWeekVolume > 0 && (
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 8, textAlign: "right" }}>
                  {fatigue.weeklyChangePct > 0 ? "+" : ""}{fatigue.weeklyChangePct}% vs semana pasada
                </div>
              )}
            </div>

            {/* Alerta si existe */}
            {fatigue.alert && (
              <div style={{
                background: fc.bg, border: `1px solid ${fc.border}`,
                borderRadius: tokens.radius.md, padding: "12px 14px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.7 }}>{fatigue.alert}</div>
              </div>
            )}

            {/* Volumen por músculo */}
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: tokens.radius.md, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2, marginBottom: 12 }}>SERIES/SEMANA POR MÚSCULO</div>
              <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 10, lineHeight: 1.6 }}>
                MEV = mínimo efectivo · MAV = máximo adaptativo · MRV = máximo recuperable
              </div>
              {Object.entries(MUSCLE_RANGES).map(([muscle, range]) => {
                const sets = muscleSets[muscle] || 0;
                const pct  = Math.min(100, Math.round((sets / range.mrv) * 100));
                let color = "#22c55e";
                if (sets < range.mev) color = "#94a3b8";
                else if (sets > range.mrv) color = "#ef4444";
                else if (sets > range.mav) color = "#f59e0b";
                return (
                  <div key={muscle} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "var(--text)" }}>{range.label}</span>
                      <span style={{ fontSize: 10, color }}>
                        {sets} <span style={{ color: "var(--text3)" }}>/ MEV {range.mev} · MAV {range.mav} · MRV {range.mrv}</span>
                      </span>
                    </div>
                    <div style={{ height: 3, background: "var(--border)", borderRadius: 2, position: "relative", overflow: "visible" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease", maxWidth: "100%" }} />
                      {/* Marcador MAV */}
                      <div style={{
                        position: "absolute", top: -2, left: `${Math.round((range.mav / range.mrv) * 100)}%`,
                        width: 1, height: 7, background: "#f59e0b88",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: PLATEAU ────────────────────────────────────────────────── */}
        {tab === "stagnation" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            {stagnation.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: tokens.radius.lg,
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 6 }}>Sin plateaus detectados</div>
                <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>
                  Tu 1RM estimado está progresando en todos los ejercicios analizados.
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  background: "#78350f22", border: "1px solid #f59e0b44",
                  borderRadius: tokens.radius.md, padding: "10px 14px", marginBottom: 16,
                  fontSize: 11, color: "#f59e0b", lineHeight: 1.6,
                }}>
                  📖 Beardsley: un plateau real ocurre cuando el 1RM estimado no sube &gt;2% en 3+ sesiones consecutivas del mismo día.
                </div>
                {stagnation.map((s, i) => (
                  <div key={i} style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: tokens.radius.lg, padding: "14px 16px", marginBottom: 12,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{s.exName}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>{s.day}</div>
                      </div>
                      <div style={{
                        background: "#78350f44", border: "1px solid #f59e0b44",
                        borderRadius: 99, padding: "3px 10px",
                        fontSize: 9, color: "#f59e0b", letterSpacing: 1,
                      }}>
                        {s.stagnantFor} sesiones
                      </div>
                    </div>

                    {/* Mini gráfico de 1RM */}
                    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 32, marginBottom: 10 }}>
                      {s.rmHistory.map((h, j) => {
                        const maxRM = Math.max(...s.rmHistory.map(x => x.rm));
                        const minRM = Math.min(...s.rmHistory.map(x => x.rm));
                        const range = maxRM - minRM || 1;
                        const heightPct = 30 + Math.round(((h.rm - minRM) / range) * 70);
                        return (
                          <div key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <div style={{
                              width: "100%", height: `${heightPct}%`,
                              background: j === s.rmHistory.length - 1 ? "#f59e0b" : "#334155",
                              borderRadius: 3, minHeight: 4,
                            }} />
                            <span style={{ fontSize: 8, color: "var(--text3)" }}>{h.rm}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sugerencia */}
                    <div style={{
                      background: "var(--bg3)", borderRadius: tokens.radius.md,
                      padding: "10px 12px", fontSize: 11, color: "var(--text2)", lineHeight: 1.6,
                    }}>
                      💡 {s.suggestion}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
