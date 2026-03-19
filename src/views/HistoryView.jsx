import { useState, useMemo } from "react";
import { DAY_META } from "../data/routine";
import { sessionVolume } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";
import SessionComments from "../components/SessionComments";

export default function HistoryView({ logs, user, onBack, onViewSession, onDeleteSession }) {
  const [search, setSearch]       = useState("");
  const [expandedKey, setExpandedKey] = useState(null);

  const sorted = useMemo(() => {
    const entries = Object.entries(logs).sort(([a], [b]) => b.localeCompare(a));
    if (!search.trim()) return entries;

    const q = search.toLowerCase().trim();
    return entries.filter(([key, s]) => {
      // Por día
      if (s.day?.toLowerCase().includes(q)) return true;
      // Por fecha
      if (s.date?.includes(q)) return true;
      // Por nota de sesión
      if (s.note?.toLowerCase().includes(q)) return true;
      // Por nombre de ejercicio dentro de los sets
      // Buscar en los datos de la sesión — los sets tienen índices numéricos
      // así que buscamos en la key del log
      if (key.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [logs, search]);

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 18px", fontFamily: "DM Mono, monospace" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 13, letterSpacing: 1 }}>← HOME</button>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 400, letterSpacing: 2, color: "#f1f5f9" }}>HISTORIAL</h2>
        <button onClick={() => exportToExcel(logs)} className="nbtn" style={{
          marginLeft: "auto", border: "1px solid #1a3a1a", color: "#22c55e",
          padding: "5px 12px", borderRadius: 6, fontSize: 10, letterSpacing: 1,
        }}>↓ XLSX</button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: 16, position: "relative" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por día, fecha o nota..."
          style={{
            width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
            color: "#f1f5f9", padding: "10px 36px 10px 12px", borderRadius: 8,
            fontSize: 13, fontFamily: "inherit", outline: "none",
            boxSizing: "border-box",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="nbtn" style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            color: "#475569", fontSize: 14,
          }}>✕</button>
        )}
      </div>

      {/* Contador */}
      {search && (
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>
          {sorted.length} resultado{sorted.length !== 1 ? "s" : ""} para "{search}"
        </div>
      )}

      {!sorted.length && (
        <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
          {search ? "Sin resultados." : "Sin sesiones aún."}
        </div>
      )}

      {sorted.map(([key, s]) => {
        const c          = DAY_META[s.day] || { accent: "#60a5fa" };
        const vol        = sessionVolume(s.sets).toLocaleString();
        const done       = Object.values(s.completed || {}).filter(Boolean).length;
        const isExpanded = expandedKey === key;

        return (
          <div key={key} className="card" style={{ borderLeft: `3px solid ${c.accent}`, marginBottom: 10 }}>
            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: "#f1f5f9" }}>{s.day}</span>
                  <span style={{ fontSize: 11, color: "#334155" }}>·</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{s.date}</span>
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>
                  vol {vol} · {done} sets ✓
                </div>
                {s.note && (
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 3, fontStyle: "italic" }}>
                    "{s.note.slice(0, 55)}{s.note.length > 55 ? "…" : ""}"
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => setExpandedKey(isExpanded ? null : key)} className="nbtn" style={{
                  fontSize: 10, color: isExpanded ? c.accent : "#475569",
                  border: `1px solid ${isExpanded ? c.accent + "44" : "#1a1a2a"}`,
                  padding: "4px 8px", borderRadius: 6, letterSpacing: 1,
                }}>
                  {isExpanded ? "▲" : "💬"}
                </button>
                <button onClick={() => onViewSession(s.day, s.date)} style={{
                  background: "#0a0a14", border: `1px solid ${c.accent}33`, color: c.accent,
                  padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                  fontSize: 11, fontFamily: "inherit",
                }}>VER</button>
                <button onClick={() => onDeleteSession(key)} className="nbtn" style={{
                  border: "1px solid #3f1010", color: "#ef4444",
                  padding: "5px 8px", borderRadius: 6, fontSize: 11,
                }}>✕</button>
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 14px 12px" }}>
                <SessionComments
                  ownerUid={user.uid}
                  sessionKey={key}
                  currentUser={user}
                  canComment={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
