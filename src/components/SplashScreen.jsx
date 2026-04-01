import { useEffect, useState } from "react";

export default function SplashScreen({ text = "CARGANDO" }) {
  const [phase, setPhase] = useState("enter"); // enter | idle | exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("idle"), 400);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "transparent",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 20, fontFamily: "DM Mono, monospace",
    }}>
      <style>{`
        @keyframes splashRhombus {
          0%   { transform: scale(0.4) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.1) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes splashPulse {
          0%, 100% { filter: drop-shadow(0 0 8px #60a5fa88); }
          50%       { filter: drop-shadow(0 0 24px #60a5facc); }
        }
        @keyframes splashText {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0; }
          40%            { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Logo ◆ */}
      <div style={{
        fontSize: 64, color: "#60a5fa",
        animation: "splashRhombus 0.6s cubic-bezier(0.34,1.56,0.64,1) both, splashPulse 2s ease-in-out 0.6s infinite",
        lineHeight: 1,
      }}>◆</div>

      {/* Nombre */}
      <div style={{
        fontSize: 13, letterSpacing: 6, color: "rgba(240,240,240,0.55)",
        animation: "splashText 0.4s ease 0.3s both",
      }}>GYM TRACKER</div>

      {/* Dots loading */}
      <div style={{ display: "flex", gap: 6, animation: "splashText 0.4s ease 0.5s both" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%", background: "#60a5fa",
            animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {text !== "CARGANDO" && (
        <div style={{
          fontSize: 11, color: "rgba(240,240,240,0.30)", letterSpacing: 2,
          animation: "splashText 0.3s ease 0.6s both",
        }}>{text}</div>
      )}
    </div>
  );
}
