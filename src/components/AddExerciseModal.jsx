import { useState } from "react";

/**
 * Modal para agregar un ejercicio nuevo al día en curso.
 * Permite definir nombre + sets base (peso/reps).
 * Los sets se pueden agregar/quitar dinámicamente.
 *
 * @param {string}   accent   - Color hex del día
 * @param {Function} onAdd    - (exercise: { name, sets }) => void
 * @param {Function} onClose  - () => void
 */
export default function AddExerciseModal({ accent, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState([{ weight: 0, reps: 8, note: "" }]);
  const [error, setError] = useState("");

  function updateSet(i, field, val) {
    setSets((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: val };
      return copy;
    });
  }

  function addSet() {
    const last = sets[sets.length - 1];
    setSets((prev) => [...prev, { weight: last.weight, reps: last.reps, note: "" }]);
  }

  function removeSet(i) {
    if (sets.length === 1) return;
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    if (!name.trim()) { setError("Ponle un nombre al ejercicio."); return; }
    onAdd({ name: name.trim(), sets });
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "#000000bb",
          zIndex: 100, backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 500, zIndex: 101,
        background: "rgba(8,8,22,0.85)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
        borderTop: `1px solid ${accent}55`, borderLeft: "1px solid rgba(255,255,255,0.10)", borderRight: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "20px 20px 0 0", padding: "20px 20px 32px",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(40px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }`}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 14, letterSpacing: 3, color: accent }}>+ NUEVO EJERCICIO</div>
          <button onClick={onClose} className="nbtn" style={{ color: "rgba(240,240,240,0.40)", fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "rgba(240,240,240,0.40)", marginBottom: 5 }}>NOMBRE</div>
          <input
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Ej: Press inclinado, Face pull..."
            style={{
              width: "100%", background: "rgba(255,255,255,0.08)", border: `1px solid ${error ? "#f87171" : "rgba(255,255,255,0.14)"}`,
              color: "#f0f0f0", padding: "10px 12px", borderRadius: 12,
              fontSize: 15, fontFamily: "inherit", outline: "none",
            }}
          />
          {error && <div style={{ fontSize: 13, color: "#ef4444", marginTop: 4 }}>{error}</div>}
        </div>

        {/* Sets base */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "rgba(240,240,240,0.40)", marginBottom: 8 }}>SETS BASE</div>

          {/* Column labels */}
          <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 72px 72px 24px", gap: 5, marginBottom: 5 }}>
            <span />
            <span style={{ fontSize: 12, color: "rgba(240,240,240,0.40)", letterSpacing: 1 }}>NOTA</span>
            <span style={{ fontSize: 12, color: "rgba(240,240,240,0.40)", letterSpacing: 1, textAlign: "center" }}>KG</span>
            <span style={{ fontSize: 12, color: "rgba(240,240,240,0.40)", letterSpacing: 1, textAlign: "center" }}>REPS</span>
            <span />
          </div>

          {sets.map((set, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "18px 1fr 72px 72px 24px", gap: 5, alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: "#334155", textAlign: "center" }}>{i + 1}</div>
              <input
                value={set.note}
                onChange={(e) => updateSet(i, "note", e.target.value)}
                placeholder="—"
                style={{
                  background: "#060610", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,240,240,0.40)",
                  padding: "5px 7px", borderRadius: 5, fontSize: 13,
                  fontFamily: "inherit", width: "100%", outline: "none",
                }}
              />
              <input
                type="number"
                value={set.weight}
                onChange={(e) => updateSet(i, "weight", parseFloat(e.target.value) || 0)}
                style={{
                  background: "#060610", border: "1px solid rgba(255,255,255,0.12)", color: accent,
                  padding: "6px 4px", borderRadius: 5, fontSize: 16, fontWeight: 500,
                  textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                }}
              />
              <input
                type="number"
                value={set.reps}
                onChange={(e) => updateSet(i, "reps", parseInt(e.target.value) || 0)}
                style={{
                  background: "#060610", border: "1px solid rgba(255,255,255,0.12)", color: "#f1f5f9",
                  padding: "6px 4px", borderRadius: 5, fontSize: 16, fontWeight: 500,
                  textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                }}
              />
              <button
                onClick={() => removeSet(i)}
                className="nbtn"
                style={{
                  width: 22, height: 22, borderRadius: 5,
                  border: "1px solid #3f1010", color: sets.length === 1 ? "#64748b" : "#ef4444",
                  fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: sets.length === 1 ? "default" : "pointer",
                }}
              >✕</button>
            </div>
          ))}

          <button onClick={addSet} className="nbtn" style={{
            marginTop: 2, width: "100%", border: "1px dashed #1a1a2a",
            color: "#334155", padding: "5px", borderRadius: 6, fontSize: 12, letterSpacing: 1,
          }}>+ SERIE</button>
        </div>

        {/* Confirmar */}
        <button onClick={handleSubmit} style={{
          width: "100%", padding: "13px", background: accent, border: "none",
          borderRadius: 10, color: "#f0f0f0", fontWeight: 700, fontSize: 15,
          letterSpacing: 2, cursor: "pointer", fontFamily: "inherit",
        }}>AGREGAR A LA RUTINA</button>
      </div>
    </>
  );
}
