import { useState, useEffect } from "react";
import {
  loadUserChallenges, createChallenge, calcChallengeProgress,
} from "../utils/challenges";
import { loadFriends } from "../utils/friends";
import { loadUserGroups, loadGroupMembers } from "../utils/groups";
import { loadMemberAllLogs, loadMemberRoutine } from "../utils/groups";

const ACCENT = "#f59e0b";

export default function ChallengesView({ user, myLogs, myRoutine, onBack }) {
  const [tab, setTab]               = useState("active");
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Create challenge state
  const [showCreate, setShowCreate] = useState(false);
  const [rivals, setRivals]         = useState([]); // amigos + miembros de grupos
  const [selectedRival, setSelectedRival] = useState("");
  const [exercise, setExercise]     = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups]         = useState([]);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  // Opponent data para calcular progreso
  const [opponentData, setOpponentData] = useState({}); // { uid: { logs, routine } }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [chs, friends, grps] = await Promise.all([
        loadUserChallenges(user.uid),
        loadFriends(user.uid),
        loadUserGroups(user.uid),
      ]);

      setChallenges(chs);
      setGroups(grps);

      // Cargar miembros de grupos como rivales potenciales
      const groupMemberUids = new Set();
      await Promise.all(grps.map(async g => {
        g.members.forEach(uid => { if (uid !== user.uid) groupMemberUids.add(uid); });
      }));

      const allRivals = new Map();
      friends.forEach(f => allRivals.set(f.uid, f));

      // Agregar miembros de grupos que no son amigos
      if (groupMemberUids.size) {
        const profiles = await Promise.all([...groupMemberUids].map(uid =>
          import("../utils/friends").then(m => m.getPublicProfile(uid)).catch(() => null)
        ));
        profiles.forEach(p => { if (p && p.uid !== user.uid) allRivals.set(p.uid, p); });
      }

      setRivals([...allRivals.values()]);

      // Cargar datos de oponentes para calcular progreso
      const uniqueOpponents = [...new Set(chs.map(c =>
        c.fromUid === user.uid ? c.toUid : c.fromUid
      ))];
      const opData = {};
      await Promise.all(uniqueOpponents.map(async uid => {
        const [logs, routine] = await Promise.all([
          loadMemberAllLogs(uid),
          loadMemberRoutine(uid),
        ]);
        opData[uid] = { logs, routine };
      }));
      setOpponentData(opData);

      setLoading(false);
    }
    load();
  }, [user.uid]);

  async function handleCreate() {
    if (!selectedRival || !exercise.trim() || !targetWeight) {
      setCreateError("Completa todos los campos."); return;
    }
    setCreating(true);
    try {
      const rival = rivals.find(r => r.uid === selectedRival);
      const ch = await createChallenge({
        fromUid:      user.uid,
        fromName:     user.displayName || user.email.split("@")[0],
        toUid:        selectedRival,
        toName:       rival?.displayName || "",
        exercise:     exercise.trim(),
        targetWeight: parseFloat(targetWeight),
        deadlineDays: parseInt(deadlineDays),
        groupId:      selectedGroup || null,
      });
      setChallenges(prev => [ch, ...prev]);
      setShowCreate(false);
      setExercise(""); setTargetWeight(""); setSelectedRival(""); setCreateError("");
    } catch { setCreateError("Error al crear el reto."); }
    finally { setCreating(false); }
  }

  const active   = challenges.filter(c => c.status === "active");
  const finished = challenges.filter(c => c.status !== "active");

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 13 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>RETOS 1v1</h2>
        <button onClick={() => setShowCreate(v => !v)} style={{
          marginLeft: "auto", background: showCreate ? "#1c1100" : ACCENT,
          border: "none", color: showCreate ? ACCENT : "#000",
          padding: "7px 14px", borderRadius: 8, cursor: "pointer",
          fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit",
          ...(showCreate ? { border: `1px solid ${ACCENT}44` } : {}),
        }}>
          {showCreate ? "✕ CANCELAR" : "+ NUEVO RETO"}
        </button>
      </div>

      {/* Crear reto */}
      {showCreate && (
        <div className="card" style={{ padding: "16px", marginBottom: 16, borderLeft: `3px solid ${ACCENT}` }}>
          <div style={{ fontSize: 11, color: ACCENT, letterSpacing: 2, marginBottom: 14 }}>NUEVO RETO</div>

          {/* Rival */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, marginBottom: 5 }}>RIVAL</div>
            <select value={selectedRival} onChange={e => { setSelectedRival(e.target.value); setCreateError(""); }} style={{
              width: "100%", background: "#0a0a14", border: "1px solid #1a1a2a",
              color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
              fontSize: 13, fontFamily: "inherit", outline: "none",
            }}>
              <option value="">Selecciona un rival...</option>
              {rivals.map(r => <option key={r.uid} value={r.uid}>{r.displayName}</option>)}
            </select>
          </div>

          {/* Ejercicio */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, marginBottom: 5 }}>EJERCICIO</div>
            <input value={exercise} onChange={e => { setExercise(e.target.value); setCreateError(""); }}
              placeholder="Ej: Peso Rumano, Press Banca..." style={{
                width: "100%", background: "#0a0a14", border: "1px solid #1a1a2a",
                color: "#f1f5f9", padding: "9px 12px", borderRadius: 8,
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>

          {/* Peso objetivo */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, marginBottom: 5 }}>PESO OBJETIVO (kg 1RM)</div>
            <input type="number" value={targetWeight} onChange={e => { setTargetWeight(e.target.value); setCreateError(""); }}
              placeholder="100" style={{
                width: "100%", background: "#0a0a14", border: "1px solid #1a1a2a",
                color: ACCENT, padding: "9px 12px", borderRadius: 8,
                fontSize: 16, fontFamily: "inherit", outline: "none", fontWeight: 500,
              }}
            />
          </div>

          {/* Plazo */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, marginBottom: 5 }}>
              PLAZO: {deadlineDays} días
            </div>
            <input type="range" min={7} max={90} value={deadlineDays}
              onChange={e => setDeadlineDays(parseInt(e.target.value))} style={{ width: "100%", accentColor: ACCENT }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#334155" }}>
              <span>7 días</span><span>90 días</span>
            </div>
          </div>

          {/* Grupo (opcional) */}
          {groups.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, marginBottom: 5 }}>GRUPO (opcional)</div>
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{
                width: "100%", background: "#0a0a14", border: "1px solid #1a1a2a",
                color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}>
                <option value="">Sin grupo</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {createError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{createError}</div>}

          <button onClick={handleCreate} disabled={creating} style={{
            width: "100%", padding: "12px", background: creating ? "#1c1100" : ACCENT,
            border: "none", borderRadius: 10, color: "#000", fontWeight: 700,
            fontSize: 12, letterSpacing: 2, cursor: creating ? "default" : "pointer",
            fontFamily: "inherit",
          }}>{creating ? "CREANDO..." : "CREAR RETO ⚔️"}</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18 }}>
        {[
          { key: "active",   label: `ACTIVOS (${active.length})` },
          { key: "finished", label: `TERMINADOS (${finished.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "#1c1100" : "transparent",
            border: `1px solid ${tab === t.key ? ACCENT + "44" : "#1a1a2a"}`,
            color: tab === t.key ? ACCENT : "#475569",
            padding: "8px", borderRadius: 8, cursor: "pointer",
            fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>Cargando...</div>
      ) : (
        <div>
          {(tab === "active" ? active : finished).length === 0 && (
            <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
              {tab === "active" ? "Sin retos activos." : "Sin retos terminados."}
            </div>
          )}

          {(tab === "active" ? active : finished).map(ch => {
            const isFrom   = ch.fromUid === user.uid;
            const myName   = isFrom ? ch.fromName : ch.toName;
            const oppName  = isFrom ? ch.toName   : ch.fromName;
            const oppUid   = isFrom ? ch.toUid    : ch.fromUid;
            const oppData  = opponentData[oppUid] || {};

            const myProgress  = calcChallengeProgress(myLogs, myRoutine, ch.exercise, ch.targetWeight);
            const oppProgress = calcChallengeProgress(oppData.logs, oppData.routine, ch.exercise, ch.targetWeight);

            const iWon  = ch.winner === user.uid;
            const oppWon = ch.winner && ch.winner !== user.uid;

            const daysLeft = ch.deadline
              ? Math.max(0, Math.ceil((new Date(ch.deadline) - new Date()) / 86400000))
              : 0;

            return (
              <div key={ch.id} className="card" style={{
                marginBottom: 12,
                borderLeft: `3px solid ${ch.status === "completed" ? (iWon ? "#22c55e" : "#ef4444") : ACCENT}`,
                padding: "14px 16px",
              }}>
                {/* Header del reto */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#f1f5f9", marginBottom: 2 }}>
                      ⚔️ {ch.exercise}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569" }}>
                      Objetivo: <span style={{ color: ACCENT }}>{ch.targetWeight} kg</span>
                      {ch.status === "active" && <span style={{ color: daysLeft <= 7 ? "#ef4444" : "#475569" }}> · {daysLeft} días</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "#475569" }}>
                    {ch.status === "completed" && (
                      <span style={{ color: iWon ? "#22c55e" : "#ef4444", fontSize: 13 }}>
                        {iWon ? "🏆 Ganaste" : "💀 Perdiste"}
                      </span>
                    )}
                    {ch.status === "expired" && <span style={{ color: "#475569" }}>Expirado</span>}
                    {ch.status === "active"  && <span style={{ color: ACCENT }}>En curso</span>}
                  </div>
                </div>

                {/* Barras de progreso */}
                <ProgressBar
                  label={`${myName} (tú)`}
                  current={myProgress.current}
                  pct={myProgress.pct}
                  target={ch.targetWeight}
                  accent="#60a5fa"
                  isWinner={ch.winner === user.uid}
                />
                <ProgressBar
                  label={oppName}
                  current={oppProgress.current}
                  pct={oppProgress.pct}
                  target={ch.targetWeight}
                  accent="#fb923c"
                  isWinner={ch.winner === oppUid}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, current, pct, target, accent, isWinner }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#e2e8f0" }}>
          {isWinner && "🏆 "}{label}
        </span>
        <span style={{ fontSize: 12, color: current > 0 ? accent : "#334155" }}>
          {current > 0 ? `${current} kg` : "—"} <span style={{ color: "#334155" }}>/ {target} kg</span>
        </span>
      </div>
      <div style={{ background: "#1a1a2a", borderRadius: 4, height: 8, position: "relative" }}>
        <div style={{
          height: 8, borderRadius: 4, background: accent,
          width: `${pct}%`, transition: "width 0.5s",
        }} />
        {pct >= 100 && (
          <div style={{ position: "absolute", right: 4, top: -1, fontSize: 14 }}>✓</div>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#334155", marginTop: 2, textAlign: "right" }}>{pct}%</div>
    </div>
  );
}
