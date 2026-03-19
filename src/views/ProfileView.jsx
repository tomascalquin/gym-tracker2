import { useState, useRef } from "react";
import { uploadProfilePhoto } from "../utils/profile";
import { getRank, xpToNextRank, RANKS } from "../utils/ranks";
import { calcStreak, streakEmoji } from "../utils/streak";
import { toggleTheme, getTheme } from "../utils/theme";
import { sessionVolume } from "../utils/fitness";

export default function ProfileView({ user, myProfile, userXP, logs, onBack, onProfileUpdated }) {
  const [photo, setPhoto]         = useState(myProfile?.photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [theme, setThemeState]    = useState(getTheme());
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

  const initial = (user.displayName || user.email || "?")[0].toUpperCase();
  const isLight = theme === "light";
  const nextRank = RANKS[RANKS.findIndex(r => r.name === rank.name) + 1];

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 13 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "var(--text)" }}>MI PERFIL</h2>
        <button onClick={handleToggleTheme} style={{
          marginLeft: "auto", background: "var(--bg2)",
          border: "1px solid var(--border)", borderRadius: 20,
          padding: "5px 12px", cursor: "pointer", fontSize: 13,
          fontFamily: "inherit", color: "var(--text2)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {isLight ? "🌙" : "☀️"}
          <span style={{ fontSize: 10, letterSpacing: 1 }}>{isLight ? "DARK" : "LIGHT"}</span>
        </button>
      </div>

      {/* Avatar + nombre */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div onClick={() => fileRef.current.click()} style={{
            width: 72, height: 72, borderRadius: "50%",
            background: rank.dim, border: `3px solid ${rank.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", overflow: "hidden", position: "relative",
          }}>
            {photo
              ? <img src={photo} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 28, color: rank.color }}>{initial}</span>
            }
            <div style={{
              position: "absolute", inset: 0, background: "#00000066",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: uploading ? 1 : 0, transition: "opacity 0.2s", fontSize: 18,
            }}>{uploading ? "⏳" : "📷"}</div>
          </div>
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            background: rank.color, borderRadius: "50%", width: 22, height: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, cursor: "pointer", border: "2px solid var(--bg)",
          }} onClick={() => fileRef.current.click()}>✏️</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        </div>

        <div>
          <div style={{ fontSize: 20, color: "var(--text)", fontWeight: 400 }}>
            {user.displayName || user.email.split("@")[0]}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{user.email}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 18 }}>{rank.emoji}</span>
            <span style={{ fontSize: 12, color: rank.color }}>{rank.name}</span>
          </div>
        </div>
      </div>

      {/* XP */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 12, borderLeft: `3px solid ${rank.color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text)" }}>{userXP.toLocaleString()} XP</span>
          {nextRank && progress && (
            <span style={{ fontSize: 11, color: "var(--text3)" }}>-{progress.needed} para {nextRank.name} {nextRank.emoji}</span>
          )}
        </div>
        {progress && (
          <>
            <div style={{ background: "var(--border)", borderRadius: 4, height: 6 }}>
              <div style={{ height: 6, borderRadius: 4, background: rank.color, width: `${progress.pct}%`, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "right", marginTop: 3 }}>{progress.pct}%</div>
          </>
        )}
        {!nextRank && <div style={{ fontSize: 12, color: rank.color }}>RANGO MÁXIMO 👑</div>}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "SESIONES",    value: totalSessions,   accent: "#60a5fa" },
          { label: "ESTA SEMANA", value: weekSessions,    accent: "#34d399" },
          { label: "RACHA",       value: `${streak}d ${streakEmoji(streak) || "🔥"}`, accent: "#fb923c" },
          { label: "VOLUMEN",     value: `${(totalVolume/1000).toFixed(1)}k kg`, accent: "#a78bfa" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "12px 14px", borderLeft: `2px solid ${s.accent}` }}>
            <div style={{ fontSize: 18, color: s.accent, fontWeight: 500 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Código amigo */}
      <div className="card" style={{ padding: "14px 16px", borderLeft: "3px solid #60a5fa" }}>
        <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 2, marginBottom: 6 }}>TU CÓDIGO DE AMIGO</div>
        <div style={{ fontSize: 24, fontWeight: 500, color: "#60a5fa", letterSpacing: 4 }}>
          {myProfile?.friendCode || "—"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Compártelo para que te agreguen</div>
      </div>

      <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", marginTop: 12 }}>
        Toca la foto para cambiarla desde tu galería
      </div>
    </div>
  );
}
