import { useEffect, useRef } from "react";

export default function SessionTransition({ onDone }) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.transition = "none";
    el.style.transform  = "translateY(100%)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.28s cubic-bezier(0.76, 0, 0.24, 1)";
        el.style.transform  = "translateY(0%)";

        setTimeout(() => {
          el.style.transition = "transform 0.32s cubic-bezier(0.76, 0, 0.24, 1)";
          el.style.transform  = "translateY(-100%)";
          setTimeout(() => onDone?.(), 350);
        }, 600);
      });
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#080810",
        pointerEvents: "all",
        touchAction: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "translateY(100%)",
        willChange: "transform",
      }}
    >
      {/* Orbs de fondo igual que el resto de la app */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 60% 50% at 20% 10%, rgba(88,56,230,0.45) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 30%, rgba(14,100,200,0.35) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 50% 85%, rgba(120,40,180,0.30) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "relative",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 12,
        animation: "fadeIn 0.2s ease 0.15s both",
      }}>
        <div style={{
          fontSize: 28, color: "rgba(167,139,250,0.18)",
          fontWeight: 900, letterSpacing: -1,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}>◆</div>
        <div style={{
          fontSize: 9, color: "rgba(255,255,255,0.30)",
          letterSpacing: 4, fontWeight: 700,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}>GYM TRACKER</div>
      </div>
    </div>
  );
}
