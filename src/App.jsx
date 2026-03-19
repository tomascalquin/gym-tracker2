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
import EditRoutineView from "./views/EditRoutineView";
import OnboardingView from "./views/OnboardingView";

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
  const [timerOpen, setTimerOpen]           = useState(false);
  const [timerVisible, setTimerVisible]     = useState(false);
  const [timerState, setTimerState]         = useState({ selected: 90, timeLeft: null, running: false, endTime: null }); // { oldRank, newRank, xpGained, prs }

  useEffect(() => {
    const unsub = onAuthChange(fb => { setUser(fb); setAuthReady(true); });
    checkRedirectResult().catch(console.error);
    // Registrar service worker para modo offline
    registerServiceWorker();
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
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [user?.uid]);

  function toast(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2200); }

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
    setActiveDay(day); setView("session");
  }

  async function saveSession() {
    const key     = getSessionKey(activeDay, sessionDate);
    const session = { day: activeDay, date: sessionDate, sets: sessionData, completed: completedSets, note: sessionNote };

    // Calcular XP antes de actualizar logs
    const streak  = calcStreak(logs);
    const { xp: xpEarned, reasons, prs } = calcSessionXP(session, logs, routine, streak);

    // Guardar sesión
    setLogs(prev => ({ ...prev, [key]: session }));
    await saveLog(user.uid, key, session);

    // Agregar XP
    const displayName = user.displayName || user.email.split("@")[0];
    const result = await addXP(user.uid, displayName, xpEarned, reasons.join(" | "));
    setUserXP(result.newXP);

    // Mostrar modal si subió de rango
    if (result.rankUp) {
      setRankUpData({ oldRank: result.oldRank, newRank: result.newRank, xpGained: xpEarned, prs });
      showLocalNotification("¡Subiste de rango! 🎉", `Ahora eres ${result.newRank.emoji} ${result.newRank.name}`);
    } else {
      toast(`+${xpEarned} XP 💪${prs.length ? ` · 🏆 PR en ${prs[0]}` : ""}`);
      if (prs.length) showLocalNotification("🏆 Nuevo PR", `${prs[0]} — ${xpEarned} XP ganados`);
    }
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

      {rankUpData && (
        <RankUpModal
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          xpGained={rankUpData.xpGained}
          prs={rankUpData.prs}
          onClose={() => setRankUpData(null)}
        />
      )}

      {/* Timer flotante global */}
      {timerOpen && <RestTimer onClose={() => setTimerOpen(false)} />}

      {view === "home" && (
        <HomeView logs={logs} user={user} myProfile={myProfile} routine={routine} userXP={userXP}
          sessionDate={sessionDate} setSessionDate={setSessionDate}
          onStartSession={startSession} onNavigate={setView} onLogout={handleLogout}
        />
      )}
      {view === "session" && activeDay && (
        <SessionView activeDay={activeDay} sessionDate={sessionDate}
          sessionData={sessionData} completedSets={completedSets}
          sessionNote={sessionNote} logs={logs} routine={routine}
          onBack={() => setView("home")} onUpdateSet={updateSet}
          onToggleSet={toggleSet} onAddSet={addSet} onRemoveSet={removeSet} onChangeNote={setSessionNote}
          onSave={saveSession} onAddExercise={handleAddExercise}
          onRemoveExercise={handleRemoveExercise}
          onOpenTimer={() => setTimerOpen(true)}
        />
      )}
      {view === "history" && (
        <HistoryView logs={logs} user={user} onBack={() => setView("home")}
          onViewSession={startSession} onDeleteSession={handleDeleteSession}
        />
      )}
      {view === "progress"    && <ProgressView logs={logs} routine={routine} onBack={() => setView("home")} />}
      {view === "friends"     && <FriendsView user={user} myProfile={myProfile} onBack={() => setView("home")} />}
      {view === "groups"      && <GroupsView user={user} onBack={() => setView("home")} />}
      {view === "challenges"  && <ChallengesView user={user} myLogs={logs} myRoutine={routine} onBack={() => setView("home")} />}
      {view === "leaderboard" && <LeaderboardView user={user} myXP={userXP} onBack={() => setView("home")} />}
      {view === "editRoutine" && (
        <EditRoutineView
          user={user}
          routine={routine}
          onBack={() => setView("home")}
          onRoutineUpdated={(updated) => { setRoutine(updated); setView("home"); }}
        />
      )}
    </>
  );
}

function Splash({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#080810", color: "#475569", fontFamily: "DM Mono, monospace" }}>
      <div style={{ fontSize: 24, animation: "blink 1s infinite" }}>◆</div>
      <div style={{ fontSize: 13, letterSpacing: 3 }}>{text}</div>
    </div>
  );
}
