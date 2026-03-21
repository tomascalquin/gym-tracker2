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

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "18px 1fr 68px 68px 32px 28px",
      gap: 5, alignItems: "center", marginBottom: 6,
      opacity: done ? 0.45 : 1,
      transition: "opacity 0.25s ease",
    }}>
      <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", fontWeight: 300 }}>
        {index + 1}
      </div>

      <input value={set.note || ""} onChange={e => onChange("note", e.target.value)}
        placeholder="nota..."
        onFocus={() => setFocused("note")} onBlur={() => setFocused(null)}
        style={{
          background: focused === "note" ? "var(--bg2)" : "var(--bg3)",
          border: `1px solid ${focused === "note" ? accent + "44" : "var(--border)"}`,
          color: "var(--text3)", padding: "7px 8px", borderRadius: 8,
          fontSize: 11, fontFamily: "inherit", width: "100%", outline: "none",
          transition: "all 0.15s",
        }}
      />

      <input type="number" value={set.weight}
        onChange={e => onChange("weight", parseFloat(e.target.value) || 0)}
        onFocus={() => setFocused("weight")} onBlur={() => setFocused(null)}
        style={{
          background: focused === "weight" ? "var(--bg2)" : "var(--bg3)",
          border: `1px solid ${focused === "weight" ? accent + "66" : "var(--border)"}`,
          color: accent, padding: "7px 4px", borderRadius: 8,
          fontSize: 15, fontWeight: 300, textAlign: "center",
          fontFamily: "inherit", width: "100%", outline: "none",
          transition: "all 0.15s",
          boxShadow: focused === "weight" ? `0 0 8px ${accent}22` : "none",
        }}
      />

      <input type="number" value={set.reps}
        onChange={e => onChange("reps", parseInt(e.target.value) || 0)}
        onFocus={() => setFocused("reps")} onBlur={() => setFocused(null)}
        style={{
          background: focused === "reps" ? "var(--bg2)" : "var(--bg3)",
          border: `1px solid ${focused === "reps" ? "var(--text2)" : "var(--border)"}`,
          color: "var(--text)", padding: "7px 4px", borderRadius: 8,
          fontSize: 15, fontWeight: 300, textAlign: "center",
          fontFamily: "inherit", width: "100%", outline: "none",
          transition: "all 0.15s",
        }}
      />

      {/* Check con animación bounce */}
      <button onClick={handleToggle} style={{
        width: 32, height: 32, borderRadius: 9,
        background: done ? "#14532d" : "var(--bg3)",
        border: `1.5px solid ${done ? "#22c55e" : "var(--border)"}`,
        color: done ? "#22c55e" : "var(--text3)",
        cursor: "pointer", fontSize: 14, padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit",
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: done ? "0 2px 8px #22c55e33" : "none",
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
        width: 28, height: 28, borderRadius: 7,
        background: "transparent",
        border: canDelete ? "1px solid #3f1010" : "1px solid transparent",
        color: canDelete ? "var(--red)" : "transparent",
        cursor: canDelete ? "pointer" : "default",
        fontSize: 11, padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", transition: "all 0.15s",
      }}>✕</button>
    </div>
  );
}
