import { useState, useEffect } from "react";
import { loadLeaderboard, getRank } from "../utils/ranks";
import { sendFriendRequest, loadFriends } from "../utils/friends";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

export default function LeaderboardView({ user, myXP, onBack }) {
  const [board, setBoard]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [friends, setFriends]   = useState(new Set());
  const [sent, setSent]         = useState(new Set()); // uids a los que ya envié solicitud esta sesión

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
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 13 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>
          RANKING GLOBAL
        </h2>
      </div>

      {myPosition > 0 && (
        <div style={{
          background: "#1e1b4b", border: "1px solid #a78bfa44",
          borderLeft: "3px solid #a78bfa", borderRadius: 10,
          padding: "12px 16px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: "#a78bfa" }}>Tu posición</div>
          <div style={{ fontSize: 22, color: "#a78bfa", fontWeight: 500 }}>#{myPosition}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
          Cargando ranking...
        </div>
      ) : (
        <div>
          {board.map((entry, i) => {
            const rank    = getRank(entry.xp);
            const isMe    = entry.uid === user.uid;
            const isFriend = friends.has(entry.uid);
            const isSent   = sent.has(entry.uid);
            const medal   = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

            return (
              <div key={entry.uid} className="card" style={{
                marginBottom: 8, padding: "12px 16px",
                borderLeft: `3px solid ${isMe ? "#a78bfa" : rank.color}`,
                background: isMe ? "#1e1b4b" : "#0e0e1a",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 32, textAlign: "center", flexShrink: 0 }}>
                  {medal
                    ? <span style={{ fontSize: 20 }}>{medal}</span>
                    : <span style={{ fontSize: 13, color: "#475569" }}>#{i + 1}</span>
                  }
                </div>

                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: rank.dim, border: `1px solid ${rank.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>{rank.emoji}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: isMe ? "#a78bfa" : "#f1f5f9",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.displayName}{isMe ? " (tú)" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: rank.color, marginTop: 2 }}>{rank.name}</div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, color: rank.color, fontWeight: 500 }}>
                      {entry.xp.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: "#334155" }}>XP</div>
                  </div>

                  {/* Botón agregar amigo */}
                  {!isMe && !isFriend && (
                    <button
                      onClick={() => handleAddFriend(entry.uid)}
                      disabled={isSent}
                      style={{
                        background: isSent ? "#14532d" : "#0e0e1a",
                        border: `1px solid ${isSent ? "#22c55e" : "#60a5fa44"}`,
                        color: isSent ? "#22c55e" : "#60a5fa",
                        padding: "5px 8px", borderRadius: 6,
                        cursor: isSent ? "default" : "pointer",
                        fontSize: 12, fontFamily: "inherit",
                        flexShrink: 0,
                      }}
                    >
                      {isSent ? "✓" : "+ 👤"}
                    </button>
                  )}
                  {!isMe && isFriend && (
                    <span style={{ fontSize: 11, color: "#22c55e" }}>amigo ✓</span>
                  )}
                </div>
              </div>
            );
          })}

          {!board.length && (
            <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
              Nadie registrado aún.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
