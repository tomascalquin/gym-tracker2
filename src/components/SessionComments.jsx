import { useState, useEffect } from "react";
import { loadComments, addComment, deleteComment } from "../utils/comments";

const QUICK_EMOJIS = ["💪", "🔥", "👏", "🏆", "😤", "⚡", "🫡", "😮"];

/**
 * Sección de comentarios de una sesión.
 * Se muestra en HistoryView al expandir una sesión.
 *
 * @param {string}  ownerUid   - UID del dueño de la sesión
 * @param {string}  sessionKey - Key de la sesión (ej: "Upper A__2026-03-19")
 * @param {Object}  currentUser - Usuario actual
 * @param {boolean} canComment - Si el usuario puede comentar (es amigo del dueño)
 */
export default function SessionComments({ ownerUid, sessionKey, currentUser, canComment }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    loadComments(ownerUid, sessionKey).then(c => {
      setComments(c);
      setLoading(false);
    });
  }, [ownerUid, sessionKey]);

  async function handleSend(emoji = "", textMsg = "") {
    if (!emoji && !textMsg.trim()) return;
    setSending(true);
    try {
      const id = await addComment(ownerUid, sessionKey, {
        uid:         currentUser.uid,
        displayName: currentUser.displayName || currentUser.email.split("@")[0],
        emoji,
        text: textMsg.trim(),
      });
      setComments(prev => [...prev, {
        id, uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email.split("@")[0],
        emoji, text: textMsg.trim(),
      }]);
      setText("");
    } catch (err) {
      console.warn("addComment error:", err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId) {
    await deleteComment(ownerUid, sessionKey, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  if (loading) return (
    <div style={{ padding: "8px 0", color: "#475569", fontSize: 12 }}>Cargando comentarios...</div>
  );

  return (
    <div style={{ borderTop: "1px solid #1a1a2a", paddingTop: 10, marginTop: 8 }}>

      {/* Comentarios existentes */}
      {comments.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {comments.map(c => (
            <div key={c.id} style={{
              display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#60a5fa", flexShrink: 0,
              }}>
                {(c.displayName || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: "#60a5fa" }}>{c.displayName}</span>
                {c.emoji && <span style={{ fontSize: 16, marginLeft: 6 }}>{c.emoji}</span>}
                {c.text  && <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: c.emoji ? 4 : 6 }}>{c.text}</span>}
              </div>
              {c.uid === currentUser.uid && (
                <button onClick={() => handleDelete(c.id)} className="nbtn" style={{
                  color: "#334155", fontSize: 11, padding: "0 4px",
                }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {!comments.length && (
        <div style={{ fontSize: 11, color: "#334155", marginBottom: 10 }}>Sin comentarios aún.</div>
      )}

      {/* Input de comentario */}
      {canComment && (
        <div>
          {/* Emojis rápidos */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {QUICK_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => handleSend(emoji)} disabled={sending} style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, padding: "4px 8px", cursor: "pointer",
                fontSize: 16, lineHeight: 1,
              }}>{emoji}</button>
            ))}
          </div>

          {/* Texto */}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value.slice(0, 100))}
              onKeyDown={e => e.key === "Enter" && handleSend("", text)}
              placeholder="Escribe un comentario..."
              style={{
                flex: 1, background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.12)",
                color: "#f1f5f9", padding: "7px 10px", borderRadius: 7,
                fontSize: 12, fontFamily: "inherit", outline: "none",
              }}
            />
            <button onClick={() => handleSend("", text)} disabled={sending || !text.trim()} style={{
              background: text.trim() ? "#60a5fa" : "#1a1a2e",
              border: "none", color: text.trim() ? "#000" : "#334155",
              padding: "7px 12px", borderRadius: 7, cursor: text.trim() ? "pointer" : "default",
              fontSize: 11, fontWeight: 700, fontFamily: "inherit",
            }}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}
