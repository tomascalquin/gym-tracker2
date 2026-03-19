import { useState, useEffect } from "react";
import { loadLeaderboard, getRank } from "../utils/ranks";
import { sendFriendRequest, loadFriends } from "../utils/friends";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { tokens } from "../design";

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
  const myEntry    = board.find(e => e.uid === user.uid);
  const myRank     = myEntry ? getRank(myEntry.xp) : null;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "20px 18px", fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>COMPETENCIA</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "var(--text)" }}>Ranking Global</h2>
        </div>
      </div>

      {/* Mi posición destacada */}
      {myPosition > 0 && myRank && (
        <div style={{
          background: `linear-gradient(135deg, ${myRank.dim} 0%, #1e1b4b 100%)`,
          border: "1px solid #a78bfa33", borderRadius: 16,
          padding: "16px 18px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 4px 20px rgba(167,139,250,0.1)",
          animation: "scaleIn 0.3s ease",
        }}>
          <div>
            <div style={{ fontSize: 9, color: "#a78bfa88", letterSpacing: 3, marginBottom: 4 }}>TU POSICIÓN</div>
            <div style={{ fontSize: 32, color: "#a78bfa", fontWeight: 300 }}>#{myPosition}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{(myXP || 0).toLocaleString()} ELO</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>{myRank.emoji}</div>
            <div style={{ fontSize: 10, color: myRank.color, marginTop: 4 }}>{myRank.name}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14 }} />
          ))}
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
                background: isMe
                  ? `linear-gradient(135deg, #1e1b4b 0%, #16133a 100%)`
                  : "var(--bg2)",
                border: `1px solid ${isMe ? "#a78bfa33" : i < 3 ? rank.color + "33" : "var(--border)"}`,
                borderRadius: 14, marginBottom: 6, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 10,
                animation: `slideDown 0.2s ease ${i * 0.03}s both`,
                boxShadow: i < 3 ? `0 2px 12px ${rank.color}11` : "none",
              }}>
                {/* Pos */}
                <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
                  {medal
                    ? <span style={{ fontSize: 20 }}>{medal}</span>
                    : <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 300 }}>#{i + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: rank.dim, border: `2px solid ${rank.color}44`,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {entry.photoURL
                    ? <img src={entry.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 17, color: rank.color }}>{initial}</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: isMe ? "#a78bfa" : "var(--text)", fontWeight: 400,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {entry.displayName}{isMe ? " · tú" : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span style={{ fontSize: 13 }}>{rank.emoji}</span>
                    <span style={{ fontSize: 9, color: rank.color, letterSpacing: 1 }}>{rank.name.toUpperCase()}</span>
                  </div>
                </div>

                {/* ELO + acción */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, color: rank.color, fontWeight: 500 }}>
                      {entry.xp.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 2 }}>ELO</div>
                  </div>

                  {!isMe && !isFriend && (
                    <button onClick={() => handleAddFriend(entry.uid)} disabled={isSent} style={{
                      background: isSent ? "#14532d22" : "var(--bg3)",
                      border: `1px solid ${isSent ? "#22c55e44" : "#60a5fa33"}`,
                      color: isSent ? "var(--green)" : "#60a5fa",
                      width: 32, height: 32, borderRadius: 8,
                      cursor: isSent ? "default" : "pointer", fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "inherit",
                    }}>{isSent ? "✓" : "+"}</button>
                  )}
                  {!isMe && isFriend && (
                    <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--green)" }}>✓</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!board.length && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏅</div>
              <div style={{ fontSize: 14, color: "var(--text2)" }}>Nadie registrado aún</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
