import { useEffect, useState } from "react";

export default function RankUpModal({ oldRank, newRank, xpGained, prs, onClose }) {
  const [visible, setVisible] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    setTimeout(() => { setVisible(true); setShowParticles(true); }, 50);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const particles = ["✨", "⭐", "💫", "🌟", "✦", "◆"];

  return (
    <>
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0, background: "#000000dd",
        zIndex: 200, backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0, transition: "opacity 0.3s",
      }} />

      {/* Partículas */}
      {showParticles && [...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: "fixed", zIndex: 201,
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 40}%`,
          fontSize: 16 + Math.random() * 14,
          animation: `float ${2 + Math.random()}s ease-in-out infinite ${Math.random()}s`,
          pointerEvents: "none",
        }}>{particles[i % particles.length]}</div>
      ))}

      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: `translate(-50%, ${visible ? "-50%" : "-44%"})`,
        zIndex: 202, width: "88%", maxWidth: 360,
        background: "rgba(8,8,20,0.85)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        border: `1.5px solid ${newRank.color}55`,
        borderRadius: 24, padding: "32px 24px",
        textAlign: "center", fontFamily: "DM Mono, monospace",
        opacity: visible ? 1 : 0,
        transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: `0 0 80px ${newRank.color}33, 0 20px 60px rgba(0,0,0,0.6)`,
      }}>
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(5deg)} }
          @keyframes rankPulse { 0%,100%{filter:drop-shadow(0 0 8px ${newRank.color})} 50%{filter:drop-shadow(0 0 24px ${newRank.color})} }
        `}</style>

        <div style={{ fontSize: 9, letterSpacing: 4, color: newRank.color + "88", marginBottom: 16 }}>
          SUBISTE DE RANGO
        </div>

        {/* Transición */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ opacity: 0.4, textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>{oldRank.emoji}</div>
            <div style={{ fontSize: 9, color: oldRank.color, marginTop: 4 }}>{oldRank.name}</div>
          </div>
          <div style={{ color: "rgba(240,240,240,0.30)", fontSize: 18 }}>→</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 58, animation: "rankPulse 2s ease-in-out infinite", display: "inline-block" }}>
              {newRank.emoji}
            </div>
            <div style={{ fontSize: 14, color: newRank.color, marginTop: 6, fontWeight: 700, letterSpacing: 3 }}>
              {newRank.name.toUpperCase()}
            </div>
          </div>
        </div>

        {/* XP */}
        <div style={{
          background: newRank.dim, border: `1px solid ${newRank.color}22`,
          borderRadius: 12, padding: "14px 18px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 28, color: newRank.color, fontWeight: 300 }}>+{xpGained} XP</div>
          {prs?.length > 0 && (
            <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)", marginTop: 4 }}>
              🏆 PR en {prs.join(", ")}
            </div>
          )}
        </div>

        <button onClick={handleClose} style={{
          width: "100%", padding: "14px",
          background: `linear-gradient(135deg, ${newRank.color} 0%, ${newRank.color}cc 100%)`,
          border: "none", borderRadius: 12, color: "#f0f0f0",
          fontWeight: 700, fontSize: 12, letterSpacing: 2,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 4px 20px ${newRank.color}44`,
        }}>SEGUIR ENTRENANDO</button>
      </div>
    </>
  );
}
