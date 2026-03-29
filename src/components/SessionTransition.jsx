import { useEffect, useRef } from "react";

/**
 * SessionTransition — Cortina editorial cream & black.
 * Igual para todos los días: panel negro que sube desde abajo,
 * pausa un instante, y luego se retira hacia arriba.
 * Sofisticado, sin color — solo forma y movimiento.
 */
export default function SessionTransition({ color, onDone }) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fase 1: entrar (panel sube desde abajo)
    // Fase 2: pausa breve
    // Fase 3: salir (panel sube fuera de pantalla)
    // Total: ~700ms

    el.style.transition = "none";
    el.style.transform  = "translateY(100%)";

    // Frame para asegurar que el estado inicial se pinte
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Entrar
        el.style.transition = "transform 0.32s cubic-bezier(0.76, 0, 0.24, 1)";
        el.style.transform  = "translateY(0%)";

        // Pausa + salir
        setTimeout(() => {
          el.style.transition = "transform 0.32s cubic-bezier(0.76, 0, 0.24, 1)";
          el.style.transform  = "translateY(-100%)";

          setTimeout(() => {
            onDone?.();
          }, 340);
        }, 180);
      });
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "var(--text)",
        pointerEvents: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "translateY(100%)",
      }}
    >
      {/* Logo / marca centrada — aparece durante la transición */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 12,
        animation: "fadeIn 0.15s ease 0.1s both",
      }}>
        <div style={{
          fontSize: 32, color: "var(--bg)",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 900, letterSpacing: -1,
        }}>◆</div>
        <div style={{
          fontSize: 9, color: "var(--bg)",
          opacity: 0.5,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: 4, fontWeight: 700,
        }}>GYM TRACKER</div>
      </div>
    </div>
  );
}
