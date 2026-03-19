import { useState } from "react";
import { saveFullRoutine } from "../utils/storage";
import { DAY_META } from "../data/routine";

export default function EditRoutineView({ user, routine, onBack, onRoutineUpdated }) {
  const [local, setLocal]         = useState(() => JSON.parse(JSON.stringify(routine)));
  const [activeDay, setActiveDay] = useState(Object.keys(routine)[0] || "");
  const [saving, setSaving]       = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [addingDay, setAddingDay] = useState(false);
  const [toast, setToast]         = useState("");

  const days = Object.keys(local);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  // ── Días ──────────────────────────────────────────────────────────────────
  function addDay() {
    if (!newDayName.trim()) return;
    if (local[newDayName.trim()]) { showToast("Ese día ya existe."); return; }
    setLocal(prev => ({ ...prev, [newDayName.trim()]: { exercises: [] } }));
    setActiveDay(newDayName.trim());
    setNewDayName("");
    setAddingDay(false);
  }

  function deleteDay(day) {
    if (days.length <= 1) { showToast("Necesitas al menos un día."); return; }
    setLocal(prev => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
    setActiveDay(Object.keys(local).filter(d => d !== day)[0]);
  }

  function renameDay(oldName, newName) {
    if (!newName.trim() || oldName === newName.trim()) return;
    if (local[newName.trim()]) { showToast("Ese nombre ya existe."); return; }
    setLocal(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[k === oldName ? newName.trim() : k] = v;
      });
      return next;
    });
    setActiveDay(newName.trim());
  }

  // ── Ejercicios ─────────────────────────────────────────────────────────────
  function addExercise() {
    setLocal(prev => ({
      ...prev,
      [activeDay]: {
        exercises: [...(prev[activeDay]?.exercises || []),
          { name: "", sets: [{ weight: 0, reps: 8, note: "" }] }
        ]
      }
    }));
  }

  function updateExName(ei, name) {
    setLocal(prev => {
      const exs = [...prev[activeDay].exercises];
      exs[ei] = { ...exs[ei], name };
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  function deleteExercise(ei) {
    setLocal(prev => {
      const exs = prev[activeDay].exercises.filter((_, i) => i !== ei);
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  function moveExercise(ei, dir) {
    setLocal(prev => {
      const exs = [...prev[activeDay].exercises];
      const target = ei + dir;
      if (target < 0 || target >= exs.length) return prev;
      [exs[ei], exs[target]] = [exs[target], exs[ei]];
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  // ── Sets ───────────────────────────────────────────────────────────────────
  function updateSet(ei, si, field, val) {
    setLocal(prev => {
      const exs  = [...prev[activeDay].exercises];
      const sets = [...exs[ei].sets];
      sets[si]   = { ...sets[si], [field]: val };
      exs[ei]    = { ...exs[ei], sets };
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  function addSet(ei) {
    setLocal(prev => {
      const exs  = [...prev[activeDay].exercises];
      const last = exs[ei].sets[exs[ei].sets.length - 1] || { weight: 0, reps: 8 };
      exs[ei]    = { ...exs[ei], sets: [...exs[ei].sets, { weight: last.weight, reps: last.reps, note: "" }] };
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  function removeSet(ei, si) {
    setLocal(prev => {
      const exs  = [...prev[activeDay].exercises];
      if (exs[ei].sets.length <= 1) return prev;
      exs[ei]    = { ...exs[ei], sets: exs[ei].sets.filter((_, i) => i !== si) };
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  // ── Guardar ────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      await saveFullRoutine(user.uid, local);
      onRoutineUpdated(local);
      showToast("Rutina guardada ✓");
      setTimeout(onBack, 1200);
    } catch { showToast("Error al guardar."); }
    finally { setSaving(false); }
  }

  const accent     = DAY_META[activeDay]?.accent || "#60a5fa";
  const exercises  = local[activeDay]?.exercises || [];

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", paddingBottom: 80, fontFamily: "DM Mono, monospace" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
          background: "#14532d", border: "1px solid #22c55e", color: "#fff",
          padding: "8px 18px", borderRadius: 8, fontSize: 12, zIndex: 999,
          animation: "slideDown 0.2s ease", whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, background: "#080810",
        borderBottom: "1px solid #1a1a2a", padding: "12px 18px", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 13 }}>← HOME</button>
        <div style={{ fontSize: 13, color: "#f1f5f9", letterSpacing: 2 }}>EDITAR RUTINA</div>
        <button onClick={handleSave} disabled={saving} style={{
          background: saving ? "#1e3a5f" : "#60a5fa", border: "none", color: "#000",
          padding: "6px 14px", borderRadius: 6, cursor: saving ? "default" : "pointer",
          fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit",
        }}>{saving ? "..." : "GUARDAR"}</button>
      </div>

      <div style={{ padding: "14px 18px" }}>

        {/* Selector de días */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 8 }}>DÍAS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {days.map(day => {
              const c = DAY_META[day] || { accent: "#60a5fa" };
              const active = activeDay === day;
              return (
                <button key={day} onClick={() => setActiveDay(day)} style={{
                  background: active ? c.accent + "22" : "#0e0e1a",
                  border: `1px solid ${active ? c.accent : "#1a1a2a"}`,
                  color: active ? c.accent : "#475569",
                  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  fontSize: 12, fontFamily: "inherit",
                }}>{day}</button>
              );
            })}
            {/* Agregar día */}
            {!addingDay ? (
              <button onClick={() => setAddingDay(true)} className="nbtn" style={{
                border: "1px dashed #1a1a2a", color: "#475569",
                padding: "6px 12px", borderRadius: 8, fontSize: 12,
              }}>+ DÍA</button>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={newDayName} onChange={e => setNewDayName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addDay()}
                  placeholder="Nombre del día" autoFocus
                  style={{
                    background: "#0e0e1a", border: "1px solid #60a5fa44", color: "#f1f5f9",
                    padding: "6px 10px", borderRadius: 8, fontSize: 12,
                    fontFamily: "inherit", outline: "none", width: 130,
                  }}
                />
                <button onClick={addDay} style={{
                  background: "#60a5fa", border: "none", color: "#000",
                  padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                }}>OK</button>
                <button onClick={() => { setAddingDay(false); setNewDayName(""); }} className="nbtn" style={{
                  color: "#475569", fontSize: 13,
                }}>✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Editor del día activo */}
        {activeDay && (
          <div>
            {/* Header del día */}
            <div className="card" style={{ padding: "12px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <DayNameEditor name={activeDay} onRename={newName => renameDay(activeDay, newName)} accent={accent} />
              <button onClick={() => deleteDay(activeDay)} className="nbtn" style={{
                border: "1px solid #3f1010", color: "#ef4444",
                padding: "5px 10px", borderRadius: 6, fontSize: 11,
              }}>ELIMINAR DÍA</button>
            </div>

            {/* Ejercicios */}
            {exercises.map((ex, ei) => (
              <div key={ei} className="card" style={{ marginBottom: 10 }}>
                {/* Header ejercicio */}
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a1a2a", display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={ex.name}
                    onChange={e => updateExName(ei, e.target.value)}
                    placeholder="Nombre del ejercicio"
                    style={{
                      flex: 1, background: "#0a0a14", border: "1px solid #1a1a2a",
                      color: "#f1f5f9", padding: "7px 10px", borderRadius: 6,
                      fontSize: 13, fontFamily: "inherit", outline: "none",
                    }}
                  />
                  {/* Mover arriba/abajo */}
                  <button onClick={() => moveExercise(ei, -1)} disabled={ei === 0} className="nbtn" style={{
                    color: ei === 0 ? "#1a1a2a" : "#475569", fontSize: 14,
                  }}>↑</button>
                  <button onClick={() => moveExercise(ei, 1)} disabled={ei === exercises.length - 1} className="nbtn" style={{
                    color: ei === exercises.length - 1 ? "#1a1a2a" : "#475569", fontSize: 14,
                  }}>↓</button>
                  <button onClick={() => deleteExercise(ei)} className="nbtn" style={{
                    color: "#ef4444", border: "1px solid #3f1010",
                    padding: "4px 8px", borderRadius: 5, fontSize: 11,
                  }}>✕</button>
                </div>

                {/* Sets */}
                <div style={{ padding: "9px 14px 11px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "18px 64px 64px 1fr 22px", gap: 5, marginBottom: 5 }}>
                    <span />
                    <span style={{ fontSize: 9, color: "#475569", textAlign: "center", letterSpacing: 1 }}>KG</span>
                    <span style={{ fontSize: 9, color: "#475569", textAlign: "center", letterSpacing: 1 }}>REPS</span>
                    <span style={{ fontSize: 9, color: "#475569", letterSpacing: 1 }}>NOTA</span>
                    <span />
                  </div>
                  {ex.sets.map((set, si) => (
                    <div key={si} style={{ display: "grid", gridTemplateColumns: "18px 64px 64px 1fr 22px", gap: 5, alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>{si + 1}</span>
                      <input type="number" value={set.weight} onChange={e => updateSet(ei, si, "weight", parseFloat(e.target.value) || 0)} style={{
                        background: "#0a0a14", border: "1px solid #1a1a2a", color: accent,
                        padding: "5px 4px", borderRadius: 5, fontSize: 13, fontWeight: 500,
                        textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                      }} />
                      <input type="number" value={set.reps} onChange={e => updateSet(ei, si, "reps", parseInt(e.target.value) || 0)} style={{
                        background: "#0a0a14", border: "1px solid #1a1a2a", color: "#f1f5f9",
                        padding: "5px 4px", borderRadius: 5, fontSize: 13, fontWeight: 500,
                        textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                      }} />
                      <input value={set.note || ""} onChange={e => updateSet(ei, si, "note", e.target.value)} placeholder="—" style={{
                        background: "#0a0a14", border: "1px solid #1a1a2a", color: "#475569",
                        padding: "5px 7px", borderRadius: 5, fontSize: 11,
                        fontFamily: "inherit", width: "100%", outline: "none",
                      }} />
                      <button onClick={() => removeSet(ei, si)} disabled={ex.sets.length <= 1} className="nbtn" style={{
                        color: ex.sets.length <= 1 ? "#1a1a2a" : "#ef4444",
                        border: `1px solid ${ex.sets.length <= 1 ? "transparent" : "#3f1010"}`,
                        width: 22, height: 22, borderRadius: 5, fontSize: 11,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addSet(ei)} className="nbtn" style={{
                    marginTop: 2, width: "100%", border: "1px dashed #1a1a2a",
                    color: "#334155", padding: "5px", borderRadius: 6, fontSize: 10,
                  }}>+ SERIE</button>
                </div>
              </div>
            ))}

            <button onClick={addExercise} className="nbtn" style={{
              width: "100%", border: `1px dashed ${accent}55`, color: accent,
              padding: "12px", borderRadius: 10, fontSize: 12, letterSpacing: 2,
              marginBottom: 12,
            }}>+ EJERCICIO</button>

            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "13px", background: saving ? "#1e3a5f" : accent,
              border: "none", borderRadius: 10, color: "#000", fontWeight: 700,
              fontSize: 13, letterSpacing: 2, cursor: saving ? "default" : "pointer",
              fontFamily: "inherit",
            }}>{saving ? "GUARDANDO..." : "GUARDAR RUTINA ✓"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Input inline para renombrar el día
function DayNameEditor({ name, onRename, accent }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(name);

  function confirm() {
    onRename(val);
    setEditing(false);
  }

  if (!editing) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14, color: "#f1f5f9" }}>{name}</span>
      <button onClick={() => setEditing(true)} className="nbtn" style={{
        fontSize: 10, color: accent, border: `1px solid ${accent}44`,
        padding: "2px 8px", borderRadius: 5, letterSpacing: 1,
      }}>RENOMBRAR</button>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && confirm()} autoFocus
        style={{
          background: "#0a0a14", border: `1px solid ${accent}44`, color: "#f1f5f9",
          padding: "5px 10px", borderRadius: 6, fontSize: 13,
          fontFamily: "inherit", outline: "none", width: 140,
        }}
      />
      <button onClick={confirm} style={{
        background: accent, border: "none", color: "#000",
        padding: "5px 10px", borderRadius: 6, cursor: "pointer",
        fontSize: 11, fontWeight: 700, fontFamily: "inherit",
      }}>OK</button>
      <button onClick={() => { setVal(name); setEditing(false); }} className="nbtn" style={{ color: "#475569", fontSize: 13 }}>✕</button>
    </div>
  );
}
