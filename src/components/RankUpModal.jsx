import { useEffect, useState } from "react";

/**
 * Modal animado que aparece cuando el usuario sube de rango.
 */
export default function RankUpModal({ oldRank, newRank, xpGained, prs, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeño delay para que la animación se vea
    setTimeout(() => setVisible(true), 50);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0, background: "#000000cc",
        zIndex: 200, backdropFilter: "blur(4px)",
        opacity: visible ? 1 : 0, transition: "opacity 0.3s",
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: `translate(-50%, ${visible ? "-50%" : "-40%"})`,
        zIndex: 201, width: "90%", maxWidth: 360,
        background: "#0e0e1a",
        border: `2px solid ${newRank.color}`,
        borderRadius: 16, padding: "32px 24px",
        textAlign: "center", fontFamily: "DM Mono, monospace",
        opacity: visible ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: `0 0 60px ${newRank.color}44`,
      }}>
        {/* Partículas decorativas */}
        <div style={{ position: "absolute", top: 12, left: 16, fontSize: 20, animation: "float 2s ease-in-out infinite" }}>✨</div>
        <div style={{ position: "absolute", top: 20, right: 16, fontSize: 16, animation: "float 2.5s ease-in-out infinite 0.5s" }}>⭐</div>
        <div style={{ position: "absolute", bottom: 16, left: 20, fontSize: 14, animation: "float 3s ease-in-out infinite 1s" }}>💫</div>
        <div style={{ position: "absolute", bottom: 20, right: 24, fontSize: 18, animation: "float 2.2s ease-in-out infinite 0.3s" }}>✨</div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes pulse-glow {
            0%, 100% { text-shadow: 0 0 20px currentColor; }
            50% { text-shadow: 0 0 40px currentColor, 0 0 80px currentColor; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Etiqueta */}
        <div style={{ fontSize: 10, letterSpacing: 4, color: newRank.color, marginBottom: 16 }}>
          ¡ SUBISTE DE RANGO !
        </div>

        {/* Transición de rango */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ textAlign: "center", opacity: 0.5 }}>
            <div style={{ fontSize: 32 }}>{oldRank.emoji}</div>
            <div style={{ fontSize: 10, color: oldRank.color, marginTop: 4 }}>{oldRank.name}</div>
          </div>
          <div style={{ fontSize: 20, color: "#475569" }}>→</div>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 52,
              animation: "pulse-glow 1.5s ease-in-out infinite",
              color: newRank.color,
            }}>{newRank.emoji}</div>
            <div style={{ fontSize: 14, color: newRank.color, marginTop: 4, fontWeight: 700, letterSpacing: 2 }}>
              {newRank.name.toUpperCase()}
            </div>
          </div>
        </div>

        {/* XP ganado */}
        <div style={{
          background: newRank.dim, border: `1px solid ${newRank.color}33`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 22, color: newRank.color, fontWeight: 700 }}>+{xpGained} XP</div>
          {prs.length > 0 && (
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
              🏆 PR en {prs.join(", ")}
            </div>
          )}
        </div>

        <button onClick={handleClose} style={{
          width: "100%", padding: "12px",
          background: newRank.color, border: "none",
          borderRadius: 10, color: "#000", fontWeight: 700,
          fontSize: 13, letterSpacing: 2, cursor: "pointer",
          fontFamily: "inherit",
        }}>
          SEGUIR ENTRENANDO
        </button>
      </div>
    </>
  );
}
