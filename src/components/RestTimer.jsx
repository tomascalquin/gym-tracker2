import { useState, useEffect, useRef } from "react";
import { saveTimer, loadTimer, clearTimer } from "../utils/timerDraft";

export default function RestTimer({ onClose, initialTime = 90 }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const endTimeRef  = useRef(null);
  const intervalRef = useRef(null);

  // LÓGICA ORIGINAL RECUPERADA: Manejo avanzado del tiempo y drafts
  useEffect(() => {
    const saved = loadTimer();
    if (saved) {
      const remaining = Math.round((saved - Date.now()) / 1000);
      if (remaining > 0) {
        endTimeRef.current = saved;
        setTimeLeft(remaining);
        startTick();
      } else {
        clearTimer();
        finishTimer();
      }
    } else {
      // Inicia automáticamente si no había un draft previo
      const end = Date.now() + initialTime * 1000;
      endTimeRef.current = end;
      saveTimer(end);
      startTick();
    }
    return () => clearInterval(intervalRef.current);
  }, [initialTime]);

  // LÓGICA ORIGINAL RECUPERADA: Sigue funcionando aunque minimices el navegador
  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden && endTimeRef.current) {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          finishTimer();
        } else {
          setTimeLeft(remaining);
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // LÓGICA ORIGINAL RECUPERADA: Tu sonido de pitido personalizado
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
    } catch (err) {
      console.warn("rest timer sound error:", err?.message || err);
    }
  }

  function finishTimer() {
    clearInterval(intervalRef.current);
    endTimeRef.current = null;
    clearTimer();
    playFinish();
    setTimeout(onClose, 3000); // Se cierra solo después de 3 segundos
  }

  function startTick() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        finishTimer();
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
  }

  const isFinished = timeLeft <= 0;
  const progress = ((initialTime - Math.max(0, timeLeft)) / initialTime) * 100;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`floating-timer ${isFinished ? 'timer-finished' : ''}`}>
      <div className="timer-background" style={{ width: `${progress}%` }}></div>
      <div className="timer-content">
        <span className="timer-icon">{isFinished ? '🔥' : '⏳'}</span>
        <span className="timer-text">
          {isFinished ? '¡A darle!' : `Descanso: ${formatTime(timeLeft)}`}
        </span>
        <button className="timer-close" onClick={() => { clearTimer(); onClose(); }}>×</button>
      </div>
    </div>
  );
}