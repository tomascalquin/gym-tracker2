import { useState, useEffect } from "react";
import { shouldShowHint, markHintSeen } from "../utils/tooltips";

/**
 * Tooltip contextual no invasivo.
 * Aparece desde abajo con animación suave, se puede descartar tocando.
 * Solo se muestra una vez por hint por usuario.
 *
 * Uso:
 *   <ContextTooltip uid={user.uid} hintId="progress" />
 */
export default function ContextTooltip({ uid, hintId, icon, text, delay = 600 }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!uid || !hintId) return;
    if (!shouldShowHint(uid, hintId)) return;

    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [uid, hintId, delay]);

  function dismiss() {
    setExiting(true);
    markHintSeen(uid, hintId);
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "relative",
        margin: "0 0 16px",
        animation: exiting
          ? "slideDown 0.28s cubic-bezier(0.55,0,1,0.45) reverse both"
          : "slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div style={{
        background: "rgba(167,139,250,0.10)",
        backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
        border: "1px solid rgba(167,139,250,0.25)",
        borderRadius: 16, padding: "12px 14px",
        display: "flex", alignItems: "flex-start", gap: 10,
        cursor: "pointer",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "rgba(240,240,240,0.85)", lineHeight: 1.5 }}>
            {text}
          </div>
          <div style={{ fontSize: 9, color: "rgba(167,139,250,0.60)", marginTop: 5, letterSpacing: 1, fontWeight: 700 }}>
            TOCAR PARA CERRAR
          </div>
        </div>
        <span style={{ fontSize: 12, color: "rgba(240,240,240,0.20)", flexShrink: 0 }}>✕</span>
      </div>
    </div>
  );
}
