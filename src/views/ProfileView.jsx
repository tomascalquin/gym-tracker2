import { useState, useRef } from "react";
import { uploadProfilePhoto } from "../utils/profile";
import { getRank, xpToNextRank, RANKS } from "../utils/ranks";
import { calcStreak, streakEmoji } from "../utils/streak";
import { toggleTheme, getTheme } from "../utils/theme";
import { sessionVolume } from "../utils/fitness";
import { getInviteLink, copyInviteLink } from "../utils/invite";
import { tokens } from "../design";

export default function ProfileView({ user, myProfile, userXP, logs, onBack, onProfileUpdated }) {
  const [photo, setPhoto]         = useState(myProfile?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [theme, setThemeState]    = useState(getTheme());
  const [copied, setCopied]       = useState(false);
  const fileRef = useRef();

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

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await uploadProfilePhoto(user.uid, file);
      setPhoto(base64);
      onProfileUpdated({ ...myProfile, photoURL: base64 });
    } catch (err) { console.warn(err.message); }
    finally { setUploading(false); }
  }

  function handleToggleTheme() {
    const next = toggleTheme();
    setThemeState(next);
  }

  async function handleCopyInvite() {
    const ok = await copyInviteLink(myProfile?.friendCode);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease" }}>

      {/* Hero con gradiente */}
      <div style={{
        background: `linear-gradient(160deg, ${rank.dim} 0%, ${rank.color}11 50%, var(--bg) 100%)`,
        padding: "20px 18px 24px",
        borderBottom: "1px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--text3)" }}>MI PERFIL</div>
          <button onClick={handleToggleTheme} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "6px 12px", cursor: "pointer",
            fontSize: 14, fontFamily: "inherit", color: "var(--text2)",
            display: "flex", alignItems: "center", gap: 6, minHeight: 36,
          }}>
            {isLight ? "🌙" : "☀️"}
            <span style={{ fontSize: 9, letterSpacing: 1 }}>{isLight ? "DARK" : "LIGHT"}</span>
          </button>
        </div>

        {/* Avatar + nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Foto */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div onClick={() => fileRef.current.click()} style={{
              width: 80, height: 80, borderRadius: "50%",
              background: rank.dim,
              border: `3px solid ${rank.color}`,
              boxShadow: `0 0 20px ${rank.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", position: "relative",
            }}>
              {photo
                ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 32, color: rank.color }}>{initial}</span>
              }
              <div style={{
                position: "absolute", inset: 0, background: "#00000066",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: uploading ? 1 : 0, transition: "opacity 0.2s",
                fontSize: uploading ? 14 : 18,
              }}>{uploading ? "⏳" : "📷"}</div>
            </div>
            <div onClick={() => fileRef.current.click()} style={{
              position: "absolute", bottom: 0, right: 0,
              background: rank.color, borderRadius: "50%",
              width: 24, height: 24, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, cursor: "pointer",
              border: "2px solid var(--bg)", boxShadow: tokens.shadow.md,
            }}>✏️</div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, color: "var(--text)", fontWeight: 300, letterSpacing: -0.5 }}>
              {user.displayName || user.email.split("@")[0]}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{user.email}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 20 }}>{rank.emoji}</span>
              <span style={{ fontSize: 12, color: rank.color, letterSpacing: 1 }}>{rank.name.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 18px" }}>
        {/* XP Progress */}
        <div style={{
          background: `linear-gradient(135deg, ${rank.dim} 0%, var(--bg2) 100%)`,
          border: `1px solid ${rank.color}33`, borderRadius: 14,
          padding: "14px 16px", marginBottom: 14,
          boxShadow: `0 2px 16px ${rank.color}11`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 16, color: "var(--text)", fontWeight: 300 }}>{userXP.toLocaleString()} XP</span>
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
            { label: "SESIONES",    value: totalSessions,                          color: "#60a5fa" },
            { label: "ESTA SEMANA", value: weekSessions,                           color: "#34d399" },
            { label: "RACHA",       value: `${streak}d ${streakEmoji(streak)||""}`, color: "#fb923c" },
            { label: "VOLUMEN",     value: `${(totalVolume/1000).toFixed(1)}k kg`, color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.color + "0d",
              border: `1px solid ${s.color}22`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 20, color: s.color, fontWeight: 300 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Código + invitación */}
        <div style={{
          background: "var(--bg2)", border: "1px solid #60a5fa22",
          borderRadius: 14, padding: "16px", marginBottom: 14,
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

        {/* Nota */}
        <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center" }}>
          Toca la foto para cambiarla desde tu galería
        </div>
      </div>
    </div>
  );
}
