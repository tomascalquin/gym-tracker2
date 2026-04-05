import { useRef, useState, useEffect } from "react";
import { getRank } from "../utils/ranks";
import { sessionVolume } from "../utils/fitness";
import { DAY_META } from "../data/routine";

export default function ShareCard({ session, routine, userXP, user, prs, xpEarned, onClose }) {
  const canvasRef          = useRef();
  const [ready, setReady]  = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const rank      = getRank(userXP);
  const dayMeta   = DAY_META[session?.day] || { accent: "#a78bfa" };
  const exercises = routine?.[session?.day]?.exercises || [];
  const totalSets = Object.values(session?.completed || {}).filter(Boolean).length;
  const volKg     = Math.round(sessionVolume(session?.sets || {}));
  const accent    = dayMeta.accent;

  useEffect(() => { if (session) drawCard(); }, [session, userXP]);

  function drawCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Formato vertical 9:16 estilo Stories
    const W = 1080, H = 1920;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const accentR = parseInt(accent.slice(1,3), 16);
    const accentG = parseInt(accent.slice(3,5), 16);
    const accentB = parseInt(accent.slice(5,7), 16);

    // ── FONDO ────────────────────────────────────────────────────────────────
    ctx.fillStyle = "#05050f";
    ctx.fillRect(0, 0, W, H);

    // Orb grande superior — color del día
    const g1 = ctx.createRadialGradient(W * 0.5, H * 0.12, 0, W * 0.5, H * 0.12, W * 0.75);
    g1.addColorStop(0, `rgba(${accentR},${accentG},${accentB},0.55)`);
    g1.addColorStop(0.5, `rgba(${accentR},${accentG},${accentB},0.18)`);
    g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    // Orb inferior azul
    const g2 = ctx.createRadialGradient(W * 0.2, H * 0.85, 0, W * 0.2, H * 0.85, W * 0.65);
    g2.addColorStop(0, "rgba(14,100,200,0.40)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // Orb derecha púrpura
    const g3 = ctx.createRadialGradient(W * 0.92, H * 0.45, 0, W * 0.92, H * 0.45, W * 0.55);
    g3.addColorStop(0, "rgba(120,40,200,0.35)");
    g3.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    // ── TEXTURA NOISE SUTIL (líneas finas diagonales) ────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.025;
    for (let i = -H; i < W + H; i += 6) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + H, H);
      ctx.stroke();
    }
    ctx.restore();

    // ── FRANJA SUPERIOR (header) ──────────────────────────────────────────────
    const headerH = 260;

    // ── Logo / app name ──────────────────────────────────────────────────────
    ctx.font = "600 28px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.textAlign = "center";
    ctx.letterSpacing = "6px";
    ctx.fillText("GYM TRACKER", W / 2, 80);
    ctx.letterSpacing = "0px";

    // ── CHECKMARK GIGANTE animado ─────────────────────────────────────────────
    // Círculo glow
    const checkCx = W / 2, checkCy = 220;
    const checkR  = 110;
    const glowG = ctx.createRadialGradient(checkCx, checkCy, 0, checkCx, checkCy, checkR * 2.5);
    glowG.addColorStop(0, `rgba(${accentR},${accentG},${accentB},0.35)`);
    glowG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowG;
    ctx.beginPath();
    ctx.arc(checkCx, checkCy, checkR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Círculo principal
    ctx.fillStyle = `rgba(${accentR},${accentG},${accentB},0.18)`;
    ctx.strokeStyle = `rgba(${accentR},${accentG},${accentB},0.60)`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(checkCx, checkCy, checkR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Check mark
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 12;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.beginPath();
    ctx.moveTo(checkCx - 48, checkCy);
    ctx.lineTo(checkCx - 14, checkCy + 38);
    ctx.lineTo(checkCx + 56, checkCy - 42);
    ctx.stroke();

    // ── NOMBRE DEL USUARIO ─────────────────────────────────────────────────
    const name = (user?.displayName || user?.email || "Atleta").split(" ")[0];
    ctx.font      = "900 100px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.letterSpacing = "-3px";
    ctx.fillText(name.toUpperCase(), W / 2, 450);
    ctx.letterSpacing = "0px";

    // ── DÍA DE ENTRENAMIENTO (pill) ─────────────────────────────────────────
    const dayText = (session?.day || "ENTRENAMIENTO").toUpperCase();
    ctx.font = "700 36px -apple-system, BlinkMacSystemFont, Arial";
    const dayW = ctx.measureText(dayText).width + 80;
    const dayX = W / 2 - dayW / 2;
    const dayY = 480;

    // Pill bg
    ctx.fillStyle = `rgba(${accentR},${accentG},${accentB},0.20)`;
    roundRect(ctx, dayX, dayY, dayW, 72, 36);
    ctx.fill();
    ctx.strokeStyle = `rgba(${accentR},${accentG},${accentB},0.55)`;
    ctx.lineWidth = 2;
    roundRect(ctx, dayX, dayW / 2, dayW, 72, 36);
    ctx.strokeStyle = `rgba(${accentR},${accentG},${accentB},0.55)`;
    roundRect(ctx, dayX, dayY, dayW, 72, 36);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.textAlign = "center";
    ctx.letterSpacing = "4px";
    ctx.fillText(dayText, W / 2, dayY + 48);
    ctx.letterSpacing = "0px";

    // ── SEPARADOR ────────────────────────────────────────────────────────────
    const sepY = 610;
    const sepGrad = ctx.createLinearGradient(120, sepY, W - 120, sepY);
    sepGrad.addColorStop(0,   "rgba(255,255,255,0)");
    sepGrad.addColorStop(0.3, `rgba(${accentR},${accentG},${accentB},0.50)`);
    sepGrad.addColorStop(0.7, `rgba(${accentR},${accentG},${accentB},0.50)`);
    sepGrad.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, sepY);
    ctx.lineTo(W - 120, sepY);
    ctx.stroke();

    // ── STATS — 3 columnas ───────────────────────────────────────────────────
    const statsY  = 660;
    const statData = [
      { label: "SERIES", value: String(totalSets), sub: "completadas" },
      { label: "TONELAJE", value: `${volKg}`, sub: "kg movidos" },
      { label: "XP", value: `+${xpEarned}`, sub: "puntos ganados" },
    ];

    const colW = W / 3;
    statData.forEach((s, i) => {
      const cx = colW * i + colW / 2;

      // Valor grande
      ctx.font      = "900 88px -apple-system, BlinkMacSystemFont, 'DM Mono', Arial";
      ctx.fillStyle = i === 0 ? accent
                    : i === 1 ? "#ffffff"
                    : "#4ade80";
      ctx.textAlign = "center";
      ctx.letterSpacing = "-2px";
      ctx.fillText(s.value, cx, statsY + 88);
      ctx.letterSpacing = "0px";

      // Label
      ctx.font      = "700 22px -apple-system, BlinkMacSystemFont, Arial";
      ctx.fillStyle = "rgba(240,240,240,0.40)";
      ctx.letterSpacing = "4px";
      ctx.fillText(s.label, cx, statsY + 125);
      ctx.letterSpacing = "0px";

      // Dividers verticales
      if (i > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(colW * i, statsY + 10);
        ctx.lineTo(colW * i, statsY + 140);
        ctx.stroke();
      }
    });

    // ── CARD GLASS DE EJERCICIOS ─────────────────────────────────────────────
    const cardY   = 870;
    const cardX   = 60;
    const cardW   = W - 120;
    const maxEx   = 5;
    const exList  = exercises.slice(0, maxEx);
    const rowH    = 76;
    const cardH   = 56 + exList.length * rowH + 30;

    // Shadow glow
    ctx.shadowColor = `rgba(${accentR},${accentG},${accentB},0.18)`;
    ctx.shadowBlur  = 60;
    ctx.fillStyle   = "rgba(255,255,255,0.06)";
    roundRect(ctx, cardX, cardY, cardW, cardH, 40);
    ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth   = 1.5;
    roundRect(ctx, cardX, cardY, cardW, cardH, 40);
    ctx.stroke();

    // Inner top glow line
    const innerGlow = ctx.createLinearGradient(cardX + 40, cardY, cardX + cardW - 40, cardY);
    innerGlow.addColorStop(0,   "rgba(255,255,255,0)");
    innerGlow.addColorStop(0.5, `rgba(${accentR},${accentG},${accentB},0.40)`);
    innerGlow.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.strokeStyle = innerGlow;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + 1);
    ctx.lineTo(cardX + cardW - 60, cardY + 1);
    ctx.stroke();

    // Label "EJERCICIOS"
    ctx.font      = "700 22px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = `rgba(${accentR},${accentG},${accentB},0.70)`;
    ctx.textAlign = "left";
    ctx.letterSpacing = "4px";
    ctx.fillText("EJERCICIOS", cardX + 50, cardY + 48);
    ctx.letterSpacing = "0px";

    exList.forEach((ex, idx) => {
      const ey = cardY + 56 + idx * rowH;

      // Separador (skip primero)
      if (idx > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 50, ey);
        ctx.lineTo(cardX + cardW - 50, ey);
        ctx.stroke();
      }

      // Dot
      ctx.fillStyle = idx === 0 ? accent : "rgba(255,255,255,0.20)";
      ctx.beginPath();
      ctx.arc(cardX + 68, ey + rowH / 2, idx === 0 ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();

      // Nombre ejercicio
      ctx.font      = `${idx === 0 ? "700" : "400"} 34px -apple-system, BlinkMacSystemFont, Arial`;
      ctx.fillStyle = idx === 0 ? "#ffffff" : "rgba(240,240,240,0.55)";
      ctx.textAlign = "left";
      // Truncar si muy largo
      let exName = ex.name;
      while (ctx.measureText(exName).width > cardW - 280 && exName.length > 5) {
        exName = exName.slice(0, -1);
      }
      if (exName !== ex.name) exName += "…";
      ctx.fillText(exName, cardX + 96, ey + rowH / 2 + 12);

      // Sets
      const setsCount = ex.sets?.length || 0;
      ctx.font      = "600 26px -apple-system, BlinkMacSystemFont, Arial";
      ctx.fillStyle = "rgba(240,240,240,0.25)";
      ctx.textAlign = "right";
      ctx.fillText(`${setsCount}×`, cardX + cardW - 50, ey + rowH / 2 + 10);
    });

    if (exercises.length > maxEx) {
      ctx.font      = "400 26px -apple-system, BlinkMacSystemFont, Arial";
      ctx.fillStyle = "rgba(240,240,240,0.25)";
      ctx.textAlign = "center";
      ctx.fillText(`+${exercises.length - maxEx} más`, W / 2, cardY + cardH - 8);
    }

    // ── PR BADGE (si hay) ─────────────────────────────────────────────────────
    const prY = cardY + cardH + 40;
    if (prs && prs.length > 0) {
      const prText = prs.length === 1
        ? `🏆  NUEVO PR — ${prs[0]}`
        : `🏆  ${prs.length} NUEVOS RECORDS — ${prs.slice(0, 2).join(" · ")}`;

      ctx.font = "700 30px -apple-system, BlinkMacSystemFont, Arial";
      const prTW = ctx.measureText(prText).width + 80;
      const prX  = W / 2 - Math.min(prTW, W - 120) / 2;
      const prBW = Math.min(prTW, W - 120);

      ctx.fillStyle = "rgba(74,222,128,0.12)";
      roundRect(ctx, prX, prY, prBW, 80, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(74,222,128,0.35)";
      ctx.lineWidth   = 1.5;
      roundRect(ctx, prX, prY, prBW, 80, 20);
      ctx.stroke();

      ctx.fillStyle = "#4ade80";
      ctx.textAlign = "center";
      ctx.letterSpacing = "1px";
      ctx.fillText(prText, W / 2, prY + 53);
      ctx.letterSpacing = "0px";
    }

    // ── RANGO del usuario ─────────────────────────────────────────────────────
    const rankBaseY = prs?.length ? prY + 120 : prY + 20;

    // Rango emoji + nombre
    ctx.font      = "900 56px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = rank.color;
    ctx.textAlign = "center";
    ctx.fillText(`${rank.emoji}  ${rank.name.toUpperCase()}`, W / 2, rankBaseY + 56);

    ctx.font      = "400 28px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(240,240,240,0.28)";
    ctx.fillText(`${userXP.toLocaleString("es")} XP TOTALES`, W / 2, rankBaseY + 100);

    // ── SEPARADOR FINAL ──────────────────────────────────────────────────────
    const botSepY = H - 120;
    const botGrad = ctx.createLinearGradient(120, botSepY, W - 120, botSepY);
    botGrad.addColorStop(0,   "rgba(255,255,255,0)");
    botGrad.addColorStop(0.5, "rgba(255,255,255,0.08)");
    botGrad.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.strokeStyle = botGrad;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(120, botSepY);
    ctx.lineTo(W - 120, botSepY);
    ctx.stroke();

    // ── WATERMARK ─────────────────────────────────────────────────────────────
    ctx.font      = "400 26px -apple-system, BlinkMacSystemFont, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.textAlign = "center";
    ctx.fillText("gymtracker.dropsc.app", W / 2, H - 60);

    setReady(true);
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSharing(true);
    canvas.toBlob(async (blob) => {
      try {
        const file = new File([blob], "entrenamiento.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Mi entrenamiento de hoy",
            text: `${session?.day} completado 💪${prs?.length ? ` · 🏆 PR en ${prs[0]}` : ""} #GymTracker`,
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement("a");
          a.href    = url;
          a.download = `gym-${session?.day}-${session?.date}.png`;
          a.click();
          URL.revokeObjectURL(url);
          setDownloaded(true);
          setTimeout(() => setDownloaded(false), 2500);
        }
      } catch { /* cancelado */ }
      setSharing(false);
    }, "image/png", 0.95);
  }

  async function handleCopy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    } catch { /* no soportado */ }
  }

  const accent2 = dayMeta.accent;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.92)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      overflowY: "auto",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: 440,
        padding: "20px 16px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>

        {/* ── Header ── */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.25)", fontWeight: 700 }}>LISTO 💪</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
              {session?.day || "Entrenamiento"} completado
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "50%", width: 38, height: 38, minHeight: 0,
            color: "rgba(255,255,255,0.60)", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
          }}>✕</button>
        </div>

        {/* ── Stats rápidas inline ── */}
        <div style={{
          width: "100%", display: "flex", gap: 8,
        }}>
          {[
            { label: "Series", value: totalSets, color: accent2 },
            { label: "Tonelaje", value: `${volKg} kg`, color: "#fff" },
            { label: "XP", value: `+${xpEarned}`, color: "#4ade80" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14, padding: "10px 8px", textAlign: "center",
            }}>
              <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, fontWeight: 700, marginTop: 2 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* ── Canvas preview ── */}
        <div style={{
          width: "100%",
          borderRadius: 24, overflow: "hidden",
          border: `1px solid ${accent2}30`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.70), 0 0 60px ${accent2}22`,
          animation: "glassIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
          position: "relative",
        }}>
          {!ready && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 2,
              background: "rgba(5,5,15,0.95)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 12,
            }}>
              <div style={{ fontSize: 28, animation: "blink 1s infinite" }}>◆</div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>GENERANDO TARJETA</div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />
        </div>

        {/* ── PRs ── */}
        {prs && prs.length > 0 && (
          <div style={{
            width: "100%",
            background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)",
            borderRadius: 14, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: "#4ade80", marginBottom: 2 }}>NUEVO RÉCORD PERSONAL</div>
              <div style={{ fontSize: 12, color: "rgba(240,240,240,0.60)" }}>{prs.join(" · ")}</div>
            </div>
          </div>
        )}

        {/* ── Botones ── */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={handleShare} disabled={!ready || sharing} style={{
            width: "100%", padding: "15px",
            background: ready ? `rgba(${parseInt(accent2.slice(1,3),16)},${parseInt(accent2.slice(3,5),16)},${parseInt(accent2.slice(5,7),16)},0.85)` : "rgba(255,255,255,0.06)",
            border: ready ? `1px solid ${accent2}` : "1px solid rgba(255,255,255,0.10)",
            color: ready ? "#fff" : "rgba(240,240,240,0.25)",
            borderRadius: 18, cursor: ready ? "pointer" : "default",
            fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
            boxShadow: ready ? `0 4px 24px ${accent2}44` : "none",
            WebkitTapHighlightColor: "transparent",
            transition: "all 0.2s",
          }}>
            {sharing ? "COMPARTIENDO..." : downloaded ? "✓ DESCARGADA" : "↑ COMPARTIR / GUARDAR"}
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCopy} disabled={!ready} style={{
              flex: 1, padding: "13px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: copied ? "#4ade80" : "rgba(240,240,240,0.55)",
              borderRadius: 14, cursor: ready ? "pointer" : "default",
              fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
              transition: "color 0.2s",
            }}>
              {copied ? "✓ COPIADA" : "⎘ COPIAR"}
            </button>
            <button onClick={onClose} style={{
              flex: 1, padding: "13px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(240,240,240,0.40)",
              borderRadius: 14, cursor: "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}>
              CERRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
