import { useState, useEffect } from "react";
import { DAY_META } from "../data/routine";
import { getSessionKey } from "../utils/storage";
import { getWeekNumber } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";
import { calcStreak, streakEmoji } from "../utils/streak";
import { loadFriendActivity, saveLastVisit } from "../utils/activity";
import { loadFriends } from "../utils/friends";
import ActivityFeed from "../components/ActivityFeed";
import XPBar from "../components/XPBar";
import { registerPushNotifications, hasNotificationPermission } from "../utils/notifications";
import { tokens } from "../design";

const C = {
  bg: "var(--bg)", bg2: "var(--bg2)", bg3: "var(--bg3)",
  border: "var(--border)", text: "var(--text)", text2: "var(--text2)",
  text3: "var(--text3)", accent: "var(--accent)", green: "var(--green)",
};

export default function HomeView({ logs, user, myProfile, routine, userXP, sessionDate, setSessionDate, onStartSession, onNavigate, onLogout }) {
  const firstName     = (user?.displayName || user?.email || "Atleta").split(" ")[0];
  const streak        = calcStreak(logs);
  const routineDays   = Object.keys(routine || {});
  const totalSessions = Object.keys(logs).length;
  const [activity, setActivity] = useState([]);
  const [showFeed, setShowFeed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const friends = await loadFriends(user.uid);
        if (!friends.length) { saveLastVisit(); return; }
        const recent = await loadFriendActivity(friends.map(f => f.uid));
        if (recent.length > 0) { setActivity(recent); setShowFeed(true); }
      } catch {}
      finally { saveLastVisit(); }
    }
    load();
  }, [user.uid]);

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "20px 18px", fontFamily: "DM Mono, monospace", animation: "fadeIn 0.3s ease" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: C.text3, marginBottom: 6 }}>HYPERTROPHY TRACKER</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <h1 style={{ fontSize: 30, fontWeight: 300, letterSpacing: -1.5, color: C.text, margin: 0 }}>{firstName}</h1>
            <span style={{ color: C.accent, fontSize: 30, animation: "blink 1.4s infinite", fontWeight: 300 }}>_</span>
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
            {totalSessions} sesiones · sem {getWeekNumber()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <ActionBtn icon="👤" onClick={() => onNavigate("profile")} />
          <ActionBtn icon="⎋" onClick={onLogout} />
        </div>
      </div>

      {/* ── Racha ── */}
      {streak > 0 && (
        <div style={{
          background: streak >= 7
            ? "linear-gradient(135deg, #1c1100 0%, #2d1800 100%)"
            : "linear-gradient(135deg, var(--bg2) 0%, #150e00 100%)",
          border: `1px solid ${streak >= 7 ? "#f59e0b44" : "#fb923c33"}`,
          borderRadius: tokens.radius.xl, padding: "14px 18px", marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: `0 4px 20px ${streak >= 7 ? "#f59e0b22" : "#fb923c11"}`,
          animation: "scaleIn 0.3s ease",
        }}>
          <div>
            <div style={{ fontSize: 9, color: streak >= 7 ? "#f59e0b88" : "#fb923c88", letterSpacing: 3, marginBottom: 3 }}>RACHA ACTIVA</div>
            <div style={{ fontSize: 24, color: streak >= 7 ? "#f59e0b" : "#fb923c", fontWeight: 400 }}>
              {streak} <span style={{ fontSize: 13 }}>día{streak > 1 ? "s" : ""}</span>
            </div>
          </div>
          <div style={{ fontSize: 36 }}>{streakEmoji(streak) || "🔥"}</div>
        </div>
      )}

      {/* ── XP Bar ── */}
      <XPBar xp={userXP || 0} />

      {/* ── Feed ── */}
      {showFeed && <ActivityFeed activity={activity} onDismiss={() => setShowFeed(false)} />}

      {/* ── Stats días ── */}
      {routineDays.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(routineDays.length, 4)}, 1fr)`, gap: 6, marginBottom: 16 }}>
          {routineDays.slice(0, 4).map(d => {
            const c = DAY_META[d] || { accent: "#60a5fa" };
            const n = Object.keys(logs).filter(k => k.startsWith(d + "__")).length;
            return (
              <div key={d} style={{
                background: n > 0 ? c.accent + "11" : C.bg2,
                border: `1px solid ${n > 0 ? c.accent + "33" : C.border}`,
                borderRadius: tokens.radius.md, padding: "10px 6px", textAlign: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 300, color: c.accent }}>{n}</div>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1, marginTop: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>{d}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fecha ── */}
      <div style={{ marginBottom: 16 }}>
        <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={{
          width: "100%", background: C.bg2, border: `1px solid ${C.border}`,
          color: C.text2, padding: "10px 14px", borderRadius: tokens.radius.md,
          fontSize: 14, fontFamily: "inherit", outline: "none",
        }} />
      </div>

      {/* ── Cards de días ── */}
      <div style={{ marginBottom: 20 }}>
        {routineDays.map((day, i) => {
          const c       = DAY_META[day] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
          const hasLog  = !!logs[getSessionKey(day, sessionDate)];
          const exCount = routine[day]?.exercises?.length || 0;
          const setCount = routine[day]?.exercises?.reduce((a, e) => a + e.sets.length, 0) || 0;
          return (
            <DayCard key={day} day={day} c={c} hasLog={hasLog}
              exCount={exCount} setCount={setCount} index={i}
              onClick={() => onStartSession(day)}
            />
          );
        })}
      </div>

      {/* ── Grid de accesos ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: C.text3, marginBottom: 10 }}>ACCESOS RÁPIDOS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <NavCard icon="📊" label="PROGRESIÓN" sub="Calculadora" color="#fb923c" onClick={() => onNavigate("progression")} />
          <NavCard icon="🏆" label="GRUPOS"     sub="Comparar"   color="#a78bfa" onClick={() => onNavigate("groups")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <NavCard icon="⚔️" label="RETOS"      sub="1 vs 1"     color="#f59e0b" onClick={() => onNavigate("challenges")} />
          <NavCard icon="✏️" label="RUTINA"     sub="Editar"     color="#34d399" onClick={() => onNavigate("editRoutine")} />
        </div>
      </div>

      {/* ── Export ── */}
      <button onClick={() => exportToExcel(logs)} style={{
        width: "100%", background: "transparent",
        border: `1px solid ${C.border}`, color: C.text3,
        padding: "12px", borderRadius: tokens.radius.md,
        fontSize: 10, letterSpacing: 2, fontFamily: "inherit",
        cursor: "pointer", marginBottom: 8,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span>↓</span> EXPORTAR EXCEL
      </button>

      {/* Notificaciones */}
      {"Notification" in window && !hasNotificationPermission() && (
        <button onClick={() => registerPushNotifications(user.uid)} style={{
          width: "100%", background: "transparent",
          border: `1px solid #1a2a3a`, color: "#38bdf8",
          padding: "12px", borderRadius: tokens.radius.md,
          fontSize: 10, letterSpacing: 2, fontFamily: "inherit",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>🔔 ACTIVAR NOTIFICACIONES</button>
      )}
    </div>
  );
}

function DayCard({ day, c, hasLog, exCount, setCount, index, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: "100%", textAlign: "left", fontFamily: "inherit",
        background: hasLog
          ? `linear-gradient(135deg, ${c.accent}18 0%, ${c.accent}08 100%)`
          : "var(--bg2)",
        border: `1px solid ${hasLog ? c.accent + "55" : "var(--border)"}`,
        borderLeft: `3px solid ${c.accent}`,
        borderRadius: 14, padding: "14px 16px", cursor: "pointer",
        marginBottom: 8,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        boxShadow: hasLog ? `0 4px 20px ${c.accent}15` : "none",
        transition: "transform 0.1s ease, box-shadow 0.2s ease",
        animation: `slideDown 0.2s ease ${index * 0.04}s both`,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 9, letterSpacing: 3, color: c.accent, opacity: 0.8 }}>{c.tag || "DÍA"}</span>
          <span style={{ fontSize: 15, fontWeight: 400, color: "var(--text)" }}>{day}</span>
          {hasLog && (
            <span style={{
              fontSize: 8, background: c.accent + "22", color: c.accent,
              padding: "2px 8px", borderRadius: 99, letterSpacing: 1,
            }}>✓ LOGGED</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          {exCount} ejercicios · {setCount} series
        </div>
      </div>
      <span style={{ color: c.accent, fontSize: 20, opacity: 0.7 }}>›</span>
    </button>
  );
}

function NavCard({ icon, label, sub, color, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{
        background: pressed ? color + "18" : "var(--bg2)",
        border: `1px solid ${pressed ? color + "44" : "var(--border)"}`,
        borderRadius: 14, padding: "14px 12px", cursor: "pointer",
        textAlign: "left", fontFamily: "inherit", width: "100%",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "all 0.12s ease",
        boxShadow: pressed ? `0 4px 16px ${color}22` : "none",
      }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 10, color, letterSpacing: 2, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function ActionBtn({ icon, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{
        width: 38, height: 38, borderRadius: "50%",
        background: pressed ? "var(--bg3)" : "var(--bg2)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 16,
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "all 0.1s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >{icon}</button>
  );
}
