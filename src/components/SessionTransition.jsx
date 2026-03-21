import { useEffect, useRef } from "react";

/**
 * Transición suave al abrir sesión.
 * Onda de luz que se expande elegantemente desde el centro.
 */
export default function SessionTransition({ color, onDone }) {
  const canvasRef = useRef();
  const frameRef  = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W   = window.innerWidth;
    const H   = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx   = W / 2;
    const cy   = H / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;

    const TOTAL_MS = 900;
    let startTime  = null;

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    }

    const rgb = hexToRgb(color.length === 7 ? color : "#60a5fa");

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t       = Math.min(elapsed / TOTAL_MS, 1);
      const ease    = easeInOutCubic(t);

      ctx.clearRect(0, 0, W, H);

      // Primera mitad: expansión suave
      if (t < 0.55) {
        const expandT = t / 0.55;
        const r       = maxR * easeInOutCubic(expandT);
        const alpha   = 0.85 * (1 - expandT * 0.3);

        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grd.addColorStop(0,    `rgba(${rgb}, ${alpha})`);
        grd.addColorStop(0.5,  `rgba(${rgb}, ${alpha * 0.6})`);
        grd.addColorStop(0.85, `rgba(${rgb}, ${alpha * 0.15})`);
        grd.addColorStop(1,    `rgba(${rgb}, 0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Anillo suave en el borde
        if (expandT > 0.1) {
          const ringAlpha = Math.sin(expandT * Math.PI) * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${ringAlpha})`;
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }
      }

      // Segunda mitad: fade out completo
      else {
        const fadeT = (t - 0.55) / 0.45;
        const alpha = Math.max(0, 1 - easeInOutCubic(fadeT)) * 0.4;

        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (t >= 1) {
        cancelAnimationFrame(frameRef.current);
        onDone?.();
        return;
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 999,
      pointerEvents: "none",
    }} />
  );
}
