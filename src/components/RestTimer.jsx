import { useState, useEffect, useRef } from "react";

const PRESETS = [
  { label: "45s",  seconds: 45  },
  { label: "60s",  seconds: 60  },
  { label: "90s",  seconds: 90  },
  { label: "2min", seconds: 120 },
  { label: "3min", seconds: 180 },
];

/**
 * Temporizador de descanso flotante entre series.
 * Se activa con un botón en ExerciseCard al marcar una serie como completada.
 */
export default function RestTimer({ onClose }) {
  const [selected, setSelected] = useState(90);
  const [timeLeft, setTimeLeft] = useState(null); // null = no iniciado
  const [running, setRunning]   = useState(false);
  const intervalRef = useRef(null);
  const audioRef    = useRef(null);

  // Limpiar intervalo al desmontar
  useEffect(() => () => clearInterval(intervalRef.current), []);

  // Vibración y sonido al llegar a 0
  useEffect(() => {
    if (timeLeft === 0) {
      setRunning(false);
      clearInterval(intervalRef.current);
      // Vibrar si disponible
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      // Sonido beep via Web Audio API
      try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
    }
  }, [timeLeft]);

  function start() {
    clearInterval(intervalRef.current);
    setTimeLeft(selected);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function pause() {
    clearInterval(intervalRef.current);
    setRunning(false);
  }

  function resume() {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setTimeLeft(null);
    setRunning(false);
  }

  const total    = selected;
  const left     = timeLeft ?? selected;
  const pct      = timeLeft !== null ? Math.round((left / total) * 100) : 100;
  const finished = timeLeft === 0;

  // Color dinámico según tiempo restante
  const color = finished ? "#22c55e"
    : left <= 10 ? "#ef4444"
    : left <= 30 ? "#f59e0b"
    : "#60a5fa";

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const display = `${mins > 0 ? `${mins}:` : ""}${String(secs).padStart(mins > 0 ? 2 : 1, "0")}`;

  return (
    <>
      {/* Overlay semi-transparente */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "#000000aa",
        zIndex: 300, backdropFilter: "blur(2px)",
      }} />

      {/* Panel */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, zIndex: 301,
        background: "#0e0e1a", borderTop: `3px solid ${color}`,
        borderRadius: "16px 16px 0 0", padding: "20px 20px 32px",
        fontFamily: "DM Mono, monospace",
        transition: "border-color 0.3s",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#475569" }}>DESCANSO</div>
          <button onClick={onClose} className="nbtn" style={{ color: "#475569", fontSize: 16 }}>✕</button>
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

        {/* Círculo de progreso + tiempo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", width: 140, height: 140 }}>
            {/* SVG círculo */}
            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
              {/* Fondo */}
              <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a2a" strokeWidth="8" />
              {/* Progreso */}
              <circle
                cx="70" cy="70" r="60" fill="none"
                stroke={color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            {/* Tiempo en el centro */}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                fontSize: finished ? 28 : 36,
                fontWeight: 500, color,
                transition: "color 0.3s",
              }}>
                {finished ? "✓" : display}
              </div>
              {finished && (
                <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: 1, marginTop: 2 }}>
                  ¡LISTO!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {timeLeft === null && (
            <button onClick={start} style={{
              background: color, border: "none", color: "#000",
              padding: "12px 32px", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              flex: 1,
            }}>INICIAR</button>
          )}
          {running && (
            <button onClick={pause} style={{
              background: "#1a1a2e", border: `1px solid ${color}44`, color,
              padding: "12px 32px", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              flex: 1,
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
              fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              flex: 1,
            }}>REPETIR</button>
          )}
        </div>
      </div>
    </>
  );
}
