import { useState, useEffect, useCallback } from "react";
import { DAY_META } from "../data/routine";
import { getSessionKey, todayStr } from "../utils/storage";
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
import OnboardingChecklist from "../components/OnboardingChecklist";
import {
  loadOnboarding, dismissOnboarding, markVisited,
  evaluateChecklist, claimBonus, BONUS_XP,
} from "../utils/onboarding";

export default function HomeView({
  logs, user, myProfile, routine, userXP,
  sessionDate, setSessionDate,
  onStartSession, onNavigate, onLogout,
  activeDay, completedSets, onDiscardSession,
  onClaimBonusXP,
}) {
  const firstName     = (user?.displayName || user?.email || "Atleta").split(" ")[0];
  const streak        = calcStreak(logs);
  const routineDays   = Object.keys(routine || {});
  const totalSessions = Object.keys(logs).length;
  const [activity, setActivity]     = useState([]);
  const [showFeed, setShowFeed]     = useState(false);
  const [toolsOpen, setToolsOpen]   = useState(false);
  const [onboarding, setOnboarding] = useState(null);
  const [hasFriend, setHasFriend]   = useState(false);

  const weekSessions = Object.values(logs).filter(s => {
    const mon = new Date();
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    return new Date(s.date) >= mon;
  }).length;

  // Cargar estado de onboarding + amigos
  useEffect(() => {
    async function load() {
      const ob = loadOnboarding(user.uid);
      if (ob.dismissed) { setOnboarding(null); return; }

      // Chequear si tiene amigos (para item "add_friend")
      try {
        const friends = await loadFriends(user.uid);
        setHasFriend(friends.length > 0);
        const recent = await loadFriendActivity(friends.map(f => f.uid));
        if (recent.length > 0) { setActivity(recent); setShowFeed(true); }
      } catch {}
      finally { saveLastVisit(); }
    }
    load();
  }, [user.uid]);

  // Evaluar checklist cuando cambian los logs
  useEffect(() => {
    if (!user?.uid) return;
    const ob = loadOnboarding(user.uid);
    if (ob.dismissed) return;
    const result = evaluateChecklist(user.uid, { logs, hasFriend });
    setOnboarding({
      ...ob,
      completed:   result.allCompleted,
      allDone:     result.allDone,
      bonusClaimed: result.bonusClaimed,
    });
  }, [logs, hasFriend, user.uid]);

  // Navegar y registrar visita
  const handleNavigate = useCallback((view) => {
    markVisited(user.uid, view);
    // Re-evaluar para marcar items como completados
    const result = evaluateChecklist(user.uid, { logs, hasFriend });
    setOnboarding(prev => prev ? {
      ...prev,
      completed:   result.allCompleted,
      allDone:     result.allDone,
    } : prev);
    onNavigate(view);
  }, [user.uid, logs, hasFriend, onNavigate]);

  async function handleClaimBonus() {
    claimBonus(user.uid);
    setOnboarding(prev => prev ? { ...prev, bonusClaimed: true } : prev);
    if (onClaimBonusXP) await onClaimBonusXP(BONUS_XP);
  }

  function handleDismissOnboarding() {
    // Si allDone → claim bonus, si no → dismiss
    if (onboarding?.allDone && !onboarding?.bonusClaimed) {
      handleClaimBonus();
    } else {
      dismissOnboarding(user.uid);
      setOnboarding(null);
    }
  }

  // Día recomendado = el que hace más tiempo no se entrena
  const recommendedDay = (() => {
    if (!routineDays.length) return null;
    const withDiff = routineDays.map(day => {
      const last = Object.entries(logs)
        .filter(([k]) => k.startsWith(day + "__"))
        .sort(([, a], [, b]) => b.date?.localeCompare(a.date))[0];
      const diff = last
        ? Math.floor((Date.now() - new Date(last[1].date)) / 86400000)
        : 999;
      return { day, diff };
    });
    return withDiff.sort((a, b) => b.diff - a.diff)[0]?.day;
  })();

  const recMeta    = recommendedDay ? (DAY_META[recommendedDay] || {}) : {};
  const recHasLog  = recommendedDay ? !!logs[getSessionKey(recommendedDay, sessionDate)] : false;
  const recExCount = recommendedDay ? (routine[recommendedDay]?.exercises?.length || 0) : 0;

  const showChecklist = onboarding &&
    !onboarding.dismissed &&
    !(onboarding.allDone && onboarding.bonusClaimed);

  const TOOLS = [
    { icon: "📊", label: "Progresión",   sub: "Calculadora",    key: "progression" },
    { icon: "😴", label: "Sueño",        sub: "Descanso",       key: "sleep" },
    { icon: "📸", label: "Fotos",        sub: "Progreso",       key: "photos" },
    { icon: "🔧", label: "Herramientas", sub: "Calculadoras",   key: "tools" },
    { icon: "📋", label: "Plantillas",   sub: "Reemplazar",     key: "routinePresets" },
    { icon: "🤖", label: "Semana IA",    sub: "Análisis",       key: "weeklySummary" },
    { icon: "🏅", label: "Logros",       sub: "Achievements",   key: "achievements" },
    { icon: "✈️", label: "Modo viaje",   sub: "Sin gym",        key: "travelMode" },
    { icon: "🏆", label: "Grupos",       sub: "Comparar",       key: "groups" },
    { icon: "⚔️", label: "Retos",        sub: "1 vs 1",         key: "challenges" },
    { icon: "✏️", label: "Rutina",       sub: "Editar",         key: "editRoutine" },
    { icon: "📅", label: "Mesociclo",    sub: "Planificación",  key: "mesocycle" },
  ];

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.3s ease" }}>

      {/* ── Header ── */}
      <div style={{ padding: "28px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3.5, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 6 }}>
              GYM TRACKER
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: -1.5, lineHeight: 1 }}>
              {firstName}
            </div>
            <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", marginTop: 5 }}>
              {totalSessions} sesiones · semana {getWeekNumber()}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <GlassIconBtn label="👤" onClick={() => handleNavigate("profile")} />
            <GlassIconBtn label="⎋" onClick={onLogout} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <StatCard label="SESIONES" value={totalSessions} />
          <StatCard label="RACHA"    value={streak > 0 ? `${streak} 🔥` : streak} />
          <StatCard label="SEMANA"   value={weekSessions} />
        </div>

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

        {/* ── Checklist de bienvenida ── */}
        {showChecklist && (
          <OnboardingChecklist
            uid={user.uid}
            completed={onboarding.completed}
            allDone={onboarding.allDone}
            bonusClaimed={onboarding.bonusClaimed}
            onNavigate={handleNavigate}
            onDismiss={handleDismissOnboarding}
          />
        )}

        {/* ── Hero: DÍA RECOMENDADO ── */}
        {recommendedDay && !activeDay && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 10 }}>
              RECOMENDADO HOY
            </div>
            <button
              onClick={() => { haptics.light(); onStartSession(recommendedDay); }}
              style={{
                width: "100%", textAlign: "left", fontFamily: "inherit",
                background: `linear-gradient(135deg, ${recMeta.accent || "#7c3aed"}22, ${recMeta.accent || "#7c3aed"}0a)`,
                backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                border: `1px solid ${recMeta.accent || "#7c3aed"}44`,
                borderRadius: 20, padding: "18px 20px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                WebkitTapHighlightColor: "transparent",
                boxShadow: `0 4px 24px ${recMeta.accent || "#7c3aed"}18`,
              }}
            >
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: recMeta.accent || "#a78bfa", fontWeight: 700, marginBottom: 6 }}>
                  {recMeta.tag || "SESIÓN"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.8, marginBottom: 4 }}>
                  {recommendedDay}
                </div>
                <div style={{ fontSize: 11, color: "rgba(240,240,240,0.50)" }}>
                  {recExCount} ejercicios
                  {recHasLog ? " · ✓ ya registrado hoy" : ""}
                </div>
              </div>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: recMeta.accent ? `${recMeta.accent}25` : "rgba(167,139,250,0.20)",
                border: `1.5px solid ${recMeta.accent || "#a78bfa"}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                ▶
              </div>
            </button>
          </div>
        )}

        {/* ── Selector de fecha + todos los días ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 10 }}>
            TODOS LOS DÍAS
          </div>

          {/* Date picker compacto */}
          <div style={{ marginBottom: 10 }}>
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", borderRadius: 12 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              const isRec = day === recommendedDay;
              return (
                <DayRow
                  key={day}
                  day={day}
                  hasLog={hasLog}
                  exCount={exCount}
                  lastLabel={lastLabel}
                  index={i}
                  isRecommended={isRec}
                  onClick={() => { haptics.light(); onStartSession(day); }}
                />
              );
            })}
          </div>
        </div>

        {/* ── Herramientas colapsables ── */}
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setToolsOpen(v => !v)}
            style={{
              width: "100%", background: "none", border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 2px", cursor: "pointer", fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>
              HERRAMIENTAS
            </div>
            <span style={{
              fontSize: 14, color: "rgba(240,240,240,0.25)",
              transition: "transform 0.2s",
              transform: toolsOpen ? "rotate(180deg)" : "rotate(0)",
            }}>˅</span>
          </button>

          {toolsOpen && (
            <div style={{ animation: "slideDown 0.2s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {TOOLS.map(item => (
                  <QuickCard
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    sub={item.sub}
                    onClick={() => { haptics.light(); handleNavigate(item.key); }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => exportToExcel(logs)} style={S.utilBtn}>
                  ↓ EXPORTAR EXCEL
                </button>
                {"Notification" in window && !hasNotificationPermission() && (
                  <button onClick={() => registerPushNotifications(user.uid)} style={S.utilBtn}>
                    🔔 NOTIFICACIONES
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div style={{
      flex: 1, textAlign: "center",
      background: "var(--glass-bg)",
      backdropFilter: "var(--glass-blur)",
      WebkitBackdropFilter: "var(--glass-blur)",
      border: "1px solid var(--glass-border)",
      borderRadius: 16, padding: "12px 8px",
    }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 7, color: "rgba(240,240,240,0.30)", letterSpacing: 2, fontWeight: 700, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function DayRow({ day, hasLog, exCount, lastLabel, index, onClick, isRecommended }) {
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
          : pressed ? "rgba(255,255,255,0.12)" : "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: `1px solid ${hasLog ? "rgba(255,255,255,0.95)" : "var(--glass-border)"}`,
        borderRadius: 16, padding: "12px 16px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.12s ease, background 0.15s",
        animationDelay: `${index * 0.04}s`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: hasLog ? "#080810" : "#fff" }}>{day}</span>
          {hasLog && (
            <span style={{ fontSize: 8, background: "rgba(8,8,16,0.10)", color: "rgba(8,8,16,0.55)", padding: "2px 7px", borderRadius: 99, letterSpacing: 1.5, fontWeight: 700 }}>✓ HOY</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: hasLog ? "rgba(8,8,16,0.40)" : "rgba(240,240,240,0.35)" }}>
          {exCount} ejercicios{lastLabel ? ` · ${lastLabel}` : ""}
        </div>
      </div>
      <span style={{ color: hasLog ? "rgba(8,8,16,0.25)" : "rgba(255,255,255,0.20)", fontSize: 18 }}>›</span>
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
        backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border)",
        borderRadius: 16, padding: "13px",
        textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 0.12s ease, background 0.15s",
        WebkitTapHighlightColor: "transparent", minHeight: 0,
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{label}</div>
      <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", marginTop: 1 }}>{sub}</div>
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
        width: 38, height: 38, borderRadius: "50%", minHeight: 38,
        background: pressed ? "rgba(255,255,255,0.15)" : "var(--glass-bg)",
        backdropFilter: "var(--glass-blur-sm)", WebkitBackdropFilter: "var(--glass-blur-sm)",
        border: "1px solid var(--glass-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 16,
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "all 0.1s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >{label}</button>
  );
}

const S = {
  utilBtn: {
    flex: 1, background: "var(--glass-bg)",
    backdropFilter: "var(--glass-blur-sm)", WebkitBackdropFilter: "var(--glass-blur-sm)",
    border: "1px solid var(--glass-border)",
    color: "rgba(240,240,240,0.30)", padding: "11px",
    borderRadius: 12, fontSize: 9, letterSpacing: 2, fontWeight: 700,
    fontFamily: "inherit", cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
};
