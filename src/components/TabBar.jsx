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
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "var(--bg)",
      borderTop: "1.5px solid var(--text)",
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
              gap: 3, padding: "8px 4px 0",
              background: "none", border: "none",
              cursor: "pointer", fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
              position: "relative",
            }}
          >
            {active && (
              <div style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: 28, height: 2,
                background: "var(--text)",
              }} />
            )}
            <span style={{
              fontSize: 18, lineHeight: 1,
              color: active ? "var(--text)" : "var(--border)",
              transition: "color 0.15s",
            }}>{tab.icon}</span>
            <span style={{
              fontSize: 8, letterSpacing: 1.5,
              color: active ? "var(--text)" : "var(--text3)",
              fontWeight: active ? 700 : 400,
              transition: "color 0.15s",
            }}>{tab.label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
