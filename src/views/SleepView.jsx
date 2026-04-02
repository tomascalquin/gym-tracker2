import { useState, useEffect, useRef } from "react";
import { saveSleepLog, loadSleepLogs, deleteSleepLog, sleepStats, QUALITY_LABELS } from "../utils/sleep";
import { todayStr } from "../utils/storage";
import { haptics } from "../utils/haptics";

export default function SleepView({ user, onBack }) {
  const [logs, setLogs]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("log"); // log | history | stats
  const [saving, setSaving]     = useState(false);

  // Form state
  const [date, setDate]         = useState(todayStr());
  const [hours, setHours]       = useState(7.5);
  const [quality, setQuality]   = useState(4);
  const [note, setNote]         = useState("");

  useEffect(() => {
    loadSleepLogs(user.uid).then(data => { setLogs(data); setLoading(false); });
  }, [user.uid]);

  // Si ya hay registro hoy, precargar
  useEffect(() => {
    const existing = logs[date];
    if (existing) {
      setHours(existing.hours);
      setQuality(existing.quality);
      setNote(existing.note || "");
    }
  }, [date, logs]);

  async function handleSave() {
    if (hours < 1 || hours > 24) return;
    setSaving(true);
    haptics.light();
    const entry = await saveSleepLog(user.uid, { date, hours, quality, note });
    setLogs(prev => ({ ...prev, [date]: entry }));
    setSaving(false);
    haptics.success?.();
  }

  async function handleDelete(d) {
    await deleteSleepLog(user.uid, d);
    setLogs(prev => { const n = { ...prev }; delete n[d]; return n; });
  }

  const stats  = sleepStats(logs);
  const sorted = Object.values(logs).sort((a, b) => b.date.localeCompare(a.date));
  const todayLogged = !!logs[todayStr()];

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ fontSize: 22, color: "rgba(240,240,240,0.50)", padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>WELLNESS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.8 }}>Sueño 😴</div>
          </div>
          {todayLogged && (
            <div style={{
              marginLeft: "auto",
              fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
              color: "#4ade80", background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.25)",
              padding: "4px 10px", borderRadius: 99,
            }}>✓ HOY</div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {[["log", "Registrar"], ["history", "Historial"], ["stats", "Stats"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === k ? "rgba(255,255,255,0.80)" : "transparent"}`,
              color: tab === k ? "#fff" : "rgba(240,240,240,0.35)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 9, letterSpacing: 2, fontWeight: 700,
              fontFamily: "inherit", marginBottom: -1,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 120px" }}>

        {/* ── TAB: REGISTRAR ── */}
        {tab === "log" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Fecha */}
            <div>
              <div style={labelStyle}>FECHA</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={inputStyle} />
            </div>

            {/* Horas */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={labelStyle}>HORAS DORMIDAS</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
                  {hours}h
                </div>
              </div>
              <input
                type="range" min={1} max={12} step={0.5} value={hours}
                onChange={e => setHours(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer", height: 4 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>1h</span>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>12h</span>
              </div>
              {/* Indicador visual */}
              <div style={{
                marginTop: 10, padding: "8px 14px", borderRadius: 12,
                background: hours >= 7.5 ? "rgba(74,222,128,0.10)" : hours >= 6 ? "rgba(251,191,36,0.10)" : "rgba(248,113,113,0.10)",
                border: `1px solid ${hours >= 7.5 ? "rgba(74,222,128,0.20)" : hours >= 6 ? "rgba(251,191,36,0.20)" : "rgba(248,113,113,0.20)"}`,
                fontSize: 11, color: hours >= 7.5 ? "#4ade80" : hours >= 6 ? "#fbbf24" : "#f87171",
              }}>
                {hours >= 8 ? "Sueño óptimo 💪" : hours >= 7 ? "Buen descanso" : hours >= 6 ? "Algo corto, no ideal" : "Muy poco — afecta la recuperación"}
              </div>
            </div>

            {/* Calidad */}
            <div>
              <div style={labelStyle}>CALIDAD DEL SUEÑO</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map(q => {
                  const ql = QUALITY_LABELS[q];
                  const sel = quality === q;
                  return (
                    <button key={q} onClick={() => setQuality(q)} style={{
                      flex: 1, padding: "10px 4px", borderRadius: 14,
                      background: sel ? `${ql.color}22` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${sel ? ql.color + "66" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      transition: "all 0.15s", minHeight: 0,
                      WebkitTapHighlightColor: "transparent",
                    }}>
                      <span style={{ fontSize: 20 }}>{ql.emoji}</span>
                      <span style={{ fontSize: 7, letterSpacing: 0.5, color: sel ? ql.color : "rgba(240,240,240,0.30)", fontWeight: 700 }}>
                        {q}
                      </span>
                    </button>
                  );
                })}
              </div>
              {quality && (
                <div style={{ marginTop: 8, fontSize: 11, color: QUALITY_LABELS[quality].color, textAlign: "center" }}>
                  {QUALITY_LABELS[quality].emoji} {QUALITY_LABELS[quality].label}
                </div>
              )}
            </div>

            {/* Nota */}
            <div>
              <div style={labelStyle}>NOTA (opcional)</div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="¿Algo que afectó tu sueño? cafeína, estrés, calor..."
                rows={2}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
              />
            </div>

            {/* Guardar */}
            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "15px",
              background: saving ? "rgba(255,255,255,0.07)" : "rgba(167,139,250,0.90)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: saving ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(167,139,250,0.95)",
              color: saving ? "rgba(240,240,240,0.30)" : "#fff",
              borderRadius: 18, cursor: saving ? "default" : "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              fontFamily: "inherit",
              boxShadow: saving ? "none" : "0 4px 20px rgba(167,139,250,0.30)",
            }}>
              {saving ? "GUARDANDO..." : logs[date] ? "✓ ACTUALIZAR" : "✓ GUARDAR"}
            </button>
          </div>
        )}

        {/* ── TAB: HISTORIAL ── */}
        {tab === "history" && (
          <div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 64, borderRadius: 16 }} />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <EmptyState icon="😴" msg="Aún no registraste ningún sueño" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sorted.map((entry, i) => {
                  const ql = QUALITY_LABELS[entry.quality];
                  return (
                    <div key={entry.date} style={{
                      background: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 16, padding: "12px 14px",
                      display: "flex", alignItems: "center", gap: 12,
                      animation: `slideDown 0.2s ease ${i * 0.03}s both`,
                    }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>{ql.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                          <span className="mono" style={{ fontSize: 20, fontWeight: 900, color: ql.color, letterSpacing: -0.5 }}>
                            {entry.hours}h
                          </span>
                          <span style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 1 }}>
                            {entry.date}
                          </span>
                        </div>
                        {entry.note && (
                          <div style={{ fontSize: 11, color: "rgba(240,240,240,0.40)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.note}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1,2,3,4,5].map(q => (
                            <div key={q} style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: q <= entry.quality ? ql.color : "rgba(255,255,255,0.10)",
                            }} />
                          ))}
                        </div>
                        <button onClick={() => handleDelete(entry.date)} style={{
                          background: "transparent", border: "none",
                          color: "rgba(248,113,113,0.40)", fontSize: 12,
                          cursor: "pointer", padding: "2px 4px", minHeight: 0,
                        }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: STATS ── */}
        {tab === "stats" && (
          <div>
            {!stats ? (
              <EmptyState icon="📊" msg="Registra al menos un sueño para ver estadísticas" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Cards principales */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <StatCard label="PROMEDIO" value={`${stats.avgHours}h`} color="#a78bfa" />
                  <StatCard label="CALIDAD" value={`${stats.avgQuality}/5`} color={QUALITY_LABELS[Math.round(stats.avgQuality)]?.color || "#fff"} />
                  <StatCard label="RACHA" value={`${stats.streak}d`} color="#4ade80" />
                </div>

                {/* Últimos 14 días — gráfico de barras */}
                <div style={{
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 18, padding: 16,
                }}>
                  <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 14 }}>
                    ÚLTIMAS 2 SEMANAS
                  </div>
                  <SleepBarChart logs={logs} />
                </div>

                {/* Insight */}
                <div style={{
                  background: stats.avgHours >= 7.5 ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.08)",
                  border: `1px solid ${stats.avgHours >= 7.5 ? "rgba(74,222,128,0.20)" : "rgba(251,191,36,0.20)"}`,
                  borderRadius: 16, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, color: stats.avgHours >= 7.5 ? "#4ade80" : "#fbbf24", marginBottom: 6 }}>
                    ANÁLISIS
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(240,240,240,0.80)", lineHeight: 1.5 }}>
                    {stats.avgHours >= 8
                      ? "Tu sueño es excelente. La recuperación muscular ocurre principalmente durante el sueño profundo — seguís en el camino correcto."
                      : stats.avgHours >= 7
                        ? "Buen promedio. Intentá llegar a 8h para maximizar la producción de hormona de crecimiento durante el sueño."
                        : "Estás durmiendo menos de lo ideal. Con menos de 7h, la recuperación muscular y los niveles de testosterona se ven afectados."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mini chart de barras ──────────────────────────────────────────────────────
function SleepBarChart({ logs }) {
  const days = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    const localKey = local.toISOString().split("T")[0];
    days.push({ key: localKey, label: d.toLocaleDateString("es", { weekday: "narrow" }), entry: logs[localKey] });
  }
  const maxH = 10;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {days.map(({ key, label, entry }) => {
        const h    = entry?.hours || 0;
        const pct  = Math.min(h / maxH, 1);
        const ql   = entry ? QUALITY_LABELS[entry.quality] : null;
        const isToday = key === new Date().toLocaleDateString("sv");
        return (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: 64, display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%",
                height: `${Math.max(pct * 100, h > 0 ? 4 : 0)}%`,
                background: ql ? ql.color : "rgba(255,255,255,0.10)",
                borderRadius: "4px 4px 2px 2px",
                opacity: h === 0 ? 0.3 : 1,
                minHeight: h > 0 ? 4 : 0,
                transition: "height 0.3s ease",
                boxShadow: ql && h > 0 ? `0 0 6px ${ql.color}44` : "none",
              }} />
            </div>
            <span style={{
              fontSize: 8, color: isToday ? "#fff" : "rgba(240,240,240,0.25)",
              fontWeight: isToday ? 700 : 400,
            }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16, padding: "12px 8px", textAlign: "center",
    }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 7, color: "rgba(240,240,240,0.30)", letterSpacing: 2, fontWeight: 700, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, color: "rgba(240,240,240,0.40)" }}>{msg}</div>
    </div>
  );
}

const labelStyle = {
  fontSize: 9, letterSpacing: 2.5, color: "rgba(240,240,240,0.30)",
  fontWeight: 700, marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f0f0f0", padding: "11px 14px",
  borderRadius: 14, fontSize: 14,
  fontFamily: "inherit", outline: "none",
};
