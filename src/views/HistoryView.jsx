import { useState, useMemo } from "react";
import { sessionVolume } from "../utils/fitness";
import { exportToExcel } from "../utils/xlsx";
import SessionComments from "../components/SessionComments";
import { tokens } from "../design";
import SwipeToDelete from "../components/SwipeToDelete";

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
      s.note?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  async function handleDelete(key) {
    setDeletingKey(key);
    setTimeout(() => { onDeleteSession(key); setDeletingKey(null); }, 300);
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1.5px solid var(--text)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} className="nbtn" style={{ color: "var(--text)", fontSize: 20, padding: "0 4px" }}>←</button>
            <div>
              <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3, fontWeight: 700 }}>REGISTRO</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -0.8 }}>Historial</div>
            </div>
          </div>
          <button onClick={() => exportToExcel(logs)} style={{
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text2)", padding: "6px 14px", borderRadius: tokens.radius.md,
            fontSize: 9, letterSpacing: 2, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer", minHeight: 36,
          }}>↓ XLSX</button>
        </div>

        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text3)" }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por día, fecha o nota..."
            style={{
              width: "100%", background: "var(--bg3)",
              border: "1px solid var(--border)",
              color: "var(--text)", padding: "10px 36px",
              borderRadius: tokens.radius.md, fontSize: 13,
              fontFamily: "inherit", outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="nbtn" style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--text3)", fontSize: 14, padding: "4px",
            }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: "0 20px 100px" }}>
        {search && (
          <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 14, letterSpacing: 2.5, fontWeight: 700, paddingTop: 16 }}>
            {sorted.length} RESULTADO{sorted.length !== 1 ? "S" : ""}
          </div>
        )}

        {!sorted.length && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600 }}>
              {search ? "Sin resultados" : "Sin sesiones aún"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>
              {search ? `No hay coincidencias con "${search}"` : "Registra tu primera sesión"}
            </div>
          </div>
        )}

        <div style={{ paddingTop: sorted.length ? 16 : 0 }}>
          {sorted.map(([key, s], i) => {
            const vol        = sessionVolume(s.sets || {}).toLocaleString();
            const done       = Object.values(s.completed || {}).filter(Boolean).length;
            const isExpanded = expandedKey === key;
            const isDeleting = deletingKey === key;

            return (
              <SwipeToDelete key={key} onDelete={() => handleDelete(key)}>
                <div style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 16, overflow: "hidden", marginBottom: 8,
                  transform: isDeleting ? "scale(0.95)" : "scale(1)",
                  opacity: isDeleting ? 0 : 1,
                  transition: "all 0.25s ease",
                  animation: `slideDown 0.2s ease ${i * 0.03}s both`,
                }}>
                  <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", letterSpacing: -0.3 }}>{s.day}</span>
                        <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{s.date}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>
                        {vol} kg · {done} sets ✓
                      </div>
                      {s.note && (
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, fontStyle: "italic" }}>
                          "{s.note.slice(0, 60)}{s.note.length > 60 ? "…" : ""}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 10 }}>
                      <button onClick={() => setExpandedKey(isExpanded ? null : key)} style={{
                        background: isExpanded ? "var(--text)" : "var(--bg3)",
                        border: "1px solid var(--border)",
                        color: isExpanded ? "var(--bg)" : "var(--text3)",
                        width: 32, height: 32, borderRadius: 8,
                        cursor: "pointer", fontSize: 14, fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>💬</button>
                      <button onClick={() => onViewSession(s.day, s.date)} style={{
                        background: "var(--text)", border: "none",
                        color: "var(--bg)", padding: "6px 12px", borderRadius: 8,
                        cursor: "pointer", fontSize: 9, letterSpacing: 2, fontWeight: 700,
                        fontFamily: "inherit", minHeight: 32,
                      }}>VER</button>
                      <button onClick={() => handleDelete(key)} style={{
                        background: "transparent", border: "1px solid var(--border)",
                        color: "var(--red)", width: 32, height: 32, borderRadius: 8,
                        cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--border)", paddingTop: 12, animation: "slideDown 0.2s ease" }}>
                      <SessionComments ownerUid={user.uid} sessionKey={key} currentUser={user} canComment />
                    </div>
                  )}
                </div>
              </SwipeToDelete>
            );
          })}
        </div>
      </div>
    </div>
  );
}
