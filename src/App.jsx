import { useState, useEffect } from "react";
import {
  loadLogs, saveLog, deleteLog,
  loadRoutine, saveFullRoutine,
  addExerciseToRoutine, removeExerciseFromRoutine,
  getSessionKey, todayStr,
} from "./utils/storage";
import { onAuthChange, logout, checkRedirectResult } from "./utils/auth";
import { initPublicProfile } from "./utils/friends";
import { loadUserXP, addXP, calcSessionXP, getRank } from "./utils/ranks";
import { calcStreak } from "./utils/streak";
import { registerServiceWorker, showLocalNotification } from "./utils/notifications";
import { applyTheme, getTheme } from "./utils/theme";
import { checkInviteParam, processPendingInvite } from "./utils/invite";
import { saveDraft, loadDraft, clearDraft } from "./utils/sessionDraft";
import ChatView from "./components/ChatView";
import { getDMChatId, getGroupChatId } from "./utils/chat";
import AuthScreen from "./components/AuthScreen";
import Toast from "./components/Toast";
import RankUpModal from "./components/RankUpModal";
import RestTimer from "./components/RestTimer";
import HomeView from "./views/HomeView";
import SessionView from "./views/SessionView";
import HistoryView from "./views/HistoryView";
import ProgressView from "./views/ProgressView";
import FriendsView from "./views/friends/FriendsView";
import GroupsView from "./views/groups/GroupsView";
import ChallengesView from "./views/ChallengesView";
import LeaderboardView from "./views/LeaderboardView";
import ProfileView from "./views/ProfileView";
import ProgressionView from "./views/ProgressionView";
import TabBar, { TAB_VIEWS } from "./components/TabBar";
import PageTransition from "./components/PageTransition";
import SplashScreen from "./components/SplashScreen";
import Confetti from "./components/Confetti";
import { haptics } from "./utils/haptics";
import { initPWAInstall, canInstall, installPWA, isInstalled } from "./utils/pwa";
import SessionTransition from "./components/SessionTransition";
import { DAY_META } from "./data/routine";
import EditRoutineView from "./views/EditRoutineView";
import OnboardingView from "./views/OnboardingView";
import WeeklySummaryView from "./views/WeeklySummaryView";
import AchievementsView from "./views/AchievementsView";
import TravelModeView from "./views/TravelModeView";
import ToolsView from "./views/ToolsView";
import { evaluateAchievements, getNewlyUnlocked, saveUnlockedAchievements, loadUnlockedAchievements } from "./utils/achievements";
import { registerOnlineListener, getPendingCount } from "./utils/offlineQueue";

export default function App() {
  const [user, setUser]                     = useState(undefined);
  const [authReady, setAuthReady]           = useState(false);
  const [myProfile, setMyProfile]           = useState(null);
  const [view, setView]                     = useState("home");
  const [activeDay, setActiveDay]           = useState(null);
  const [sessionDate, setSessionDate]       = useState(todayStr());
  const [logs, setLogs]                     = useState({});
  const [routine, setRoutine]               = useState(undefined);
  const [sessionData, setSessionData]       = useState({});
  const [completedSets, setCompletedSets]   = useState({});
  const [sessionNote, setSessionNote]       = useState("");
  const [toastMsg, setToastMsg]             = useState(null);
  const [dataLoading, setDataLoading]       = useState(false);
  const [userXP, setUserXP]                 = useState(0);
  const [rankUpData, setRankUpData]         = useState(null);
  const [chatTarget, setChatTarget]         = useState(null);
  const [showConfetti, setShowConfetti]     = useState(false);
  const [sessionTransition, setSessionTransition] = useState(null);
  const [showInstall, setShowInstall]         = useState(false); 
  const [theme, setTheme]                   = useState(getTheme);
  const [timerOpen, setTimerOpen]           = useState(false);
  const [timerVisible, setTimerVisible]     = useState(false);
  const [timerState, setTimerState]         = useState({ selected: 90, timeLeft: null, running: false, endTime: null }); 

  const [isOffline, setIsOffline]           = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(fb => { setUser(fb); setAuthReady(true); });
    checkRedirectResult().catch(console.error);
    registerServiceWorker();
    const saved = getTheme();
    applyTheme(saved);
    checkInviteParam();
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) { setRoutine(undefined); return; }
    setDataLoading(true);
    setView("home");
    Promise.all([
      loadLogs(user.uid),
      loadRoutine(user.uid),
      initPublicProfile(user.uid, user.displayName, user.email),
      loadUserXP(user.uid),
    ])
      .then(([logsData, routineData, profile, xpData]) => {
        setLogs(logsData);
        setRoutine(routineData);
        setMyProfile(profile);
        setUserXP(xpData.xp || 0);
        // Procesar invitación pendiente si existe
        processPendingInvite(user.uid).then(inviter => {
          if (inviter) toast(`✓ Solicitud enviada a ${inviter.displayName}`);
        });
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [user?.uid]);

  function toast(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2200); }

  function handleToggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  function handleProfileUpdated(updated) {
    setMyProfile(updated);
  }

  // Init PWA install
  useEffect(() => {
    initPWAInstall();
    setTimeout(() => {
      if (canInstall() && !isInstalled()) setShowInstall(true);
    }, 3000);
  }, []);

  // Auto-guardar borrador de sesión en localStorage
  useEffect(() => {
    if (view === "session" && activeDay && user) {
      saveDraft(user.uid, { activeDay, sessionDate, sessionData, completedSets, sessionNote });
    }
  }, [sessionData, completedSets, sessionNote, view, activeDay]);

  async function handleLogout() {
    await logout();
    setLogs({}); setRoutine(undefined); setMyProfile(null); setView("home"); setUserXP(0);
  }

  async function handleRoutineReady(newRoutine) {
    await saveFullRoutine(user.uid, newRoutine);
    setRoutine(newRoutine);
    toast("Rutina guardada 💪");
  }

  function startSession(day, overrideDate) {
    const date   = overrideDate || sessionDate;
    const key    = getSessionKey(day, date);
    const existing = logs[key];
    const dayExs = routine?.[day]?.exercises || [];

    // Verificar si hay un draft guardado para este día
    const draft = loadDraft(user.uid);
    if (draft && draft.activeDay === day && draft.sessionDate === date) {
      setSessionData(draft.sessionData);
      setCompletedSets(draft.completedSets);
      setSessionNote(draft.sessionNote || "");
      
      const meta  = DAY_META[day];
      const color = meta?.accent || "#60a5fa";
      setSessionTransition(color);
      setTimeout(() => {
        window.scrollTo(0, 0); 
        setActiveDay(day); 
        setView("session");
      }, 280);
      return;
    }

    if (existing) {
      setSessionData(existing.sets);
      setCompletedSets(existing.completed || {});
      setSessionNote(existing.note || "");
    } else {
      const lastKey = Object.keys(logs).filter(k => k.startsWith(day + "__")).sort().reverse()[0];
      const defaults = {};
      dayExs.forEach((ex, ei) => {
        const src = lastKey ? (logs[lastKey].sets[ei] || ex.sets) : ex.sets;
        defaults[ei] = src.map(s => ({ weight: s.weight, reps: s.reps, note: s.note || "" }));
      });
      setSessionData(defaults); setCompletedSets({}); setSessionNote("");
    }
    
    // Panel negro cubre pantalla en 280ms, luego swapeamos vista
    const meta  = DAY_META[day];
    const color = meta?.accent || "#60a5fa";
    setSessionTransition(color);
    setTimeout(() => {
      window.scrollTo(0, 0); 
      setActiveDay(day); 
      setView("session");
    }, 280);
  }

  async function saveSession() {
    const key     = getSessionKey(activeDay, sessionDate);
    const session = { day: activeDay, date: sessionDate, sets: sessionData, completed: completedSets, note: sessionNote };

    // Limpiar draft al guardar
    clearDraft();

    const streak  = calcStreak(logs);
    const { xp: xpEarned, reasons, prs } = calcSessionXP(session, logs, routine, streak);

    const newLogs = { ...logs, [key]: session };
    setLogs(newLogs);
    await saveLog(user.uid, key, session);

    const displayName = user.displayName || user.email.split("@")[0];
    const result = await addXP(user.uid, displayName, xpEarned, reasons.join(" | "));
    setUserXP(result.newXP);

    // ── Detectar logros nuevos ─────────────────────────────────────────────
    const prevUnlocked = loadUnlockedAchievements(user.uid);
    const currUnlocked = evaluateAchievements(newLogs, routine, result.newXP);
    const newAchs      = getNewlyUnlocked(prevUnlocked, currUnlocked);
    saveUnlockedAchievements(user.uid, currUnlocked);
    if (newAchs.length > 0) {
      setTimeout(() => toast(`${newAchs[0].icon} LOGRO: ${newAchs[0].title}`), 800);
    }
    // ──────────────────────────────────────────────────────────────────────

    setShowConfetti(true);
    haptics.celebrate();
    if (result.rankUp) {
      setRankUpData({ oldRank: result.oldRank, newRank: result.newRank, xpGained: xpEarned, prs });
      showLocalNotification("¡Subiste de rango! 🎉", `Ahora eres ${result.newRank.emoji} ${result.newRank.name}`);
    } else {
      toast(`+${xpEarned} XP 💪${prs.length ? ` · 🏆 PR en ${prs[0]}` : ""}`);
      if (prs.length) showLocalNotification("🏆 Nuevo PR", `${prs[0]} — ${xpEarned} XP ganados`);
    }
  }

  function handleDiscardSession() {
    setActiveDay(null);
    setSessionData({});
    setCompletedSets({});
    setSessionNote("");
  }

  function updateSet(ei, si, field, val) {
    setSessionData(prev => { const c = { ...prev, [ei]: [...(prev[ei] || [])] }; c[ei][si] = { ...c[ei][si], [field]: val }; return c; });
  }
  function toggleSet(ei, si) { const k = `${ei}-${si}`; setCompletedSets(prev => ({ ...prev, [k]: !prev[k] })); }
  function addSet(ei) {
    setSessionData(prev => { const curr = prev[ei] || []; const last = curr[curr.length - 1] || { weight: 0, reps: 0 }; return { ...prev, [ei]: [...curr, { weight: last.weight, reps: last.reps, note: "" }] }; });
  }

  function removeSet(ei, si) {
    setSessionData(prev => {
      const curr = [...(prev[ei] || [])];
      if (curr.length <= 1) return prev; // no borrar si es la única serie
      curr.splice(si, 1);
      return { ...prev, [ei]: curr };
    });
    // Limpiar el completedSet de esa fila
    setCompletedSets(prev => {
      const updated = { ...prev };
      delete updated[`${ei}-${si}`];
      // Reindexar los que vienen después
      Object.keys(updated).forEach(key => {
        const [kei, ksi] = key.split("-").map(Number);
        if (kei === ei && ksi > si) {
          updated[`${ei}-${ksi - 1}`] = updated[key];
          delete updated[key];
        }
      });
      return updated;
    });
  }

  async function handleDeleteSession(key) {
    setLogs(prev => { const n = { ...prev }; delete n[key]; return n; });
    await deleteLog(user.uid, key);
  }

  async function handleAddExercise(day, exercise) {
    await addExerciseToRoutine(user.uid, day, exercise);
    setRoutine(prev => ({ ...prev, [day]: { exercises: [...(prev[day]?.exercises || []), { ...exercise, custom: true }] } }));
    toast(`"${exercise.name}" agregado 💪`);
  }

  async function handleRemoveExercise(day, exIndex) {
    const exercise = routine[day]?.exercises[exIndex];
    if (!exercise?.custom) return;
    await removeExerciseFromRoutine(user.uid, day, exercise);
    setRoutine(prev => ({ ...prev, [day]: { exercises: prev[day].exercises.filter((_, i) => i !== exIndex) } }));
    toast("Ejercicio eliminado");
  }

  if (!authReady || user === undefined) return <Splash text="CARGANDO" />;
  if (!user) return <AuthScreen />;
  if (dataLoading || routine === undefined) return <Splash text={`HOLA, ${(user.displayName || user.email).split(" ")[0].toUpperCase()}`} />;
  if (routine === null) return <OnboardingView user={user} onRoutineReady={handleRoutineReady} />;

  return (
    <>
      <Toast message={toastMsg} />

      {/* Offline banner */}
      {isOffline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
          background: "#111", borderBottom: "1px solid #333",
          padding: "8px 18px", textAlign: "center",
          fontSize: 10, color: "#f5f5f0", letterSpacing: 2, fontWeight: 700,
          fontFamily: "inherit",
        }}>
          SIN CONEXIÓN — los cambios se guardarán cuando vuelva internet
        </div>
      )}

      {rankUpData && (
        <RankUpModal
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          xpGained={rankUpData.xpGained}
          prs={rankUpData.prs}
          onClose={() => setRankUpData(null)}
        />
      )}

      {timerOpen && <RestTimer onClose={() => setTimerOpen(false)} />}
      <Confetti active={showConfetti} onDone={() => { setShowConfetti(false); setView("home"); }} />

      {view === "chat" && chatTarget && (
        <ChatView
          chatId={chatTarget.id}
          currentUser={{ ...user, photoURL: myProfile?.photoURL }}
          title={chatTarget.title}
          accentColor={chatTarget.accent || "#60a5fa"}
          onBack={() => { setView(chatTarget.from || "home"); setChatTarget(null); }}
        />
      )}

      <div className="scroll-view">
        <PageTransition view={view}>
          {(currentView) => (<>
            {currentView === "home" && (
              <HomeView logs={logs} user={user} myProfile={myProfile} routine={routine} userXP={userXP}
                sessionDate={sessionDate} setSessionDate={setSessionDate}
                onStartSession={startSession} onNavigate={setView} onLogout={handleLogout}
                activeDay={activeDay} completedSets={completedSets}
                onDiscardSession={handleDiscardSession}
              />
            )}
            {currentView === "session" && activeDay && (
              <SessionView activeDay={activeDay} sessionDate={sessionDate}
                sessionData={sessionData} completedSets={completedSets}
                sessionNote={sessionNote} logs={logs} routine={routine}
                onBack={() => setView("home")} onUpdateSet={updateSet}
                onToggleSet={toggleSet} onAddSet={addSet} onRemoveSet={removeSet}
                onChangeNote={setSessionNote} onSave={saveSession}
                onAddExercise={handleAddExercise} onRemoveExercise={handleRemoveExercise}
              />
            )}
            {currentView === "history" && (
              <HistoryView logs={logs} user={user} onBack={() => setView("home")}
                onViewSession={startSession} onDeleteSession={handleDeleteSession}
              />
            )}
            {currentView === "progress"    && <ProgressView logs={logs} routine={routine} onBack={() => setView("home")} />}
            {currentView === "progression" && <ProgressionView logs={logs} routine={routine} onBack={() => setView("home")} />}
            {currentView === "friends"     && <FriendsView user={user} myProfile={myProfile} onBack={() => setView("home")}
              onOpenChat={(uid, name) => { setChatTarget({ id: getDMChatId(user.uid, uid), title: name, accent: "#60a5fa", from: "friends" }); setView("chat"); }}
            />}
            {currentView === "groups"      && <GroupsView user={user} onBack={() => setView("home")}
              onOpenChat={(gid, name) => { setChatTarget({ id: getGroupChatId(gid), title: name, accent: "#a78bfa", from: "groups" }); setView("chat"); }}
            />}
            {currentView === "challenges"  && <ChallengesView user={user} myLogs={logs} myRoutine={routine} onBack={() => setView("home")} />}
            {currentView === "leaderboard" && <LeaderboardView user={user} myXP={userXP} onBack={() => setView("home")} />}
            {currentView === "profile"     && (
              <ProfileView user={user} myProfile={myProfile} userXP={userXP} logs={logs}
                onBack={() => setView("home")} onProfileUpdated={handleProfileUpdated}
                onNavigate={setView}
              />
            )}
            {currentView === "weeklySummary" && <WeeklySummaryView logs={logs} routine={routine} onBack={() => setView("home")} />}
            {currentView === "achievements"  && <AchievementsView logs={logs} routine={routine} userXP={userXP} onBack={() => setView("profile")} />}
            {currentView === "travelMode"    && <TravelModeView onBack={() => setView("home")} />}
            {currentView === "tools"          && <ToolsView onBack={() => setView("home")} />}
            {currentView === "editRoutine"   && (
              <EditRoutineView user={user} routine={routine} onBack={() => setView("home")}
                onRoutineUpdated={(updated) => { setRoutine(updated); setView("home"); }}
              />
            )}
          </>)}
        </PageTransition>
      </div>

      {TAB_VIEWS.includes(view) && (
        <TabBar currentView={view} onNavigate={setView} />
      )}

      {sessionTransition && (
        <SessionTransition
          color={sessionTransition}
          onDone={() => setSessionTransition(null)}
        />
      )}
    </>
  );
}

function Splash({ text }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, background: "var(--bg)",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ fontSize: 28, animation: "blink 1s infinite", color: "var(--text)" }}>◆</div>
      <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 700, color: "var(--text3)" }}>{text}</div>
    </div>
  );
}