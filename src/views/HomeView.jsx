import { useState, useEffect } from "react";
import { DAY_META } from "../data/routine";
import { getSessionKey, todayStr } from "../utils/storage";
import { getWeekNumber } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";
import { calcStreak, streakEmoji, streakMessage } from "../utils/streak";
import { loadFriendActivity, saveLastVisit } from "../utils/activity";
import { loadFriends } from "../utils/friends";
import ActivityFeed from "../components/ActivityFeed";
import XPBar from "../components/XPBar";
import { registerPushNotifications, hasNotificationPermission } from "../utils/notifications";

const C = {
  bg:      "var(--bg)",
  bg2:     "var(--bg2)",
  bg3:     "var(--bg3)",
  border:  "var(--border)",
  text:    "var(--text)",
  text2:   "var(--text2)",
  text3:   "var(--text3)",
  accent:  "var(--accent)",
  green:   "var(--green)",
};

export default function HomeView({ logs, user, myProfile, routine, userXP, sessionDate, setSessionDate, onStartSession, onNavigate, onLogout }) {
  const firstName   = (user?.displayName || user?.email || "Atleta").split(" ")[0];
  const streak      = calcStreak(logs);
  const routineDays = Object.keys(routine || {});
  const totalSessions = Object.keys(logs).length;

  const [activity, setActivity] = useState([]);
  const [showFeed, setShowFeed] = useState(false);

  useEffect(() => {
    async function loadActivity() {
      try {
        const friends = await loadFriends(user.uid);
        if (!friends.length) { saveLastVisit(); return; }
        const recent = await loadFriendActivity(friends.map(f => f.uid));
        if (recent.length > 0) { setActivity(recent); setShowFeed(true); }
      } catch {}
      finally { saveLastVisit(); }
    }
    loadActivity();
  }, [user.uid]);

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace", background: C.bg, minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: C.text3, marginBottom: 4 }}>HYPERTROPHY TRACKER</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 400, letterSpacing: -1, color: C.text, margin: 0 }}>{firstName}</h1>
            <span style={{ color: C.accent, fontSize: 26, animation: "blink 1.4s infinite" }}>_</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onNavigate("profile")} style={{
              background: "none", border: `1px solid ${C.border}`, color: C.text3,
              padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              fontSize: 11, letterSpacing: 1, fontFamily: "inherit",
            }}>👤</button>
            <button onClick={onLogout} style={{
              background: "none", border: `1px solid ${C.border}`, color: C.text3,
              padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              fontSize: 11, letterSpacing: 1, fontFamily: "inherit",
            }}>SALIR</button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>
          {totalSessions} sesiones · semana {getWeekNumber()}
        </div>
      </div>

      {/* Racha */}
      {streak > 0 && (
        <div style={{
          background: streak >= 7 ? "#1c1100" : C.bg2,
          border: `1px solid ${streak >= 7 ? "#f59e0b44" : C.border}`,
          borderLeft: `3px solid ${streak >= 7 ? "#f59e0b" : "#fb923c"}`,
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2, marginBottom: 1 }}>RACHA</div>
            <div style={{ fontSize: 18, color: streak >= 7 ? "#f59e0b" : "#fb923c", fontWeight: 500 }}>
              {streak} día{streak > 1 ? "s" : ""} {streakEmoji(streak)}
            </div>
          </div>
          <div style={{ fontSize: 28 }}>{streakEmoji(streak) || "🔥"}</div>
        </div>
      )}

      {/* XP Bar */}
      <XPBar xp={userXP || 0} />

      {/* Feed actividad */}
      {showFeed && <ActivityFeed activity={activity} onDismiss={() => setShowFeed(false)} />}

      {/* Stats días */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(routineDays.length, 4)}, 1fr)`, gap: 6, marginBottom: 14 }}>
        {routineDays.slice(0, 4).map(d => {
          const c = DAY_META[d] || { accent: C.accent };
          const n = Object.keys(logs).filter(k => k.startsWith(d + "__")).length;
          return (
            <div key={d} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderLeft: `2px solid ${c.accent}`, borderRadius: 12, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 400, color: c.accent }}>{n}</div>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>{d}</div>
            </div>
          );
        })}
      </div>

      {/* Fecha */}
      <div style={{ marginBottom: 14 }}>
        <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={{
          background: C.bg2, border: `1px solid ${C.border}`, color: C.text2,
          padding: "8px 12px", borderRadius: 8, fontSize: 13,
          width: "100%", fontFamily: "inherit", outline: "none",
        }} />
      </div>

      {/* Cards de días */}
      {routineDays.map(day => {
        const c       = DAY_META[day] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
        const hasLog  = !!logs[getSessionKey(day, sessionDate)];
        const exCount = routine[day]?.exercises?.length || 0;
        const setCount = routine[day]?.exercises?.reduce((a, e) => a + e.sets.length, 0) || 0;
        return (
          <button key={day} onClick={() => onStartSession(day)} style={{
            width: "100%",
            background: hasLog ? (c.dim || "#1e3a5f") + "55" : C.bg2,
            border: `1px solid ${hasLog ? c.accent + "44" : C.border}`,
            borderLeft: `3px solid ${c.accent}`,
            borderRadius: 10, padding: "11px 14px", cursor: "pointer",
            textAlign: "left", marginBottom: 7,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontFamily: "inherit",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: 2, color: c.accent }}>{c.tag || "DÍA"}</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: C.text }}>{day}</span>
                {hasLog && <span style={{ fontSize: 9, background: c.accent + "22", color: c.accent, padding: "1px 6px", borderRadius: 10 }}>LOGGED</span>}
              </div>
              <div style={{ fontSize: 11, color: C.text3 }}>{exCount} ejercicios · {setCount} series</div>
            </div>
            <span style={{ color: c.accent }}>›</span>
          </button>
        );
      })}

      {/* Grid navegación */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <NavCard icon="📋" label="HISTORIAL"  sub={`${totalSessions} sesiones`} color="#60a5fa" onClick={() => onNavigate("history")} />
          <NavCard icon="📈" label="PROGRESO"   sub="Gráficos"  color="#34d399"  onClick={() => onNavigate("progress")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <NavCard icon="👥" label="AMIGOS"     sub="Ver amigos" color="#60a5fa" onClick={() => onNavigate("friends")} />
          <NavCard icon="🏆" label="GRUPOS"     sub="Comparar"  color="#a78bfa" onClick={() => onNavigate("groups")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <NavCard icon="⚔️" label="RETOS 1v1"  sub="Desafiar"  color="#f59e0b" onClick={() => onNavigate("challenges")} />
          <NavCard icon="🏅" label="RANKING"    sub="Top global" color="#a78bfa" onClick={() => onNavigate("leaderboard")} />
        </div>

        {/* Editar rutina */}
        <button onClick={() => onNavigate("editRoutine")} style={{
          width: "100%", background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "11px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          fontFamily: "inherit", marginBottom: 8,
        }}>
          <span style={{ fontSize: 18 }}>✏️</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "#34d399", letterSpacing: 2 }}>EDITAR RUTINA</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>Ejercicios, pesos y días</div>
          </div>
        </button>

        {/* Exportar */}
        <button onClick={() => exportToExcel(logs)} className="nbtn" style={{
          width: "100%", border: `1px solid ${C.border}`, color: C.green,
          padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2, marginBottom: 8,
        }}>↓ EXPORTAR EXCEL</button>

        {/* Notificaciones */}
        {"Notification" in window && !hasNotificationPermission() && (
          <button onClick={() => registerPushNotifications(user.uid)} className="nbtn" style={{
            width: "100%", border: `1px solid ${C.border}`, color: "#38bdf8",
            padding: "10px", borderRadius: 8, fontSize: 11, letterSpacing: 2,
          }}>🔔 ACTIVAR NOTIFICACIONES</button>
        )}
      </div>
    </div>
  );
}

function NavCard({ icon, label, sub, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "12px 14px", cursor: "pointer",
      textAlign: "left", fontFamily: "inherit", width: "100%",
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color, letterSpacing: 2, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{sub}</div>
    </button>
  );
}
