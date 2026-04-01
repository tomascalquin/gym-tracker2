import { useState, useEffect } from "react";
import { loadFriendWeeklyLogs, loadFriendRoutine, loadFriendAllLogs } from "../../utils/friends";
import { DAY_ORDER, DAY_META } from "../../data/routine";
import { calc1RM, bestSet, sessionVolume } from "../../utils/fitness";

export default function FriendProfile({ friend, myUid, onBack, onRemove }) {
  const [tab, setTab]             = useState("semana"); // semana | rutina | comparar
  const [weeklyLogs, setWeeklyLogs] = useState({});
  const [routine, setRoutine]     = useState({});
  const [allLogs, setAllLogs]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [weekly, r, all] = await Promise.all([
        loadFriendWeeklyLogs(friend.uid),
        loadFriendRoutine(friend.uid),
        loadFriendAllLogs(friend.uid),
      ]);
      setWeeklyLogs(weekly);
      setRoutine(r);
      setAllLogs(all);
      setLoading(false);
    }
    load();
  }, [friend.uid]);

  const initial = (friend.displayName || "?")[0].toUpperCase();
  const weekSessions = Object.values(weeklyLogs);
  const totalWeekVol = weekSessions.reduce((a, s) => a + sessionVolume(s.sets), 0);
  const daysThisWeek = [...new Set(weekSessions.map(s => s.day))];

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 13, letterSpacing: 1 }}>← AMIGOS</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!confirmRemove ? (
            <button onClick={() => setConfirmRemove(true)} className="nbtn" style={{
              border: "1px solid #3f1010", color: "#ef4444",
              padding: "5px 10px", borderRadius: 6, fontSize: 10,
            }}>ELIMINAR</button>
          ) : (
            <>
              <button onClick={onRemove} style={{
                background: "#7f1d1d", border: "1px solid #ef4444", color: "#ef4444",
                padding: "5px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer", fontFamily: "inherit",
              }}>¿SEGURO?</button>
              <button onClick={() => setConfirmRemove(false)} className="nbtn" style={{
                border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,240,240,0.30)",
                padding: "5px 10px", borderRadius: 6, fontSize: 10,
              }}>CANCELAR</button>
            </>
          )}
        </div>
      </div>

      {/* Avatar + nombre */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)", border: "2px solid #60a5fa44",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "#60a5fa", fontWeight: 500,
        }}>{initial}</div>
        <div>
          <div style={{ fontSize: 18, color: "var(--text)", fontWeight: 400 }}>{friend.displayName}</div>
          <div style={{ fontSize: 12, color: "rgba(240,240,240,0.30)" }}>{friend.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 20 }}>
        {[
          { key: "semana",   label: "SEMANA" },
          { key: "rutina",   label: "RUTINA" },
          { key: "comparar", label: "COMPARAR" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "#1a1a2e" : "transparent",
            border: `1px solid ${tab === t.key ? "#60a5fa44" : "#1a1a2a"}`,
            color: tab === t.key ? "#60a5fa" : "#475569",
            padding: "8px 4px", borderRadius: 8, cursor: "pointer",
            fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "rgba(240,240,240,0.30)", padding: "40px 0", fontSize: 13 }}>Cargando...</div>
      ) : (
        <>
          {/* ── SEMANA ── */}
          {tab === "semana" && (
            <div>
              {/* Resumen semanal */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                <StatCard label="SESIONES" value={weekSessions.length} accent="#60a5fa" />
                <StatCard label="VOLUMEN" value={`${totalWeekVol.toLocaleString()} kg`} accent="#34d399" />
              </div>

              {/* Días entrenados */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 16 }}>
                {Object.keys(routine).map(day => {
                  const c = DAY_META[day] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
                  const done = daysThisWeek.includes(day);
                  return (
                    <div key={day} className="card" style={{
                      padding: "10px 6px", textAlign: "center",
                      borderLeft: `2px solid ${done ? c.accent : "#1a1a2a"}`,
                      opacity: done ? 1 : 0.4,
                    }}>
                      <div style={{ fontSize: 16 }}>{done ? "✓" : "·"}</div>
                      <div style={{ fontSize: 9, color: done ? c.accent : "#334155", letterSpacing: 1, marginTop: 2 }}>{day}</div>
                    </div>
                  );
                })}
              </div>

              {/* Sesiones de la semana */}
              {weekSessions.length === 0 && (
                <div style={{ textAlign: "center", color: "rgba(240,240,240,0.30)", padding: "20px 0", fontSize: 13 }}>
                  {friend.displayName.split(" ")[0]} no ha entrenado esta semana todavía.
                </div>
              )}
              {weekSessions.sort((a, b) => b.date.localeCompare(a.date)).map((s, i) => {
                const c = DAY_META[s.day] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
                return (
                  <div key={i} className="card" style={{ borderLeft: `3px solid ${c.accent}`, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text)" }}>{s.day}</div>
                        <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)" }}>{s.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, color: c.accent }}>{sessionVolume(s.sets).toLocaleString()} kg</div>
                        <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)" }}>{Object.values(s.completed || {}).filter(Boolean).length} sets ✓</div>
                      </div>
                    </div>
                    {s.note && <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", marginTop: 6, fontStyle: "italic" }}>"{s.note}"</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── RUTINA ── */}
          {tab === "rutina" && (
            <div>
              {Object.keys(routine).map(day => {
                const c = DAY_META[day] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
                const exercises = routine[day]?.exercises || [];
                return (
                  <div key={day} className="card" style={{ marginBottom: 12, borderLeft: `3px solid ${c.accent}` }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a1a2a", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>{day}</span>
                      <span style={{ fontSize: 10, color: c.accent }}>{exercises.length} ejercicios</span>
                    </div>
                    <div style={{ padding: "10px 14px" }}>
                      {exercises.map((ex, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 3 }}>{ex.name}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {ex.sets.map((set, si) => (
                              <span key={si} style={{
                                fontSize: 10, background: "rgba(255,255,255,0.07)",
                                color: c.accent, padding: "2px 8px", borderRadius: 6,
                              }}>
                                {set.weight}kg × {set.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── COMPARAR ── */}
          {tab === "comparar" && (
            <CompareTab
              friend={friend}
              friendLogs={allLogs}
              friendRoutine={routine}
            />
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ padding: "14px", textAlign: "center", borderLeft: `2px solid ${accent}` }}>
      <div style={{ fontSize: 20, fontWeight: 400, color: accent }}>{value}</div>
      <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 1, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function CompareTab({ friend, friendLogs, friendRoutine }) {
  const routineDays = Object.keys(friendRoutine || {});
  const [selectedDay, setSelectedDay] = useState(routineDays[0] || "");
  const [selectedEx, setSelectedEx]   = useState(null);

  const exercises = friendRoutine[selectedDay]?.exercises || [];

  useEffect(() => {
    if (exercises.length) setSelectedEx(exercises[0].name);
  }, [selectedDay]);

  // Mejor 1RM de un ejercicio en todos los logs
  function getBest1RM(logs, day, exName) {
    const sessions = Object.values(logs).filter(s => s.day === day);
    let best = 0;
    sessions.forEach(s => {
      const exs = friendRoutine[day]?.exercises || [];
      const ei  = exs.findIndex(e => e.name === exName);
      if (ei === -1) return;
      const sets = s.sets[ei];
      if (!sets?.length) return;
      const b = bestSet(sets);
      const rm = calc1RM(b.weight, b.reps);
      if (rm > best) best = rm;
    });
    return best;
  }

  const friendBest = selectedEx ? getBest1RM(friendLogs, selectedDay, selectedEx) : 0;
  const accent = DAY_META[selectedDay]?.accent || "#60a5fa";

  return (
    <div>
      <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", marginBottom: 12 }}>
        Comparando el mejor 1RM estimado (Epley) por ejercicio.
      </div>

      {/* Selector día */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
        {Object.keys(friendRoutine).map(d => {
          const c = DAY_META[d] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
          const active = selectedDay === d;
          return (
            <button key={d} onClick={() => setSelectedDay(d)} style={{
              background: active ? c.dim : "#0e0e1a",
              border: `1px solid ${active ? c.accent : "#1a1a2a"}`,
              color: active ? c.accent : "#334155",
              padding: "7px 4px", borderRadius: 7, cursor: "pointer",
              fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
            }}>{d}</button>
          );
        })}
      </div>

      {/* Selector ejercicio */}
      <select value={selectedEx || ""} onChange={e => setSelectedEx(e.target.value)} style={{
        width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(240,240,240,0.55)", padding: "9px 12px", borderRadius: 8,
        fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16,
      }}>
        {exercises.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
      </select>

      {selectedEx && (
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: 12, color: accent, letterSpacing: 1, marginBottom: 16 }}>{selectedEx}</div>

          {/* Barra de comparación */}
          <CompareBar
            label={friend.displayName.split(" ")[0]}
            value={friendBest}
            max={friendBest}
            accent={accent}
          />

          {friendBest === 0 && (
            <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", textAlign: "center", marginTop: 8 }}>
              {friend.displayName.split(" ")[0]} aún no tiene registros de este ejercicio.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareBar({ label, value, max, accent }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#e2e8f0" }}>{label}</span>
        <span style={{ fontSize: 13, color: accent, fontWeight: 500 }}>{value > 0 ? `${value} kg` : "—"}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 8 }}>
        <div style={{ height: 8, borderRadius: 4, background: accent, width: `${pct}%`, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}
