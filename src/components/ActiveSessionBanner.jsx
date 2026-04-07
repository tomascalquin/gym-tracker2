import { DAY_META } from "../data/routine";
import { haptics } from "../utils/haptics";
import { clearDraft } from "../utils/sessionDraft";

/**
 * Pill inline (NO fixed) que aparece en el scroll de HomeView cuando
 * hay una sesión en progreso. Al ser parte del flujo normal del documento,
 * nunca tapa la TabBar ni el botón de herramientas.
 */
export default function ActiveSessionBanner({ activeDay, sessionDate, completedSets, routine, onResume, onDiscard }) {
  if (!activeDay) return null;

  const c         = DAY_META[activeDay] || { accent: "#a78bfa", tag: "DÍA" };
  const exercises = routine?.[activeDay]?.exercises || [];
  const totalSets = exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const doneSets  = Object.values(completedSets).filter(Boolean).length;
  const pct       = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  function handleResume()  { haptics.medium(); onResume(); }
  function handleDiscard() { haptics.warning(); clearDraft(); onDiscard(); }

  return (
    <div style={{ marginBottom: 12 }}>
      <style>{`
        @keyframes activePulse {
          0%, 100% { box-shadow: 0 0 0 0 ${c.accent}44; }
          50%       { box-shadow: 0 0 0 6px ${c.accent}00; }
        }
        @keyframes dotPing {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        background: `linear-gradient(135deg, ${c.accent}14, ${c.accent}06)`,
        backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        border: `1px solid ${c.accent}30`,
        borderRadius: 18,
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
        animation: "bannerIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* Dot pulsante */}
        <div style={{ position: "relative", flexShrink: 0, width: 10, height: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: c.accent,
            boxShadow: `0 0 8px ${c.accent}88`,
            animation: "activePulse 2s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `1.5px solid ${c.accent}`,
            animation: "dotPing 1.6s ease-out infinite",
          }} />
        </div>

        {/* Info — toca para reanudar */}
        <button onClick={handleResume} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          textAlign: "left", fontFamily: "inherit", padding: 0,
          WebkitTapHighlightColor: "transparent",
        }}>
          <div style={{
            fontSize: 9, letterSpacing: 2.5, fontWeight: 700,
            color: c.accent, marginBottom: 3,
          }}>
            {c.tag || "DÍA"} EN PROGRESO
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>
            {activeDay}
          </div>
        </button>

        {/* Progreso circular mini */}
        <div style={{ flexShrink: 0, position: "relative", width: 36, height: 36 }}>
          <svg width="36" height="36" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="14" fill="none"
              stroke={`${c.accent}20`} strokeWidth="2.5" />
            <circle cx="18" cy="18" r="14" fill="none"
              stroke={c.accent} strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, fontWeight: 700, color: c.accent,
          }}>{pct}%</div>
        </div>

        {/* Botón volver */}
        <button onClick={handleResume} style={{
          background: `${c.accent}22`,
          border: `1px solid ${c.accent}44`,
          color: c.accent,
          padding: "7px 13px",
          borderRadius: 99,
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          cursor: "pointer", fontFamily: "inherit",
          flexShrink: 0, minHeight: 0,
          WebkitTapHighlightColor: "transparent",
          transition: "background 0.15s",
        }}>
          VOLVER
        </button>

        {/* Descartar */}
        <button onClick={handleDiscard} style={{
          background: "transparent",
          border: "1px solid rgba(248,113,113,0.20)",
          color: "rgba(248,113,113,0.55)",
          width: 26, height: 26, borderRadius: 8,
          cursor: "pointer", fontSize: 11, minHeight: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit", flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
          transition: "all 0.15s",
        }}>✕</button>
      </div>
    </div>
  );
}
