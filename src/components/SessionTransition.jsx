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

    // Estado inicial
    el.style.transition = "none";
    el.style.transform  = "translateY(100%)";

    // Frame para asegurar que el estado inicial se pinte
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Fase 1: Entrar (panel sube fluido desde abajo usando GPU)
        el.style.transition = "transform 0.3s cubic-bezier(0.85, 0, 0.15, 1)";
        el.style.transform  = "translateY(0%)";

        // Fase 2: Pausa extendida.
        // App.jsx cambia la vista internamente a los 350ms. 
        // Esperamos hasta los 550ms para asegurar que el renderizado pesado de React 
        // haya terminado detrás del panel negro sin que el usuario lo note.
        setTimeout(() => {
          // Fase 3: Salir hacia arriba
          el.style.transition = "transform 0.35s cubic-bezier(0.85, 0, 0.15, 1)";
          el.style.transform  = "translateY(-100%)";

          // Limpiar el componente
          setTimeout(() => {
            onDone?.();
          }, 400); // Dar tiempo seguro a que termine de salir
        }, 550);
      });
    });
  }, [onDone]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "var(--text)",
        pointerEvents: "all", // CRUCIAL: Bloquea toques accidentales mientras transiciona
        touchAction: "none",  // CRUCIAL: Evita el pull-to-refresh o scroll fantasma en iOS/Android
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "translateY(100%)",
        willChange: "transform", // CRUCIAL: Fuerza la aceleración por hardware (cero tirones)
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