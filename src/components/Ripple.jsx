import { useRef } from "react";

/**
 * Wrapper que agrega ripple effect a cualquier botón/div.
 * Uso: <Ripple color="#60a5fa"><button>...</button></Ripple>
 */
export default function Ripple({ children, color = "#ffffff", style, onClick, ...props }) {
  const containerRef = useRef();

  function handleClick(e) {
    const el   = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${color}33;
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      transform: scale(0);
      animation: rippleAnim 0.5s ease-out forwards;
      pointer-events: none;
      z-index: 0;
    `;

    // Asegurar que el contenedor tiene position relative
    el.style.position = "relative";
    el.style.overflow = "hidden";
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 520);

    onClick?.(e);
  }

  return (
    <>
      <style>{`
        @keyframes rippleAnim {
          to { transform: scale(1); opacity: 0; }
        }
      `}</style>
      <div ref={containerRef} onClick={handleClick} style={{ position: "relative", overflow: "hidden", ...style }} {...props}>
        {children}
      </div>
    </>
  );
}
