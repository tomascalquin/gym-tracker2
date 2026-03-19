import { useState, useEffect } from "react";
import { loadLeaderboard, getRank } from "../utils/ranks";
import { sendFriendRequest, loadFriends } from "../utils/friends";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

export default function LeaderboardView({ user, myXP, onBack }) {
  const [board, setBoard]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState(new Set());
  const [sent, setSent]       = useState(new Set());

  useEffect(() => {
    async function load() {
      const [data, friendList, sentSnap] = await Promise.all([
        loadLeaderboard(),
        loadFriends(user.uid),
        getDocs(collection(db, "friendships", user.uid, "sent")),
      ]);
      setBoard(data);
      setFriends(new Set(friendList.map(f => f.uid)));
      setSent(new Set(sentSnap.docs.map(d => d.id)));
      setLoading(false);
    }
    load();
  }, [user.uid]);

  async function handleAddFriend(uid) {
    await sendFriendRequest(user.uid, uid);
    setSent(prev => new Set([...prev, uid]));
  }

  const myPosition = board.findIndex(e => e.uid === user.uid) + 1;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 13 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "var(--text)" }}>
          RANKING GLOBAL
        </h2>
      </div>

      {/* Mi posición */}
      {myPosition > 0 && (
        <div style={{
          background: "#1e1b4b", border: "1px solid #a78bfa44",
          borderLeft: "3px solid #a78bfa", borderRadius: 10,
          padding: "12px 16px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: "#a78bfa" }}>Tu posición</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, color: "#a78bfa", fontWeight: 500 }}>#{myPosition}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>{myXP.toLocaleString()} ELO</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text3)", padding: "40px 0", fontSize: 13 }}>
          Cargando ranking...
        </div>
      ) : (
        <div>
          {board.map((entry, i) => {
            const rank     = getRank(entry.xp);
            const isMe     = entry.uid === user.uid;
            const isFriend = friends.has(entry.uid);
            const isSent   = sent.has(entry.uid);
            const medal    = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            const initial  = (entry.displayName || "?")[0].toUpperCase();

            return (
              <div key={entry.uid} style={{
                background: isMe ? "#1e1b4b" : "var(--bg2)",
                border: `1px solid ${isMe ? "#a78bfa44" : "var(--border)"}`,
                borderLeft: `3px solid ${isMe ? "#a78bfa" : rank.color}`,
                borderRadius: 10, marginBottom: 8, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {/* Posición */}
                <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
                  {medal
                    ? <span style={{ fontSize: 18 }}>{medal}</span>
                    : <span style={{ fontSize: 12, color: "var(--text3)" }}>#{i + 1}</span>
                  }
                </div>

                {/* Avatar con foto */}
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: rank.dim, border: `2px solid ${rank.color}44`,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {entry.photoURL
                    ? <img src={entry.photoURL} alt={entry.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 16, color: rank.color }}>{initial}</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: isMe ? "#a78bfa" : "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {entry.displayName}{isMe ? " (tú)" : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 14 }}>{rank.emoji}</span>
                    <span style={{ fontSize: 10, color: rank.color }}>{rank.name}</span>
                  </div>
                </div>

                {/* ELO + botón amigo */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, color: rank.color, fontWeight: 500 }}>
                      {entry.xp.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1 }}>ELO</div>
                  </div>

                  {!isMe && !isFriend && (
                    <button onClick={() => handleAddFriend(entry.uid)} disabled={isSent} style={{
                      background: isSent ? "#14532d" : "var(--bg3)",
                      border: `1px solid ${isSent ? "#22c55e" : "#60a5fa44"}`,
                      color: isSent ? "#22c55e" : "#60a5fa",
                      padding: "5px 8px", borderRadius: 6,
                      cursor: isSent ? "default" : "pointer",
                      fontSize: 12, fontFamily: "inherit",
                    }}>
                      {isSent ? "✓" : "+ 👤"}
                    </button>
                  )}
                  {!isMe && isFriend && (
                    <span style={{ fontSize: 10, color: "#22c55e" }}>amigo ✓</span>
                  )}
                </div>
              </div>
            );
          })}

          {!board.length && (
            <div style={{ textAlign: "center", color: "var(--text3)", padding: "40px 0", fontSize: 13 }}>
              Nadie registrado aún.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
