import { useState, useEffect } from "react";
import { loadUserChallenges, createChallenge, calcChallengeProgress } from "../utils/challenges";
import { loadFriends } from "../utils/friends";
import { loadUserGroups } from "../utils/groups";
import { loadMemberAllLogs, loadMemberRoutine } from "../utils/groups";
import { tokens } from "../design";

const ACCENT = "#f59e0b";

export default function ChallengesView({ user, myLogs, myRoutine, onBack }) {
  const [tab, setTab]           = useState("active");
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [rivals, setRivals]     = useState([]);
  const [groups, setGroups]     = useState([]);
  const [opponentData, setOpponentData] = useState({});
  const [selectedRival, setSelectedRival] = useState("");
  const [exercise, setExercise] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [chs, friends, grps] = await Promise.all([
        loadUserChallenges(user.uid),
        loadFriends(user.uid),
        loadUserGroups(user.uid),
      ]);
      setChallenges(chs); setGroups(grps);
      const groupMemberUids = new Set();
      grps.forEach(g => g.members.forEach(uid => { if (uid !== user.uid) groupMemberUids.add(uid); }));
      const allRivals = new Map();
      friends.forEach(f => allRivals.set(f.uid, f));
      if (groupMemberUids.size) {
        const profiles = await Promise.all([...groupMemberUids].map(uid =>
          import("../utils/friends").then(m => m.getPublicProfile(uid)).catch(() => null)
        ));
        profiles.forEach(p => { if (p && p.uid !== user.uid) allRivals.set(p.uid, p); });
      }
      setRivals([...allRivals.values()]);
      const uniqueOpps = [...new Set(chs.map(c => c.fromUid === user.uid ? c.toUid : c.fromUid))];
      const opData = {};
      await Promise.all(uniqueOpps.map(async uid => {
        const [logs, routine] = await Promise.all([loadMemberAllLogs(uid), loadMemberRoutine(uid)]);
        opData[uid] = { logs, routine };
      }));
      setOpponentData(opData);
      setLoading(false);
    }
    load();
  }, [user.uid]);

  async function handleCreate() {
    if (!selectedRival || !exercise.trim() || !targetWeight) { setCreateError("Completa todos los campos."); return; }
    setCreating(true);
    try {
      const rival = rivals.find(r => r.uid === selectedRival);
      const ch = await createChallenge({
        fromUid: user.uid, fromName: user.displayName || user.email.split("@")[0],
        toUid: selectedRival, toName: rival?.displayName || "",
        exercise: exercise.trim(), targetWeight: parseFloat(targetWeight),
        deadlineDays: parseInt(deadlineDays), groupId: selectedGroup || null,
      });
      setChallenges(prev => [ch, ...prev]);
      setShowCreate(false); setExercise(""); setTargetWeight(""); setSelectedRival(""); setCreateError("");
    } catch { setCreateError("Error al crear el reto."); }
    finally { setCreating(false); }
  }

  const active   = challenges.filter(c => c.status === "active");
  const finished = challenges.filter(c => c.status !== "active");

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3 }}>COMPETENCIA</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -0.8 }}>Retos 1v1</h2>
          </div>
          <button onClick={() => setShowCreate(v => !v)} style={{
            background: showCreate ? "transparent" : ACCENT,
            border: showCreate ? `1px solid ${ACCENT}44` : "none",
            color: showCreate ? ACCENT : "#f0f0f0",
            padding: "8px 16px", borderRadius: 10, cursor: "pointer",
            fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit",
            minHeight: 38, boxShadow: showCreate ? "none" : `0 4px 14px ${ACCENT}44`,
            transition: "all 0.2s",
          }}>{showCreate ? "✕ CANCELAR" : "+ NUEVO"}</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--glass-border)" }}>
          {[
            { key: "active",   label: `ACTIVOS (${active.length})` },
            { key: "finished", label: `TERMINADOS (${finished.length})` },
          ].map(t => (
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
        {/* Crear reto */}
        {showCreate && (
          <div style={{
            background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1px solid ${ACCENT}33`,
            borderRadius: 16, padding: "18px", marginBottom: 20,
            animation: "slideDown 0.25s ease",
            boxShadow: `0 4px 20px ${ACCENT}11`,
          }}>
            <div style={{ fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 16 }}>NUEVO RETO ⚔️</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>RIVAL</div>
              <select value={selectedRival} onChange={e => { setSelectedRival(e.target.value); setCreateError(""); }} style={{
                width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
                color: selectedRival ? "var(--text)" : "var(--text3)", padding: "11px 14px", borderRadius: 12,
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}>
                <option value="">Selecciona un rival...</option>
                {rivals.map(r => <option key={r.uid} value={r.uid}>{r.displayName}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>EJERCICIO</div>
              <input value={exercise} onChange={e => { setExercise(e.target.value); setCreateError(""); }}
                placeholder="Ej: Peso Rumano, Press Banca..."
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
                  color: "var(--text)", padding: "11px 14px", borderRadius: 12,
                  fontSize: 13, fontFamily: "inherit", outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>OBJETIVO (kg 1RM)</div>
                <input type="number" value={targetWeight} onChange={e => { setTargetWeight(e.target.value); setCreateError(""); }}
                  placeholder="100"
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
                    color: ACCENT, padding: "11px 14px", borderRadius: 12,
                    fontSize: 18, fontFamily: "inherit", outline: "none", textAlign: "center", fontWeight: 300,
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>PLAZO: {deadlineDays}d</div>
                <input type="range" min={7} max={90} value={deadlineDays}
                  onChange={e => setDeadlineDays(parseInt(e.target.value))}
                  style={{ width: "100%", marginTop: 12, accentColor: ACCENT }}
                />
              </div>
            </div>

            {createError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 10 }}>{createError}</div>}

            <button onClick={handleCreate} disabled={creating} style={{
              width: "100%", padding: "13px",
              background: creating ? "var(--bg3)" : ACCENT,
              border: creating ? "1px solid var(--border)" : "none",
              color: creating ? "var(--text3)" : "#f0f0f0",
              borderRadius: 12, cursor: creating ? "default" : "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              minHeight: 48, boxShadow: creating ? "none" : `0 4px 16px ${ACCENT}44`,
            }}>{creating ? "CREANDO..." : "CREAR RETO ⚔️"}</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14 }} />)}
          </div>
        ) : (
          <div>
            {(tab === "active" ? active : finished).length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚔️</div>
                <div style={{ fontSize: 14, color: "rgba(240,240,240,0.55)" }}>
                  {tab === "active" ? "Sin retos activos" : "Sin retos terminados"}
                </div>
              </div>
            )}

            {(tab === "active" ? active : finished).map((ch, i) => {
              const isFrom   = ch.fromUid === user.uid;
              const myName   = isFrom ? ch.fromName : ch.toName;
              const oppName  = isFrom ? ch.toName   : ch.fromName;
              const oppUid   = isFrom ? ch.toUid    : ch.fromUid;
              const oppData  = opponentData[oppUid] || {};
              const myP      = calcChallengeProgress(myLogs, myRoutine, ch.exercise, ch.targetWeight);
              const oppP     = calcChallengeProgress(oppData.logs, oppData.routine, ch.exercise, ch.targetWeight);
              const iWon     = ch.winner === user.uid;
              const daysLeft = ch.deadline ? Math.max(0, Math.ceil((new Date(ch.deadline) - new Date()) / 86400000)) : 0;
              const statusColor = ch.status === "completed" ? (iWon ? "#22c55e" : "#ef4444") : ACCENT;

              return (
                <div key={ch.id} style={{
                  background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                  border: `1px solid ${statusColor}33`,
                  borderLeft: `3px solid ${statusColor}`,
                  borderRadius: 14, padding: "16px", marginBottom: 10,
                  animation: `slideDown 0.2s ease ${i * 0.05}s both`,
                  boxShadow: `0 2px 12px ${statusColor}11`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 4 }}>RETO ⚔️</div>
                      <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 400 }}>{ch.exercise}</div>
                      <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", marginTop: 2 }}>
                        Objetivo: <span style={{ color: ACCENT }}>{ch.targetWeight} kg 1RM</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {ch.status === "completed" && (
                        <div style={{ fontSize: 14, color: statusColor }}>{iWon ? "🏆 Ganaste" : "💀 Perdiste"}</div>
                      )}
                      {ch.status === "expired" && <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)" }}>Expirado</div>}
                      {ch.status === "active" && (
                        <div style={{ fontSize: 11, color: daysLeft <= 7 ? "var(--red)" : "var(--text3)" }}>
                          {daysLeft} días restantes
                        </div>
                      )}
                    </div>
                  </div>

                  <ProgressBar label={`${myName} (tú)`} current={myP.current} pct={myP.pct} target={ch.targetWeight} color="#60a5fa" isWinner={ch.winner === user.uid} />
                  <ProgressBar label={oppName} current={oppP.current} pct={oppP.pct} target={ch.targetWeight} color="#fb923c" isWinner={ch.winner === oppUid} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, current, pct, target, color, isWinner }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "rgba(240,240,240,0.55)" }}>
          {isWinner && "🏆 "}{label}
        </span>
        <span style={{ fontSize: 12, color: current > 0 ? color : "var(--text3)" }}>
          {current > 0 ? `${current} kg` : "—"} <span style={{ color: "rgba(240,240,240,0.30)", fontSize: 10 }}>/ {target}</span>
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
          width: `${pct}%`, transition: "width 0.5s ease",
          boxShadow: pct > 0 ? `0 0 8px ${color}66` : "none",
        }} />
      </div>
      <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", textAlign: "right", marginTop: 3 }}>{pct}%</div>
    </div>
  );
}
