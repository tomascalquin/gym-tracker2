import { useState } from "react";
import { updateProfilePhoto, updateDisplayName } from "../utils/profile";
import { getRank, xpToNextRank } from "../utils/ranks";
import { calcStreak, streakEmoji } from "../utils/streak";
import { THEMES } from "../utils/theme";

export default function ProfileView({ user, myProfile, userXP, logs, theme, onToggleTheme, onBack, onProfileUpdated }) {
  const T = THEMES[theme];

  const [editingName, setEditingName]   = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [nameVal, setNameVal]           = useState(user.displayName || "");
  const [photoVal, setPhotoVal]         = useState(user.photoURL || "");
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState("");

  const rank      = getRank(userXP);
  const progress  = xpToNextRank(userXP);
  const streak    = calcStreak(logs);
  const totalSess = Object.keys(logs).length;

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2000); }

  async function saveName() {
    setSaving(true);
    try {
      await updateDisplayName(user.uid, nameVal.trim());
      onProfileUpdated({ displayName: nameVal.trim() });
      setEditingName(false);
      showToast("Nombre actualizado ✓");
    } catch { showToast("Error al guardar."); }
    finally { setSaving(false); }
  }

  async function savePhoto() {
    if (!photoVal.trim()) return;
    setSaving(true);
    try {
      await updateProfilePhoto(user.uid, photoVal.trim());
      onProfileUpdated({ photoURL: photoVal.trim() });
      setEditingPhoto(false);
      showToast("Foto actualizada ✓");
    } catch { showToast("Error al guardar."); }
    finally { setSaving(false); }
  }

  const photoURL = user.photoURL || myProfile?.photoURL;

  return (
    <div style={{
      maxWidth: 440, margin: "0 auto", padding: "24px 18px",
      fontFamily: "DM Mono, monospace",
      background: T.bg, minHeight: "100vh", color: T.text,
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
          background: "#14532d", border: "1px solid #22c55e", color: "#fff",
          padding: "8px 18px", borderRadius: 8, fontSize: 12, zIndex: 999,
          whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} className="nbtn" style={{ color: T.textMuted, fontSize: 13 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: T.text }}>MI PERFIL</h2>
        {/* Toggle tema */}
        <button onClick={onToggleTheme} style={{
          marginLeft: "auto",
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: "5px 12px", cursor: "pointer",
          fontSize: 13, fontFamily: "inherit", color: T.textSub,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {theme === "dark" ? "☀️" : "🌙"} {theme === "dark" ? "Claro" : "Oscuro"}
        </button>
      </div>

      {/* Avatar + nombre */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        {/* Foto */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: rank.dim, border: `3px solid ${rank.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, overflow: "hidden",
          }}>
            {photoURL
              ? <img src={photoURL} alt="foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
              : <span>{rank.emoji}</span>
            }
          </div>
          <button onClick={() => setEditingPhoto(v => !v)} style={{
            position: "absolute", bottom: 0, right: 0,
            background: rank.color, border: "none", borderRadius: "50%",
            width: 26, height: 26, cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✏️</button>
        </div>

        {/* Input foto */}
        {editingPhoto && (
          <div style={{ width: "100%", marginBottom: 10 }}>
            <input
              value={photoVal}
              onChange={e => setPhotoVal(e.target.value)}
              placeholder="Pega una URL de imagen (https://...)"
              style={{
                width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
                color: T.text, padding: "8px 12px", borderRadius: 8,
                fontSize: 12, fontFamily: "inherit", outline: "none",
                boxSizing: "border-box", marginBottom: 6,
              }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={savePhoto} disabled={saving} style={{
                flex: 1, background: rank.color, border: "none", color: "#000",
                padding: "7px", borderRadius: 7, cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: "inherit",
              }}>GUARDAR</button>
              <button onClick={() => setEditingPhoto(false)} className="nbtn" style={{
                border: `1px solid ${T.border}`, color: T.textMuted,
                padding: "7px 12px", borderRadius: 7, fontSize: 11,
              }}>✕</button>
            </div>
          </div>
        )}

        {/* Nombre */}
        {!editingName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 20, color: T.text, fontWeight: 400 }}>
              {user.displayName || user.email?.split("@")[0]}
            </div>
            <button onClick={() => setEditingName(true)} className="nbtn" style={{
              fontSize: 10, color: rank.color, border: `1px solid ${rank.color}44`,
              padding: "2px 8px", borderRadius: 5,
            }}>✏️</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={nameVal} onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              autoFocus style={{
                background: T.bgInput, border: `1px solid ${rank.color}44`,
                color: T.text, padding: "6px 10px", borderRadius: 7,
                fontSize: 15, fontFamily: "inherit", outline: "none",
              }}
            />
            <button onClick={saveName} disabled={saving} style={{
              background: rank.color, border: "none", color: "#000",
              padding: "6px 12px", borderRadius: 7, cursor: "pointer",
              fontSize: 11, fontWeight: 700, fontFamily: "inherit",
            }}>OK</button>
            <button onClick={() => setEditingName(false)} className="nbtn" style={{ color: T.textMuted, fontSize: 13 }}>✕</button>
          </div>
        )}

        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{user.email}</div>
      </div>

      {/* Rango */}
      <div style={{
        background: rank.dim, border: `1px solid ${rank.color}44`,
        borderLeft: `3px solid ${rank.color}`,
        borderRadius: 10, padding: "14px 16px", marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 32 }}>{rank.emoji}</span>
            <div>
              <div style={{ fontSize: 14, color: rank.color, letterSpacing: 1 }}>{rank.name.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{userXP.toLocaleString()} XP</div>
            </div>
          </div>
        </div>
        {progress && (
          <>
            <div style={{ background: T.border, borderRadius: 4, height: 6 }}>
              <div style={{ height: 6, borderRadius: 4, background: rank.color, width: `${progress.pct}%` }} />
            </div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 4, textAlign: "right" }}>
              {progress.needed.toLocaleString()} XP para {rank.name}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "SESIONES", value: totalSess, color: "#60a5fa" },
          { label: "RACHA",    value: `${streak}d ${streakEmoji(streak)}`, color: streak >= 7 ? "#f59e0b" : "#fb923c" },
          { label: "CÓDIGO",   value: myProfile?.friendCode || "—", color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{
            background: T.bgCard, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "12px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 16, color: s.color, fontWeight: 500 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Código de amigo */}
      <div style={{
        background: T.bgCard, border: `1px solid ${T.border}`,
        borderLeft: "3px solid #a78bfa", borderRadius: 10,
        padding: "12px 16px",
      }}>
        <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 6 }}>TU CÓDIGO DE AMIGO</div>
        <div style={{ fontSize: 24, color: "#a78bfa", letterSpacing: 4, fontWeight: 500 }}>
          {myProfile?.friendCode || "—"}
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
          Compártelo para que te agreguen
        </div>
      </div>
    </div>
  );
}
