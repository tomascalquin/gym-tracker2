import { useState } from "react";
import { haptics } from "../utils/haptics";

export default function SetRow({ index, set, done, accent, onChange, onToggle, onDelete, canDelete }) {
  const [focused, setFocused]   = useState(null);
  const [checking, setChecking] = useState(false);

  function handleToggle() {
    if (!done) {
      setChecking(true);
      haptics.light();
      setTimeout(() => setChecking(false), 400);
    }
    onToggle();
  }

  const inputBase = {
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(240,240,240,0.90)",
    padding: "7px 4px", borderRadius: 10,
    fontSize: 15, fontWeight: 300, textAlign: "center",
    fontFamily: "inherit", width: "100%", outline: "none",
    transition: "all 0.15s",
  };

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "18px 1fr 68px 68px 32px 28px",
      gap: 5, alignItems: "center", marginBottom: 6,
      opacity: done ? 0.40 : 1,
      transition: "opacity 0.25s ease",
    }}>
      <div style={{ fontSize: 11, color: "rgba(240,240,240,0.25)", textAlign: "center", fontWeight: 300 }}>
        {index + 1}
      </div>

      <input value={set.note || ""} onChange={e => onChange("note", e.target.value)}
        placeholder="nota..."
        onFocus={() => setFocused("note")} onBlur={() => setFocused(null)}
        style={{
          ...inputBase,
          background: focused === "note" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${focused === "note" ? accent + "55" : "rgba(255,255,255,0.10)"}`,
          color: "rgba(240,240,240,0.40)", fontSize: 11, textAlign: "left",
          padding: "7px 8px",
        }}
      />

      <input type="number" value={set.weight}
        onChange={e => onChange("weight", parseFloat(e.target.value) || 0)}
        onFocus={() => setFocused("weight")} onBlur={() => setFocused(null)}
        style={{
          ...inputBase,
          background: focused === "weight" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${focused === "weight" ? accent + "77" : "rgba(255,255,255,0.10)"}`,
          color: accent,
          boxShadow: focused === "weight" ? `0 0 10px ${accent}22` : "none",
        }}
      />

      <input type="number" value={set.reps}
        onChange={e => onChange("reps", parseInt(e.target.value) || 0)}
        onFocus={() => setFocused("reps")} onBlur={() => setFocused(null)}
        style={{
          ...inputBase,
          background: focused === "reps" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${focused === "reps" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.10)"}`,
        }}
      />

      <button onClick={handleToggle} style={{
        width: 32, height: 32, borderRadius: 10, minHeight: 0,
        background: done ? "rgba(34,197,94,0.20)" : "rgba(255,255,255,0.07)",
        border: `1px solid ${done ? "#22c55e" : "rgba(255,255,255,0.14)"}`,
        color: done ? "#22c55e" : "rgba(240,240,240,0.30)",
        cursor: "pointer", fontSize: 14, padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit",
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: done ? "0 2px 10px rgba(34,197,94,0.25)" : "none",
        animation: checking ? "checkBounce 0.35s cubic-bezier(0.34,1.56,0.64,1)" : "none",
      }}>
        <style>{`
          @keyframes checkBounce {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.35); }
            100% { transform: scale(1); }
          }
        `}</style>
        {done ? "✓" : "○"}
      </button>

      <button onClick={() => { if (canDelete) { haptics.warning(); onDelete(); } }} disabled={!canDelete} style={{
        width: 28, height: 28, borderRadius: 7, minHeight: 0,
        background: "transparent",
        border: canDelete ? "1px solid rgba(248,113,113,0.25)" : "1px solid transparent",
        color: canDelete ? "var(--red)" : "transparent",
        cursor: canDelete ? "pointer" : "default",
        fontSize: 11, padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", transition: "all 0.15s",
      }}>✕</button>
    </div>
  );
}
