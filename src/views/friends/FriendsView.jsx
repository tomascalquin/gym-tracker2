import { useState, useEffect } from "react";
import {
  loadFriends, loadFriendRequests,
  findUserByCode, findUserByEmail,
  sendFriendRequest, acceptFriendRequest,
  rejectFriendRequest, removeFriend,
} from "../../utils/friends";
import FriendProfile from "./FriendProfile";

const ACCENT = "#60a5fa";

export default function FriendsView({ user, myProfile, onBack }) {
  const [tab, setTab]               = useState("friends"); // friends | add | requests
  const [friends, setFriends]       = useState([]);
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Add friend state
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError]   = useState("");
  const [searching, setSearching]       = useState(false);
  const [requestSent, setRequestSent]   = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [f, r] = await Promise.all([
        loadFriends(user.uid),
        loadFriendRequests(user.uid),
      ]);
      setFriends(f);
      setRequests(r);
      setLoading(false);
    }
    load();
  }, [user.uid]);

  async function handleSearch() {
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResult(null);
    setRequestSent(false);
    try {
      const isEmail = searchInput.includes("@");
      const result  = isEmail
        ? await findUserByEmail(searchInput.trim())
        : await findUserByCode(searchInput.trim());

      if (!result) { setSearchError("Usuario no encontrado."); return; }
      if (result.uid === user.uid) { setSearchError("Ese eres tú 😄"); return; }
      if (friends.find(f => f.uid === result.uid)) { setSearchError("Ya son amigos."); return; }
      setSearchResult(result);
    } catch { setSearchError("Error al buscar. Intenta de nuevo."); }
    finally { setSearching(false); }
  }

  async function handleSendRequest() {
    if (!searchResult) return;
    await sendFriendRequest(user.uid, searchResult.uid);
    setRequestSent(true);
  }

  async function handleAccept(fromUid) {
    await acceptFriendRequest(user.uid, fromUid);
    const accepted = requests.find(r => r.uid === fromUid);
    setRequests(prev => prev.filter(r => r.uid !== fromUid));
    if (accepted) setFriends(prev => [...prev, accepted]);
  }

  async function handleReject(fromUid) {
    await rejectFriendRequest(user.uid, fromUid);
    setRequests(prev => prev.filter(r => r.uid !== fromUid));
  }

  async function handleRemove(friendUid) {
    await removeFriend(user.uid, friendUid);
    setFriends(prev => prev.filter(f => f.uid !== friendUid));
    setSelectedFriend(null);
  }

  // Ver perfil de amigo
  if (selectedFriend) {
    return (
      <FriendProfile
        friend={selectedFriend}
        myUid={user.uid}
        myLogs={{}}
        onBack={() => setSelectedFriend(null)}
        onRemove={() => handleRemove(selectedFriend.uid)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 13, letterSpacing: 1 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>AMIGOS</h2>
        {requests.length > 0 && (
          <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 11 }}>
            {requests.length}
          </span>
        )}
      </div>

      {/* Mi código */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 16, borderLeft: `3px solid ${ACCENT}` }}>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 6 }}>TU CÓDIGO DE AMIGO</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: ACCENT, letterSpacing: 4 }}>
          {myProfile?.friendCode || "—"}
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Compártelo para que te agreguen</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 20 }}>
        {[
          { key: "friends", label: `AMIGOS (${friends.length})` },
          { key: "add",     label: "AGREGAR" },
          { key: "requests", label: `SOLICITUDES${requests.length ? ` (${requests.length})` : ""}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "#1a1a2e" : "transparent",
            border: `1px solid ${tab === t.key ? ACCENT + "44" : "#1a1a2a"}`,
            color: tab === t.key ? ACCENT : "#475569",
            padding: "8px 4px", borderRadius: 8, cursor: "pointer",
            fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>Cargando...</div>
      ) : (
        <>
          {/* Lista de amigos */}
          {tab === "friends" && (
            <div>
              {!friends.length && (
                <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
                  Aún no tienes amigos.<br />
                  <span style={{ fontSize: 11 }}>Agrega uno con su código o email.</span>
                </div>
              )}
              {friends.map(f => (
                <FriendCard key={f.uid} friend={f} onClick={() => setSelectedFriend(f)} />
              ))}
            </div>
          )}

          {/* Agregar amigo */}
          {tab === "add" && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 8 }}>BUSCAR POR CÓDIGO O EMAIL</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setSearchError(""); setSearchResult(null); setRequestSent(false); }}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="ABC123 o email@ejemplo.com"
                  style={{
                    flex: 1, background: "#0e0e1a", border: "1px solid #1a1a2a",
                    color: "#f1f5f9", padding: "10px 12px", borderRadius: 8,
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                  }}
                />
                <button onClick={handleSearch} disabled={searching} style={{
                  background: ACCENT, border: "none", color: "#000",
                  padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                  fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                }}>
                  {searching ? "..." : "BUSCAR"}
                </button>
              </div>

              {searchError && (
                <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{searchError}</div>
              )}

              {searchResult && !requestSent && (
                <div className="card" style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#f1f5f9" }}>{searchResult.displayName}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{searchResult.email}</div>
                  </div>
                  <button onClick={handleSendRequest} style={{
                    background: ACCENT, border: "none", color: "#000",
                    padding: "7px 14px", borderRadius: 6, cursor: "pointer",
                    fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                  }}>AGREGAR</button>
                </div>
              )}

              {requestSent && (
                <div style={{ textAlign: "center", color: "#22c55e", fontSize: 13, padding: "16px 0" }}>
                  ✓ Solicitud enviada a {searchResult?.displayName}
                </div>
              )}
            </div>
          )}

          {/* Solicitudes */}
          {tab === "requests" && (
            <div>
              {!requests.length && (
                <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
                  Sin solicitudes pendientes.
                </div>
              )}
              {requests.map(r => (
                <div key={r.uid} className="card" style={{ padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#f1f5f9" }}>{r.displayName}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{r.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleAccept(r.uid)} style={{
                      background: "#14532d", border: "1px solid #22c55e", color: "#22c55e",
                      padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                      fontSize: 11, fontFamily: "inherit",
                    }}>✓ ACEPTAR</button>
                    <button onClick={() => handleReject(r.uid)} className="nbtn" style={{
                      border: "1px solid #3f1010", color: "#ef4444",
                      padding: "6px 10px", borderRadius: 6, fontSize: 11,
                    }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FriendCard({ friend, onClick }) {
  const initial = (friend.displayName || "?")[0].toUpperCase();
  return (
    <button onClick={onClick} style={{
      width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
      borderRadius: 10, padding: "13px 16px", cursor: "pointer",
      textAlign: "left", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "#1a1a2e", border: "1px solid #60a5fa44",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, color: "#60a5fa", fontWeight: 500, flexShrink: 0,
      }}>{initial}</div>
      <div>
        <div style={{ fontSize: 14, color: "#f1f5f9", marginBottom: 2 }}>{friend.displayName}</div>
        <div style={{ fontSize: 11, color: "#475569" }}>{friend.email}</div>
      </div>
      <span style={{ marginLeft: "auto", color: "#475569" }}>›</span>
    </button>
  );
}
