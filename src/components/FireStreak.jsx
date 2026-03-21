import { useEffect, useRef } from "react";

/**
 * Fuego animado en Canvas con física de partículas real.
 * Se usa en el home para mostrar la racha.
 */
export default function FireStreak({ streak, size = 80 }) {
  const canvasRef = useRef();
  const frameRef  = useRef();
  const particles = useRef([]);

  useEffect(() => {
    if (streak < 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size * 0.72;

    // Intensidad según racha
    const intensity = Math.min(streak / 7, 1);
    const maxParticles = Math.floor(12 + intensity * 28);

    function spawnParticle() {
      const angle  = (Math.random() - 0.5) * 0.6;
      const speed  = 0.4 + Math.random() * 0.8 * intensity;
      return {
        x:     cx + (Math.random() - 0.5) * 10,
        y:     cy,
        vx:    Math.sin(angle) * speed,
        vy:    -(0.6 + Math.random() * 1.2 + intensity * 0.6),
        life:  1,
        decay: 0.018 + Math.random() * 0.015,
        r:     3 + Math.random() * 5 * intensity,
        // color entre amarillo → naranja → rojo
        hue:   25 + Math.random() * 30,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);

      // Spawn nuevas partículas
      while (particles.current.length < maxParticles) {
        particles.current.push(spawnParticle());
      }

      // Dibujar y actualizar
      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        p.x    += p.vx;
        p.y    += p.vy;
        p.vx   *= 0.98;
        p.life -= p.decay;

        const alpha = Math.max(0, p.life);
        const r     = p.r * alpha;

        // Glow exterior
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5);
        grd.addColorStop(0,   `hsla(${p.hue}, 100%, 70%, ${alpha * 0.4})`);
        grd.addColorStop(1,   `hsla(${p.hue}, 100%, 50%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core
        const core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        core.addColorStop(0,   `hsla(55, 100%, 90%, ${alpha})`);
        core.addColorStop(0.4, `hsla(${p.hue + 10}, 100%, 65%, ${alpha * 0.9})`);
        core.addColorStop(1,   `hsla(${p.hue - 10}, 100%, 40%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      });

      // Número de racha en el centro
      ctx.save();
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";

      // Glow del número
      ctx.shadowColor  = "#fb923c";
      ctx.shadowBlur   = 12;
      ctx.fillStyle    = "#fff";
      ctx.font         = `bold ${size * 0.32}px DM Mono, monospace`;
      ctx.fillText(streak, cx, cy - size * 0.18);

      ctx.shadowBlur   = 0;
      ctx.font         = `${size * 0.12}px DM Mono, monospace`;
      ctx.fillStyle    = "#fb923c88";
      ctx.fillText("DÍAS", cx, cy - size * 0.18 + size * 0.2);
      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [streak, size]);

  if (streak < 1) return null;

  return (
    <canvas ref={canvasRef} style={{ display: "block" }} />
  );
}
