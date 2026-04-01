import { useMemo } from "react";
import { ACHIEVEMENTS, RARITY_COLORS, evaluateAchievements } from "../utils/achievements";
import { tokens } from "../design";

const CATEGORIES = [
  { key: "all",         label: "TODOS" },
  { key: "milestone",   label: "HITOS" },
  { key: "consistency", label: "CONSTANCIA" },
  { key: "strength",    label: "FUERZA" },
  { key: "volume",      label: "VOLUMEN" },
];

import { useState } from "react";

export default function AchievementsView({ logs, routine, userXP, onBack }) {
  const [cat, setCat] = useState("all");

  const unlocked = useMemo(
    () => evaluateAchievements(logs, routine, userXP),
    [logs, routine, userXP]
  );

  const filtered = ACHIEVEMENTS.filter(a => cat === "all" || a.category === cat);
  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.has(a.id)).length;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>
      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3 }}>PERFIL</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -0.8 }}>Logros</h2>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 300, color: "var(--text)" }}>{unlockedCount}</div>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)" }}>/ {ACHIEVEMENTS.length}</div>
          </div>
        </div>

        {/* Barra progreso global */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%`,
              background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", marginTop: 4, textAlign: "right" }}>
            {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% completado
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)} style={{
              background: cat === c.key ? "#a78bfa22" : "var(--bg2)",
              border: `1px solid ${cat === c.key ? "#a78bfa" : "var(--border)"}`,
              color: cat === c.key ? "#a78bfa" : "var(--text3)",
              padding: "5px 12px", borderRadius: 99, cursor: "pointer",
              fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
              whiteSpace: "nowrap", transition: "all 0.15s",
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "0 18px 100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {filtered.map(ach => {
            const done = unlocked.has(ach.id);
            const rc   = RARITY_COLORS[ach.rarity];
            return (
              <div key={ach.id} style={{
                background: done ? rc.bg : "var(--bg2)",
                border: `1px solid ${done ? rc.border : "var(--border)"}`,
                borderRadius: 18,
                padding: "14px 12px",
                opacity: done ? 1 : 0.45,
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Rareza badge */}
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  fontSize: 7, letterSpacing: 1,
                  color: done ? rc.text : "var(--text3)",
                }}>{rc.label}</div>

                {/* Icon */}
                <div style={{ fontSize: 28, marginBottom: 8, lineHeight: 1 }}>{ach.icon}</div>

                {/* Título */}
                <div style={{ fontSize: 11, color: done ? "var(--text)" : "var(--text2)", fontWeight: 500, marginBottom: 4, lineHeight: 1.2 }}>
                  {ach.title}
                </div>

                {/* Desc */}
                <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", lineHeight: 1.5 }}>
                  {done ? ach.desc : "???"}
                </div>

                {/* Tick */}
                {done && (
                  <div style={{
                    position: "absolute", bottom: 10, right: 10,
                    width: 16, height: 16, borderRadius: "50%",
                    background: rc.text + "33", border: `1px solid ${rc.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: rc.text,
                  }}>✓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
