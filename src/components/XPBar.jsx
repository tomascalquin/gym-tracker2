import { getRank, getNextRank, xpToNextRank, RANKS } from "../utils/ranks";

/**
 * Componente de rango y barra de XP para mostrar en el home.
 */
export default function XPBar({ xp }) {
  const rank   = getRank(xp);
  const next   = getNextRank(xp);
  const progress = xpToNextRank(xp);

  return (
    <div style={{
      background: rank.dim,
      border: `1px solid ${rank.color}44`,
      borderLeft: `3px solid ${rank.color}`,
      borderRadius: 10, padding: "12px 16px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>{rank.emoji}</span>
          <div>
            <div style={{ fontSize: 14, color: rank.color, fontWeight: 500, letterSpacing: 1 }}>
              {rank.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>
              {xp.toLocaleString()} XP
            </div>
          </div>
        </div>
        {next && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#475569" }}>próximo</div>
            <div style={{ fontSize: 13, color: "#475569" }}>
              {next.emoji} {next.name}
            </div>
            <div style={{ fontSize: 10, color: "#334155" }}>
              -{progress.needed.toLocaleString()} XP
            </div>
          </div>
        )}
        {!next && (
          <div style={{ fontSize: 12, color: rank.color }}>RANGO MÁX ✓</div>
        )}
      </div>

      {/* Barra de progreso */}
      {next && progress && (
        <div>
          <div style={{ background: "#1a1a2a", borderRadius: 4, height: 6 }}>
            <div style={{
              height: 6, borderRadius: 4, background: rank.color,
              width: `${progress.pct}%`, transition: "width 0.5s",
            }} />
          </div>
          <div style={{ fontSize: 9, color: "#334155", textAlign: "right", marginTop: 3 }}>
            {progress.pct}% hacia {next.name}
          </div>
        </div>
      )}
    </div>
  );
}
