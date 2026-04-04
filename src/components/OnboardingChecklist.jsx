import { useState } from "react";
import { CHECKLIST, BONUS_XP, dismissOnboarding } from "../utils/onboarding";

export default function OnboardingChecklist({ uid, completed, onDismiss, onNavigate, allDone, bonusClaimed }) {
  const [expanded, setExpanded] = useState(true);
  const doneCount  = completed.length;
  const totalCount = CHECKLIST.length;
  const pct        = Math.round((doneCount / totalCount) * 100);

  // No mostrar si fue descartada o si ya completaron todo y reclamaron el bonus
  if (allDone && bonusClaimed) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 20, marginBottom: 20, overflow: "hidden",
    }}>
      {/* Header — siempre visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "14px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
          fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Progress ring */}
        <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
          <svg width="42" height="42" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="21" cy="21" r="17" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx="21" cy="21" r="17" fill="none"
              stroke={allDone ? "#4ade80" : "#a78bfa"}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 17}`}
              strokeDashoffset={`${2 * Math.PI * 17 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700,
            color: allDone ? "#4ade80" : "#a78bfa",
          }}>
            {allDone ? "✓" : `${doneCount}/${totalCount}`}
          </div>
        </div>

        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
            {allDone ? "¡Misión completada! 🎉" : "Misión de bienvenida"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(240,240,240,0.40)" }}>
            {allDone
              ? bonusClaimed ? "Ya reclamaste el bonus" : `Reclamá tus +${BONUS_XP} XP bonus`
              : `${doneCount} de ${totalCount} completados · +${BONUS_XP} XP al terminar`}
          </div>
        </div>

        <span style={{ fontSize: 14, color: "rgba(240,240,240,0.25)", transition: "transform 0.2s", display: "block", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          ˅
        </span>
      </button>

      {/* Lista expandible */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", animation: "slideDown 0.18s ease" }}>
          {CHECKLIST.map((item, i) => {
            const done = completed.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => !done && onNavigate && handleNav(item.id, onNavigate)}
                style={{
                  width: "100%", background: "none", border: "none",
                  borderBottom: i < CHECKLIST.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: done ? "default" : "pointer",
                  fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
                  opacity: done ? 0.6 : 1,
                }}
              >
                {/* Check / icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: done ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.07)",
                  border: `1px solid ${done ? "rgba(74,222,128,0.30)" : "rgba(255,255,255,0.10)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  {done ? "✓" : item.icon}
                </div>

                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: done ? "rgba(240,240,240,0.50)" : "#fff",
                    textDecoration: done ? "line-through" : "none",
                    marginBottom: 2,
                  }}>
                    {item.title}
                  </div>
                  {!done && (
                    <div style={{ fontSize: 10, color: "rgba(240,240,240,0.35)" }}>{item.desc}</div>
                  )}
                </div>

                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  color: done ? "rgba(74,222,128,0.60)" : "rgba(167,139,250,0.70)",
                  flexShrink: 0,
                }}>
                  +{item.xp} XP
                </div>
              </button>
            );
          })}

          {/* Bonus claim */}
          {allDone && !bonusClaimed && (
            <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={onDismiss}
                style={{
                  width: "100%", padding: "13px",
                  background: "rgba(74,222,128,0.20)",
                  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(74,222,128,0.35)",
                  color: "#4ade80", borderRadius: 14,
                  fontSize: 11, fontWeight: 700, letterSpacing: 2,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(74,222,128,0.20)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                🎁 RECLAMAR +{BONUS_XP} XP BONUS
              </button>
            </div>
          )}

          {/* Descartar (solo si no está completa) */}
          {!allDone && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "right" }}>
              <button onClick={() => { dismissOnboarding(uid); onDismiss?.(); }} style={{
                background: "none", border: "none",
                color: "rgba(240,240,240,0.20)", fontSize: 10,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
              }}>
                descartar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function handleNav(itemId, onNavigate) {
  const map = {
    first_session:  null,       // scroll al day picker — no navegar
    see_progress:   "progress",
    three_sessions: null,
    add_friend:     "friends",
    weekly_ai:      "weeklySummary",
  };
  const dest = map[itemId];
  if (dest) onNavigate(dest);
}
