import { useState, useMemo } from "react";
import { calc1RM, bestSet, sessionVolume } from "../utils/fitness";
import { getProgressionHistory, predictRM, daysToTarget } from "../utils/predictor";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { tokens } from "../design";
import MuscleMap from "../components/MuscleMap";

export default function ProgressView({ logs, routine, onBack }) {
  const routineDays = Object.keys(routine || {});
  const [section, setSection] = useState("ejercicios"); // ejercicios | cuerpo | musculos

  if (!routineDays.length) return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "24px 20px", fontFamily: "inherit" }}>
      <button onClick={onBack} className="nbtn" style={{ color: "var(--text)", fontSize: 20 }}>←</button>
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600 }}>Sin rutina configurada</div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1.5px solid var(--text)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3, fontWeight: 700 }}>ANÁLISIS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -0.8 }}>Progreso</div>
          </div>
        </div>

        {/* Tabs principales */}
        <div style={{ display: "flex" }}>
          {[
            { key: "ejercicios", label: "EJERCICIOS" },
            { key: "cuerpo",     label: "VOLUMEN" },
            { key: "musculos",   label: "MÚSCULOS" },
          ].map(t => (
            <button key={t.key} onClick={() => setSection(t.key)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${section === t.key ? "var(--text)" : "transparent"}`,
              color: section === t.key ? "var(--text)" : "var(--text3)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 8, letterSpacing: 2, fontWeight: 700,
              fontFamily: "inherit", transition: "all 0.15s", marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 100px" }}>
        {section === "ejercicios" && <EjerciciosSection logs={logs} routine={routine} routineDays={routineDays} />}
        {section === "cuerpo"     && <VolumenSection logs={logs} />}
        {section === "musculos"   && (
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 14 }}>GRUPOS MUSCULARES TRABAJADOS</div>
            <MuscleMap logs={logs} routine={routine} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sección ejercicios: PR por ejercicio + predictor integrado ─────────────
function EjerciciosSection({ logs, routine, routineDays }) {
  const [selectedDay, setSelectedDay] = useState(routineDays[0] || "");
  const [selectedEx, setSelectedEx]   = useState(
    routine?.[routineDays[0]]?.exercises?.[0]?.name || ""
  );
  const [targetWeight, setTargetWeight] = useState("");

  function handleDayChange(day) {
    setSelectedDay(day);
    setSelectedEx(routine?.[day]?.exercises?.[0]?.name || "");
  }

  const exercises = routine?.[selectedDay]?.exercises || [];
  const history   = getProgressionHistory(logs, routine, selectedDay, selectedEx);
  const prediction = history.length >= 2 ? predictRM(history, 90) : null;

  const chartData = [
    ...history.map(h => ({ date: h.date.slice(5), rm: h.rm })),
    ...(prediction?.predictions?.slice(0, 4) || []).map(p => ({ date: p.date.slice(5), pred: p.rm })),
  ];

  const maxRM = history.length ? Math.max(...history.map(h => h.rm)) : 0;
  const lastRM = history.length ? history[history.length - 1].rm : 0;
  const firstRM = history.length ? history[0].rm : 0;
  const gain = maxRM - firstRM;

  const target = parseFloat(targetWeight);
  const forecast = target > 0 && history.length >= 2 ? daysToTarget(history, target) : null;

  // PRs de todos los ejercicios del día seleccionado
  const dayPRs = useMemo(() => {
    return exercises.map(ex => {
      const hist = getProgressionHistory(logs, routine, selectedDay, ex.name);
      const best = hist.length ? Math.max(...hist.map(h => h.rm)) : 0;
      const last = hist.length ? hist[hist.length - 1].rm : 0;
      const trend = hist.length >= 2 ? hist[hist.length - 1].rm - hist[hist.length - 2].rm : 0;
      return { name: ex.name, best, last, trend, sessions: hist.length };
    });
  }, [exercises, logs, routine, selectedDay]);

  return (
    <div>
      {/* Selector de día */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {routineDays.map(d => {
          const active = selectedDay === d;
          return (
            <button key={d} onClick={() => handleDayChange(d)} style={{
              background: active ? "var(--text)" : "transparent",
              border: `1px solid ${active ? "var(--text)" : "var(--border)"}`,
              color: active ? "var(--bg)" : "var(--text3)",
              padding: "6px 14px", borderRadius: 99, cursor: "pointer",
              fontSize: 10, letterSpacing: 1.5, fontWeight: 700,
              fontFamily: "inherit", transition: "all 0.15s",
            }}>{d}</button>
          );
        })}
      </div>

      {/* Grid PRs de todos los ejercicios del día */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 12 }}>
          RÉCORDS — {selectedDay}
        </div>
        <div style={{ borderTop: "1.5px solid var(--text)" }}>
          {dayPRs.map((ex, i) => (
            <button
              key={ex.name}
              onClick={() => setSelectedEx(ex.name)}
              style={{
                width: "100%", background: selectedEx === ex.name ? "var(--text)" : "transparent",
                border: "none", borderBottom: "1px solid var(--border)",
                padding: "12px 0", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: selectedEx === ex.name ? "var(--bg)" : (ex.trend > 0 ? "var(--green)" : ex.trend < 0 ? "var(--red)" : "var(--text3)"),
                  flexShrink: 0,
                }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selectedEx === ex.name ? "var(--bg)" : "var(--text)", letterSpacing: -0.2 }}>
                    {ex.name}
                  </div>
                  <div style={{ fontSize: 9, color: selectedEx === ex.name ? "rgba(245,245,240,0.5)" : "var(--text3)", marginTop: 1 }}>
                    {ex.sessions} sesiones
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 900, color: selectedEx === ex.name ? "var(--bg)" : "var(--text)", letterSpacing: -0.5 }}>
                  {ex.best > 0 ? `${ex.best}` : "—"}
                </div>
                <div style={{ fontSize: 8, color: selectedEx === ex.name ? "rgba(245,245,240,0.4)" : "var(--text3)", letterSpacing: 1, fontWeight: 700 }}>
                  {ex.best > 0 ? "KG 1RM" : "SIN DATOS"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico del ejercicio seleccionado */}
      {selectedEx && history.length > 0 && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
          {/* Stats del ejercicio */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -1 }}>{maxRM}</div>
              <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2, fontWeight: 700, marginTop: 2 }}>MEJOR</div>
            </div>
            <div style={{ width: 1, background: "var(--border)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -1 }}>{lastRM}</div>
              <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2, fontWeight: 700, marginTop: 2 }}>ÚLTIMO</div>
            </div>
            <div style={{ width: 1, background: "var(--border)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div className="mono" style={{
                fontSize: 22, fontWeight: 900, letterSpacing: -1,
                color: gain > 0 ? "var(--green)" : gain < 0 ? "var(--red)" : "var(--text3)",
              }}>{gain > 0 ? `+${gain}` : gain}</div>
              <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2, fontWeight: 700, marginTop: 2 }}>GANANCIA</div>
            </div>
          </div>

          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 10 }}>
            EVOLUCIÓN 1RM — {selectedEx}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <defs>
                <linearGradient id="rmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--text)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--text)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--text3)", fontSize: 8, fontFamily: "inherit" }} />
              <YAxis tick={{ fill: "var(--text3)", fontSize: 8, fontFamily: "inherit" }} />
              <Tooltip
                contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11, fontFamily: "inherit", color: "var(--text)" }}
                labelStyle={{ fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="rm" stroke="var(--text)" strokeWidth={2} fill="url(#rmGrad)" dot={{ fill: "var(--text)", r: 3, strokeWidth: 0 }} name="1RM real" />
              <Line type="monotone" dataKey="pred" stroke="var(--text3)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Predicción" />
            </AreaChart>
          </ResponsiveContainer>

          {prediction && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {[
                { label: "+30d", val: prediction.predictions?.find(p => p.label === "+30d")?.rm },
                { label: "+60d", val: prediction.predictions?.find(p => p.label === "+56d")?.rm || prediction.predictions?.[7]?.rm },
                { label: "+90d", val: prediction.predictions?.find(p => p.label === "+90d")?.rm },
              ].filter(p => p.val).map(p => (
                <div key={p.label} style={{
                  flex: 1, background: "var(--bg3)", borderRadius: 10, padding: "10px 8px", textAlign: "center"
                }}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{p.val}</div>
                  <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 1.5, fontWeight: 700, marginTop: 2 }}>{p.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedEx && history.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>Sin datos para {selectedEx}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Registra al menos una sesión</div>
        </div>
      )}

      {/* Calculadora objetivo */}
      {history.length >= 2 && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 12 }}>
            ¿CUÁNDO LLEGO A...?
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <input
              type="number"
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
              placeholder="Objetivo en kg"
              style={{
                flex: 1, background: "var(--bg3)", border: "1px solid var(--border)",
                color: "var(--text)", padding: "11px 14px", borderRadius: tokens.radius.md,
                fontSize: 14, fontFamily: "inherit", outline: "none",
              }}
            />
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>kg</div>
          </div>
          {targetWeight && forecast !== null && (
            <div style={{
              background: "var(--text)", borderRadius: 12, padding: "16px",
              textAlign: "center", animation: "scaleIn 0.2s ease",
            }}>
              {forecast === 0
                ? <div style={{ fontSize: 14, fontWeight: 900, color: "var(--bg)" }}>🏆 ¡Ya lo lograste!</div>
                : prediction?.slope <= 0
                  ? <div style={{ fontSize: 12, color: "rgba(245,245,240,0.7)" }}>Progresión insuficiente — aumenta carga o frecuencia</div>
                  : <>
                      <div style={{ fontSize: 9, color: "rgba(245,245,240,0.5)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 4 }}>ESTIMADO EN</div>
                      <div className="mono" style={{ fontSize: 40, fontWeight: 900, color: "var(--bg)", letterSpacing: -2 }}>{forecast.days}</div>
                      <div style={{ fontSize: 11, color: "rgba(245,245,240,0.6)", marginTop: 2 }}>días · {forecast.date}</div>
                    </>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sección volumen: tonelaje semanal ─────────────────────────────────────
function VolumenSection({ logs }) {
  const weeklyData = useMemo(() => {
    const weeks = {};
    Object.values(logs).forEach(s => {
      if (!s.date) return;
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = mon.toISOString().split("T")[0];
      if (!weeks[key]) weeks[key] = { week: key.slice(5), volume: 0, sessions: 0 };
      weeks[key].volume   += sessionVolume(s.sets || {});
      weeks[key].sessions += 1;
    });
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)).slice(-12);
  }, [logs]);

  const totalSessions = Object.keys(logs).length;
  const totalVolume   = Object.values(logs).reduce((a, s) => a + sessionVolume(s.sets || {}), 0);
  const avgVolume     = weeklyData.length ? Math.round(weeklyData.reduce((a, w) => a + w.volume, 0) / weeklyData.length) : 0;
  const bestWeek      = weeklyData.length ? weeklyData.reduce((a, b) => b.volume > a.volume ? b : a, weeklyData[0]) : null;

  return (
    <div>
      {/* Stats globales */}
      <div style={{ borderTop: "1.5px solid var(--text)", borderBottom: "1.5px solid var(--text)", display: "flex", marginBottom: 20 }}>
        <div style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRight: "1px solid var(--border)" }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -1 }}>
            {(totalVolume / 1000).toFixed(1)}t
          </div>
          <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginTop: 3 }}>TOTAL</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRight: "1px solid var(--border)" }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -1 }}>
            {(avgVolume / 1000).toFixed(1)}t
          </div>
          <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginTop: 3 }}>SEMANAL</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: "14px 0" }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -1 }}>
            {totalSessions}
          </div>
          <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginTop: 3 }}>SESIONES</div>
        </div>
      </div>

      {weeklyData.length > 0 ? (
        <>
          {/* Gráfico tonelaje semanal */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 14 }}>
              TONELAJE — ÚLTIMAS 12 SEMANAS
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--text)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--text)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fill: "var(--text3)", fontSize: 8, fontFamily: "inherit" }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}t`} tick={{ fill: "var(--text3)", fontSize: 8, fontFamily: "inherit" }} />
                <Tooltip
                  formatter={(v) => [`${(v/1000).toFixed(2)}t`, "Tonelaje"]}
                  contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11, fontFamily: "inherit", color: "var(--text)" }}
                />
                <Area type="monotone" dataKey="volume" stroke="var(--text)" strokeWidth={2} fill="url(#volGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Mejor semana */}
          {bestWeek && (
            <div style={{ background: "var(--text)", borderRadius: 16, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(245,245,240,0.5)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 4 }}>MEJOR SEMANA</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 900, color: "var(--bg)", letterSpacing: -1 }}>
                  {(bestWeek.volume / 1000).toFixed(2)}t
                </div>
                <div style={{ fontSize: 10, color: "rgba(245,245,240,0.5)", marginTop: 2 }}>semana {bestWeek.week}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 32, fontWeight: 900, color: "var(--bg)", opacity: 0.4 }}>🏆</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)" }}>Sin sesiones registradas</div>
        </div>
      )}
    </div>
  );
}
