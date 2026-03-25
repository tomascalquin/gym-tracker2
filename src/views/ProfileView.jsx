import { useState, useRef, useEffect } from "react";
import { uploadProfilePhoto } from "../utils/profile";
import { getRank, xpToNextRank, RANKS } from "../utils/ranks";
import { calcStreak, streakEmoji } from "../utils/streak";
import { toggleTheme, getTheme } from "../utils/theme";
import { sessionVolume } from "../utils/fitness";
import { getInviteLink, copyInviteLink } from "../utils/invite";
import AnimatedNumber from "../components/AnimatedNumber";
import { haptics } from "../utils/haptics";

export default function ProfileView({ user, myProfile, userXP, logs, onBack, onProfileUpdated, onNavigate }) {
  const [photo, setPhoto]         = useState(myProfile?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [theme, setThemeState]    = useState(getTheme());
  const [copied, setCopied]       = useState(false);
  const [scrollY, setScrollY]     = useState(0);
  const fileRef    = useRef();
  const scrollRef  = useRef();

  const rank      = getRank(userXP);
  const progress  = xpToNextRank(userXP);
  const streak    = calcStreak(logs);
  const totalSessions = Object.keys(logs).length;
  const totalVolume   = Object.values(logs).reduce((a, s) => a + sessionVolume(s.sets), 0);
  const now    = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekSessions = Object.values(logs).filter(s => new Date(s.date) >= monday).length;
  const nextRank = RANKS[RANKS.findIndex(r => r.name === rank.name) + 1];
  const initial  = (user.displayName || user.email || "?")[0].toUpperCase();
  const isLight  = theme === "light";

  // Parallax scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await uploadProfilePhoto(user.uid, file);
      setPhoto(base64);
      onProfileUpdated({ ...myProfile, photoURL: base64 });
      haptics.success();
    } catch (err) { console.warn(err.message); }
    finally { setUploading(false); }
  }

  function handleToggleTheme() {
    const next = toggleTheme();
    setThemeState(next);
    haptics.light();
  }

  async function handleCopyInvite() {
    const ok = await copyInviteLink(myProfile?.friendCode);
    if (ok) { setCopied(true); haptics.success(); setTimeout(() => setCopied(false), 2000); }
  }

  const heroScale   = Math.max(1, 1 + scrollY * 0.001);
  const heroOpacity = Math.max(0, 1 - scrollY * 0.004);

  return (
    <div ref={scrollRef} style={{
      height: "100%", overflowY: "auto", overflowX: "hidden",
      WebkitOverflowScrolling: "touch", fontFamily: "DM Mono, monospace",
    }}>
      {/* ── BLUR HERO ── */}
      <div style={{
        position: "relative", height: 260, overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Foto de fondo con blur extremo — estilo Spotify */}
        <div style={{
          position: "absolute", inset: -20,
          backgroundImage: photo ? `url(${photo})` : "none",
          backgroundColor: rank.dim,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(40px) saturate(1.5) brightness(0.4)",
          transform: `scale(${heroScale})`,
          transition: "transform 0.1s linear",
        }} />

        {/* Gradiente overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${rank.color}22 50%, var(--bg) 100%)`,
        }} />

        {/* Header */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 18px",
          opacity: heroOpacity,
        }}>
          <button onClick={onBack} className="nbtn" style={{
            color: "#fff", fontSize: 20, padding: "0 4px",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}>←</button>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.7)" }}>MI PERFIL</div>
          <button onClick={handleToggleTheme} style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 20, padding: "6px 12px", cursor: "pointer",
            fontSize: 13, fontFamily: "inherit", color: "#fff",
            display: "flex", alignItems: "center", gap: 6, minHeight: 36,
          }}>
            {isLight ? "🌙" : "☀️"}
            <span style={{ fontSize: 9, letterSpacing: 1 }}>{isLight ? "DARK" : "LIGHT"}</span>
          </button>
        </div>

        {/* Avatar centrado */}
        <div style={{
          position: "absolute", bottom: 20, left: 0, right: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          opacity: heroOpacity,
        }}>
          <div style={{ position: "relative" }}>
            <div onClick={() => fileRef.current.click()} style={{
              width: 88, height: 88, borderRadius: "50%",
              border: `3px solid ${rank.color}`,
              boxShadow: `0 0 0 3px rgba(0,0,0,0.3), 0 0 30px ${rank.color}66`,
              overflow: "hidden", cursor: "pointer", position: "relative",
              background: rank.dim,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {photo
                ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 34, color: rank.color }}>{initial}</span>
              }
              <div style={{
                position: "absolute", inset: 0, background: "#00000055",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: uploading ? 1 : 0, transition: "opacity 0.2s", fontSize: 18,
              }}>{uploading ? "⏳" : "📷"}</div>
            </div>
            <div onClick={() => fileRef.current.click()} style={{
              position: "absolute", bottom: 2, right: 2,
              background: rank.color, borderRadius: "50%",
              width: 24, height: 24, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, cursor: "pointer",
              border: "2px solid var(--bg)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}>✏️</div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 18, color: "#fff", fontWeight: 300, textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
            {user.displayName || user.email.split("@")[0]}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 16 }}>{rank.emoji}</span>
            <span style={{ fontSize: 11, color: rank.color, letterSpacing: 1 }}>{rank.name.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ padding: "16px 18px 100px" }}>

        {/* XP */}
        <div style={{
          background: `linear-gradient(135deg, ${rank.dim} 0%, var(--bg2) 100%)`,
          border: `1px solid ${rank.color}33`, borderRadius: 14,
          padding: "14px 16px", marginBottom: 14,
          boxShadow: `0 2px 16px ${rank.color}11`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 16, color: "var(--text)", fontWeight: 300 }}>
              <AnimatedNumber value={userXP} /> XP
            </span>
            {nextRank && progress && (
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                {progress.needed.toLocaleString()} para {nextRank.emoji}
              </span>
            )}
          </div>
          {progress && (
            <>
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: `linear-gradient(90deg, ${rank.color} 0%, ${rank.color}88 100%)`,
                  width: `${progress.pct}%`, transition: "width 0.6s ease",
                  boxShadow: `0 0 10px ${rank.color}88`,
                }} />
              </div>
              <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "right", marginTop: 4 }}>
                {progress.pct}% → {nextRank?.name}
              </div>
            </>
          )}
          {!nextRank && <div style={{ fontSize: 12, color: rank.color }}>RANGO MÁXIMO 👑</div>}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "SESIONES",    value: totalSessions,   color: "#60a5fa" },
            { label: "ESTA SEMANA", value: weekSessions,    color: "#34d399" },
            { label: "RACHA",       value: `${streak}d ${streakEmoji(streak)||"🔥"}`, color: "#fb923c" },
            { label: "VOLUMEN",     value: `${(totalVolume/1000).toFixed(1)}k`, color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.color + "0d", border: `1px solid ${s.color}22`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 20, color: s.color, fontWeight: 300 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Accesos rápidos — Logros y Resumen semanal */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => { haptics.light(); onNavigate("achievements"); }}
            style={{
              background: "#78350f22", border: "1px solid #f59e0b33",
              borderRadius: 14, padding: "14px 12px", cursor: "pointer",
              fontFamily: "inherit", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 6,
              WebkitTapHighlightColor: "transparent",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>🏆</span>
            <div>
              <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 500 }}>Logros</div>
              <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, letterSpacing: 0.5 }}>
                VER ACHIEVEMENTS →
              </div>
            </div>
          </button>

          <button
            onClick={() => { haptics.light(); onNavigate("weeklySummary"); }}
            style={{
              background: "#1e1b4b",
              border: "1px solid #534ab733",
              borderRadius: 14, padding: "14px 12px", cursor: "pointer",
              fontFamily: "inherit", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 6,
              WebkitTapHighlightColor: "transparent",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>🤖</span>
            <div>
              <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 500 }}>Resumen IA</div>
              <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, letterSpacing: 0.5 }}>
                ANÁLISIS SEMANAL →
              </div>
            </div>
          </button>
        </div>

        {/* Código + invitación */}
        <div style={{
          background: "var(--bg2)", border: "1px solid #60a5fa22",
          borderRadius: 14, padding: "16px",
        }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3, marginBottom: 8 }}>CÓDIGO DE AMIGO</div>
          <div style={{ fontSize: 26, fontWeight: 300, color: "#60a5fa", letterSpacing: 6, marginBottom: 12 }}>
            {myProfile?.friendCode || "—"}
          </div>
          <button onClick={handleCopyInvite} style={{
            width: "100%", padding: "12px",
            background: copied ? "#14532d" : "transparent",
            border: `1px solid ${copied ? "#22c55e44" : "#60a5fa33"}`,
            color: copied ? "var(--green)" : "#60a5fa",
            borderRadius: 10, cursor: "pointer",
            fontSize: 10, letterSpacing: 2, fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s ease", minHeight: 44,
          }}>
            {copied ? "✓ LINK COPIADO" : "🔗 COPIAR LINK DE INVITACIÓN"}
          </button>
        </div>

        <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", marginTop: 12 }}>
          Toca la foto para cambiarla desde tu galería
        </div>
      </div>
    </div>
  );
}
