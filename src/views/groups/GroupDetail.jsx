import { useState, useEffect } from "react";
import {
  loadGroupMembers, loadMemberWeeklyLogs,
  loadMemberAllLogs, loadMemberRoutine,
} from "../../utils/groups";
import { calc1RM, bestSet, sessionVolume } from "../../utils/fitness";
import { DAY_META } from "../../data/routine";
import { tokens } from "../../design";

const ACCENT = "#a78bfa";

export default function GroupDetail({ group, user, onBack, onLeave, onDelete, onOpenChat }) {
  const [tab, setTab]           = useState("semana");
  const [members, setMembers]   = useState([]);
  const [allLogs, setAllLogs]   = useState({});
  const [allRoutines, setAllRoutines] = useState({});
  const [weeklyLogs, setWeeklyLogs]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedDay, setSelectedDay]   = useState("");
  const [selectedEx, setSelectedEx]     = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [availableExs, setAvailableExs]   = useState([]);
  const isOwner = group.createdBy === user.uid;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const memberProfiles = await loadGroupMembers(group.members);
      setMembers(memberProfiles);
      const [logsR, routineR, weeklyR] = await Promise.all([
        Promise.all(group.members.map(uid => loadMemberAllLogs(uid).then(logs => ({ uid, logs })))),
        Promise.all(group.members.map(uid => loadMemberRoutine(uid).then(routine => ({ uid, routine })))),
        Promise.all(group.members.map(uid => loadMemberWeeklyLogs(uid).then(logs => ({ uid, logs })))),
      ]);
      const logsMap = {}, routineMap = {}, weeklyMap = {};
      logsR.forEach(({ uid, logs }) => { logsMap[uid] = logs; });
      routineR.forEach(({ uid, routine }) => { routineMap[uid] = routine; });
      weeklyR.forEach(({ uid, logs }) => { weeklyMap[uid] = logs; });
      setAllLogs(logsMap); setAllRoutines(routineMap); setWeeklyLogs(weeklyMap);
      const allDays = [...new Set(group.members.flatMap(uid => Object.keys(routineMap[uid] || {})))];
      setAvailableDays(allDays);
      if (allDays.length) {
        setSelectedDay(allDays[0]);
        const firstMember = group.members.find(uid => routineMap[uid]?.[allDays[0]]);
        if (firstMember) {
          const exs = routineMap[firstMember][allDays[0]]?.exercises || [];
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
    const first = group.members.find(uid => allRoutines[uid]?.[day]);
    if (first) {
      const exs = allRoutines[first][day]?.exercises || [];
      setAvailableExs(exs.map(e => e.name));
      setSelectedEx(exs[0]?.name || "");
    }
  }

  function getMember1RM(uid, day, exName) {
    let best = 0;
    Object.values(allLogs[uid] || {}).filter(s => s.day === day).forEach(s => {
      const ei = (allRoutines[uid]?.[day]?.exercises || []).findIndex(e => e.name === exName);
      if (ei === -1) return;
      const b = bestSet(s.sets?.[ei]);
      if (!b) return;
      const rm = calc1RM(b.weight, b.reps);
      if (rm > best) best = rm;
    });
    return best;
  }

  function getMemberFreq(uid)  { return Object.keys(allLogs[uid] || {}).length; }
  function getMemberWeek(uid)  { return Object.keys(weeklyLogs[uid] || {}).length; }

  const maxRM   = selectedEx ? Math.max(...group.members.map(uid => getMember1RM(uid, selectedDay, selectedEx)), 0) : 0;
  const maxFreq = Math.max(...group.members.map(uid => getMemberFreq(uid)), 1);

  const TABS = [
    { key: "semana",     label: "SEMANA" },
    { key: "1rm",        label: "1RM" },
    { key: "frecuencia", label: "FRECUENCIA" },
  ];

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Hero header */}
      <div style={{
        background: `linear-gradient(160deg, #1e1b4b 0%, #12102a 100%)`,
        padding: "20px 18px 0",
        borderBottom: "1px solid var(--glass-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: ACCENT + "88", letterSpacing: 3 }}>GRUPO</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 300, color: "var(--text)" }}>{group.name}</h2>
            <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", marginTop: 2 }}>
              {group.members.length} miembros ·{" "}
              <span style={{ color: ACCENT, letterSpacing: 2 }}>{group.code}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {onOpenChat && (
              <button onClick={() => onOpenChat(group.id, group.name)} style={{
                background: ACCENT + "22", border: `1px solid ${ACCENT}33`,
                color: ACCENT, padding: "7px 12px", borderRadius: 10,
                cursor: "pointer", fontSize: 13, fontFamily: "inherit", minHeight: 36,
              }}>💬</button>
            )}
            {!confirmLeave ? (
              <button onClick={() => setConfirmLeave(true)} style={{
                background: "transparent", border: "1px solid #3f1010",
                color: "var(--red)", padding: "7px 10px", borderRadius: 10,
                cursor: "pointer", fontSize: 10, letterSpacing: 1, fontFamily: "inherit", minHeight: 36,
              }}>{isOwner ? "ELIMINAR" : "SALIR"}</button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={isOwner ? onDelete : onLeave} style={{
                  background: "#7f1d1d", border: "1px solid var(--red)", color: "var(--red)",
                  padding: "7px 10px", borderRadius: 10, cursor: "pointer",
                  fontSize: 10, fontFamily: "inherit", minHeight: 36,
                }}>¿SEGURO?</button>
                <button onClick={() => setConfirmLeave(false)} style={{
                  background: "transparent", border: "1px solid var(--glass-border)", color: "rgba(240,240,240,0.30)",
                  padding: "7px 10px", borderRadius: 10, cursor: "pointer",
                  fontSize: 10, fontFamily: "inherit", minHeight: 36,
                }}>NO</button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs underline */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--glass-border)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.key ? ACCENT : "transparent"}`,
              color: tab === t.key ? ACCENT : "var(--text3)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 9, letterSpacing: 2, fontFamily: "inherit",
              transition: "all 0.15s", marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)}
          </div>
        ) : (
          <>
            {/* SEMANA */}
            {tab === "semana" && (
              <div>
                <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3, marginBottom: 12 }}>ACTIVIDAD ESTA SEMANA</div>
                {members.map((m, i) => {
                  const sessions = getMemberWeek(m.uid);
                  const logs_    = weeklyLogs[m.uid] || {};
                  const days_    = [...new Set(Object.values(logs_).map(s => s.day))];
                  const vol      = Object.values(logs_).reduce((a, s) => a + sessionVolume(s.sets), 0);
                  const isMe     = m.uid === user.uid;
                  return (
                    <div key={m.uid} style={{
                      background: sessions > 0 ? `linear-gradient(135deg, var(--bg2) 0%, ${"#22c55e"}08 100%)` : "var(--bg2)",
                      border: `1px solid ${sessions > 0 ? "#22c55e22" : "var(--border)"}`,
                      borderLeft: `3px solid ${sessions > 0 ? "#22c55e" : "var(--border)"}`,
                      borderRadius: 14, padding: "13px 16px", marginBottom: 8,
                      opacity: sessions > 0 ? 1 : 0.6,
                      animation: `slideDown 0.2s ease ${i * 0.05}s both`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: isMe ? "#a78bfa22" : "#60a5fa22",
                              border: `1px solid ${isMe ? "#a78bfa44" : "#60a5fa33"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              overflow: "hidden", flexShrink: 0,
                            }}>
                              {m.photoURL
                                ? <img src={m.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: 13, color: isMe ? "#a78bfa" : "#60a5fa" }}>{(m.displayName||"?")[0].toUpperCase()}</span>
                              }
                            </div>
                            <span style={{ fontSize: 14, color: isMe ? "#a78bfa" : "var(--text)" }}>
                              {m.displayName}{isMe ? " · tú" : ""}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", paddingLeft: 40 }}>
                            {sessions > 0 ? `${sessions} sesión${sessions > 1 ? "es" : ""} · ${vol.toLocaleString()} kg` : "Sin entrenar"}
                          </div>
                          {days_.length > 0 && (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6, paddingLeft: 40 }}>
                              {days_.map(d => {
                                const c = DAY_META[d] || { accent: ACCENT };
                                return (
                                  <span key={d} style={{
                                    fontSize: 9, background: c.accent + "22", color: c.accent,
                                    padding: "2px 8px", borderRadius: 99, letterSpacing: 1,
                                  }}>{d}</span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 20, color: sessions > 0 ? "#22c55e" : "var(--border)" }}>
                          {sessions > 0 ? "✓" : "·"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 1RM */}
            {tab === "1rm" && (
              <div>
                {availableDays.length ? (
                  <>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {availableDays.map(d => {
                        const c = DAY_META[d] || { accent: ACCENT };
                        return (
                          <button key={d} onClick={() => handleDayChange(d)} style={{
                            background: selectedDay === d ? c.accent + "22" : "var(--bg2)",
                            border: `1px solid ${selectedDay === d ? c.accent : "var(--border)"}`,
                            color: selectedDay === d ? c.accent : "var(--text3)",
                            padding: "6px 12px", borderRadius: 99, cursor: "pointer",
                            fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
                            transition: "all 0.15s",
                          }}>{d}</button>
                        );
                      })}
                    </div>
                    {availableExs.length ? (
                      <>
                        <select value={selectedEx} onChange={e => setSelectedEx(e.target.value)} style={{
                          width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
                          color: "rgba(240,240,240,0.55)", padding: "10px 14px", borderRadius: 12,
                          fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16,
                        }}>
                          {availableExs.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                        </select>
                        <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)", borderRadius: 14, padding: "16px" }}>
                          <div style={{ fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 14 }}>
                            MEJOR 1RM — {selectedEx}
                          </div>
                          {[...members]
                            .map(m => ({ ...m, rm: getMember1RM(m.uid, selectedDay, selectedEx) }))
                            .sort((a, b) => b.rm - a.rm)
                            .map((m, i) => (
                              <RankBar key={m.uid} rank={i+1} name={m.displayName + (m.uid === user.uid ? " · tú" : "")}
                                value={m.rm} max={maxRM} accent={ACCENT} isMe={m.uid === user.uid}
                                photoURL={m.photoURL}
                              />
                            ))}
                        </div>
                      </>
                    ) : <div style={{ color: "rgba(240,240,240,0.30)", fontSize: 12, textAlign: "center", padding: "30px 0" }}>Sin ejercicios en este día.</div>}
                  </>
                ) : <div style={{ color: "rgba(240,240,240,0.30)", fontSize: 12, textAlign: "center", padding: "30px 0" }}>Sin rutinas configuradas.</div>}
              </div>
            )}

            {/* FRECUENCIA */}
            {tab === "frecuencia" && (
              <div>
                <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3, marginBottom: 12 }}>RANKING TOTAL DE SESIONES</div>
                <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)", borderRadius: 14, padding: "16px" }}>
                  {[...members]
                    .map(m => ({ ...m, freq: getMemberFreq(m.uid), week: getMemberWeek(m.uid) }))
                    .sort((a, b) => b.freq - a.freq)
                    .map((m, i) => (
                      <div key={m.uid} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, width: 24, textAlign: "center" }}>
                              {i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                            </span>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: m.uid === user.uid ? "#a78bfa22" : "var(--bg3)",
                              border: `1px solid ${m.uid === user.uid ? "#a78bfa44" : "var(--border)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              overflow: "hidden", flexShrink: 0,
                            }}>
                              {m.photoURL
                                ? <img src={m.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: 12, color: m.uid === user.uid ? "#a78bfa" : "var(--text3)" }}>{(m.displayName||"?")[0].toUpperCase()}</span>
                              }
                            </div>
                            <span style={{ fontSize: 13, color: m.uid === user.uid ? ACCENT : "var(--text)" }}>
                              {m.displayName}{m.uid === user.uid ? " · tú" : ""}
                            </span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 16, color: ACCENT, fontWeight: 400 }}>{m.freq}</span>
                            <span style={{ fontSize: 10, color: "rgba(240,240,240,0.30)" }}> sesiones</span>
                            {m.week > 0 && <span style={{ fontSize: 10, color: "var(--green)", marginLeft: 6 }}>+{m.week} sem</span>}
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 99,
                            background: i === 0 ? `linear-gradient(90deg, #fbbf24, #f59e0b)` : ACCENT,
                            width: `${maxFreq > 0 ? Math.round((m.freq/maxFreq)*100) : 0}%`,
                            transition: "width 0.5s ease",
                            boxShadow: i === 0 ? "0 0 8px #fbbf2466" : `0 0 6px ${ACCENT}44`,
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
    </div>
  );
}

function RankBar({ rank, name, value, max, accent, isMe, photoURL }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const initial = (name || "?")[0].toUpperCase();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, width: 24, textAlign: "center" }}>
            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
          </span>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", overflow: "hidden",
            background: isMe ? "#a78bfa22" : "var(--bg3)",
            border: `1px solid ${isMe ? "#a78bfa44" : "var(--border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {photoURL
              ? <img src={photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 12, color: isMe ? "#a78bfa" : "var(--text3)" }}>{initial}</span>
            }
          </div>
          <span style={{ fontSize: 13, color: isMe ? accent : "var(--text)" }}>{name}</span>
        </div>
        <span style={{ fontSize: 14, color: value > 0 ? accent : "var(--text3)", fontWeight: value > 0 ? 400 : 300 }}>
          {value > 0 ? `${value} kg` : "—"}
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: rank === 1 ? `linear-gradient(90deg, #fbbf24, #f59e0b)` : accent,
          width: `${pct}%`, transition: "width 0.5s ease",
          boxShadow: rank === 1 ? "0 0 8px #fbbf2466" : `0 0 6px ${accent}44`,
        }} />
      </div>
    </div>
  );
}     