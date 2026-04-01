import { useState, useEffect, useRef } from "react";
import { subscribeToChat, sendMessage, sendImage } from "../utils/chat";

const QUICK_EMOJIS = ["💪", "🔥", "👏", "🏆", "😤", "⚡", "🫡", "😂", "👀", "🥶"];

export default function ChatView({ chatId, currentUser, title, onBack, accentColor = "#60a5fa" }) {
  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState("");
  const [sending, setSending]       = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef  = useRef();
  const inputRef   = useRef();
  const fileRef    = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToChat(chatId, msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
    return unsub;
  }, [chatId]);

  // Fix iOS: cuando el teclado sube, hacer scroll al fondo
  useEffect(() => {
    function handleResize() {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  async function handleSend() {
    if (!text.trim() || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      await sendMessage(chatId, {
        uid:         currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split("@")[0],
        photoURL:    currentUser.photoURL || null,
        text:        msg,
      });
    } catch (err) { console.warn(err); }
    finally { setSending(false); }
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      await sendImage(chatId, {
        uid:         currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split("@")[0],
        photoURL:    currentUser.photoURL || null,
        file,
      });
    } catch (err) { console.warn(err); }
    finally { setSending(false); e.target.value = ""; }
  }

  function formatTime(ts) {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(ts) {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Hoy";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "long" });
  }

  // Agrupar mensajes por fecha
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const date = formatDate(msg.createdAt);
    if (date !== lastDate) { grouped.push({ type: "date", label: date }); lastDate = date; }
    const prevMsg = messages[i - 1];
    const isMe = msg.uid === currentUser.uid;
    const showAvatar = !isMe && (!prevMsg || prevMsg.uid !== msg.uid);
    const showName   = showAvatar;
    grouped.push({ type: "msg", msg, isMe, showAvatar, showName });
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", background: "rgba(8,8,16,0.96)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      fontFamily: "DM Mono, monospace",
      position: "fixed", inset: 0, zIndex: 200,
      paddingTop: "env(safe-area-inset-top)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        padding: "12px 16px", borderBottom: "1px solid var(--glass-border)",
        background: "rgba(8,8,16,0.6)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 20, minHeight: 44, padding: "0 8px" }}>←</button>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: accentColor + "22", border: `1px solid ${accentColor}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
        }}>💬</div>
        <div>
          <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)" }}>
            {messages.length} mensajes
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div ref={containerRef} style={{
        flex: 1, overflowY: "auto", padding: "12px 16px",
        WebkitOverflowScrolling: "touch",
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, color: "rgba(240,240,240,0.55)" }}>Sin mensajes aún</div>
            <div style={{ fontSize: 12, color: "rgba(240,240,240,0.30)", marginTop: 4 }}>Sé el primero en escribir</div>
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === "date") return (
            <div key={`date-${i}`} style={{ textAlign: "center", margin: "14px 0 8px" }}>
              <span style={{
                fontSize: 10, color: "rgba(240,240,240,0.30)", letterSpacing: 1,
                background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", padding: "3px 10px", borderRadius: 10,
              }}>{item.label}</span>
            </div>
          );

          const { msg, isMe, showAvatar, showName } = item;
          return (
            <div key={msg.id} style={{
              display: "flex", flexDirection: isMe ? "row-reverse" : "row",
              alignItems: "flex-end", gap: 8,
              marginBottom: 4, marginTop: showName ? 10 : 0,
            }}>
              {/* Avatar */}
              <div style={{ width: 32, flexShrink: 0, alignSelf: "flex-end" }}>
                {!isMe && showAvatar && (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1.5px solid ${accentColor}33`,
                    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {msg.photoURL
                      ? <img src={msg.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 13, color: accentColor }}>{(msg.displayName || "?")[0].toUpperCase()}</span>
                    }
                  </div>
                )}
              </div>

              {/* Burbuja */}
              <div style={{ maxWidth: "70%", minWidth: 60 }}>
                {showName && !isMe && (
                  <div style={{ fontSize: 10, color: accentColor, marginBottom: 3, paddingLeft: 2 }}>
                    {msg.displayName}
                  </div>
                )}
                <div style={{
                  background: isMe ? accentColor : "var(--bg2)",
                  border: isMe ? "none" : "1px solid var(--border)",
                  borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: msg.image ? "3px" : "9px 13px",
                  overflow: "hidden",
                  boxShadow: isMe ? `0 2px 8px ${accentColor}33` : "none",
                }}>
                  {msg.image && (
                    <img src={msg.image} alt="foto" style={{ maxWidth: "100%", borderRadius: 13, display: "block" }} />
                  )}
                  {msg.text && (
                    <div style={{
                      fontSize: 14, lineHeight: 1.45,
                      color: isMe ? "#000" : "var(--text)",
                      wordBreak: "break-word",
                    }}>{msg.text}</div>
                  )}
                </div>
                <div style={{
                  fontSize: 9, color: "rgba(240,240,240,0.30)", marginTop: 3,
                  textAlign: isMe ? "right" : "left",
                  paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0,
                }}>{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Emojis rápidos */}
      {showEmojis && (
        <div style={{
          display: "flex", gap: 4, padding: "8px 16px",
          borderTop: "1px solid var(--glass-border)", background: "rgba(8,8,16,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          overflowX: "auto", flexShrink: 0,
        }}>
          {QUICK_EMOJIS.map(e => (
            <button key={e} onClick={() => { setText(p => p + e); setShowEmojis(false); }} style={{
              background: "none", border: "none", fontSize: 24,
              cursor: "pointer", padding: "4px 6px", flexShrink: 0, minHeight: 44,
            }}>{e}</button>
          ))}
        </div>
      )}

      {/* Input — pegado al fondo con safe area */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8,
        padding: "10px 16px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        borderTop: "1px solid var(--glass-border)",
        background: "transparent", flexShrink: 0,
      }}>
        <button onClick={() => setShowEmojis(v => !v)} className="nbtn" style={{
          fontSize: 22, padding: "0 4px",
          color: showEmojis ? accentColor : "var(--text3)",
          minHeight: 44, flexShrink: 0,
        }}>😊</button>

        <button onClick={() => fileRef.current.click()} disabled={sending} className="nbtn" style={{
          fontSize: 22, padding: "0 4px", color: "rgba(240,240,240,0.30)",
          minHeight: 44, flexShrink: 0,
        }}>📎</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />

        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300)}
            placeholder="Escribe un mensaje..."
            rows={1}
            style={{
              width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              border: `1px solid ${text ? accentColor + "66" : "var(--border)"}`,
              color: "var(--text)", padding: "10px 14px",
              borderRadius: 22, fontSize: 14, fontFamily: "inherit",
              outline: "none", resize: "none", lineHeight: 1.4,
              maxHeight: 100, overflowY: "auto",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <button onClick={handleSend} disabled={sending || !text.trim()} style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: text.trim() ? accentColor : "var(--bg2)",
          border: `1.5px solid ${text.trim() ? accentColor : "var(--border)"}`,
          color: text.trim() ? "#000" : "var(--text3)",
          cursor: text.trim() ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, transition: "all 0.2s",
        }}>↑</button>
      </div>
    </div>
  );
}
