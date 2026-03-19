import { useState } from "react";
import { saveFullRoutine } from "../utils/storage";
import { DAY_META } from "../data/routine";
import { tokens } from "../design";

export default function EditRoutineView({ user, routine, onBack, onRoutineUpdated }) {
  const [local, setLocal]         = useState(() => JSON.parse(JSON.stringify(routine)));
  const [activeDay, setActiveDay] = useState(Object.keys(routine)[0] || "");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [addingDay, setAddingDay]   = useState(false);

  const days     = Object.keys(local);
  const c        = DAY_META[activeDay] || { accent: "#60a5fa" };
  const exercises = local[activeDay]?.exercises || [];

  function showSaved() { setSaved(true); setTimeout(() => setSaved(false), 1800); }

  // Días
  function addDay() {
    if (!newDayName.trim() || local[newDayName.trim()]) return;
    setLocal(prev => ({ ...prev, [newDayName.trim()]: { exercises: [] } }));
    setActiveDay(newDayName.trim()); setNewDayName(""); setAddingDay(false);
  }

  function deleteDay(day) {
    if (days.length <= 1) return;
    setLocal(prev => { const n = { ...prev }; delete n[day]; return n; });
    setActiveDay(Object.keys(local).filter(d => d !== day)[0]);
  }

  function renameDay(oldName, newName) {
    if (!newName.trim() || oldName === newName.trim() || local[newName.trim()]) return;
    setLocal(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => { next[k === oldName ? newName.trim() : k] = v; });
      return next;
    });
    setActiveDay(newName.trim());
  }

  // Ejercicios
  function addExercise() {
    setLocal(prev => ({
      ...prev,
      [activeDay]: { exercises: [...(prev[activeDay]?.exercises || []), { name: "", sets: [{ weight: 0, reps: 8, note: "" }] }] }
    }));
  }

  function updateExName(ei, name) {
    setLocal(prev => { const exs = [...prev[activeDay].exercises]; exs[ei] = { ...exs[ei], name }; return { ...prev, [activeDay]: { exercises: exs } }; });
  }

  function deleteExercise(ei) {
    setLocal(prev => ({ ...prev, [activeDay]: { exercises: prev[activeDay].exercises.filter((_, i) => i !== ei) } }));
  }

  function moveExercise(ei, dir) {
    setLocal(prev => {
      const exs = [...prev[activeDay].exercises];
      const t = ei + dir;
      if (t < 0 || t >= exs.length) return prev;
      [exs[ei], exs[t]] = [exs[t], exs[ei]];
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  // Sets
  function updateSet(ei, si, field, val) {
    setLocal(prev => {
      const exs = [...prev[activeDay].exercises];
      const sets = [...exs[ei].sets];
      sets[si] = { ...sets[si], [field]: val };
      exs[ei] = { ...exs[ei], sets };
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  function addSet(ei) {
    setLocal(prev => {
      const exs = [...prev[activeDay].exercises];
      const last = exs[ei].sets[exs[ei].sets.length - 1] || { weight: 0, reps: 8 };
      exs[ei] = { ...exs[ei], sets: [...exs[ei].sets, { weight: last.weight, reps: last.reps, note: "" }] };
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  function removeSet(ei, si) {
    setLocal(prev => {
      const exs = [...prev[activeDay].exercises];
      if (exs[ei].sets.length <= 1) return prev;
      exs[ei] = { ...exs[ei], sets: exs[ei].sets.filter((_, i) => i !== si) };
      return { ...prev, [activeDay]: { exercises: exs } };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveFullRoutine(user.uid, local);
      onRoutineUpdated(local);
      showSaved();
      setTimeout(onBack, 1200);
    } catch { }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", paddingBottom: 100, fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease" }}>

      {/* Header sticky */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(8,8,16,0.95)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={onBack} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>CONFIGURACIÓN</div>
          <div style={{ fontSize: 14, color: "var(--text)" }}>Editar Rutina</div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          background: saved ? "#22c55e" : saving ? "var(--bg2)" : "#60a5fa",
          border: "none", color: saved || (!saving) ? "#000" : "var(--text3)",
          padding: "8px 16px", borderRadius: 10, cursor: saving ? "default" : "pointer",
          fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit",
          minHeight: 38, transition: "all 0.2s",
          boxShadow: saved ? "0 4px 14px #22c55e44" : saving ? "none" : "0 4px 14px #60a5fa44",
        }}>{saved ? "✓ LISTO" : saving ? "..." : "GUARDAR"}</button>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {/* Selector de días — pills */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3, marginBottom: 10 }}>DÍAS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {days.map(day => {
              const dc = DAY_META[day] || { accent: "#60a5fa" };
              return (
                <button key={day} onClick={() => setActiveDay(day)} style={{
                  background: activeDay === day ? dc.accent + "22" : "var(--bg2)",
                  border: `1px solid ${activeDay === day ? dc.accent : "var(--border)"}`,
                  color: activeDay === day ? dc.accent : "var(--text3)",
                  padding: "7px 14px", borderRadius: 99, cursor: "pointer",
                  fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
                  transition: "all 0.15s",
                  boxShadow: activeDay === day ? `0 2px 10px ${dc.accent}33` : "none",
                }}>{day}</button>
              );
            })}
            {!addingDay ? (
              <button onClick={() => setAddingDay(true)} style={{
                background: "transparent", border: "1px dashed var(--border)",
                color: "var(--text3)", padding: "7px 14px", borderRadius: 99,
                cursor: "pointer", fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
              }}>+ DÍA</button>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={newDayName} onChange={e => setNewDayName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addDay()} placeholder="Nombre" autoFocus
                  style={{
                    background: "var(--bg2)", border: "1px solid #60a5fa44", color: "var(--text)",
                    padding: "7px 12px", borderRadius: 99, fontSize: 11, fontFamily: "inherit",
                    outline: "none", width: 110,
                  }}
                />
                <button onClick={addDay} style={{
                  background: "#60a5fa", border: "none", color: "#000",
                  padding: "7px 12px", borderRadius: 99, cursor: "pointer",
                  fontSize: 10, fontWeight: 700, fontFamily: "inherit",
                }}>OK</button>
                <button onClick={() => { setAddingDay(false); setNewDayName(""); }} className="nbtn"
                  style={{ color: "var(--text3)", fontSize: 14 }}>✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Header del día activo */}
        {activeDay && (
          <div style={{
            background: "var(--bg2)", border: `1px solid ${c.accent}22`,
            borderLeft: `3px solid ${c.accent}`, borderRadius: 12,
            padding: "12px 14px", marginBottom: 12,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <DayNameEditor name={activeDay} onRename={n => renameDay(activeDay, n)} accent={c.accent} />
            <button onClick={() => deleteDay(activeDay)} disabled={days.length <= 1} style={{
              background: "transparent", border: "1px solid #3f1010",
              color: days.length <= 1 ? "var(--border)" : "var(--red)",
              padding: "6px 12px", borderRadius: 8, cursor: days.length <= 1 ? "default" : "pointer",
              fontSize: 9, letterSpacing: 1, fontFamily: "inherit", minHeight: 34,
            }}>ELIMINAR</button>
          </div>
        )}

        {/* Ejercicios */}
        {exercises.map((ex, ei) => (
          <div key={ei} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 14, marginBottom: 10, overflow: "hidden",
            animation: `slideDown 0.2s ease ${ei * 0.04}s both`,
          }}>
            {/* Header ejercicio */}
            <div style={{
              padding: "11px 14px", borderBottom: "1px solid var(--border)",
              display: "flex", gap: 8, alignItems: "center",
              background: "var(--bg3)",
            }}>
              <input value={ex.name} onChange={e => updateExName(ei, e.target.value)}
                placeholder="Nombre del ejercicio"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "var(--text)", fontSize: 14, fontFamily: "inherit",
                  outline: "none", minWidth: 0,
                }}
              />
              <button onClick={() => moveExercise(ei, -1)} disabled={ei === 0} className="nbtn" style={{
                color: ei === 0 ? "var(--border)" : "var(--text3)", fontSize: 16, padding: "0 4px",
              }}>↑</button>
              <button onClick={() => moveExercise(ei, 1)} disabled={ei === exercises.length - 1} className="nbtn" style={{
                color: ei === exercises.length - 1 ? "var(--border)" : "var(--text3)", fontSize: 16, padding: "0 4px",
              }}>↓</button>
              <button onClick={() => deleteExercise(ei)} style={{
                background: "transparent", border: "1px solid #3f1010",
                color: "var(--red)", width: 28, height: 28, borderRadius: 7,
                cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>

            {/* Sets */}
            <div style={{ padding: "10px 14px 12px" }}>
              {/* Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 28px", gap: 5, marginBottom: 6 }}>
                {["", "NOTA", "KG", "REPS", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 8, color: "var(--text3)", letterSpacing: 1, textAlign: i > 1 ? "center" : "left" }}>{h}</span>
                ))}
              </div>

              {ex.sets.map((set, si) => (
                <div key={si} style={{ display: "grid", gridTemplateColumns: "18px 1fr 60px 60px 28px", gap: 5, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "var(--text3)", textAlign: "center" }}>{si + 1}</span>
                  <input value={set.note || ""} onChange={e => updateSet(ei, si, "note", e.target.value)} placeholder="—"
                    style={{
                      background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text3)",
                      padding: "6px 8px", borderRadius: 7, fontSize: 12, fontFamily: "inherit",
                      outline: "none", width: "100%",
                    }}
                  />
                  <input type="number" value={set.weight} onChange={e => updateSet(ei, si, "weight", parseFloat(e.target.value) || 0)}
                    style={{
                      background: "var(--bg3)", border: "1px solid var(--border)", color: c.accent,
                      padding: "6px 4px", borderRadius: 7, fontSize: 14, fontWeight: 300,
                      textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                    }}
                  />
                  <input type="number" value={set.reps} onChange={e => updateSet(ei, si, "reps", parseInt(e.target.value) || 0)}
                    style={{
                      background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)",
                      padding: "6px 4px", borderRadius: 7, fontSize: 14, fontWeight: 300,
                      textAlign: "center", fontFamily: "inherit", width: "100%", outline: "none",
                    }}
                  />
                  <button onClick={() => removeSet(ei, si)} disabled={ex.sets.length <= 1} style={{
                    background: "transparent",
                    border: ex.sets.length <= 1 ? "1px solid transparent" : "1px solid #3f1010",
                    color: ex.sets.length <= 1 ? "transparent" : "var(--red)",
                    width: 28, height: 28, borderRadius: 7, cursor: ex.sets.length <= 1 ? "default" : "pointer",
                    fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit",
                  }}>✕</button>
                </div>
              ))}

              <button onClick={() => addSet(ei)} style={{
                marginTop: 4, width: "100%", background: "transparent",
                border: "1px dashed var(--border)", color: "var(--text3)",
                padding: "6px", borderRadius: 8, fontSize: 10, letterSpacing: 1,
                cursor: "pointer", fontFamily: "inherit",
              }}>+ SERIE</button>
            </div>
          </div>
        ))}

        <button onClick={addExercise} style={{
          width: "100%", background: "transparent",
          border: `1px dashed ${c.accent}55`, color: c.accent,
          padding: "13px", borderRadius: 14, fontSize: 11, letterSpacing: 2,
          cursor: "pointer", fontFamily: "inherit", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>+ AGREGAR EJERCICIO</button>

        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", padding: "14px",
          background: saved ? "#22c55e" : saving ? "var(--bg2)" : "#60a5fa",
          border: "none", borderRadius: 14, color: "#000",
          fontWeight: 700, fontSize: 11, letterSpacing: 2, fontFamily: "inherit",
          cursor: saving ? "default" : "pointer", minHeight: 52,
          boxShadow: saved ? "0 4px 20px #22c55e44" : saving ? "none" : "0 4px 20px #60a5fa44",
          transition: "all 0.2s",
        }}>{saved ? "✓ GUARDADO" : saving ? "GUARDANDO..." : "GUARDAR RUTINA"}</button>
      </div>
    </div>
  );
}

function DayNameEditor({ name, onRename, accent }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(name);

  function confirm() { onRename(val); setEditing(false); }

  if (!editing) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14, color: "var(--text)" }}>{name}</span>
      <button onClick={() => setEditing(true)} style={{
        background: accent + "22", border: `1px solid ${accent}33`,
        color: accent, padding: "4px 10px", borderRadius: 99,
        cursor: "pointer", fontSize: 9, letterSpacing: 1, fontFamily: "inherit",
      }}>RENOMBRAR</button>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && confirm()} autoFocus
        style={{
          background: "var(--bg3)", border: `1px solid ${accent}44`, color: "var(--text)",
          padding: "6px 10px", borderRadius: 8, fontSize: 13, fontFamily: "inherit",
          outline: "none", width: 130,
        }}
      />
      <button onClick={confirm} style={{
        background: accent, border: "none", color: "#000",
        padding: "6px 12px", borderRadius: 8, cursor: "pointer",
        fontSize: 10, fontWeight: 700, fontFamily: "inherit",
      }}>OK</button>
      <button onClick={() => { setVal(name); setEditing(false); }} className="nbtn"
        style={{ color: "var(--text3)", fontSize: 14 }}>✕</button>
    </div>
  );
}
