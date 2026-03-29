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
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "14px 16px", marginBottom: 16,
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{rank.emoji}</span>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700 }}>
              {rank.name.toUpperCase()}
            </div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", letterSpacing: -0.5 }}>
              {xp.toLocaleString()} XP
            </div>
          </div>
        </div>
        {next && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1, fontWeight: 700 }}>PRÓXIMO</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{next.emoji} {next.name}</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>−{progress?.needed?.toLocaleString()} XP</div>
          </div>
        )}
        {!next && <div style={{ fontSize: 10, color: "var(--text2)", letterSpacing: 1, fontWeight: 700 }}>MÁXIMO 👑</div>}
      </div>

      {next && progress && (
        <>
          <div style={{ background: "var(--border)", borderRadius: 2, height: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: "var(--text)",
              width: `${progress.pct}%`, transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "right", marginTop: 4, fontWeight: 700 }}>
            {progress.pct}%
          </div>
        </>
      )}

      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14, animation: "slideDown 0.2s ease" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 10 }}>TODOS LOS RANGOS</div>
          {RANKS.map((r, i) => {
            const isCurrent = r.name === rank.name;
            const isPast    = i < RANKS.findIndex(rr => rr.name === rank.name);
            return (
              <div key={r.name} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0", borderBottom: "1px solid var(--border)",
                opacity: isPast ? 0.4 : 1,
              }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 400, color: "var(--text)" }}>
                    {r.name} {isCurrent ? "← tú" : ""}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{r.minXP.toLocaleString()} XP</div>
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
