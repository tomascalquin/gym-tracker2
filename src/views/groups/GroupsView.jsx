import { useState, useEffect } from "react";
import {
  loadUserGroups, createGroup, findGroupByCode,
  joinGroup, leaveGroup, deleteGroup,
} from "../../utils/groups";
import GroupDetail from "./GroupDetail";
import { tokens } from "../../design";

export default function GroupsView({ user, onBack, onOpenChat }) {
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("list");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newName, setNewName]   = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining]   = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  useEffect(() => {
    loadUserGroups(user.uid).then(g => { setGroups(g); setLoading(false); });
  }, [user.uid]);

  async function handleCreate() {
    if (!newName.trim()) { setCreateError("Ponle un nombre."); return; }
    setCreating(true);
    try {
      const group = await createGroup(user.uid, newName);
      setGroups(prev => [...prev, group]);
      setNewName(""); setTab("list");
    } catch { setCreateError("Error al crear."); }
    finally { setCreating(false); }
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setJoinError("Ingresa el código."); return; }
    setJoining(true); setJoinError(""); setJoinSuccess("");
    try {
      const group = await findGroupByCode(joinCode.trim());
      if (!group) { setJoinError("Código no encontrado."); return; }
      if (group.members.includes(user.uid)) { setJoinError("Ya eres miembro."); return; }
      await joinGroup(user.uid, group.id);
      setGroups(prev => [...prev, { ...group, members: [...group.members, user.uid] }]);
      setJoinSuccess(`✓ Te uniste a "${group.name}"`);
      setJoinCode("");
    } catch { setJoinError("Error al unirse."); }
    finally { setJoining(false); }
  }

  async function handleLeave(group) {
    await leaveGroup(user.uid, group.id);
    setGroups(prev => prev.filter(g => g.id !== group.id));
    setSelectedGroup(null);
  }

  async function handleDelete(group) {
    await deleteGroup(user.uid, group.id);
    setGroups(prev => prev.filter(g => g.id !== group.id));
    setSelectedGroup(null);
  }

  if (selectedGroup) return (
    <GroupDetail group={selectedGroup} user={user}
      onBack={() => setSelectedGroup(null)}
      onLeave={() => handleLeave(selectedGroup)}
      onDelete={() => handleDelete(selectedGroup)}
      onOpenChat={onOpenChat}
    />
  );

  const TABS = [
    { key: "list",   label: `GRUPOS (${groups.length})` },
    { key: "create", label: "CREAR" },
    { key: "join",   label: "UNIRSE" },
  ];

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>COMPETENCIA</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "var(--text)" }}>Grupos</h2>
          </div>
        </div>

        {/* Tabs underline */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === t.key ? "#a78bfa" : "transparent"}`,
              color: tab === t.key ? "#a78bfa" : "var(--text3)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 9, letterSpacing: 2, fontFamily: "inherit",
              transition: "all 0.15s", marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {/* Lista */}
        {tab === "list" && (
          <div>
            {loading && [...Array(2)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14, marginBottom: 8 }} />
            ))}
            {!loading && !groups.length && (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 14, color: "var(--text2)" }}>Sin grupos aún</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Crea uno o únete con un código</div>
              </div>
            )}
            {groups.map((g, i) => (
              <button key={g.id} onClick={() => setSelectedGroup(g)} style={{
                width: "100%", background: "var(--bg2)", border: "1px solid var(--border)",
                borderLeft: "3px solid #a78bfa", borderRadius: 14,
                padding: "14px 16px", cursor: "pointer", textAlign: "left",
                marginBottom: 8, fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                animation: `slideDown 0.2s ease ${i * 0.05}s both`,
                transition: "border-color 0.15s",
              }}>
                <div>
                  <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 3 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {g.members?.length || 0} miembros ·{" "}
                    <span style={{ color: "#a78bfa", letterSpacing: 1 }}>{g.code}</span>
                  </div>
                </div>
                <span style={{ color: "#a78bfa", fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* Crear */}
        {tab === "create" && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 2, marginBottom: 10 }}>NOMBRE DEL GRUPO</div>
            <input value={newName} onChange={e => { setNewName(e.target.value); setCreateError(""); }}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Ej: Los del gym, Equipo A..." autoFocus
              style={{
                width: "100%", background: "var(--bg2)",
                border: `1px solid ${createError ? "var(--red)" : "var(--border)"}`,
                color: "var(--text)", padding: "12px 14px", borderRadius: 12,
                fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 10,
              }}
            />
            {createError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 10 }}>{createError}</div>}
            <button onClick={handleCreate} disabled={creating} style={{
              width: "100%", padding: "14px",
              background: creating ? "var(--bg2)" : "#a78bfa",
              border: creating ? "1px solid var(--border)" : "none",
              color: creating ? "var(--text3)" : "#000",
              borderRadius: 12, cursor: creating ? "default" : "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
              minHeight: 48, boxShadow: creating ? "none" : "0 4px 16px #a78bfa44",
              transition: "all 0.15s",
            }}>{creating ? "CREANDO..." : "CREAR GRUPO"}</button>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 12, textAlign: "center" }}>
              Se genera un código automático para invitar miembros
            </div>
          </div>
        )}

        {/* Unirse */}
        {tab === "join" && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 2, marginBottom: 10 }}>CÓDIGO DEL GRUPO</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); setJoinSuccess(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="ABC123" maxLength={6} autoFocus
                style={{
                  flex: 1, background: "var(--bg2)",
                  border: `1px solid ${joinError ? "var(--red)" : "var(--border)"}`,
                  color: "#a78bfa", padding: "12px 14px", borderRadius: 12,
                  fontSize: 20, fontFamily: "inherit", outline: "none",
                  letterSpacing: 4, textAlign: "center",
                }}
              />
              <button onClick={handleJoin} disabled={joining} style={{
                background: joining ? "var(--bg2)" : "#a78bfa",
                border: joining ? "1px solid var(--border)" : "none",
                color: joining ? "var(--text3)" : "#000",
                padding: "12px 18px", borderRadius: 12, cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: "inherit", minHeight: 48,
              }}>{joining ? "..." : "UNIRSE"}</button>
            </div>
            {joinError   && <div style={{ color: "var(--red)",   fontSize: 12 }}>{joinError}</div>}
            {joinSuccess && <div style={{ color: "var(--green)", fontSize: 12 }}>{joinSuccess}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
