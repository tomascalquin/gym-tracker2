import { useState, useEffect, lazy, Suspense } from "react";
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
import { saveDraft, loadDraft, clearDraft, registerDraftGuard } from "./utils/sessionDraft";
import ChatView from "./components/ChatView";
import { getDMChatId, getGroupChatId } from "./utils/chat";
import AuthScreen from "./components/AuthScreen";
import Toast from "./components/Toast";
import RankUpModal from "./components/RankUpModal";
import RestTimer from "./components/RestTimer";
import TabBar, { TAB_VIEWS } from "./components/TabBar";
import PageTransition from "./components/PageTransition";
import SplashScreen from "./components/SplashScreen";
import Confetti from "./components/Confetti";
import { haptics } from "./utils/haptics";
import { initPWAInstall, canInstall, installPWA, isInstalled } from "./utils/pwa";
import SessionTransition from "./components/SessionTransition";
import { DAY_META } from "./data/routine";
import { evaluateAchievements, getNewlyUnlocked, saveUnlockedAchievements, loadUnlockedAchievements } from "./utils/achievements";
import { registerOnlineListener, getPendingCount } from "./utils/offlineQueue";

// Vistas críticas (Cargan de inmediato)
import HomeView from "./views/HomeView";
import SessionView from "./views/SessionView";
import OnboardingView from "./views/OnboardingView";

// --- INICIO DE LA MAGIA (Code Splitting - Vistas secundarias cargan diferido) ---
const HistoryView = lazy(() => import("./views/HistoryView"));
const ProgressView = lazy(() => import("./views/ProgressView"));
const FriendsView = lazy(() => import("./views/friends/FriendsView"));
const GroupsView = lazy(() => import("./views/groups/GroupsView"));
const ChallengesView = lazy(() => import("./views/ChallengesView"));
const LeaderboardView = lazy(() => import("./views/LeaderboardView"));
const ProfileView = lazy(() => import("./views/ProfileView"));
const ProgressionView = lazy(() => import("./views/ProgressionView"));
const EditRoutineView = lazy(() => import("./views/EditRoutineView"));
const WeeklySummaryView = lazy(() => import("./views/WeeklySummaryView"));
const AchievementsView = lazy(() => import("./views/AchievementsView"));
const TravelModeView = lazy(() => import("./views/TravelModeView"));
const ToolsView = lazy(() => import("./views/ToolsView"));
// --- FIN DE LA MAGIA ---

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
    let cancelled = false;
    let unsub = () => {};

    (async () => {
      const { error } = await checkRedirectResult();
      if (cancelled) return;
      if (error?.code) {
        const redirectErrors = {
          "auth/unauthorized-domain": "Dominio no autorizado: agrega tu URL en Firebase → Authentication → Settings → Authorized domains.",
          "auth/operation-not-allowed": "Inicio con Google no habilitado en la consola de Firebase.",
          "auth/account-exists-with-different-credential": "Ya existe una cuenta con ese email (otro método de acceso).",
        };
        const msg = redirectErrors[error.code] || `Google: ${error.message || "Error al volver del login"}`;
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 5000);
      }
      unsub = onAuthChange((fb) => {
        setUser(fb);
        setAuthReady(true);
      });
    })();

    registerServiceWorker();
    const saved = getTheme();
    applyTheme(saved);
    checkInviteParam();
    return () => {
      cancelled = true;
      unsub();
    };
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

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unregister = registerOnlineListener(user.uid, (count) => {
      toast(`Sincronizado: ${count} cambio${count > 1 ? "s" : ""} pendientes`);
    });

    const pending = getPendingCount();
    if (pending > 0 && !navigator.onLine) {
      toast(`${pending} cambio${pending > 1 ? "s" : ""} pendiente${pending > 1 ? "s" : ""} para sincronizar`);
    }

    return unregister;
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

  // Auto-guardar borrador en localStorage cuando cambian los datos
  useEffect(() => {
    if (view === "session" && activeDay && user) {
      saveDraft(user.uid, { activeDay, sessionDate, sessionData, completedSets, sessionNote });
    }
  }, [sessionData, completedSets, sessionNote, view, activeDay]);

  // Guardar borrador cuando la app va al fondo o se cierra
  useEffect(() => {
    if (view !== "session" || !activeDay || !user) return;
    const unregister = registerDraftGuard(() => ({
      uid: user.uid, activeDay, sessionDate, sessionData, completedSets, sessionNote,
    }));
    return unregister;
  }, [view, activeDay, user, sessionDate, sessionData, completedSets, sessionNote]);

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
  if (!user) {
    return (
      <>
        <Toast message={toastMsg} />
        <AuthScreen />
      </>
    );
  }
  if (dataLoading || routine === undefined) return <Splash text={`HOLA, ${(user.displayName || user.email).split(" ")[0].toUpperCase()}`} />;
  if (routine === null) return <OnboardingView user={user} onRoutineReady={handleRoutineReady} />;

  return (
    <>
      <Toast message={toastMsg} />

      {/* Offline banner */}
      {isOffline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
          background: "rgba(8,8,20,0.92)", borderBottom: "1px solid rgba(255,255,255,0.12)",
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
          {(currentView) => (
            <Suspense fallback={
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontFamily: "inherit" }}>
                CARGANDO...
              </div>
            }>
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
            {currentView === "sleep"         && <SleepView user={user} onBack={() => setView("home")} />}
            {currentView === "photos"        && <ProgressPhotosView user={user} onBack={() => setView("home")} />}
              {currentView === "tools"          && <ToolsView onBack={() => setView("home")} />}
              {currentView === "routinePresets" && (
                <OnboardingView
                  user={user}
                  onBack={() => setView("home")}
                  allowOverwrite={true}
                  onRoutineReady={async (newRoutine) => {
                    await handleRoutineReady(newRoutine);
                    setView("home");
                  }}
                />
              )}
              {currentView === "editRoutine"   && (
                <EditRoutineView user={user} routine={routine} onBack={() => setView("home")}
                  onRoutineUpdated={(updated) => { setRoutine(updated); setView("home"); }}
                />
              )}
            </Suspense>
          )}
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
      gap: 14,
      background: "#080810",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* orbs */}
      <div style={{ position:"absolute", inset:0, background: "radial-gradient(ellipse 60% 50% at 20% 10%, rgba(88,56,230,0.45) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(14,100,200,0.35) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 50% 85%, rgba(120,40,180,0.30) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"relative", textAlign:"center" }}>
        <div style={{ fontSize: 32, animation: "blink 1.2s infinite", color: "rgba(255,255,255,0.9)" }}>◆</div>
        <div style={{ fontSize: 9, letterSpacing: 4, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>{text}</div>
      </div>
    </div>
  );
}