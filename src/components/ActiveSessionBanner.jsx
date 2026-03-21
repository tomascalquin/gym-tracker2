import { DAY_META } from "../data/routine";
import { haptics } from "../utils/haptics";
import { clearDraft } from "../utils/sessionDraft";

/**
 * Banner flotante que aparece en el home cuando hay una sesión en progreso.
 */
export default function ActiveSessionBanner({ activeDay, sessionDate, completedSets, routine, onResume, onDiscard }) {
  if (!activeDay) return null;

  const c         = DAY_META[activeDay] || { accent: "#60a5fa", tag: "DÍA" };
  const exercises = routine?.[activeDay]?.exercises || [];
  const totalSets = exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const doneSets  = Object.values(completedSets).filter(Boolean).length;
  const pct       = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  function handleResume() {
    haptics.medium();
    onResume();
  }

  function handleDiscard() {
    haptics.warning();
    clearDraft();
    onDiscard();
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(72px + env(safe-area-inset-bottom) + 12px)",
      left: 16, right: 16, zIndex: 80,
      animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes activePulse {
          0%, 100% { box-shadow: 0 4px 24px ${c.accent}33; }
          50%       { box-shadow: 0 4px 32px ${c.accent}66; }
        }
        @keyframes ping {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <div style={{
        background: "rgba(8,8,16,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: `1.5px solid ${c.accent}66`,
        borderRadius: 16, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 10,
        animation: "activePulse 2s ease-in-out infinite",
      }}>
        {/* Indicador pulsante */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.accent }} />
          <div style={{
            position: "absolute", inset: -3, borderRadius: "50%",
            border: `1.5px solid ${c.accent}`,
            animation: "ping 1.2s ease-in-out infinite",
          }} />
        </div>

        {/* Info — clickeable para continuar */}
        <button onClick={handleResume} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          textAlign: "left", fontFamily: "inherit", padding: 0,
          WebkitTapHighlightColor: "transparent",
        }}>
          <div style={{ fontSize: 12, color: c.accent, letterSpacing: 1 }}>
            {activeDay} · EN PROGRESO
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
            {doneSets}/{totalSets} series · toca para continuar
          </div>
        </button>

        {/* Barra de progreso */}
        <div style={{ width: 48, flexShrink: 0 }}>
          <div style={{ background: "var(--border)", borderRadius: 99, height: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: c.accent,
              width: `${pct}%`, transition: "width 0.4s ease",
              boxShadow: `0 0 6px ${c.accent}88`,
            }} />
          </div>
          <div style={{ fontSize: 9, color: c.accent, textAlign: "right", marginTop: 3 }}>{pct}%</div>
        </div>

        {/* Continuar */}
        <button onClick={handleResume} style={{
          background: c.accent, color: "#000",
          padding: "6px 10px", borderRadius: 99,
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          border: "none", cursor: "pointer", fontFamily: "inherit",
          flexShrink: 0, minHeight: 32,
          WebkitTapHighlightColor: "transparent",
        }}>IR</button>

        {/* Descartar ✕ */}
        <button onClick={handleDiscard} style={{
          background: "transparent",
          border: "1px solid #3f1010",
          color: "var(--red)",
          width: 28, height: 28, borderRadius: 8,
          cursor: "pointer", fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit", flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
          transition: "background 0.15s",
        }}>✕</button>
      </div>
    </div>
  );
}
