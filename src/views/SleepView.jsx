import { useState, useEffect, useRef } from "react";
import { saveSleepLog, loadSleepLogs, deleteSleepLog, sleepStats, QUALITY_LABELS } from "../utils/sleep";
import { todayStr } from "../utils/storage";
import { haptics } from "../utils/haptics";

// ─── Slider custom glassmorphism ──────────────────────────────────────────────
function GlassSlider({ min, max, step, value, onChange, color = "#a78bfa" }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);

  function calcValue(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, parseFloat(stepped.toFixed(4))));
  }

  function onPointerDown(e) {
    e.preventDefault();
    isDragging.current = true;
    trackRef.current.setPointerCapture(e.pointerId);
    onChange(calcValue(e.clientX));
  }
  function onPointerMove(e) {
    if (!isDragging.current) return;
    onChange(calcValue(e.clientX));
  }
  function onPointerUp() { isDragging.current = false; }

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative", height: 36, display: "flex",
        alignItems: "center", cursor: "pointer", userSelect: "none",
        WebkitUserSelect: "none", touchAction: "none",
      }}
    >
      <div style={{
        position: "absolute", left: 0, right: 0, height: 6,
        background: "rgba(255,255,255,0.08)", borderRadius: 99,
        overflow: "visible",
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

// ─── Toast de guardado ────────────────────────────────────────────────────────
function SaveToast({ visible, isUpdate }) {
  return (
    <div style={{
      position: "fixed", bottom: 100, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      zIndex: 9999, pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(74,222,128,0.15)",
        backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(74,222,128,0.35)",
        borderRadius: 99, padding: "10px 22px",
        display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 8px 32px rgba(74,222,128,0.20)",
        whiteSpace: "nowrap",
      }}>
        <span style={{ fontSize: 16 }}>😴</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", letterSpacing: 0.5 }}>
          {isUpdate ? "Sueño actualizado" : "Sueño guardado para hoy"}
        </span>
        <span style={{ fontSize: 14 }}>✓</span>
      </div>
    </div>
  );
}

export default function SleepView({ user, onBack }) {
  const [logs, setLogs]           = useState({});
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("log");
  const [saving, setSaving]       = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [wasUpdate, setWasUpdate] = useState(false);

  const [date, setDate]       = useState(() => todayStr());
  const [hours, setHours]     = useState(7.5);
  const [quality, setQuality] = useState(4);
  const [note, setNote]       = useState("");

  useEffect(() => {
    loadSleepLogs(user.uid)
      .then(data => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.uid]);

  useEffect(() => {
    const existing = logs[date];
    if (existing) {
      setHours(existing.hours || 7.5);
      setQuality(existing.quality || 4);
      setNote(existing.note || "");
    } else {
      setHours(7.5);
      setQuality(4);
      setNote("");
    }
  }, [date, logs]);

  async function handleSave() {
    if (hours < 1 || hours > 24) return;
    const isUpdate = !!logs[date];
    setSaving(true);
    haptics.light();
    try {
      const entry = await saveSleepLog(user.uid, { date, hours, quality, note });
      setLogs(prev => ({ ...prev, [date]: entry }));
      setWasUpdate(isUpdate);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      haptics.success?.();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete(d) {
    await deleteSleepLog(user.uid, d);
    setLogs(prev => { const n = { ...prev }; delete n[d]; return n; });
  }

  const stats       = sleepStats(logs);
  const sorted      = Object.values(logs).sort((a, b) => b.date.localeCompare(a.date));
  const todayLogged = !!logs[todayStr()];
  const hoursColor  = hours >= 7.5 ? "#4ade80" : hours >= 6 ? "#fbbf24" : "#f87171";
  const hoursMsg    = hours >= 8 ? "Sueño óptimo 💪" : hours >= 7 ? "Buen descanso" : hours >= 6 ? "Algo corto, no ideal" : "Muy poco — afecta la recuperación";

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>
      <SaveToast visible={showToast} isUpdate={wasUpdate} />

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
              marginLeft: "auto", fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
              color: "#4ade80", background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.25)", padding: "4px 10px", borderRadius: 99,
            }}>✓ HOY</div>
          )}
        </div>
        <div style={{ display: "flex" }}>
          {[["log","Registrar"],["history","Historial"],["stats","Stats"]].map(([k,l]) => (
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

        {tab === "log" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={S.label}>FECHA</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} />
            </div>

            {/* Horas */}
            <div style={{
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 18, padding: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <div style={S.label}>HORAS DORMIDAS</div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 900, color: hoursColor, letterSpacing: -1, transition: "color 0.2s" }}>{hours}h</div>
              </div>
              <GlassSlider min={1} max={12} step={0.5} value={hours} onChange={setHours} color={hoursColor} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>1h</span>
                <span style={{ fontSize: 9, color: "rgba(240,240,240,0.25)" }}>12h</span>
              </div>
              <div style={{
                marginTop: 12, padding: "8px 14px", borderRadius: 12,
                background: `${hoursColor}14`, border: `1px solid ${hoursColor}33`,
                fontSize: 11, color: hoursColor, textAlign: "center", transition: "all 0.2s",
              }}>{hoursMsg}</div>
            </div>

            <div>
              <div style={S.label}>CALIDAD DEL SUEÑO</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[1,2,3,4,5].map(q => {
                  const ql = QUALITY_LABELS[q];
                  const sel = quality === q;
                  return (
                    <button key={q} onClick={() => setQuality(q)} style={{
                      flex: 1, padding: "10px 4px", borderRadius: 14, minHeight: 0,
                      background: sel ? `${ql.color}22` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${sel ? ql.color + "66" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
                    }}>
                      <span style={{ fontSize: 20 }}>{ql.emoji}</span>
                      <span style={{ fontSize: 7, letterSpacing: 0.5, color: sel ? ql.color : "rgba(240,240,240,0.30)", fontWeight: 700 }}>{q}</span>
                    </button>
                  );
                })}
              </div>
              {quality > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: QUALITY_LABELS[quality].color, textAlign: "center" }}>
                  {QUALITY_LABELS[quality].emoji} {QUALITY_LABELS[quality].label}
                </div>
              )}
            </div>

            <div>
              <div style={S.label}>NOTA (opcional)</div>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="cafeína, estrés, calor..."
                rows={2} style={{ ...S.input, resize: "none", lineHeight: 1.5 }} />
            </div>

            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "15px",
              background: saving ? "rgba(255,255,255,0.07)" : "rgba(167,139,250,0.90)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: saving ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(167,139,250,0.95)",
              color: saving ? "rgba(240,240,240,0.30)" : "#fff",
              borderRadius: 18, cursor: saving ? "default" : "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              boxShadow: saving ? "none" : "0 4px 20px rgba(167,139,250,0.30)",
            }}>
              {saving ? "GUARDANDO..." : logs[date] ? "✓ ACTUALIZAR" : "✓ GUARDAR"}
            </button>
          </div>
        )}

        {tab === "history" && (
          loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 16 }} />)}
            </div>
          ) : sorted.length === 0 ? (
            <Empty icon="😴" msg="Aún no registraste ningún sueño" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sorted.map((entry, i) => {
                const ql = QUALITY_LABELS[entry.quality] || QUALITY_LABELS[3];
                return (
                  <div key={entry.date} style={{
                    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.10)",
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
                        <span style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 1 }}>{entry.date}</span>
                      </div>
                      {entry.note && (
                        <div style={{ fontSize: 11, color: "rgba(240,240,240,0.40)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.note}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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
          )
        )}

        {tab === "stats" && (
          !stats ? (
            <Empty icon="📊" msg="Registra al menos un sueño para ver estadísticas" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <StatCard label="PROMEDIO" value={`${stats.avgHours}h`} color="#a78bfa" />
                <StatCard label="CALIDAD"  value={`${stats.avgQuality}/5`} color={QUALITY_LABELS[Math.round(stats.avgQuality)]?.color || "#fff"} />
                <StatCard label="RACHA"    value={`${stats.streak}d`} color="#4ade80" />
              </div>
              <div style={{
                background: "rgba(255,255,255,0.06)", backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 18, padding: 16,
              }}>
                <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 14 }}>
                  ÚLTIMAS 2 SEMANAS
                </div>
                <SleepBarChart logs={logs} />
              </div>
              <div style={{
                background: stats.avgHours >= 7.5 ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.08)",
                border: `1px solid ${stats.avgHours >= 7.5 ? "rgba(74,222,128,0.20)" : "rgba(251,191,36,0.20)"}`,
                borderRadius: 16, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, marginBottom: 6,
                  color: stats.avgHours >= 7.5 ? "#4ade80" : "#fbbf24" }}>ANÁLISIS</div>
                <div style={{ fontSize: 13, color: "rgba(240,240,240,0.80)", lineHeight: 1.5 }}>
                  {stats.avgHours >= 8
                    ? "Tu sueño es excelente. La recuperación muscular ocurre principalmente en sueño profundo — seguís en el camino correcto."
                    : stats.avgHours >= 7
                      ? "Buen promedio. Intentá llegar a 8h para maximizar la producción de hormona de crecimiento."
                      : "Menos de 7h afecta la recuperación muscular y los niveles de testosterona. Priorizá el sueño."}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function SleepBarChart({ logs }) {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d      = new Date();
    d.setDate(d.getDate() - i);
    const offset = d.getTimezoneOffset();
    const local  = new Date(d.getTime() - offset * 60000);
    const key    = local.toISOString().split("T")[0];
    days.push({ key, label: d.toLocaleDateString("es", { weekday: "narrow" }), entry: logs[key], isToday: i === 0 });
  }
  const maxH = 12;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90 }}>
      {days.map(({ key, label, entry, isToday }) => {
        const h   = entry?.hours || 0;
        const pct = Math.min(h / maxH, 1);
        const ql  = entry ? (QUALITY_LABELS[entry.quality] || QUALITY_LABELS[3]) : null;
        const barColor = ql ? ql.color : "rgba(255,255,255,0.08)";
        return (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: 72, display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%",
                height: h > 0 ? `${Math.max(pct * 100, 6)}%` : "4%",
                background: h > 0 ? `linear-gradient(180deg, ${barColor}cc 0%, ${barColor}66 100%)` : "rgba(255,255,255,0.05)",
                borderRadius: "4px 4px 2px 2px",
                border: h > 0 ? `1px solid ${barColor}44` : "none",
                opacity: h === 0 ? 0.3 : 1,
                transition: "height 0.4s ease",
                boxShadow: h > 0 ? `0 0 8px ${barColor}33` : "none",
              }} />
            </div>
            <span style={{ fontSize: 8, color: isToday ? "#fff" : "rgba(240,240,240,0.25)", fontWeight: isToday ? 700 : 400 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)", backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16, padding: "12px 8px", textAlign: "center",
    }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 7, color: "rgba(240,240,240,0.30)", letterSpacing: 2, fontWeight: 700, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Empty({ icon, msg }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, color: "rgba(240,240,240,0.40)" }}>{msg}</div>
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
    borderRadius: 14, fontSize: 14, fontFamily: "inherit", outline: "none",
  },
};
