import { useState, useEffect, useRef } from "react";

export default function Toast({ message, type = "success", duration = 2400 }) {
  const [visible, setVisible]   = useState(false);
  const [exiting, setExiting]   = useState(false);
  const [dragX, setDragX]       = useState(0);
  const startX  = useRef(0);
  const timerRef = useRef();

  useEffect(() => {
    if (!message) return;
    setVisible(true); setExiting(false); setDragX(0);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(dismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [message]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => { setVisible(false); setExiting(false); }, 280);
  }

  function onTouchStart(e) { startX.current = e.touches[0].clientX; }
  function onTouchMove(e)  { setDragX(e.touches[0].clientX - startX.current); }
  function onTouchEnd()    { Math.abs(dragX) > 80 ? dismiss() : setDragX(0); }

  if (!visible || !message) return null;

  const color = type === "error" ? "#ef4444" : type === "pr" ? "#fbbf24" : "#22c55e";
  const icon  = type === "error" ? "✕" : type === "pr" ? "🏆" : type === "xp" ? "⚡" : "✓";

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-14px) scale(0.92); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={dismiss}
        style={{
          position: "fixed",
          top: "calc(14px + env(safe-area-inset-top))",
          left: "50%", zIndex: 500,
          transform: `translateX(calc(-50% + ${dragX}px))`,
          opacity: exiting ? 0 : Math.max(0, 1 - Math.abs(dragX) / 150),
          transition: dragX ? "opacity 0.1s" : exiting ? "all 0.28s ease" : "none",
          animation: !exiting && !dragX ? "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
          maxWidth: "calc(100vw - 32px)", minWidth: 200, cursor: "pointer",
        }}
      >
        <div style={{
          background: "rgba(14,14,26,0.95)",
          border: `1px solid ${color}44`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 14, padding: "11px 16px",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          fontFamily: "DM Mono, monospace",
        }}>
          <span style={{ fontSize: 15, color, flexShrink: 0 }}>{icon}</span>
          <span style={{ fontSize: 12, color: "var(--text)", letterSpacing: 0.3 }}>{message}</span>
        </div>
      </div>
    </>
  );
}
