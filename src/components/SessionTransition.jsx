import { useEffect, useRef } from "react";

/**
 * SessionTransition — Panel negro que cubre la pantalla mientras
 * React renderiza la nueva vista detrás. Sin slide lateral: solo
 * entra desde abajo, pausa, y sale hacia arriba.
 *
 * Timing coordinado con App.jsx (startSession):
 *   0ms     — Panel empieza a subir desde abajo
 *   280ms   — Panel cubre toda la pantalla (App.jsx cambia la vista en este momento)
 *   600ms   — Panel empieza a salir hacia arriba
 *   880ms   — Panel terminó de salir → onDone()
 */
export default function SessionTransition({ onDone }) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Estado inicial: fuera de pantalla abajo
    el.style.transition = "none";
    el.style.transform  = "translateY(100%)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Fase 1: Entrar — 280ms
        el.style.transition = "transform 0.28s cubic-bezier(0.76, 0, 0.24, 1)";
        el.style.transform  = "translateY(0%)";

        // Fase 2: Pausa — la vista ya fue swapeada detrás del panel
        // Fase 3: Salir — a los 600ms
        setTimeout(() => {
          el.style.transition = "transform 0.32s cubic-bezier(0.76, 0, 0.24, 1)";
          el.style.transform  = "translateY(-100%)";

          setTimeout(() => {
            onDone?.();
          }, 350);
        }, 600);
      });
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(255,255,255,0.90)",
        pointerEvents: "all",
        touchAction: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "translateY(100%)",
        willChange: "transform",
      }}
    >
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 12,
        animation: "fadeIn 0.2s ease 0.15s both",
      }}>
        <div style={{
          fontSize: 28, color: "#080810",
          fontWeight: 900, letterSpacing: -1,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}>◆</div>
        <div style={{
          fontSize: 9, color: "#080810", opacity: 0.4,
          letterSpacing: 4, fontWeight: 700,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}>GYM TRACKER</div>
      </div>
    </div>
  );
}
