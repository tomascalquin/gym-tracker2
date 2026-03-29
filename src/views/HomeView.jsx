import { useState, useEffect } from "react";
import { DAY_META } from "../data/routine";
import { getSessionKey } from "../utils/storage";
import { getWeekNumber } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";
import { calcStreak } from "../utils/streak";
import { loadFriendActivity, saveLastVisit } from "../utils/activity";
import { loadFriends } from "../utils/friends";
import ActivityFeed from "../components/ActivityFeed";
import XPBar from "../components/XPBar";
import { registerPushNotifications, hasNotificationPermission } from "../utils/notifications";
import { tokens } from "../design";
import ActiveSessionBanner from "../components/ActiveSessionBanner";
import { haptics } from "../utils/haptics";

const T = tokens;

export default function HomeView({ logs, user, myProfile, routine, userXP, sessionDate, setSessionDate, onStartSession, onNavigate, onLogout, activeDay, completedSets, onDiscardSession }) {
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
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* ── Header editorial ── */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--text3)", fontWeight: 700, marginBottom: 4 }}>
              GYM TRACKER
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: -1, lineHeight: 1.1 }}>
              {firstName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
              {totalSessions} sesiones · sem {getWeekNumber()}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <ActionBtn label="👤" onClick={() => onNavigate("profile")} />
            <ActionBtn label="⎋" onClick={onLogout} />
          </div>
        </div>

        {/* ── Línea divisoria + stats ── */}
        <div style={{ borderTop: "1.5px solid var(--text)", borderBottom: "1.5px solid var(--text)", padding: "12px 0", display: "flex", marginBottom: 24 }}>
          <StatCell label="SESIONES" value={totalSessions} />
          <StatCell label="RACHA" value={`${streak}${streak > 0 ? "🔥" : ""}`} border />
          <StatCell label="SEMANA" value={Object.values(logs).filter(s => {
            const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay()+6)%7)); mon.setHours(0,0,0,0);
            return new Date(s.date) >= mon;
          }).length} border />
        </div>
      </div>

      <div style={{ padding: "0 20px 100px" }}>

        {/* XP bar */}
        <XPBar xp={userXP || 0} />

        {/* Feed amigos */}
        {showFeed && <ActivityFeed activity={activity} onDismiss={() => setShowFeed(false)} />}

        {/* Banner sesión activa */}
        {activeDay && (
          <ActiveSessionBanner
            activeDay={activeDay}
            sessionDate={sessionDate}
            completedSets={completedSets || {}}
            routine={routine}
            onResume={() => onStartSession(activeDay, sessionDate)}
            onDiscard={onDiscardSession}
          />
        )}

        {/* ── Selector de fecha ── */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            style={{
              width: "100%", background: "var(--bg3)",
              border: "1px solid var(--border)",
              color: "var(--text)", padding: "10px 14px",
              borderRadius: tokens.radius.md,
              fontSize: 14, fontFamily: "inherit", outline: "none",
            }}
          />
        </div>

        {/* ── Días — el usuario elige ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--text3)", fontWeight: 700, marginBottom: 14 }}>
            ELIGE TU SESIÓN
          </div>
          {routineDays.map((day, i) => {
            const meta     = DAY_META[day] || { accent: "#111", tag: "DÍA" };
            const hasLog   = !!logs[getSessionKey(day, sessionDate)];
            const exCount  = routine[day]?.exercises?.length || 0;
            // Última sesión de este día
            const lastSessions = Object.entries(logs)
              .filter(([k]) => k.startsWith(day + "__"))
              .sort(([,a],[,b]) => b.date?.localeCompare(a.date));
            const lastDate = lastSessions[0]?.[1]?.date;
            let lastLabel = "";
            if (lastDate) {
              const diff = Math.floor((Date.now() - new Date(lastDate)) / 86400000);
              lastLabel = diff === 0 ? "hoy" : diff === 1 ? "ayer" : `hace ${diff}d`;
            }
            return (
              <DayRow
                key={day}
                day={day}
                hasLog={hasLog}
                exCount={exCount}
                lastLabel={lastLabel}
                index={i}
                onClick={() => { haptics.light(); onStartSession(day); }}
              />
            );
          })}
        </div>

        {/* ── Accesos rápidos — tabla editorial ── */}
        <div style={{ borderTop: "1.5px solid var(--text)", marginTop: 28, marginBottom: 0 }}>
          {[
            { icon: "📊", label: "Progresión",   sub: "Calculadora",   key: "progression" },
            { icon: "🤖", label: "Semana IA",    sub: "Análisis",      key: "weeklySummary" },
            { icon: "🏅", label: "Logros",       sub: "Achievements",  key: "achievements" },
            { icon: "✈️", label: "Modo viaje",   sub: "Sin gym",       key: "travelMode" },
            { icon: "🏆", label: "Grupos",       sub: "Comparar",      key: "groups" },
            { icon: "⚔️", label: "Retos",        sub: "1 vs 1",        key: "challenges" },
            { icon: "✏️", label: "Rutina",       sub: "Editar",        key: "editRoutine" },
          ].map((item, i) => (
            <button
              key={item.key}
              onClick={() => { haptics.light(); onNavigate(item.key); }}
              style={{
                width: "100%", background: "transparent",
                border: "none", borderBottom: "1px solid var(--border)",
                padding: "13px 0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", fontFamily: "inherit",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{item.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
              <span style={{ color: "var(--text3)", fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        {/* ── Export ── */}
        <button
          onClick={() => exportToExcel(logs)}
          style={{
            width: "100%", background: "transparent",
            border: "1px solid var(--border)", color: "var(--text3)",
            padding: "12px", borderRadius: tokens.radius.md,
            fontSize: 9, letterSpacing: 2.5, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer",
            marginTop: 20,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          ↓ EXPORTAR EXCEL
        </button>

        {/* Notificaciones */}
        {"Notification" in window && !hasNotificationPermission() && (
          <button onClick={() => registerPushNotifications(user.uid)} style={{
            width: "100%", background: "transparent",
            border: "1px solid var(--border)", color: "var(--text3)",
            padding: "12px", borderRadius: tokens.radius.md,
            fontSize: 9, letterSpacing: 2, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer", marginTop: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>🔔 ACTIVAR NOTIFICACIONES</button>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value, border }) {
  return (
    <div style={{
      flex: 1, textAlign: "center",
      borderRight: border ? "1px solid var(--border)" : "none",
    }}>
      <div className="mono" style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 7, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DayRow({ day, hasLog, exCount, lastLabel, index, onClick }) {
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
        background: pressed ? "var(--bg3)" : hasLog ? "var(--text)" : "var(--bg2)",
        border: `1px solid ${hasLog ? "var(--text)" : "var(--border)"}`,
        borderRadius: tokens.radius.lg,
        padding: "14px 16px", cursor: "pointer",
        marginBottom: 8,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.1s ease, background 0.15s",
        animation: `slideDown 0.2s ease ${index * 0.05}s both`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{
            fontSize: 15, fontWeight: 800, letterSpacing: -0.3,
            color: hasLog ? "var(--bg)" : "var(--text)",
          }}>{day}</span>
          {hasLog && (
            <span style={{
              fontSize: 8, background: "rgba(245,245,240,0.2)",
              color: "var(--bg)", padding: "2px 8px",
              borderRadius: 99, letterSpacing: 1.5, fontWeight: 700,
            }}>✓ REGISTRADO</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: hasLog ? "rgba(245,245,240,0.5)" : "var(--text3)" }}>
          {exCount} ejercicios{lastLabel ? ` · ${lastLabel}` : ""}
        </div>
      </div>
      <span style={{ color: hasLog ? "rgba(245,245,240,0.6)" : "var(--text3)", fontSize: 20 }}>›</span>
    </button>
  );
}

function ActionBtn({ label, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
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
    >{label}</button>
  );
}
