/**
 * Fila de una serie dentro de un ejercicio.
 * Contiene: número de serie, nota, peso, reps, check y eliminar.
 */
export default function SetRow({ index, set, done, accent, onChange, onToggle, onDelete, canDelete }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "18px 1fr 68px 68px 24px 24px",
      gap: 5,
      alignItems: "center",
      marginBottom: 5,
      opacity: done ? 0.4 : 1,
      transition: "opacity 0.2s",
    }}>
      {/* Número */}
      <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
        {index + 1}
      </div>

      {/* Nota */}
      <input
        value={set.note || ""}
        onChange={e => onChange("note", e.target.value)}
        placeholder="—"
        style={{
          background: "#0a0a14", border: "1px solid #1a1a2a", color: "#475569",
          padding: "5px 7px", borderRadius: 5, fontSize: 13,
          fontFamily: "inherit", width: "100%", outline: "none",
        }}
      />

      {/* Peso */}
      <input
        type="number"
        value={set.weight}
        onChange={e => onChange("weight", parseFloat(e.target.value) || 0)}
        style={{
          background: "#0a0a14", border: "1px solid #1a1a2a", color: accent,
          padding: "6px 4px", borderRadius: 5, fontSize: 16, fontWeight: 500,
          textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
        }}
      />

      {/* Reps */}
      <input
        type="number"
        value={set.reps}
        onChange={e => onChange("reps", parseInt(e.target.value) || 0)}
        style={{
          background: "#0a0a14", border: "1px solid #1a1a2a", color: "#f1f5f9",
          padding: "6px 4px", borderRadius: 5, fontSize: 16, fontWeight: 500,
          textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
        }}
      />

      {/* Check */}
      <button onClick={onToggle} style={{
        width: 22, height: 22, borderRadius: 5,
        background: done ? "#14532d" : "#0e0e1a",
        border: `1px solid ${done ? "#22c55e" : "#1a1a2a"}`,
        color: done ? "#22c55e" : "#64748b",
        cursor: "pointer", fontSize: 14, padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit",
      }}>
        {done ? "✓" : "○"}
      </button>

      {/* Eliminar serie — solo si hay más de 1 */}
      <button
        onClick={onDelete}
        disabled={!canDelete}
        style={{
          width: 22, height: 22, borderRadius: 5,
          background: "transparent",
          border: `1px solid ${canDelete ? "#3f1010" : "transparent"}`,
          color: canDelete ? "#ef4444" : "transparent",
          cursor: canDelete ? "pointer" : "default",
          fontSize: 12, padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        ✕
      </button>
    </div>
  );
}
