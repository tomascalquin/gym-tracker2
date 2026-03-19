import { useState, useEffect } from "react";
import { DAY_META } from "../data/routine";
import { getSessionKey, todayStr } from "../utils/storage";
import { getWeekNumber } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";
import { calcStreak, streakEmoji, streakMessage } from "../utils/streak";
import { loadFriendActivity, saveLastVisit, getLastVisit } from "../utils/activity";
import { loadFriends } from "../utils/friends";
import ActivityFeed from "../components/ActivityFeed";
import XPBar from "../components/XPBar";

export default function HomeView({ logs, user, myProfile, routine, userXP, sessionDate, setSessionDate, onStartSession, onNavigate, onLogout }) {
  const firstName  = (user?.displayName || user?.email || "Atleta").split(" ")[0];
  const streak     = calcStreak(logs);
  const routineDays = Object.keys(routine || {});

  const [activity, setActivity]       = useState([]);
  const [showFeed, setShowFeed]       = useState(false);
  const [feedLoaded, setFeedLoaded]   = useState(false);

  // Cargar actividad de amigos al montar
  useEffect(() => {
    async function loadActivity() {
      try {
        const friends = await loadFriends(user.uid);
        const friendUids = friends.map(f => f.uid);
        if (!friendUids.length) { saveLastVisit(); return; }
        const recent = await loadFriendActivity(friendUids);
        if (recent.length > 0) {
          setActivity(recent);
          setShowFeed(true);
        }
      } catch (err) {
        console.warn("loadActivity error:", err.message);
      } finally {
        saveLastVisit();
        setFeedLoaded(true);
      }
    }
    loadActivity();
  }, [user.uid]);

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "28px 18px", fontFamily: "DM Mono, monospace" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: 4, color: "#475569", marginBottom: 4 }}>
          HYPERTROPHY TRACKER
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: -1, color: "#f8fafc" }}>
              {firstName}
            </h1>
            <span style={{ color: "#60a5fa", fontSize: 28, animation: "blink 1.4s infinite" }}>_</span>
          </div>
          <button onClick={onLogout} style={{
            background: "none", border: "1px solid #1a1a2a", color: "#475569",
            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            fontSize: 11, letterSpacing: 1, fontFamily: "inherit",
          }}>SALIR</button>
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 4, display: "flex", gap: 12, alignItems: "center" }}>
          <span>{Object.keys(logs).length} sesiones · semana {getWeekNumber()}</span>
        </div>
      </div>

      {/* Racha */}
      {streak > 0 && (
        <div style={{
          background: streak >= 7 ? "#1c1100" : "#0e0e1a",
          border: `1px solid ${streak >= 7 ? "#f59e0b44" : "#1a1a2a"}`,
          borderLeft: `3px solid ${streak >= 7 ? "#f59e0b" : "#fb923c"}`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 2 }}>RACHA</div>
            <div style={{ fontSize: 20, color: streak >= 7 ? "#f59e0b" : "#fb923c", fontWeight: 500 }}>
              {streak} día{streak > 1 ? "s" : ""} {streakEmoji(streak)}
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{streakMessage(streak)}</div>
          </div>
          <div style={{ fontSize: 32 }}>{streakEmoji(streak) || "🔥"}</div>
        </div>
      )}

      {/* XP Bar */}
      <XPBar xp={userXP || 0} />

      {/* Feed de actividad */}
      {showFeed && (
        <ActivityFeed activity={activity} onDismiss={() => setShowFeed(false)} />
      )}

      {/* Stats por día */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(routineDays.length, 4)}, 1fr)`, gap: 7, marginBottom: 20 }}>
        {routineDays.slice(0, 4).map(d => {
          const c = DAY_META[d] || { accent: "#60a5fa" };
          const n = Object.keys(logs).filter(k => k.startsWith(d + "__")).length;
          return (
            <div key={d} className="card" style={{ padding: "10px 6px", textAlign: "center", borderLeft: `2px solid ${c.accent}` }}>
              <div style={{ fontSize: 20, fontWeight: 400, color: c.accent }}>{n}</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>
                {d}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selector de fecha */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#475569", marginBottom: 5 }}>FECHA</div>
        <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={{
          background: "#0e0e1a", border: "1px solid #1a1a2a", color: "#94a3b8",
          padding: "9px 12px", borderRadius: 8, fontSize: 14,
          width: "100%", fontFamily: "inherit", outline: "none",
        }} />
      </div>

      {/* Cards de días — dinámico desde la rutina del usuario */}
      {routineDays.map(day => {
        const c       = DAY_META[day] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
        const hasLog  = !!logs[getSessionKey(day, sessionDate)];
        const exCount = routine[day]?.exercises?.length || 0;
        const setCount = routine[day]?.exercises?.reduce((a, e) => a + e.sets.length, 0) || 0;
        return (
          <button key={day} onClick={() => onStartSession(day)} style={{
            width: "100%", background: hasLog ? (c.dim || "#1e3a5f") + "55" : "#0e0e1a",
            border: `1px solid ${hasLog ? c.accent + "44" : "#1a1a2a"}`,
            borderLeft: `3px solid ${c.accent}`, borderRadius: 10,
            padding: "13px 16px", cursor: "pointer", textAlign: "left",
            marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
            fontFamily: "inherit",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 11, letterSpacing: 2, color: c.accent }}>{c.tag || "DÍA"}</span>
                <span style={{ fontSize: 15, fontWeight: 400, color: "#f1f5f9" }}>{day}</span>
                {hasLog && (
                  <span style={{ fontSize: 10, background: c.accent + "22", color: c.accent, padding: "2px 7px", borderRadius: 10 }}>
                    LOGGED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#475569" }}>
                {exCount} ejercicios · {setCount} series
              </div>
            </div>
            <span style={{ color: c.accent }}>›</span>
          </button>
        );
      })}

      {/* Nav */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <button onClick={() => onNavigate("history")} className="nbtn" style={{ border: "1px solid #1a1a2a", color: "#475569", padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2 }}>
          HISTORIAL
        </button>
        <button onClick={() => onNavigate("progress")} className="nbtn" style={{ border: "1px solid #1a1a2a", color: "#475569", padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2 }}>
          PROGRESO
        </button>
      </div>
      <button onClick={() => onNavigate("editRoutine")} className="nbtn" style={{
        marginTop: 8, width: "100%", border: "1px solid #1a2a1a", color: "#34d399",
        padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2,
      }}>✏️ EDITAR RUTINA</button>
      <button onClick={() => onNavigate("friends")} className="nbtn" style={{
        marginTop: 8, width: "100%", border: "1px solid #1e3a5f", color: "#60a5fa",
        padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2,
      }}>👥 AMIGOS</button>
      <button onClick={() => onNavigate("groups")} className="nbtn" style={{
        marginTop: 8, width: "100%", border: "1px solid #1e1b4b", color: "#a78bfa",
        padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2,
      }}>🏆 GRUPOS</button>
      <button onClick={() => onNavigate("challenges")} className="nbtn" style={{
        marginTop: 8, width: "100%", border: "1px solid #1c1100", color: "#f59e0b",
        padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2,
      }}>⚔️ RETOS 1v1</button>
      <button onClick={() => onNavigate("leaderboard")} className="nbtn" style={{
        marginTop: 8, width: "100%", border: "1px solid #1e1b4b", color: "#a78bfa",
        padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2,
      }}>🏅 RANKING GLOBAL</button>
      <button onClick={() => exportToExcel(logs)} className="nbtn" style={{
        marginTop: 8, width: "100%", border: "1px solid #1a3a1a", color: "#22c55e",
        padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2,
      }}>↓ EXPORTAR EXCEL</button>
    </div>
  );
}
