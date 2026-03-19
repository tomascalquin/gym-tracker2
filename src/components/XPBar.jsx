import { useState } from "react";
import { getRank, getNextRank, xpToNextRank, RANKS } from "../utils/ranks";

export default function XPBar({ xp }) {
  const [expanded, setExpanded] = useState(false);
  const rank     = getRank(xp);
  const next     = getNextRank(xp);
  const progress = xpToNextRank(xp);

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        background: `linear-gradient(135deg, ${rank.dim} 0%, ${rank.color}11 100%)`,
        border: `1px solid ${rank.color}33`,
        borderRadius: 14, padding: "12px 16px", marginBottom: 14,
        cursor: "pointer", transition: "all 0.2s ease",
        boxShadow: `0 2px 12px ${rank.color}11`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: progress ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>{rank.emoji}</span>
          <div>
            <div style={{ fontSize: 11, color: rank.color, letterSpacing: 2, fontWeight: 500 }}>
              {rank.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 1 }}>
              {xp.toLocaleString()} XP
            </div>
          </div>
        </div>
        {next && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1 }}>PRÓXIMO</div>
            <div style={{ fontSize: 13, color: "var(--text3)" }}>{next.emoji} {next.name}</div>
            <div style={{ fontSize: 10, color: rank.color }}>-{progress?.needed?.toLocaleString()} XP</div>
          </div>
        )}
        {!next && <div style={{ fontSize: 11, color: rank.color }}>MÁXIMO 👑</div>}
      </div>

      {next && progress && (
        <>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 99, height: 5, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${rank.color} 0%, ${rank.color}aa 100%)`,
              width: `${progress.pct}%`, transition: "width 0.6s ease",
              boxShadow: `0 0 8px ${rank.color}88`,
            }} />
          </div>
          <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "right", marginTop: 4 }}>
            {progress.pct}% hacia {next.name}
          </div>
        </>
      )}

      {/* Expandido: todos los rangos */}
      {expanded && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12, animation: "slideDown 0.2s ease" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2, marginBottom: 8 }}>TODOS LOS RANGOS</div>
          {RANKS.map((r, i) => {
            const isCurrentRank = r.name === rank.name;
            const isPast = i < RANKS.findIndex(rr => rr.name === rank.name);
            return (
              <div key={r.name} style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 6,
                opacity: isPast ? 0.4 : 1,
              }}>
                <span style={{ fontSize: 16 }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: isCurrentRank ? r.color : "var(--text3)" }}>
                    {r.name} {isCurrentRank ? "← tú" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{r.minXP.toLocaleString()} XP</div>
                </div>
                {isPast && <span style={{ fontSize: 12 }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
