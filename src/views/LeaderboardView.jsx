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
  const myEntry    = board.find(e => e.uid === user.uid);
  const myRank     = myEntry ? getRank(myEntry.xp) : null;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3, fontWeight: 700 }}>COMPETENCIA</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -0.8 }}>Ranking</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 100px" }}>

        {/* Mi posición — glass card con accent */}
        {myPosition > 0 && myRank && (
          <div style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 20, padding: "18px 20px",
            marginTop: 20, marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(240,240,240,0.35)", letterSpacing: 3, fontWeight: 700, marginBottom: 4 }}>
                TU POSICIÓN
              </div>
              <div className="mono" style={{ fontSize: 40, color: "#fff", fontWeight: 900, letterSpacing: -2 }}>
                #{myPosition}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "rgba(240,240,240,0.40)", marginTop: 3 }}>
                {(myXP || 0).toLocaleString()} XP
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44 }}>{myRank.emoji}</div>
              <div style={{ fontSize: 9, color: "rgba(240,240,240,0.40)", marginTop: 6, letterSpacing: 2, fontWeight: 700 }}>
                {myRank.name.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                    ? "rgba(255,255,255,0.13)"
                    : "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                  border: isMe
                    ? "1px solid rgba(255,255,255,0.28)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  animation: `slideDown 0.2s ease ${i * 0.03}s both`,
                }}>
                  {/* Posición */}
                  <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
                    {medal
                      ? <span style={{ fontSize: 18 }}>{medal}</span>
                      : <span className="mono" style={{
                          fontSize: 11, fontWeight: 700,
                          color: isMe ? "rgba(255,255,255,0.60)" : "rgba(240,240,240,0.25)",
                        }}>#{i + 1}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: isMe ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${isMe ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.12)"}`,
                    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {entry.photoURL
                      ? <img src={entry.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 15, fontWeight: 900, color: isMe ? "#fff" : "rgba(240,240,240,0.70)" }}>
                          {initial}
                        </span>
                    }
                  </div>

                  {/* Nombre + rango */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: isMe ? 700 : 500, letterSpacing: -0.2,
                      color: isMe ? "#fff" : "rgba(240,240,240,0.80)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {entry.displayName}{isMe ? " · tú" : ""}
                    </div>
                    <div style={{
                      fontSize: 9, marginTop: 2, letterSpacing: 1, fontWeight: 700,
                      color: isMe ? "rgba(255,255,255,0.45)" : "rgba(240,240,240,0.30)",
                    }}>
                      {rank.emoji} {rank.name.toUpperCase()}
                    </div>
                  </div>

                  {/* XP + botón */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div className="mono" style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: 16, fontWeight: 900,
                        color: isMe ? "#fff" : "rgba(240,240,240,0.80)",
                      }}>
                        {entry.xp.toLocaleString()}
                      </div>
                      <div style={{
                        fontSize: 8, letterSpacing: 2, fontWeight: 700,
                        color: isMe ? "rgba(255,255,255,0.40)" : "rgba(240,240,240,0.25)",
                      }}>XP</div>
                    </div>
                    {!isMe && !isFriend && (
                      <button onClick={() => handleAddFriend(entry.uid)} disabled={isSent} style={{
                        background: isSent ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                        border: `1px solid ${isSent ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.25)"}`,
                        color: isSent ? "rgba(240,240,240,0.30)" : "#fff",
                        width: 32, height: 32, minHeight: 32, borderRadius: 10,
                        cursor: isSent ? "default" : "pointer", fontSize: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "inherit", fontWeight: 700,
                        WebkitTapHighlightColor: "transparent",
                      }}>{isSent ? "✓" : "+"}</button>
                    )}
                    {!isMe && isFriend && (
                      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(240,240,240,0.25)" }}>✓</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!board.length && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏅</div>
                <div style={{ fontSize: 14, color: "rgba(240,240,240,0.55)", fontWeight: 600 }}>Nadie registrado aún</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
