import { useEffect, useRef } from "react";

/**
 * Anillos de actividad estilo Apple Fitness.
 * Muestra 3 anillos: sesiones esta semana, volumen, racha.
 */
export default function ActivityRings({ logs, streak, size = 100 }) {
  const canvasRef = useRef();

  // Calcular stats de la semana
  const now    = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weekSessions = Object.values(logs).filter(s => new Date(s.date) >= monday).length;
  const weekTarget   = 4; // objetivo semanal
  const streakTarget = 7; // objetivo de racha

  // Porcentajes (pueden superar 100%)
  const sessionPct = Math.min(weekSessions / weekTarget, 1);
  const streakPct  = Math.min(streak / streakTarget, 1);
  const allPct     = weekSessions >= weekTarget ? 1 : sessionPct * 0.8;

  const rings = [
    { color: "#ff375f", pct: sessionPct,  label: `${weekSessions}/${weekTarget}d` },
    { color: "#30d158", pct: allPct,      label: weekSessions >= weekTarget ? "✓" : `${Math.round(allPct * 100)}%` },
    { color: "#0a84ff", pct: streakPct,   label: `${streak}d` },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const dpr    = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    const cx      = size / 2;
    const cy      = size / 2;
    const stroke  = size * 0.09;
    const gap     = stroke * 1.4;

    rings.forEach((ring, i) => {
      const r = cx - stroke / 2 - i * gap;
      if (r <= 0) return;

      // Track (fondo)
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color + "22";
      ctx.lineWidth   = stroke;
      ctx.lineCap     = "round";
      ctx.stroke();

      // Progreso
      if (ring.pct > 0) {
        const startAngle = -Math.PI / 2;
        const endAngle   = startAngle + (Math.PI * 2 * ring.pct);
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth   = stroke;
        ctx.lineCap     = "round";
        ctx.shadowColor = ring.color;
        ctx.shadowBlur  = 6;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }
    });
  }, [logs, streak, size]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <canvas ref={canvasRef} />
      {/* Labels pequeños */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
      }}>
        <div style={{ fontSize: size * 0.16, color: rings[0].color, fontWeight: 500, lineHeight: 1 }}>
          {weekSessions}
        </div>
        <div style={{ fontSize: size * 0.09, color: "rgba(240,240,240,0.30)", letterSpacing: 1, marginTop: 2 }}>
          SEM
        </div>
      </div>
    </div>
  );
}
