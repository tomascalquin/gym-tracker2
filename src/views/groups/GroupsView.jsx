import { useState, useEffect } from "react";
import {
  loadUserGroups, createGroup, findGroupByCode,
  joinGroup, leaveGroup, deleteGroup,
} from "../../utils/groups";
import GroupDetail from "./GroupDetail";

const ACCENT = "#a78bfa";

export default function GroupsView({ user, onBack }) {
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("list"); // list | create | join
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Create
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  // Join
  const [joinCode, setJoinCode]     = useState("");
  const [joining, setJoining]       = useState(false);
  const [joinError, setJoinError]   = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  useEffect(() => {
    loadUserGroups(user.uid).then(g => {
      setGroups(g);
      setLoading(false);
    });
  }, [user.uid]);

  async function handleCreate() {
    if (!newName.trim()) { setCreateError("Ponle un nombre al grupo."); return; }
    setCreating(true);
    try {
      const group = await createGroup(user.uid, newName);
      setGroups(prev => [...prev, group]);
      setNewName("");
      setTab("list");
    } catch { setCreateError("Error al crear el grupo."); }
    finally { setCreating(false); }
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setJoinError("Ingresa el código del grupo."); return; }
    setJoining(true); setJoinError(""); setJoinSuccess("");
    try {
      const group = await findGroupByCode(joinCode.trim());
      if (!group) { setJoinError("Código no encontrado."); return; }
      if (group.members.includes(user.uid)) { setJoinError("Ya eres miembro de este grupo."); return; }
      await joinGroup(user.uid, group.id);
      setGroups(prev => [...prev, { ...group, members: [...group.members, user.uid] }]);
      setJoinSuccess(`✓ Te uniste a "${group.name}"`);
      setJoinCode("");
    } catch { setJoinError("Error al unirse al grupo."); }
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

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        user={user}
        onBack={() => setSelectedGroup(null)}
        onLeave={() => handleLeave(selectedGroup)}
        onDelete={() => handleDelete(selectedGroup)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 13, letterSpacing: 1 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>GRUPOS</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 20 }}>
        {[
          { key: "list",   label: `MIS GRUPOS (${groups.length})` },
          { key: "create", label: "CREAR" },
          { key: "join",   label: "UNIRSE" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "#1e1b4b" : "transparent",
            border: `1px solid ${tab === t.key ? ACCENT + "44" : "#1a1a2a"}`,
            color: tab === t.key ? ACCENT : "#475569",
            padding: "8px 4px", borderRadius: 8, cursor: "pointer",
            fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Lista de grupos */}
      {tab === "list" && (
        <div>
          {loading && <div style={{ color: "#475569", textAlign: "center", padding: "40px 0", fontSize: 13 }}>Cargando...</div>}
          {!loading && !groups.length && (
            <div style={{ color: "#475569", textAlign: "center", padding: "40px 0", fontSize: 13 }}>
              No estás en ningún grupo.<br />
              <span style={{ fontSize: 11 }}>Crea uno o únete con un código.</span>
            </div>
          )}
          {groups.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g)} style={{
              width: "100%", background: "#0e0e1a",
              border: "1px solid #1a1a2a", borderLeft: `3px solid ${ACCENT}`,
              borderRadius: 10, padding: "13px 16px", cursor: "pointer",
              textAlign: "left", marginBottom: 8, fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>
                  {g.members?.length || 0} miembros · código: <span style={{ color: ACCENT }}>{g.code}</span>
                </div>
              </div>
              <span style={{ color: ACCENT }}>›</span>
            </button>
          ))}
        </div>
      )}

      {/* Crear grupo */}
      {tab === "create" && (
        <div>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 10 }}>NOMBRE DEL GRUPO</div>
          <input
            value={newName}
            onChange={e => { setNewName(e.target.value); setCreateError(""); }}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            placeholder="Ej: Los del gym, Equipo A..."
            style={{
              width: "100%", background: "#0e0e1a", border: `1px solid ${createError ? "#ef4444" : "#1a1a2a"}`,
              color: "#f1f5f9", padding: "11px 12px", borderRadius: 8,
              fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 8,
            }}
          />
          {createError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{createError}</div>}
          <button onClick={handleCreate} disabled={creating} style={{
            width: "100%", padding: "13px", background: creating ? "#1e1b4b" : ACCENT,
            border: "none", borderRadius: 10, color: "#000", fontWeight: 700,
            fontSize: 13, letterSpacing: 2, cursor: creating ? "default" : "pointer",
            fontFamily: "inherit",
          }}>
            {creating ? "CREANDO..." : "CREAR GRUPO"}
          </button>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 12, textAlign: "center" }}>
            Se genera un código automático para que otros se unan.
          </div>
        </div>
      )}

      {/* Unirse */}
      {tab === "join" && (
        <div>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 10 }}>CÓDIGO DEL GRUPO</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); setJoinSuccess(""); }}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              placeholder="ABC123"
              maxLength={6}
              style={{
                flex: 1, background: "#0e0e1a", border: `1px solid ${joinError ? "#ef4444" : "#1a1a2a"}`,
                color: "#f1f5f9", padding: "11px 12px", borderRadius: 8,
                fontSize: 16, fontFamily: "inherit", outline: "none", letterSpacing: 3,
              }}
            />
            <button onClick={handleJoin} disabled={joining} style={{
              background: joining ? "#1e1b4b" : ACCENT, border: "none", color: "#000",
              padding: "11px 16px", borderRadius: 8, cursor: joining ? "default" : "pointer",
              fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            }}>
              {joining ? "..." : "UNIRSE"}
            </button>
          </div>
          {joinError   && <div style={{ color: "#ef4444", fontSize: 12 }}>{joinError}</div>}
          {joinSuccess && <div style={{ color: "#22c55e", fontSize: 12 }}>{joinSuccess}</div>}
        </div>
      )}
    </div>
  );
}
