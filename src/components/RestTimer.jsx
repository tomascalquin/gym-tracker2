import { useState, useEffect, useRef } from "react";

const PRESETS = [
  { label: "45s",  seconds: 45  },
  { label: "60s",  seconds: 60  },
  { label: "90s",  seconds: 90  },
  { label: "2min", seconds: 120 },
  { label: "3min", seconds: 180 },
];

/**
 * Cronómetro flotante persistente.
 * Vive en App.jsx — no desaparece al navegar entre vistas.
 * Se colapsa a una burbuja pequeña cuando está corriendo.
 */
export default function RestTimer({ onClose }) {
  const [selected, setSelected]   = useState(90);
  const [timeLeft, setTimeLeft]   = useState(null);
  const [running, setRunning]     = useState(false);
  const [expanded, setExpanded]   = useState(true); // false = burbuja mini
  const endTimeRef  = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function playFinish() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }

  function startTick() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setTimeLeft(0); setRunning(false);
        setExpanded(true); // expandir al terminar
        playFinish();
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
  }

  function start() {
    endTimeRef.current = Date.now() + selected * 1000;
    setTimeLeft(selected); setRunning(true);
    startTick();
  }

  function pause() {
    clearInterval(intervalRef.current);
    setRunning(false); endTimeRef.current = null;
  }

  function resume() {
    if (!timeLeft || timeLeft <= 0) return;
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setRunning(true); startTick();
  }

  function reset() {
    clearInterval(intervalRef.current);
    endTimeRef.current = null;
    setTimeLeft(null); setRunning(false);
  }

  // Recalcular al volver del background
  useEffect(() => {
    function onVisible() {
      if (!document.hidden && running && endTimeRef.current) {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setTimeLeft(0); setRunning(false); setExpanded(true); playFinish();
        } else {
          setTimeLeft(remaining);
        }
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [running]);

  const left     = timeLeft ?? selected;
  const total    = selected;
  const pct      = timeLeft !== null ? Math.max(0, Math.round((left / total) * 100)) : 100;
  const finished = timeLeft === 0;

  const color = finished ? "#22c55e"
    : left <= 10 ? "#ef4444"
    : left <= 30 ? "#f59e0b"
    : "#60a5fa";

  const mins    = Math.floor(left / 60);
  const secs    = left % 60;
  const display = `${mins > 0 ? `${mins}:` : ""}${String(secs).padStart(mins > 0 ? 2 : 1, "0")}`;

  // ── BURBUJA MINI (cuando está corriendo y colapsado) ──────────────────────
  if (!expanded && running) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          position: "fixed", bottom: 90, right: 18, zIndex: 400,
          width: 64, height: 64, borderRadius: "50%",
          background: "#0e0e1a", border: `3px solid ${color}`,
          cursor: "pointer", fontFamily: "DM Mono, monospace",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 20px ${color}55`,
          animation: left <= 10 ? "pulse-border 0.5s ease-in-out infinite" : "none",
        }}
      >
        <style>{`
          @keyframes pulse-border {
            0%,100% { box-shadow: 0 0 20px ${color}55; }
            50% { box-shadow: 0 0 40px ${color}99; }
          }
        `}</style>
        <span style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{display}</span>
        <span style={{ fontSize: 8, color: "#475569", marginTop: 2, letterSpacing: 1 }}>⏱</span>
      </button>
    );
  }

  // ── PANEL EXPANDIDO ────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay — NO cierra el timer, solo lo colapsa */}
      <div
        onClick={() => running ? setExpanded(false) : onClose()}
        style={{
          position: "fixed", inset: 0, background: "#000000aa",
          zIndex: 300, backdropFilter: "blur(2px)",
        }}
      />

      <div style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, zIndex: 301,
        background: "#0e0e1a", borderTop: `3px solid ${color}`,
        borderRadius: "16px 16px 0 0", padding: "20px 20px 32px",
        fontFamily: "DM Mono, monospace", transition: "border-color 0.3s",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#475569" }}>DESCANSO</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {running && (
              <button
                onClick={() => setExpanded(false)}
                className="nbtn"
                style={{ fontSize: 11, color: "#475569", border: "1px solid #1a1a2a", padding: "4px 10px", borderRadius: 6, letterSpacing: 1 }}
              >
                MINIMIZAR
              </button>
            )}
            <button onClick={() => { reset(); onClose(); }} className="nbtn" style={{ color: "#475569", fontSize: 16 }}>✕</button>
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "center" }}>
          {PRESETS.map(p => (
            <button key={p.seconds} onClick={() => { setSelected(p.seconds); reset(); }} style={{
              background: selected === p.seconds ? "#1a1a2e" : "transparent",
              border: `1px solid ${selected === p.seconds ? color + "66" : "#1a1a2a"}`,
              color: selected === p.seconds ? color : "#475569",
              padding: "6px 12px", borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontFamily: "inherit",
            }}>{p.label}</button>
          ))}
        </div>

        {/* Círculo SVG */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", width: 140, height: 140 }}>
            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a2a" strokeWidth="8" />
              <circle
                cx="70" cy="70" r="60" fill="none"
                stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.3s" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: finished ? 28 : 36, fontWeight: 500, color, transition: "color 0.3s" }}>
                {finished ? "✓" : display}
              </div>
              {finished && <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: 1, marginTop: 2 }}>¡LISTO!</div>}
            </div>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {timeLeft === null && (
            <button onClick={start} style={{
              background: color, border: "none", color: "#000",
              padding: "12px 32px", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit", flex: 1,
            }}>INICIAR</button>
          )}
          {running && (
            <button onClick={pause} style={{
              background: "#1a1a2e", border: `1px solid ${color}44`, color,
              padding: "12px 32px", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit", flex: 1,
            }}>PAUSAR</button>
          )}
          {!running && timeLeft !== null && !finished && (
            <>
              <button onClick={resume} style={{
                background: color, border: "none", color: "#000",
                padding: "12px 24px", borderRadius: 10, cursor: "pointer",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit", flex: 1,
              }}>REANUDAR</button>
              <button onClick={reset} className="nbtn" style={{
                border: "1px solid #1a1a2a", color: "#475569",
                padding: "12px 16px", borderRadius: 10, fontSize: 12,
              }}>↺</button>
            </>
          )}
          {finished && (
            <button onClick={start} style={{
              background: "#22c55e", border: "none", color: "#000",
              padding: "12px 32px", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit", flex: 1,
            }}>REPETIR</button>
          )}
        </div>
      </div>
    </>
  );
}
