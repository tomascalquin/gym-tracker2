import { useState } from "react";

const TABS = [
  { key: "home",        icon: "⊹", label: "Inicio",    activeIcon: "⊹" },
  { key: "history",     icon: "◫",  label: "Historial", activeIcon: "◫" },
  { key: "progress",    icon: "∿",  label: "Progreso",  activeIcon: "∿" },
  { key: "friends",     icon: "◎",  label: "Social",    activeIcon: "◎" },
  { key: "leaderboard", icon: "◈",  label: "Ranking",   activeIcon: "◈" },
];

export const TAB_VIEWS = TABS.map(t => t.key);

export default function TabBar({ currentView, onNavigate }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(8,8,16,0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      paddingBottom: "env(safe-area-inset-bottom)",
      height: "calc(64px + env(safe-area-inset-bottom))",
    }}>
      {TABS.map(tab => {
        const active = currentView === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onNavigate(tab.key)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 4, padding: "8px 4px 0",
              background: "none", border: "none",
              cursor: "pointer", fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
              position: "relative",
            }}
          >
            {/* Indicador activo */}
            {active && (
              <div style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: 32, height: 2, borderRadius: 2,
                background: "#60a5fa",
              }} />
            )}
            <span style={{
              fontSize: 18, lineHeight: 1,
              color: active ? "#60a5fa" : "#334155",
              transition: "color 0.15s",
            }}>{tab.icon}</span>
            <span style={{
              fontSize: 9, letterSpacing: 0.8,
              color: active ? "#60a5fa" : "#334155",
              fontWeight: active ? 500 : 400,
              transition: "color 0.15s",
            }}>{tab.label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
