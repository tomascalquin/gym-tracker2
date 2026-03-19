import { useState, useEffect } from "react";
import {
  loadGroupMembers, loadMemberWeeklyLogs,
  loadMemberAllLogs, loadMemberRoutine,
} from "../../utils/groups";
import { calc1RM, bestSet, sessionVolume } from "../../utils/fitness";
import { DAY_META } from "../../data/routine";

const ACCENT = "#a78bfa";

export default function GroupDetail({ group, user, onBack, onLeave, onDelete }) {
  const [tab, setTab]             = useState("semana");
  const [members, setMembers]     = useState([]);
  const [allLogs, setAllLogs]     = useState({});     // { uid: logs }
  const [allRoutines, setAllRoutines] = useState({}); // { uid: routine }
  const [weeklyLogs, setWeeklyLogs]   = useState({}); // { uid: weeklyLogs }
  const [loading, setLoading]     = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // 1RM compare state
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedEx, setSelectedEx]   = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [availableExs, setAvailableExs]   = useState([]);

  const isOwner = group.createdBy === user.uid;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const memberProfiles = await loadGroupMembers(group.members);
      setMembers(memberProfiles);

      // Cargar logs y rutinas de todos los miembros en paralelo
      const [logsResults, routineResults, weeklyResults] = await Promise.all([
        Promise.all(group.members.map(uid =>
          loadMemberAllLogs(uid).then(logs => ({ uid, logs }))
        )),
        Promise.all(group.members.map(uid =>
          loadMemberRoutine(uid).then(routine => ({ uid, routine }))
        )),
        Promise.all(group.members.map(uid =>
          loadMemberWeeklyLogs(uid).then(logs => ({ uid, logs }))
        )),
      ]);

      const logsMap    = {};
      const routineMap = {};
      const weeklyMap  = {};

      logsResults.forEach(({ uid, logs })       => { logsMap[uid]    = logs; });
      routineResults.forEach(({ uid, routine }) => { routineMap[uid] = routine; });
      weeklyResults.forEach(({ uid, logs })     => { weeklyMap[uid]  = logs; });

      setAllLogs(logsMap);
      setAllRoutines(routineMap);
      setWeeklyLogs(weeklyMap);

      // Calcular días comunes entre miembros para el selector de 1RM
      const daysSets = group.members.map(uid =>
        Object.keys(routineMap[uid] || {})
      );
      // Unión de todos los días disponibles
      const allDays = [...new Set(daysSets.flat())];
      setAvailableDays(allDays);
      if (allDays.length) {
        setSelectedDay(allDays[0]);
        // Ejercicios del primer día del primer miembro que lo tenga
        const firstMemberWithDay = group.members.find(uid => routineMap[uid]?.[allDays[0]]);
        if (firstMemberWithDay) {
          const exs = routineMap[firstMemberWithDay][allDays[0]]?.exercises || [];
          setAvailableExs(exs.map(e => e.name));
          if (exs.length) setSelectedEx(exs[0].name);
        }
      }

      setLoading(false);
    }
    load();
  }, [group.id]);

  function handleDayChange(day) {
    setSelectedDay(day);
    // Actualizar ejercicios disponibles del día seleccionado
    const firstMemberWithDay = group.members.find(uid => allRoutines[uid]?.[day]);
    if (firstMemberWithDay) {
      const exs = allRoutines[firstMemberWithDay][day]?.exercises || [];
      const names = exs.map(e => e.name);
      setAvailableExs(names);
      setSelectedEx(names[0] || "");
    } else {
      setAvailableExs([]);
      setSelectedEx("");
    }
  }

  // Calcular mejor 1RM de un miembro para un ejercicio
  function getMemberBest1RM(uid, day, exName) {
    const logs    = allLogs[uid] || {};
    const routine = allRoutines[uid] || {};
    const sessions = Object.values(logs).filter(s => s.day === day);
    let best = 0;
    sessions.forEach(s => {
      const exs = routine[day]?.exercises || [];
      const ei  = exs.findIndex(e => e.name === exName);
      if (ei === -1) return;
      const sets = s.sets[ei];
      if (!sets?.length) return;
      const b  = bestSet(sets);
      const rm = calc1RM(b.weight, b.reps);
      if (rm > best) best = rm;
    });
    return best;
  }

  // Calcular frecuencia de entrenamientos (total sesiones)
  function getMemberFrequency(uid) {
    return Object.keys(allLogs[uid] || {}).length;
  }

  // Calcular sesiones esta semana
  function getMemberWeekSessions(uid) {
    return Object.keys(weeklyLogs[uid] || {}).length;
  }

  const maxRM = selectedEx
    ? Math.max(...group.members.map(uid => getMemberBest1RM(uid, selectedDay, selectedEx)), 0)
    : 0;

  const maxFreq = Math.max(...group.members.map(uid => getMemberFrequency(uid)), 1);

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 13 }}>← GRUPOS</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!confirmLeave ? (
            <button onClick={() => setConfirmLeave(true)} className="nbtn" style={{
              border: "1px solid #3f1010", color: "#ef4444",
              padding: "5px 10px", borderRadius: 6, fontSize: 10,
            }}>{isOwner ? "ELIMINAR" : "SALIR"}</button>
          ) : (
            <>
              <button onClick={isOwner ? onDelete : onLeave} style={{
                background: "#7f1d1d", border: "1px solid #ef4444", color: "#ef4444",
                padding: "5px 10px", borderRadius: 6, fontSize: 10,
                cursor: "pointer", fontFamily: "inherit",
              }}>¿SEGURO?</button>
              <button onClick={() => setConfirmLeave(false)} className="nbtn" style={{
                border: "1px solid #1a1a2a", color: "#475569",
                padding: "5px 10px", borderRadius: 6, fontSize: 10,
              }}>CANCELAR</button>
            </>
          )}
        </div>
      </div>

      {/* Nombre y código */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: "#f1f5f9" }}>{group.name}</h2>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
          Código: <span style={{ color: ACCENT, letterSpacing: 2 }}>{group.code}</span>
          {" · "}{group.members.length} miembros
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 20 }}>
        {[
          { key: "semana",    label: "SEMANA" },
          { key: "1rm",       label: "1RM" },
          { key: "frecuencia",label: "FRECUENCIA" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "#1e1b4b" : "transparent",
            border: `1px solid ${tab === t.key ? ACCENT + "44" : "#1a1a2a"}`,
            color: tab === t.key ? ACCENT : "#475569",
            padding: "8px 4px", borderRadius: 8, cursor: "pointer",
            fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
          Cargando datos del grupo...
        </div>
      ) : (
        <>
          {/* ── SEMANA ── */}
          {tab === "semana" && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", letterSpacing: 1, marginBottom: 14 }}>
                QUIÉN ENTRENÓ ESTA SEMANA
              </div>
              {members.map(m => {
                const sessions  = getMemberWeekSessions(m.uid);
                const weekLogs  = weeklyLogs[m.uid] || {};
                const days      = [...new Set(Object.values(weekLogs).map(s => s.day))];
                const vol       = Object.values(weekLogs).reduce((a, s) => a + sessionVolume(s.sets), 0);
                const isMe      = m.uid === user.uid;
                return (
                  <div key={m.uid} className="card" style={{
                    marginBottom: 10, padding: "14px 16px",
                    borderLeft: `3px solid ${sessions > 0 ? "#22c55e" : "#334155"}`,
                    opacity: sessions > 0 ? 1 : 0.6,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, color: "#f1f5f9" }}>
                          {m.displayName}{isMe ? " (tú)" : ""}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                          {sessions > 0
                            ? `${sessions} sesión${sessions > 1 ? "es" : ""} · ${vol.toLocaleString()} kg`
                            : "Sin entrenar esta semana"}
                        </div>
                        {days.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                            {days.map(d => (
                              <span key={d} style={{
                                fontSize: 9, background: "#1a1a2e",
                                color: DAY_META[d]?.accent || ACCENT,
                                padding: "2px 7px", borderRadius: 10,
                              }}>{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 22, color: sessions > 0 ? "#22c55e" : "#334155",
                      }}>
                        {sessions > 0 ? "✓" : "·"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 1RM ── */}
          {tab === "1rm" && (
            <div>
              {/* Selector día */}
              {availableDays.length > 0 ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(availableDays.length, 4)}, 1fr)`, gap: 6, marginBottom: 10 }}>
                    {availableDays.map(d => {
                      const c = DAY_META[d] || { accent: ACCENT, dim: "#1e1b4b" };
                      const active = selectedDay === d;
                      return (
                        <button key={d} onClick={() => handleDayChange(d)} style={{
                          background: active ? c.dim : "#0e0e1a",
                          border: `1px solid ${active ? c.accent : "#1a1a2a"}`,
                          color: active ? c.accent : "#334155",
                          padding: "7px 4px", borderRadius: 7, cursor: "pointer",
                          fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{d}</button>
                      );
                    })}
                  </div>

                  {/* Selector ejercicio */}
                  {availableExs.length > 0 ? (
                    <>
                      <select value={selectedEx} onChange={e => setSelectedEx(e.target.value)} style={{
                        width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
                        color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
                        fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16,
                      }}>
                        {availableExs.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                      </select>

                      {/* Ranking 1RM */}
                      <div className="card" style={{ padding: "16px" }}>
                        <div style={{ fontSize: 11, color: ACCENT, marginBottom: 14, letterSpacing: 1 }}>
                          MEJOR 1RM — {selectedEx}
                        </div>
                        {[...members]
                          .map(m => ({ ...m, rm: getMemberBest1RM(m.uid, selectedDay, selectedEx) }))
                          .sort((a, b) => b.rm - a.rm)
                          .map((m, i) => (
                            <RankBar
                              key={m.uid}
                              rank={i + 1}
                              name={m.displayName + (m.uid === user.uid ? " (tú)" : "")}
                              value={m.rm}
                              max={maxRM}
                              accent={ACCENT}
                              isMe={m.uid === user.uid}
                            />
                          ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                      Ningún miembro tiene ejercicios en este día.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: "30px 0" }}>
                  Los miembros aún no tienen rutina configurada.
                </div>
              )}
            </div>
          )}

          {/* ── FRECUENCIA ── */}
          {tab === "frecuencia" && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", letterSpacing: 1, marginBottom: 14 }}>
                RANKING TOTAL DE SESIONES
              </div>
              <div className="card" style={{ padding: "16px" }}>
                {[...members]
                  .map(m => ({ ...m, freq: getMemberFrequency(m.uid), week: getMemberWeekSessions(m.uid) }))
                  .sort((a, b) => b.freq - a.freq)
                  .map((m, i) => (
                    <div key={m.uid} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: i === 0 ? "#fbbf24" : "#475569", width: 18 }}>
                            {i === 0 ? "🏆" : `#${i + 1}`}
                          </span>
                          <span style={{ fontSize: 13, color: m.uid === user.uid ? ACCENT : "#e2e8f0" }}>
                            {m.displayName}{m.uid === user.uid ? " (tú)" : ""}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 14, color: ACCENT, fontWeight: 500 }}>{m.freq}</span>
                          <span style={{ fontSize: 10, color: "#475569" }}> total</span>
                          {m.week > 0 && (
                            <span style={{ fontSize: 10, color: "#22c55e", marginLeft: 6 }}>
                              +{m.week} sem
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ background: "#1a1a2a", borderRadius: 4, height: 6 }}>
                        <div style={{
                          height: 6, borderRadius: 4,
                          background: i === 0 ? "#fbbf24" : ACCENT,
                          width: `${maxFreq > 0 ? Math.round((m.freq / maxFreq) * 100) : 0}%`,
                          transition: "width 0.5s",
                        }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RankBar({ rank, name, value, max, accent, isMe }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: rank === 1 ? "#fbbf24" : "#475569", width: 18 }}>
            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
          </span>
          <span style={{ fontSize: 13, color: isMe ? accent : "#e2e8f0" }}>{name}</span>
        </div>
        <span style={{ fontSize: 14, color: value > 0 ? accent : "#334155", fontWeight: value > 0 ? 500 : 400 }}>
          {value > 0 ? `${value} kg` : "—"}
        </span>
      </div>
      <div style={{ background: "#1a1a2a", borderRadius: 4, height: 6 }}>
        <div style={{
          height: 6, borderRadius: 4,
          background: rank === 1 ? "#fbbf24" : accent,
          width: `${pct}%`, transition: "width 0.5s",
        }} />
      </div>
    </div>
  );
}
