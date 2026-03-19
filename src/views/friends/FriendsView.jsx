import { useState, useEffect } from "react";
import {
  loadFriends, loadFriendRequests,
  findUserByCode, findUserByEmail,
  sendFriendRequest, acceptFriendRequest,
  rejectFriendRequest, removeFriend,
} from "../../utils/friends";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import FriendProfile from "./FriendProfile";
import { tokens } from "../../design";

const TABS = [
  { key: "friends",  label: "AMIGOS" },
  { key: "add",      label: "AGREGAR" },
  { key: "requests", label: "SOLICITUDES" },
];

export default function FriendsView({ user, myProfile, onBack, onOpenChat }) {
  const [tab, setTab]               = useState("friends");
  const [friends, setFriends]       = useState([]);
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError]   = useState("");
  const [searching, setSearching]       = useState(false);
  const [sendingReq, setSendingReq]     = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [f, r] = await Promise.all([loadFriends(user.uid), loadFriendRequests(user.uid)]);
      setFriends(f); setRequests(r); setLoading(false);
    }
    load();
  }, [user.uid]);

  async function handleSearch() {
    if (!searchInput.trim()) return;
    setSearching(true); setSearchError(""); setSearchResult(null);
    try {
      const byCode  = searchInput.trim().length === 6;
      const result  = byCode
        ? await findUserByCode(searchInput.trim().toUpperCase())
        : await findUserByEmail(searchInput.trim());
      if (!result) { setSearchError("Usuario no encontrado."); return; }
      if (result.uid === user.uid) { setSearchError("Ese eres tú 😄"); return; }
      if (friends.find(f => f.uid === result.uid)) { setSearchError("Ya son amigos."); return; }
      try {
        const sentSnap = await getDocs(collection(db, "friendships", user.uid, "sent"));
        if (sentSnap.docs.some(d => d.id === result.uid)) { setSearchError("Ya le enviaste una solicitud."); return; }
      } catch {}
      setSearchResult(result);
    } catch { setSearchError("Error al buscar."); }
    finally { setSearching(false); }
  }

  async function handleSendRequest() {
    if (!searchResult) return;
    setSendingReq(true);
    await sendFriendRequest(user.uid, searchResult.uid);
    setSearchResult(null); setSearchInput("");
    setSendingReq(false);
  }

  async function handleAccept(fromUid) {
    await acceptFriendRequest(user.uid, fromUid);
    const newFriend = requests.find(r => r.uid === fromUid);
    if (newFriend) setFriends(prev => [...prev, newFriend]);
    setRequests(prev => prev.filter(r => r.uid !== fromUid));
  }

  async function handleReject(fromUid) {
    await rejectFriendRequest(user.uid, fromUid);
    setRequests(prev => prev.filter(r => r.uid !== fromUid));
  }

  async function handleRemove(uid) {
    await removeFriend(user.uid, uid);
    setFriends(prev => prev.filter(f => f.uid !== uid));
    setSelectedFriend(null);
  }

  if (selectedFriend) return (
    <FriendProfile friend={selectedFriend} user={user} onBack={() => setSelectedFriend(null)} onRemove={() => handleRemove(selectedFriend.uid)} />
  );

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>SOCIAL</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "var(--text)" }}>Amigos</h2>
          </div>
          {requests.length > 0 && (
            <div style={{
              marginLeft: "auto", background: "#ef4444",
              color: "#fff", fontSize: 10, fontWeight: 700,
              padding: "3px 8px", borderRadius: 99,
            }}>{requests.length}</div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 0, borderBottom: "1px solid var(--border)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.key ? "#60a5fa" : "transparent"}`,
              color: tab === t.key ? "#60a5fa" : "var(--text3)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 9, letterSpacing: 2, fontFamily: "inherit",
              transition: "all 0.15s ease",
              marginBottom: -1, position: "relative",
            }}>
              {t.label}
              {t.key === "requests" && requests.length > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: "calc(50% - 24px)",
                  width: 6, height: 6, borderRadius: "50%", background: "#ef4444",
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {/* AMIGOS */}
        {tab === "friends" && (
          <div>
            {loading && [...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14, marginBottom: 8 }} />
            ))}
            {!loading && !friends.length && (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 14, color: "var(--text2)" }}>Sin amigos aún</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Agrega uno con su código o email</div>
              </div>
            )}
            {friends.map((f, i) => (
              <div key={f.uid} style={{
                display: "flex", gap: 8, alignItems: "center", marginBottom: 8,
                animation: `slideDown 0.2s ease ${i * 0.04}s both`,
              }}>
                <button onClick={() => setSelectedFriend(f)} style={{
                  flex: 1, background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "12px 14px", cursor: "pointer",
                  textAlign: "left", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "border-color 0.15s",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: "#60a5fa22", border: "1.5px solid #60a5fa33",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {f.photoURL
                      ? <img src={f.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 16, color: "#60a5fa" }}>{(f.displayName||"?")[0].toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--text)" }}>{f.displayName}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{f.email}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "var(--text3)", fontSize: 16 }}>›</span>
                </button>
                {onOpenChat && (
                  <button onClick={() => onOpenChat(f.uid, f.displayName)} style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "#60a5fa18", border: "1px solid #60a5fa33",
                    color: "#60a5fa", cursor: "pointer", fontSize: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit",
                  }}>💬</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AGREGAR */}
        {tab === "add" && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 2, marginBottom: 10 }}>BUSCAR POR CÓDIGO O EMAIL</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={searchInput} onChange={e => { setSearchInput(e.target.value); setSearchError(""); setSearchResult(null); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Código de 6 letras o email..."
                style={{
                  flex: 1, background: "var(--bg2)", border: `1px solid ${searchError ? "var(--red)" : "var(--border)"}`,
                  color: "var(--text)", padding: "11px 14px", borderRadius: 12,
                  fontSize: 13, fontFamily: "inherit", outline: "none",
                }}
              />
              <button onClick={handleSearch} disabled={searching} style={{
                background: searching ? "var(--bg2)" : "#60a5fa",
                border: "none", color: searching ? "var(--text3)" : "#000",
                padding: "11px 16px", borderRadius: 12, cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: "inherit", minHeight: 44,
                transition: "all 0.15s",
              }}>{searching ? "..." : "BUSCAR"}</button>
            </div>

            {searchError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{searchError}</div>}

            {searchResult && (
              <div style={{
                background: "var(--bg2)", border: "1px solid #22c55e33",
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
                animation: "scaleIn 0.2s ease",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "#22c55e22", border: "1.5px solid #22c55e33",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {searchResult.photoURL
                    ? <img src={searchResult.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 18, color: "#22c55e" }}>{(searchResult.displayName||"?")[0].toUpperCase()}</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "var(--text)" }}>{searchResult.displayName}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{searchResult.email}</div>
                </div>
                <button onClick={handleSendRequest} disabled={sendingReq} style={{
                  background: sendingReq ? "#14532d" : "#22c55e",
                  border: "none", color: "#000", padding: "9px 16px",
                  borderRadius: 10, cursor: "pointer", fontSize: 11,
                  fontWeight: 700, fontFamily: "inherit", minHeight: 40,
                }}>{sendingReq ? "✓" : "AGREGAR"}</button>
              </div>
            )}
          </div>
        )}

        {/* SOLICITUDES */}
        {tab === "requests" && (
          <div>
            {!requests.length && (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
                <div style={{ fontSize: 14, color: "var(--text2)" }}>Sin solicitudes pendientes</div>
              </div>
            )}
            {requests.map((r, i) => (
              <div key={r.uid} style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "14px 16px", marginBottom: 8,
                display: "flex", alignItems: "center", gap: 12,
                animation: `slideDown 0.2s ease ${i * 0.05}s both`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "#a78bfa22", border: "1.5px solid #a78bfa33",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {r.photoURL
                    ? <img src={r.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 18, color: "#a78bfa" }}>{(r.displayName||"?")[0].toUpperCase()}</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "var(--text)" }}>{r.displayName}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.email}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleAccept(r.uid)} style={{
                    background: "#22c55e", border: "none", color: "#000",
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                    fontSize: 11, fontWeight: 700, fontFamily: "inherit", minHeight: 38,
                  }}>✓</button>
                  <button onClick={() => handleReject(r.uid)} style={{
                    background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--red)",
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                    fontSize: 11, fontFamily: "inherit", minHeight: 38,
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
