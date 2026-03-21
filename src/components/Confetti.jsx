import { useEffect, useRef } from "react";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#fb923c"];

export default function Confetti({ active, onDone }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    // Crear partículas
    const particles = Array.from({ length: 80 }, () => ({
      x:     Math.random() * canvas.width,
      y:     -10,
      r:     Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx:    (Math.random() - 0.5) * 4,
      vy:    Math.random() * 4 + 2,
      rot:   Math.random() * 360,
      vrot:  (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? "rect" : "circle",
      alpha: 1,
    }));

    let frame;
    let elapsed = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      elapsed++;

      particles.forEach(p => {
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += 0.08; // gravedad
        p.rot += p.vrot;
        p.alpha = Math.max(0, 1 - elapsed / 90);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < 100) {
        frame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    }

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 999,
      pointerEvents: "none",
    }} />
  );
}
