import { useState, useRef } from "react";
import { uploadProfilePhoto } from "../utils/profile";
import { getRank, xpToNextRank, RANKS } from "../utils/ranks";
import { calcStreak } from "../utils/streak";
import { toggleTheme, getTheme } from "../utils/theme";
import { sessionVolume } from "../utils/fitness";
import { copyInviteLink } from "../utils/invite";
import { haptics } from "../utils/haptics";
import { tokens } from "../design";

export default function ProfileView({ user, myProfile, userXP, logs, onBack, onProfileUpdated, onNavigate }) {
  const [photo, setPhoto]         = useState(myProfile?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [theme, setThemeState]    = useState(getTheme());
  const [copied, setCopied]       = useState(false);
  const fileRef = useRef();

  const rank          = getRank(userXP);
  const progress      = xpToNextRank(userXP);
  const streak        = calcStreak(logs);
  const totalSessions = Object.keys(logs).length;
  const totalVolume   = Object.values(logs).reduce((a, s) => a + sessionVolume(s.sets || {}), 0);
  const now    = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekSessions = Object.values(logs).filter(s => new Date(s.date) >= monday).length;
  const nextRank = RANKS[RANKS.findIndex(r => r.name === rank.name) + 1];
  const initial  = (user.displayName || user.email || "?")[0].toUpperCase();

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
    document.body.style.background = next === "light" ? "#f5f5f0" : "#f5f5f0";
  }

  async function handleCopyInvite() {
    const ok = await copyInviteLink(myProfile?.friendCode);
    if (ok) { setCopied(true); haptics.success(); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* ── Header ── */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1.5px solid var(--text)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--text3)", fontWeight: 700 }}>MI PERFIL</div>
          <button onClick={handleToggleTheme} className="nbtn" style={{ fontSize: 16, color: "var(--text3)" }}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>

        {/* Avatar + nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "var(--text)",
                border: "2px solid var(--text)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden",
              }}
            >
              {photo
                ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 26, fontWeight: 900, color: "var(--bg)" }}>{initial}</span>
              }
              {uploading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⏳</div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -0.8, lineHeight: 1.1 }}>
              {user.displayName || user.email?.split("@")[0]}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 2,
                background: "var(--text)", color: "var(--bg)",
                padding: "3px 10px", borderRadius: 99,
              }}>{rank.emoji} {rank.name.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 100px" }}>

        {/* ── XP ── */}
        <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -1 }}>{userXP.toLocaleString()} XP</span>
            {nextRank && progress && (
              <span style={{ fontSize: 10, color: "var(--text3)" }}>{progress.needed.toLocaleString()} para {nextRank.emoji}</span>
            )}
          </div>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: "var(--text)",
              width: `${progress?.pct || 0}%`, transition: "width 0.6s ease",
              borderRadius: 2,
            }} />
          </div>
          {!nextRank && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 8 }}>Rango máximo 👑</div>}
        </div>

        {/* ── Stats tabla editorial ── */}
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "SESIONES TOTALES", value: totalSessions },
            { label: "ESTA SEMANA",      value: weekSessions },
            { label: "RACHA ACTUAL",     value: `${streak}${streak > 0 ? " 🔥" : ""}` },
            { label: "VOLUMEN TOTAL",    value: `${(totalVolume / 1000).toFixed(1)}t` },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 0", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 2, fontWeight: 700 }}>{s.label}</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: -0.5 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Accesos ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 20, marginBottom: 20 }}>
          <button onClick={() => { haptics.light(); onNavigate("achievements"); }} style={{
            background: "var(--text)", border: "none",
            borderRadius: tokens.radius.lg, padding: "16px 14px",
            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            WebkitTapHighlightColor: "transparent",
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--bg)", letterSpacing: 1 }}>LOGROS</div>
            <div style={{ fontSize: 9, color: "rgba(245,245,240,0.5)", marginTop: 2 }}>Achievements</div>
          </button>

          <button onClick={() => { haptics.light(); onNavigate("weeklySummary"); }} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: tokens.radius.lg, padding: "16px 14px",
            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            WebkitTapHighlightColor: "transparent",
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🤖</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", letterSpacing: 1 }}>IA SEMANAL</div>
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>Análisis</div>
          </button>
        </div>

        {/* ── Código de amigo ── */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: tokens.radius.lg, padding: "16px",
        }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 10 }}>CÓDIGO DE AMIGO</div>
          <div className="mono" style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: 6, marginBottom: 14 }}>
            {myProfile?.friendCode || "—"}
          </div>
          <button onClick={handleCopyInvite} style={{
            width: "100%", padding: "12px",
            background: copied ? "var(--text)" : "transparent",
            border: `1px solid ${copied ? "var(--text)" : "var(--border)"}`,
            color: copied ? "var(--bg)" : "var(--text2)",
            borderRadius: tokens.radius.md, cursor: "pointer",
            fontSize: 9, letterSpacing: 2.5, fontWeight: 700,
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
            minHeight: 44,
          }}>
            {copied ? "✓ COPIADO" : "🔗 COPIAR LINK DE INVITACIÓN"}
          </button>
        </div>

        <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", marginTop: 14 }}>
          Toca la foto para cambiarla
        </div>
      </div>
    </div>
  );
}
