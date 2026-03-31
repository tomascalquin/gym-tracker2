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
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border)",
        borderRadius: 18, padding: "14px 16px", marginBottom: 16,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{rank.emoji}</span>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700 }}>
              {rank.name.toUpperCase()}
            </div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
              {xp.toLocaleString()} XP
            </div>
          </div>
        </div>
        {next ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1, fontWeight: 700 }}>PRÓXIMO</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{next.emoji} {next.name}</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>
              −{progress?.needed?.toLocaleString()} XP
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "var(--text2)", letterSpacing: 1, fontWeight: 700 }}>MÁXIMO 👑</div>
        )}
      </div>

      {next && progress && (
        <>
          <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 99, height: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: "rgba(255,255,255,0.75)",
              width: `${progress.pct}%`,
              transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
            }} />
          </div>
          <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "right", marginTop: 4, fontWeight: 700 }}>
            {progress.pct}%
          </div>
        </>
      )}

      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--glass-border)", paddingTop: 14, animation: "slideDown 0.2s ease" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 10 }}>TODOS LOS RANGOS</div>
          {RANKS.map((r, i) => {
            const isCurrent = r.name === rank.name;
            const isPast    = i < RANKS.findIndex(rr => rr.name === rank.name);
            return (
              <div key={r.name} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0", borderBottom: "1px solid var(--glass-border)",
                opacity: isPast ? 0.4 : 1,
              }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 400, color: "#fff" }}>
                    {r.name} {isCurrent ? "← tú" : ""}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>
                    {r.minXP.toLocaleString()} XP
                  </div>
                </div>
                {isPast && <span style={{ fontSize: 11, color: "var(--text3)" }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
