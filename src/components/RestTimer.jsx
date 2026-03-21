import { useState, useEffect, useRef } from "react";
import { saveTimer, loadTimer, clearTimer } from "../utils/timerDraft";

const PRESETS = [
  { label: "45s",  seconds: 45  },
  { label: "1min", seconds: 60  },
  { label: "90s",  seconds: 90  },
  { label: "2min", seconds: 120 },
  { label: "3min", seconds: 180 },
];

export default function RestTimer({ onClose }) {
  const [selected, setSelected] = useState(90);
  const [timeLeft, setTimeLeft] = useState(null);
  const [running, setRunning]   = useState(false);
  const endTimeRef  = useRef(null);
  const intervalRef = useRef(null);

  // Al montar, recuperar timer si estaba corriendo
  useEffect(() => {
    const saved = loadTimer();
    if (saved) {
      const remaining = Math.round((saved - Date.now()) / 1000);
      if (remaining > 0) {
        endTimeRef.current = saved;
        setTimeLeft(remaining);
        setRunning(true);
        startTick();
      } else {
        clearTimer();
      }
    }
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden && running && endTimeRef.current) {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) { clearInterval(intervalRef.current); setTimeLeft(0); setRunning(false); playFinish(); clearTimer(); }
        else setTimeLeft(remaining);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running]);

  function playFinish() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }

  function startTick() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) { clearInterval(intervalRef.current); setTimeLeft(0); setRunning(false); playFinish(); clearTimer(); }
      else setTimeLeft(remaining);
    }, 500);
  }

  function start() {
    const end = Date.now() + selected * 1000;
    endTimeRef.current = end;
    saveTimer(end);
    setTimeLeft(selected); setRunning(true); startTick();
  }

  function pause() { clearInterval(intervalRef.current); setRunning(false); endTimeRef.current = null; }

  function resume() {
    if (!timeLeft || timeLeft <= 0) return;
    const end = Date.now() + timeLeft * 1000;
    endTimeRef.current = end;
    saveTimer(end);
    setRunning(true); startTick();
  }

  function reset() { clearInterval(intervalRef.current); endTimeRef.current = null; setTimeLeft(null); setRunning(false); clearTimer(); }

  const total    = selected;
  const left     = timeLeft ?? selected;
  const pct      = timeLeft !== null ? Math.max(0, Math.round((left / total) * 100)) : 100;
  const finished = timeLeft === 0;

  const color = finished ? "#22c55e" : left <= 10 ? "#ef4444" : left <= 30 ? "#f59e0b" : "#60a5fa";

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(secs);

  // SVG círculo
  const r = 64;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 300, backdropFilter: "blur(8px)",
      }} />

      <div style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, zIndex: 301,
        background: "var(--bg)",
        borderTop: `2px solid ${color}`,
        borderRadius: "20px 20px 0 0",
        padding: "24px 24px calc(24px + env(safe-area-inset-bottom))",
        fontFamily: "DM Mono, monospace",
        transition: "border-color 0.3s",
        boxShadow: `0 -8px 40px ${color}22`,
        animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--text3)" }}>DESCANSO</div>
          <button onClick={onClose} className="nbtn" style={{ color: "var(--text3)", fontSize: 18 }}>✕</button>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, justifyContent: "center" }}>
          {PRESETS.map(p => (
            <button key={p.seconds} onClick={() => { setSelected(p.seconds); reset(); }} style={{
              background: selected === p.seconds ? color + "22" : "var(--bg2)",
              border: `1px solid ${selected === p.seconds ? color + "66" : "var(--border)"}`,
              color: selected === p.seconds ? color : "var(--text3)",
              padding: "6px 12px", borderRadius: 99, cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
              transition: "all 0.15s",
              boxShadow: selected === p.seconds ? `0 2px 10px ${color}33` : "none",
            }}>{p.label}</button>
          ))}
        </div>

        {/* Círculo SVG */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ position: "relative", width: 160, height: 160 }}>
            <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="80" cy="80" r={r} fill="none" stroke="var(--bg2)" strokeWidth="8" />
              <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={dash}
                style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.3s", filter: `drop-shadow(0 0 6px ${color}88)` }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: finished ? 32 : 40, fontWeight: 300, color, transition: "color 0.3s, font-size 0.2s" }}>
                {finished ? "✓" : display}
              </div>
              {finished && (
                <div style={{ fontSize: 10, color: "#22c55e", letterSpacing: 2, marginTop: 4 }}>LISTO</div>
              )}
              {!finished && timeLeft !== null && (
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                  {Math.round(pct)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display: "flex", gap: 10 }}>
          {timeLeft === null && (
            <button onClick={start} style={{
              flex: 1, padding: "14px", background: color, border: "none",
              color: "#000", borderRadius: 14, cursor: "pointer",
              fontSize: 13, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              boxShadow: `0 4px 20px ${color}44`, minHeight: 52,
            }}>INICIAR</button>
          )}
          {running && (
            <button onClick={pause} style={{
              flex: 1, padding: "14px",
              background: "var(--bg2)", border: `1.5px solid ${color}44`, color,
              borderRadius: 14, cursor: "pointer",
              fontSize: 13, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              minHeight: 52,
            }}>PAUSAR</button>
          )}
          {!running && timeLeft !== null && !finished && (
            <>
              <button onClick={resume} style={{
                flex: 1, padding: "14px", background: color, border: "none",
                color: "#000", borderRadius: 14, cursor: "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                boxShadow: `0 4px 20px ${color}44`, minHeight: 52,
              }}>REANUDAR</button>
              <button onClick={reset} style={{
                width: 52, height: 52, background: "var(--bg2)",
                border: "1px solid var(--border)", color: "var(--text3)",
                borderRadius: 14, cursor: "pointer", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "inherit",
              }}>↺</button>
            </>
          )}
          {finished && (
            <button onClick={start} style={{
              flex: 1, padding: "14px", background: "#22c55e", border: "none",
              color: "#000", borderRadius: 14, cursor: "pointer",
              fontSize: 13, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              boxShadow: "0 4px 20px #22c55e44", minHeight: 52,
            }}>REPETIR</button>
          )}
        </div>
      </div>
    </>
  );
}
