import { useState, useMemo } from "react";
import { DAY_META } from "../data/routine";
import { sessionVolume } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";
import SessionComments from "../components/SessionComments";
import { tokens } from "../design";

export default function HistoryView({ logs, user, onBack, onViewSession, onDeleteSession }) {
  const [search, setSearch]           = useState("");
  const [expandedKey, setExpandedKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);

  const sorted = useMemo(() => {
    const entries = Object.entries(logs).sort(([a], [b]) => b.localeCompare(a));
    if (!search.trim()) return entries;
    const q = search.toLowerCase().trim();
    return entries.filter(([key, s]) =>
      s.day?.toLowerCase().includes(q) || s.date?.includes(q) ||
      s.note?.toLowerCase().includes(q) || key.toLowerCase().includes(q)
    );
  }, [logs, search]);

  async function handleDelete(key) {
    setDeletingKey(key);
    setTimeout(() => {
      onDeleteSession(key);
      setDeletingKey(null);
    }, 300);
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "20px 18px", fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>REGISTRO</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "var(--text)" }}>Historial</h2>
        </div>
        <button onClick={() => exportToExcel(logs)} style={{
          marginLeft: "auto", background: "transparent",
          border: "1px solid var(--border)", color: "var(--green)",
          padding: "6px 12px", borderRadius: tokens.radius.md,
          fontSize: 10, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer",
          minHeight: 36,
        }}>↓ XLSX</button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: 16, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text3)" }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por día, fecha o nota..."
          style={{
            width: "100%", background: "var(--bg2)", border: "1px solid var(--border)",
            color: "var(--text)", padding: "10px 36px 10px 36px",
            borderRadius: tokens.radius.lg, fontSize: 13,
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="nbtn" style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--text3)", fontSize: 14, padding: "4px",
          }}>✕</button>
        )}
      </div>

      {search && (
        <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 12, letterSpacing: 1 }}>
          {sorted.length} RESULTADO{sorted.length !== 1 ? "S" : ""}
        </div>
      )}

      {!sorted.length && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, color: "var(--text2)" }}>
            {search ? "Sin resultados" : "Sin sesiones aún"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
            {search ? `No hay sesiones que coincidan con "${search}"` : "Registra tu primera sesión"}
          </div>
        </div>
      )}

      {sorted.map(([key, s], i) => {
        const c          = DAY_META[s.day] || { accent: "#60a5fa" };
        const vol        = sessionVolume(s.sets).toLocaleString();
        const done       = Object.values(s.completed || {}).filter(Boolean).length;
        const isExpanded = expandedKey === key;
        const isDeleting = deletingKey === key;

        return (
          <div key={key} style={{
            background: "var(--bg2)", border: `1px solid ${isExpanded ? c.accent + "44" : "var(--border)"}`,
            borderLeft: `3px solid ${c.accent}`, borderRadius: 14,
            marginBottom: 8, overflow: "hidden",
            transform: isDeleting ? "scale(0.95)" : "scale(1)",
            opacity: isDeleting ? 0 : 1,
            transition: "all 0.25s ease",
            animation: `slideDown 0.2s ease ${i * 0.03}s both`,
          }}>
            <div style={{ padding: "13px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 400 }}>{s.day}</span>
                  <span style={{ fontSize: 10, color: "var(--text3)" }}>{s.date}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>
                  {vol} kg vol · {done} sets ✓
                </div>
                {s.note && (
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, fontStyle: "italic", opacity: 0.8 }}>
                    "{s.note.slice(0, 60)}{s.note.length > 60 ? "…" : ""}"
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
                <button onClick={() => setExpandedKey(isExpanded ? null : key)} style={{
                  background: isExpanded ? c.accent + "22" : "var(--bg3)",
                  border: `1px solid ${isExpanded ? c.accent + "44" : "var(--border)"}`,
                  color: isExpanded ? c.accent : "var(--text3)",
                  width: 32, height: 32, borderRadius: 8,
                  cursor: "pointer", fontSize: 14, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>💬</button>
                <button onClick={() => onViewSession(s.day, s.date)} style={{
                  background: c.accent + "18", border: `1px solid ${c.accent}33`,
                  color: c.accent, padding: "6px 10px", borderRadius: 8,
                  cursor: "pointer", fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
                  minHeight: 32,
                }}>VER</button>
                <button onClick={() => handleDelete(key)} style={{
                  background: "transparent", border: "1px solid #3f1010",
                  color: "var(--red)", width: 32, height: 32, borderRadius: 8,
                  cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 14px 13px", borderTop: "1px solid var(--border)", paddingTop: 10, animation: "slideDown 0.2s ease" }}>
                <SessionComments ownerUid={user.uid} sessionKey={key} currentUser={user} canComment={true} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
