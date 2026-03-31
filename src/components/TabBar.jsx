import { useState } from "react";

const TABS = [
  { key: "home",        icon: "⊹", label: "Inicio" },
  { key: "history",     icon: "◫", label: "Historial" },
  { key: "progress",    icon: "∿", label: "Progreso" },
  { key: "friends",     icon: "◎", label: "Social" },
  { key: "leaderboard", icon: "◈", label: "Ranking" },
];

export const TAB_VIEWS = TABS.map(t => t.key);

export default function TabBar({ currentView, onNavigate }) {
  const [pressed, setPressed] = useState(null);

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(env(safe-area-inset-bottom) + 16px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      width: "calc(100% - 40px)",
      maxWidth: 420,
    }}>
      <div style={{
        display: "flex",
        background: "rgba(12,12,28,0.65)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 99,
        padding: "6px",
        gap: 2,
      }}>
        {TABS.map(tab => {
          const active = currentView === tab.key;
          const isPressed = pressed === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              onTouchStart={() => setPressed(tab.key)}
              onTouchEnd={() => setPressed(null)}
              onMouseDown={() => setPressed(tab.key)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "8px 4px",
                background: active
                  ? "rgba(255,255,255,0.15)"
                  : isPressed
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                border: "none",
                borderRadius: 99,
                cursor: "pointer",
                fontFamily: "inherit",
                WebkitTapHighlightColor: "transparent",
                transition: "background 0.15s",
                transform: isPressed ? "scale(0.94)" : "scale(1)",
              }}
            >
              <span style={{
                fontSize: 18,
                lineHeight: 1,
                color: active ? "#fff" : "rgba(240,240,240,0.30)",
                transition: "color 0.15s, transform 0.15s",
                transform: active ? "scale(1.08)" : "scale(1)",
                display: "block",
              }}>{tab.icon}</span>
              <span style={{
                fontSize: 7,
                letterSpacing: 1.2,
                color: active ? "rgba(255,255,255,0.9)" : "rgba(240,240,240,0.25)",
                fontWeight: active ? 700 : 400,
                transition: "color 0.15s",
              }}>{tab.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
