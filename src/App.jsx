import { useState, useEffect } from "react";
import { ROUTINE } from "./data/routine";
import { loadLogs, saveLogs, getSessionKey, todayStr } from "./utils/storage";
import Toast from "./components/Toast";
import HomeView from "./views/HomeView";
import SessionView from "./views/SessionView";
import HistoryView from "./views/HistoryView";
import ProgressView from "./views/ProgressView";

/**
 * App.jsx — orquestador central.
 *
 * Todo el estado global vive acá:
 *   - logs: historial persistido en localStorage
 *   - view: vista activa ("home" | "session" | "history" | "progress")
 *   - activeDay, sessionDate, sessionData, completedSets, sessionNote
 *
 * Las vistas reciben solo lo que necesitan via props.
 */
export default function App() {
  const [view, setView]                 = useState("home");
  const [activeDay, setActiveDay]       = useState(null);
  const [sessionDate, setSessionDate]   = useState(todayStr());
  const [logs, setLogs]                 = useState(loadLogs);
  const [sessionData, setSessionData]   = useState({});
  const [completedSets, setCompletedSets] = useState({});
  const [sessionNote, setSessionNote]   = useState("");
  const [toastMsg, setToastMsg]         = useState(null);

  // Persistir cada vez que cambian los logs
  useEffect(() => { saveLogs(logs); }, [logs]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  function toast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }

  // ── Iniciar sesión ─────────────────────────────────────────────────────────
  function startSession(day, overrideDate) {
    const date = overrideDate || sessionDate;
    const key  = getSessionKey(day, date);
    const existing = logs[key];

    if (existing) {
      setSessionData(existing.sets);
      setCompletedSets(existing.completed || {});
      setSessionNote(existing.note || "");
    } else {
      // Precargar con la última sesión del mismo día (si existe)
      const lastKey = Object.keys(logs)
        .filter((k) => k.startsWith(day + "__"))
        .sort()
        .reverse()[0];

      const defaults = {};
      ROUTINE[day].exercises.forEach((ex, ei) => {
        const src = lastKey ? (logs[lastKey].sets[ei] || ex.sets) : ex.sets;
        defaults[ei] = src.map((s) => ({ weight: s.weight, reps: s.reps, note: s.note || "" }));
      });

      setSessionData(defaults);
      setCompletedSets({});
      setSessionNote("");
    }

    setActiveDay(day);
    setView("session");
  }

  // ── Guardar sesión ─────────────────────────────────────────────────────────
  function saveSession() {
    const key = getSessionKey(activeDay, sessionDate);
    setLogs((prev) => ({
      ...prev,
      [key]: {
        day: activeDay,
        date: sessionDate,
        sets: sessionData,
        completed: completedSets,
        note: sessionNote,
      },
    }));
    toast("Sesión guardada 💾");
  }

  // ── Mutaciones de sets ─────────────────────────────────────────────────────
  function updateSet(ei, si, field, val) {
    setSessionData((prev) => {
      const copy = { ...prev, [ei]: [...(prev[ei] || [])] };
      copy[ei][si] = { ...copy[ei][si], [field]: val };
      return copy;
    });
  }

  function toggleSet(ei, si) {
    const k = `${ei}-${si}`;
    setCompletedSets((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  function addSet(ei) {
    setSessionData((prev) => {
      const current = prev[ei] || [];
      const last = current[current.length - 1] || { weight: 0, reps: 0 };
      return { ...prev, [ei]: [...current, { weight: last.weight, reps: last.reps, note: "" }] };
    });
  }

  // ── Historial ──────────────────────────────────────────────────────────────
  function deleteSession(key) {
    setLogs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast message={toastMsg} />

      {view === "home" && (
        <HomeView
          logs={logs}
          sessionDate={sessionDate}
          setSessionDate={setSessionDate}
          onStartSession={startSession}
          onNavigate={setView}
        />
      )}

      {view === "session" && activeDay && (
        <SessionView
          activeDay={activeDay}
          sessionDate={sessionDate}
          sessionData={sessionData}
          completedSets={completedSets}
          sessionNote={sessionNote}
          logs={logs}
          onBack={() => setView("home")}
          onUpdateSet={updateSet}
          onToggleSet={toggleSet}
          onAddSet={addSet}
          onChangeNote={setSessionNote}
          onSave={saveSession}
        />
      )}

      {view === "history" && (
        <HistoryView
          logs={logs}
          onBack={() => setView("home")}
          onViewSession={(day, date) => startSession(day, date)}
          onDeleteSession={deleteSession}
        />
      )}

      {view === "progress" && (
        <ProgressView
          logs={logs}
          onBack={() => setView("home")}
        />
      )}
    </>
  );
}
