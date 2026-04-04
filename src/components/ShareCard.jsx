import { useRef, useState, useEffect } from "react";
import { getRank } from "../utils/ranks";
import { sessionVolume } from "../utils/fitness";

/**
 * ShareCard — Tarjeta para compartir en RRSS después de terminar una sesión.
 * Se renderiza en canvas para poder exportarla como imagen.
 * Diseño: Liquid Glass oscuro con gradientes, stats de la sesión, motivación.
 */
export default function ShareCard({ session, routine, userXP, user, prs, xpEarned, onClose }) {
  const canvasRef  = useRef();
  const [ready, setReady]     = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied]   = useState(false);

  const rank       = getRank(userXP);
  const exercises  = routine?.[session?.day]?.exercises || [];
  const totalSets  = Object.values(session?.completed || {}).filter(Boolean).length;
  const volKg      = Math.round(sessionVolume(session?.sets || {}));
  const dayMeta    = { accent: "#a78bfa" }; // default

  // Stats para mostrar
  const stats = [
    { label: "SERIES",    value: totalSets },
    { label: "TONELAJE",  value: `${volKg}kg` },
    { label: "+XP",       value: `+${xpEarned}` },
  ];

  useEffect(() => {
    if (!session) return;
    drawCard();
  }, [session, userXP]);

  function drawCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 1080, H = 1080;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // ── Fondo oscuro con gradientes ──────────────────────────────────────
    ctx.fillStyle = "#080810";
    ctx.fillRect(0, 0, W, H);

    // Orbs de color
    const orbs = [
      { x: 0.2, y: 0.15, r: 0.5, color: "rgba(88,56,230,0.50)" },
      { x: 0.8, y: 0.25, r: 0.45, color: "rgba(14,100,200,0.40)" },
      { x: 0.5, y: 0.85, r: 0.50, color: "rgba(120,40,180,0.35)" },
    ];
    orbs.forEach(o => {
      const grd = ctx.createRadialGradient(o.x*W, o.y*H, 0, o.x*W, o.y*H, o.r*W);
      grd.addColorStop(0, o.color);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    });

    // ── Glass card central ───────────────────────────────────────────────
    const cx = W / 2, cy = H / 2;
    const cardW = 860, cardH = 820;
    const cardX = cx - cardW / 2, cardY = cy - cardH / 2;
    const r = 48;

    // Sombra/glow
    ctx.shadowColor = "rgba(120,80,255,0.35)";
    ctx.shadowBlur  = 80;

    // Card background
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, cardX, cardY, cardW, cardH, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Card border
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth   = 2;
    roundRect(ctx, cardX, cardY, cardW, cardH, r);
    ctx.stroke();

    // ── Logo / brand ─────────────────────────────────────────────────────
    ctx.font      = "700 28px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(240,240,240,0.30)";
    ctx.textAlign = "center";
    ctx.letterSpacing = "4px";
    ctx.fillText("GYM TRACKER", cx, cardY + 80);

    // ── Nombre del usuario ───────────────────────────────────────────────
    const name = (user?.displayName || user?.email || "Atleta").split(" ")[0].toUpperCase();
    ctx.font      = "900 96px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(name, cx, cardY + 190);

    // ── Día de entrenamiento ─────────────────────────────────────────────
    ctx.font      = "700 44px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(167,139,250,0.90)";
    ctx.textAlign = "center";
    ctx.fillText(session?.day?.toUpperCase() || "ENTRENAMIENTO", cx, cardY + 260);

    // ── Línea divisoria ──────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + 300);
    ctx.lineTo(cardX + cardW - 60, cardY + 300);
    ctx.stroke();

    // ── Stats pills ──────────────────────────────────────────────────────
    const statW = 220, statH = 130, statGap = 30;
    const statsTotal = stats.length;
    const statsTotalW = statsTotal * statW + (statsTotal - 1) * statGap;
    const statsX = cx - statsTotalW / 2;

    stats.forEach((s, i) => {
      const sx = statsX + i * (statW + statGap);
      const sy = cardY + 330;

      // Pill bg
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, sx, sy, statW, statH, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      roundRect(ctx, sx, sy, statW, statH, 20);
      ctx.stroke();

      // Value
      ctx.font      = "900 52px -apple-system, BlinkMacSystemFont, Arial, 'DM Mono'";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(String(s.value), sx + statW / 2, sy + 72);

      // Label
      ctx.font      = "700 20px -apple-system, BlinkMacSystemFont, Arial";
      ctx.fillStyle = "rgba(240,240,240,0.35)";
      ctx.letterSpacing = "3px";
      ctx.fillText(s.label, sx + statW / 2, sy + 105);
    });

    // ── PRs ──────────────────────────────────────────────────────────────
    if (prs && prs.length > 0) {
      const prY = cardY + 510;
      ctx.fillStyle = "rgba(74,222,128,0.12)";
      roundRect(ctx, cardX + 60, prY, cardW - 120, 90, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(74,222,128,0.25)";
      ctx.lineWidth = 1;
      roundRect(ctx, cardX + 60, prY, cardW - 120, 90, 16);
      ctx.stroke();

      ctx.font      = "700 22px -apple-system, BlinkMacSystemFont, Arial";
      ctx.fillStyle = "#4ade80";
      ctx.textAlign = "center";
      ctx.letterSpacing = "2px";
      ctx.fillText(`🏆 PR en ${prs.slice(0, 2).join(" · ")}`, cx, prY + 52);
    }

    // ── Ejercicios destacados ─────────────────────────────────────────────
    const exY = prs?.length ? cardY + 630 : cardY + 520;
    const exNames = exercises.slice(0, 4).map(e => e.name);
    ctx.font      = "400 26px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(240,240,240,0.40)";
    ctx.textAlign = "center";
    ctx.letterSpacing = "0px";
    ctx.fillText(exNames.join("  ·  "), cx, exY);

    // ── Rango ─────────────────────────────────────────────────────────────
    const rankY = cardY + cardH - 120;
    ctx.font      = "900 52px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = rank.color;
    ctx.textAlign = "center";
    ctx.fillText(`${rank.emoji} ${rank.name.toUpperCase()}`, cx, rankY);

    ctx.font      = "400 24px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(240,240,240,0.25)";
    ctx.fillText(`${userXP.toLocaleString()} XP`, cx, rankY + 40);

    // ── URL / watermark ───────────────────────────────────────────────────
    ctx.font      = "400 22px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(240,240,240,0.15)";
    ctx.textAlign = "center";
    ctx.fillText("gymtracker.dropsc.app", cx, H - 40);

    setReady(true);
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSharing(true);

    try {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "entrenamiento.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Mi entrenamiento de hoy",
            text: `${session?.day} completado 💪 ${prs?.length ? `¡PR en ${prs[0]}! ` : ""}#GymTracker`,
          });
        } else {
          // Fallback: descargar
          const url = URL.createObjectURL(blob);
          const a   = document.createElement("a");
          a.href    = url;
          a.download = `gym-${session?.day}-${session?.date}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setSharing(false);
      }, "image/png", 0.95);
    } catch {
      setSharing(false);
    }
  }

  async function handleCopy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback silencioso
    }
  }

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px 16px",
      minHeight: "100vh",
      animation: "fadeIn 0.3s ease",
    }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 420, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>COMPARTIR</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>Tu entrenamiento 🔥</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%", width: 36, height: 36, minHeight: 0,
            color: "#fff", fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "inherit",
          }}>✕</button>
        </div>
      </div>

      {/* Preview del canvas */}
      <div style={{
        width: "100%", maxWidth: 420,
        borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(120,80,255,0.20)",
        marginBottom: 20,
        animation: "glassIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", display: "block" }}
        />
      </div>

      {/* Botones de acción */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={handleShare} disabled={!ready || sharing} style={{
          width: "100%", padding: "15px",
          background: ready ? "rgba(167,139,250,0.85)" : "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: ready ? "1px solid rgba(167,139,250,0.95)" : "1px solid rgba(255,255,255,0.10)",
          color: ready ? "#fff" : "rgba(240,240,240,0.30)",
          borderRadius: 18, cursor: ready ? "pointer" : "default",
          fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
          boxShadow: ready ? "0 4px 20px rgba(167,139,250,0.35)" : "none",
          WebkitTapHighlightColor: "transparent",
        }}>
          {sharing ? "COMPARTIENDO..." : "↑ COMPARTIR EN REDES"}
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleCopy} style={{
            flex: 1, padding: "12px",
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: copied ? "#4ade80" : "rgba(240,240,240,0.70)",
            borderRadius: 14, cursor: "pointer",
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}>
            {copied ? "✓ COPIADA" : "⎘ COPIAR"}
          </button>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px",
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(240,240,240,0.50)",
            borderRadius: 14, cursor: "pointer",
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}>
            AHORA NO
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: roundRect path
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
