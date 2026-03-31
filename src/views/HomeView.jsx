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
import ActiveSessionBanner from "../components/ActiveSessionBanner";
import { haptics } from "../utils/haptics";

export default function HomeView({ logs, user, myProfile, routine, userXP, sessionDate, setSessionDate, onStartSession, onNavigate, onLogout, activeDay, completedSets, onDiscardSession }) {
  const firstName     = (user?.displayName || user?.email || "Atleta").split(" ")[0];
  const streak        = calcStreak(logs);
  const routineDays   = Object.keys(routine || {});
  const totalSessions = Object.keys(logs).length;
  const [activity, setActivity]   = useState([]);
  const [showFeed, setShowFeed]   = useState(false);
  const weekSessions = Object.values(logs).filter(s => {
    const mon = new Date();
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    return new Date(s.date) >= mon;
  }).length;

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
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.3s ease" }}>

      {/* ── Header ── */}
      <div style={{ padding: "28px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3.5, color: "var(--text3)", fontWeight: 700, marginBottom: 6 }}>
              GYM TRACKER
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: -1.5, lineHeight: 1 }}>
              {firstName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
              {totalSessions} sesiones · semana {getWeekNumber()}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <GlassIconBtn label="👤" onClick={() => onNavigate("profile")} />
            <GlassIconBtn label="⎋" onClick={onLogout} />
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <StatCard label="SESIONES" value={totalSessions} />
          <StatCard label="RACHA" value={streak > 0 ? `${streak} 🔥` : streak} />
          <StatCard label="SEMANA" value={weekSessions} />
        </div>

        {/* ── XP bar glass ── */}
        <XPBar xp={userXP || 0} />
      </div>

      <div style={{ padding: "16px 20px 40px" }}>

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
              width: "100%",
              padding: "11px 14px",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* ── Días ── */}
        <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--text3)", fontWeight: 700, marginBottom: 12 }}>
          ELIGE TU SESIÓN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
          {routineDays.map((day, i) => {
            const hasLog   = !!logs[getSessionKey(day, sessionDate)];
            const exCount  = routine[day]?.exercises?.length || 0;
            const lastSessions = Object.entries(logs)
              .filter(([k]) => k.startsWith(day + "__"))
              .sort(([, a], [, b]) => b.date?.localeCompare(a.date));
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

        {/* ── Accesos rápidos glass grid ── */}
        <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--text3)", fontWeight: 700, marginBottom: 12 }}>
          HERRAMIENTAS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { icon: "📊", label: "Progresión",   sub: "Calculadora",   key: "progression" },
            { icon: "🔧", label: "Herramientas", sub: "Calculadoras",  key: "tools" },
            { icon: "🤖", label: "Semana IA",    sub: "Análisis",      key: "weeklySummary" },
            { icon: "🏅", label: "Logros",       sub: "Achievements",  key: "achievements" },
            { icon: "✈️", label: "Modo viaje",   sub: "Sin gym",       key: "travelMode" },
            { icon: "🏆", label: "Grupos",       sub: "Comparar",      key: "groups" },
            { icon: "⚔️", label: "Retos",        sub: "1 vs 1",        key: "challenges" },
            { icon: "✏️", label: "Rutina",       sub: "Editar",        key: "editRoutine" },
          ].map((item) => (
            <QuickCard
              key={item.key}
              icon={item.icon}
              label={item.label}
              sub={item.sub}
              onClick={() => { haptics.light(); onNavigate(item.key); }}
            />
          ))}
        </div>

        {/* ── Utilidades ── */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => exportToExcel(logs)}
            style={{
              flex: 1,
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur-sm)",
              WebkitBackdropFilter: "var(--glass-blur-sm)",
              border: "1px solid var(--glass-border)",
              color: "var(--text3)",
              padding: "12px",
              borderRadius: 14,
              fontSize: 9, letterSpacing: 2, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ↓ EXPORTAR EXCEL
          </button>
          {"Notification" in window && !hasNotificationPermission() && (
            <button onClick={() => registerPushNotifications(user.uid)} style={{
              flex: 1,
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur-sm)",
              WebkitBackdropFilter: "var(--glass-blur-sm)",
              border: "1px solid var(--glass-border)",
              color: "var(--text3)",
              padding: "12px",
              borderRadius: 14,
              fontSize: 9, letterSpacing: 2, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}>🔔 NOTIFICACIONES</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div style={{
      flex: 1, textAlign: "center",
      background: "var(--glass-bg)",
      backdropFilter: "var(--glass-blur)",
      WebkitBackdropFilter: "var(--glass-blur)",
      border: "1px solid var(--glass-border)",
      borderRadius: 16,
      padding: "12px 8px",
    }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
        {value}
      </div>
      <div style={{ fontSize: 7, color: "var(--text3)", letterSpacing: 2, fontWeight: 700, marginTop: 3 }}>
        {label}
      </div>
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
      onMouseLeave={() => setPressed(false)}
      className="day-row-btn"
      style={{
        width: "100%", textAlign: "left", fontFamily: "inherit",
        background: hasLog
          ? "rgba(255,255,255,0.90)"
          : pressed
            ? "rgba(255,255,255,0.12)"
            : "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: `1px solid ${hasLog ? "rgba(255,255,255,0.95)" : "var(--glass-border)"}`,
        borderRadius: 18,
        padding: "14px 16px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.12s ease, background 0.15s",
        animationDelay: `${index * 0.04}s`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{
            fontSize: 15, fontWeight: 800, letterSpacing: -0.3,
            color: hasLog ? "#080810" : "#fff",
          }}>{day}</span>
          {hasLog && (
            <span style={{
              fontSize: 8,
              background: "rgba(8,8,16,0.10)",
              color: "rgba(8,8,16,0.55)",
              padding: "2px 8px",
              borderRadius: 99, letterSpacing: 1.5, fontWeight: 700,
            }}>✓ HOY</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: hasLog ? "rgba(8,8,16,0.40)" : "var(--text3)" }}>
          {exCount} ejercicios{lastLabel ? ` · ${lastLabel}` : ""}
        </div>
      </div>
      <span style={{ color: hasLog ? "rgba(8,8,16,0.25)" : "rgba(255,255,255,0.20)", fontSize: 20 }}>›</span>
    </button>
  );
}

function QuickCard({ icon, label, sub, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: pressed ? "rgba(255,255,255,0.12)" : "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border)",
        borderRadius: 18, padding: "14px",
        textAlign: "left", cursor: "pointer",
        fontFamily: "inherit",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 0.12s ease, background 0.15s",
        WebkitTapHighlightColor: "transparent",
        minHeight: 0,
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: -0.2 }}>{label}</div>
      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{sub}</div>
    </button>
  );
}

function GlassIconBtn({ label, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: 38, height: 38, borderRadius: "50%",
        background: pressed ? "rgba(255,255,255,0.15)" : "var(--glass-bg)",
        backdropFilter: "var(--glass-blur-sm)",
        WebkitBackdropFilter: "var(--glass-blur-sm)",
        border: "1px solid var(--glass-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 16, minHeight: 38,
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "all 0.1s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >{label}</button>
  );
}
