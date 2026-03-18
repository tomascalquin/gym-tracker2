import { useState, useEffect } from "react";
import {
  loadLogs, saveLog, deleteLog,
  loadRoutine, saveFullRoutine,
  addExerciseToRoutine, removeExerciseFromRoutine,
  getSessionKey, todayStr,
} from "./utils/storage";
import { onAuthChange, logout, checkRedirectResult } from "./utils/auth";
import { initPublicProfile } from "./utils/friends";
import AuthScreen from "./components/AuthScreen";
import Toast from "./components/Toast";
import HomeView from "./views/HomeView";
import SessionView from "./views/SessionView";
import HistoryView from "./views/HistoryView";
import ProgressView from "./views/ProgressView";
import FriendsView from "./views/friends/FriendsView";
import OnboardingView from "./views/OnboardingView";

export default function App() {
  const [user, setUser]                     = useState(undefined);
  const [authReady, setAuthReady]           = useState(false);
  const [myProfile, setMyProfile]           = useState(null);
  const [view, setView]                     = useState("home");
  const [activeDay, setActiveDay]           = useState(null);
  const [sessionDate, setSessionDate]       = useState(todayStr());
  const [logs, setLogs]                     = useState({});
  const [routine, setRoutine]               = useState(undefined); // undefined=cargando, null=sin rutina
  const [sessionData, setSessionData]       = useState({});
  const [completedSets, setCompletedSets]   = useState({});
  const [sessionNote, setSessionNote]       = useState("");
  const [toastMsg, setToastMsg]             = useState(null);
  const [dataLoading, setDataLoading]       = useState(false);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    checkRedirectResult().catch(console.error);
    return unsub;
  }, []);

  // ── Cargar datos cuando hay usuario ───────────────────────────────────────
  useEffect(() => {
    if (!user) { setRoutine(undefined); return; }
    setDataLoading(true);
    setView("home");
    Promise.all([
      loadLogs(user.uid),
      loadRoutine(user.uid),
      initPublicProfile(user.uid, user.displayName, user.email),
    ])
      .then(([logsData, routineData, profile]) => {
        setLogs(logsData);
        setRoutine(routineData); // null si no tiene rutina
        setMyProfile(profile);
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [user?.uid]);

  function toast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }

  async function handleLogout() {
    await logout();
    setLogs({}); setRoutine(undefined); setMyProfile(null); setView("home");
  }

  // ── Onboarding: guardar rutina nueva ──────────────────────────────────────
  async function handleRoutineReady(newRoutine) {
    await saveFullRoutine(user.uid, newRoutine);
    setRoutine(newRoutine);
    toast("Rutina guardada 💪");
  }

  // ── Sesión de entrenamiento ───────────────────────────────────────────────
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
      const lastKey = Object.keys(logs)
        .filter(k => k.startsWith(day + "__")).sort().reverse()[0];
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
    const key = getSessionKey(activeDay, sessionDate);
    const session = { day: activeDay, date: sessionDate, sets: sessionData, completed: completedSets, note: sessionNote };
    setLogs(prev => ({ ...prev, [key]: session }));
    await saveLog(user.uid, key, session);
    toast("Sesión guardada 💾");
  }

  function updateSet(ei, si, field, val) {
    setSessionData(prev => {
      const copy = { ...prev, [ei]: [...(prev[ei] || [])] };
      copy[ei][si] = { ...copy[ei][si], [field]: val };
      return copy;
    });
  }
  function toggleSet(ei, si) {
    const k = `${ei}-${si}`;
    setCompletedSets(prev => ({ ...prev, [k]: !prev[k] }));
  }
  function addSet(ei) {
    setSessionData(prev => {
      const curr = prev[ei] || [];
      const last = curr[curr.length - 1] || { weight: 0, reps: 0 };
      return { ...prev, [ei]: [...curr, { weight: last.weight, reps: last.reps, note: "" }] };
    });
  }

  async function handleDeleteSession(key) {
    setLogs(prev => { const n = { ...prev }; delete n[key]; return n; });
    await deleteLog(user.uid, key);
  }

  async function handleAddExercise(day, exercise) {
    await addExerciseToRoutine(user.uid, day, exercise);
    setRoutine(prev => ({
      ...prev,
      [day]: { exercises: [...(prev[day]?.exercises || []), { ...exercise, custom: true }] },
    }));
    toast(`"${exercise.name}" agregado 💪`);
  }

  async function handleRemoveExercise(day, exIndex) {
    const exercise = routine[day]?.exercises[exIndex];
    if (!exercise?.custom) return;
    await removeExerciseFromRoutine(user.uid, day, exercise);
    setRoutine(prev => ({
      ...prev,
      [day]: { exercises: prev[day].exercises.filter((_, i) => i !== exIndex) },
    }));
    toast("Ejercicio eliminado");
  }

  // ── Loading / Auth guards ──────────────────────────────────────────────────
  if (!authReady || user === undefined) return <Splash text="CARGANDO" />;
  if (!user) return <AuthScreen />;
  if (dataLoading || routine === undefined) return <Splash text={`HOLA, ${(user.displayName || user.email).split(" ")[0].toUpperCase()}`} />;

  // Usuario sin rutina → onboarding
  if (routine === null) {
    return <OnboardingView user={user} onRoutineReady={handleRoutineReady} />;
  }

  // ── App principal ──────────────────────────────────────────────────────────
  return (
    <>
      <Toast message={toastMsg} />

      {view === "home" && (
        <HomeView logs={logs} user={user} myProfile={myProfile}
          sessionDate={sessionDate} setSessionDate={setSessionDate}
          onStartSession={startSession} onNavigate={setView} onLogout={handleLogout}
        />
      )}
      {view === "session" && activeDay && (
        <SessionView activeDay={activeDay} sessionDate={sessionDate}
          sessionData={sessionData} completedSets={completedSets}
          sessionNote={sessionNote} logs={logs} routine={routine}
          onBack={() => setView("home")} onUpdateSet={updateSet}
          onToggleSet={toggleSet} onAddSet={addSet} onChangeNote={setSessionNote}
          onSave={saveSession} onAddExercise={handleAddExercise}
          onRemoveExercise={handleRemoveExercise}
        />
      )}
      {view === "history" && (
        <HistoryView logs={logs} onBack={() => setView("home")}
          onViewSession={startSession} onDeleteSession={handleDeleteSession}
        />
      )}
      {view === "progress" && (
        <ProgressView logs={logs} routine={routine} onBack={() => setView("home")} />
      )}
      {view === "friends" && (
        <FriendsView user={user} myProfile={myProfile} onBack={() => setView("home")} />
      )}
    </>
  );
}

function Splash({ text }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "#080810", color: "#475569", fontFamily: "DM Mono, monospace",
    }}>
      <div style={{ fontSize: 24, animation: "blink 1s infinite" }}>◆</div>
      <div style={{ fontSize: 13, letterSpacing: 3 }}>{text}</div>
    </div>
  );
}
