import { useState, useRef } from "react";
import { downloadRoutineTemplate, parseRoutineExcel } from "../utils/routineTemplate";
import AIRoutineBuilder from "./AIRoutineBuilder";

const SPLITS = {
  "Upper/Lower":       ["Upper A", "Lower A", "Upper B", "Lower B"],
  "PPL":               ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"],
  "Arnold Split (PPL)":["Pecho/Espalda", "Hombros/Brazos", "Piernas", "Pecho/Espalda", "Hombros/Brazos", "Piernas"],
  "Bro Split":         ["Pecho", "Espalda", "Hombros", "Bíceps/Tríceps", "Piernas"],
  "Full Body":         ["Full Body A", "Full Body B", "Full Body C"],
};

export default function OnboardingView({ user, onRoutineReady }) {
  const [step, setStep]           = useState("choose");
  const [showAI, setShowAI]         = useState(false); // choose | manual | import
  const [splitType, setSplitType] = useState(null);     // predefinido o "custom"
  const [days, setDays]           = useState([]);        // nombres de días
  const [customDayCount, setCustomDayCount] = useState(3);
  const [customDayNames, setCustomDayNames] = useState([]);
  const [routine, setRoutine]     = useState(null);      // rutina construida
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef();

  // ── Paso 1: elegir split ───────────────────────────────────────────────────
  function handleSelectSplit(split) {
    setSplitType(split);
    if (split === "custom") {
      const names = Array.from({ length: customDayCount }, (_, i) => `Día ${i + 1}`);
      setCustomDayNames(names);
    } else {
      setDays(SPLITS[split]);
    }
  }

  function handleCustomDayCount(n) {
    setCustomDayCount(n);
    setCustomDayNames(Array.from({ length: n }, (_, i) => `Día ${i + 1}`));
  }

  function confirmDays() {
    const finalDays = splitType === "custom" ? customDayNames.filter(d => d.trim()) : days;
    // Inicializar rutina vacía con esos días
    const empty = {};
    finalDays.forEach(d => { empty[d] = { exercises: [] }; });
    setRoutine(empty);
    setStep("manual");
  }

  // ── Paso 2: agregar ejercicios manualmente ─────────────────────────────────
  function addExercise(day) {
    setRoutine(prev => ({
      ...prev,
      [day]: { exercises: [...prev[day].exercises, { name: "", sets: [{ weight: 0, reps: 8, note: "" }] }] },
    }));
  }

  function updateExerciseName(day, ei, name) {
    setRoutine(prev => {
      const exs = [...prev[day].exercises];
      exs[ei] = { ...exs[ei], name };
      return { ...prev, [day]: { exercises: exs } };
    });
  }

  function addSet(day, ei) {
    setRoutine(prev => {
      const exs = [...prev[day].exercises];
      const last = exs[ei].sets[exs[ei].sets.length - 1] || { weight: 0, reps: 8 };
      exs[ei] = { ...exs[ei], sets: [...exs[ei].sets, { weight: last.weight, reps: last.reps, note: "" }] };
      return { ...prev, [day]: { exercises: exs } };
    });
  }

  function updateSet(day, ei, si, field, val) {
    setRoutine(prev => {
      const exs = [...prev[day].exercises];
      const sets = [...exs[ei].sets];
      sets[si] = { ...sets[si], [field]: val };
      exs[ei] = { ...exs[ei], sets };
      return { ...prev, [day]: { exercises: exs } };
    });
  }

  function removeExercise(day, ei) {
    setRoutine(prev => {
      const exs = prev[day].exercises.filter((_, i) => i !== ei);
      return { ...prev, [day]: { exercises: exs } };
    });
  }

  // ── Import Excel ───────────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportError("");
    try {
      const parsed = await parseRoutineExcel(file);
      setRoutine(parsed);
      setStep("preview");
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }

  // ── Guardar rutina ─────────────────────────────────────────────────────────
  async function handleSave() {
    // Limpiar ejercicios sin nombre
    const cleaned = {};
    Object.entries(routine).forEach(([day, data]) => {
      const exs = data.exercises.filter(ex => ex.name.trim());
      if (exs.length) cleaned[day] = { exercises: exs };
    });
    if (!Object.keys(cleaned).length) return;
    setSaving(true);
    onRoutineReady(cleaned);
  }

  const accent = "#60a5fa";

  // ── RENDER ─────────────────────────────────────────────────────────────────

  if (showAI) return (
    <AIRoutineBuilder
      onBack={() => setShowAI(false)}
      onRoutineReady={onRoutineReady}
    />
  );

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 18px", fontFamily: "DM Mono, monospace", minHeight: "100vh", background: "#080810" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#334155", marginBottom: 4 }}>CONFIGURACIÓN INICIAL</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f8fafc", margin: 0 }}>
          Hola, {(user.displayName || user.email).split(" ")[0]} 👋
        </h1>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Crea o importa tu rutina para empezar.</div>
      </div>

      {/* ── CHOOSE ── */}
      {step === "choose" && (
        <div>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 14 }}>¿CÓMO QUIERES ARMAR TU RUTINA?</div>

          <button onClick={() => setStep("split")} style={{
            width: "100%", background: "#0e0e1a", border: `1px solid ${accent}44`,
            borderLeft: `3px solid ${accent}`, borderRadius: 10,
            padding: "16px 18px", cursor: "pointer", textAlign: "left", marginBottom: 10,
            fontFamily: "inherit",
          }}>
            <div style={{ fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>✏️ Crear manualmente</div>
            <div style={{ fontSize: 11, color: "#475569" }}>Elige una división y agrega tus ejercicios</div>
          </button>

          <button onClick={() => setShowAI(true)} style={{
            width: "100%", background: "#0e0e1a", border: "1px solid #7c3aed44",
            borderLeft: "3px solid #7c3aed", borderRadius: 10,
            padding: "16px 18px", cursor: "pointer", textAlign: "left", marginBottom: 10,
            fontFamily: "inherit",
          }}>
            <div style={{ fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>🤖 Crear con IA</div>
            <div style={{ fontSize: 11, color: "#475569" }}>Pega tu rutina en texto y la IA la estructura</div>
          </button>

          <button onClick={() => setStep("import")} style={{
            width: "100%", background: "#0e0e1a", border: "1px solid #22c55e44",
            borderLeft: "3px solid #22c55e", borderRadius: 10,
            padding: "16px 18px", cursor: "pointer", textAlign: "left",
            fontFamily: "inherit",
          }}>
            <div style={{ fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>📊 Importar desde Excel</div>
            <div style={{ fontSize: 11, color: "#475569" }}>Descarga la plantilla, rellénala y súbela</div>
          </button>
        </div>
      )}

      {/* ── SPLIT ── */}
      {step === "split" && (
        <div>
          <button onClick={() => setStep("choose")} className="nbtn" style={{ color: "#475569", fontSize: 12, marginBottom: 16 }}>← VOLVER</button>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 14 }}>ELIGE TU DIVISIÓN</div>

          {Object.keys(SPLITS).map(split => (
            <button key={split} onClick={() => { handleSelectSplit(split); setStep("days"); }} style={{
              width: "100%", background: splitType === split ? "#1a1a2e" : "#0e0e1a",
              border: `1px solid ${splitType === split ? accent + "44" : "#1a1a2a"}`,
              borderRadius: 10, padding: "13px 16px", cursor: "pointer",
              textAlign: "left", marginBottom: 8, fontFamily: "inherit",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 14, color: "#f1f5f9" }}>{split}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{SPLITS[split].join(" · ")}</div>
              </div>
              <span style={{ color: accent }}>›</span>
            </button>
          ))}

          {/* Custom */}
          <button onClick={() => { handleSelectSplit("custom"); setStep("custom"); }} style={{
            width: "100%", background: "#0e0e1a", border: "1px solid #a78bfa44",
            borderLeft: "3px solid #a78bfa", borderRadius: 10,
            padding: "13px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          }}>
            <div style={{ fontSize: 14, color: "#f1f5f9" }}>Personalizada</div>
            <div style={{ fontSize: 11, color: "#475569" }}>Define tus propios días</div>
          </button>
        </div>
      )}

      {/* ── CUSTOM DAYS ── */}
      {step === "custom" && (
        <div>
          <button onClick={() => setStep("split")} className="nbtn" style={{ color: "#475569", fontSize: 12, marginBottom: 16 }}>← VOLVER</button>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 14 }}>CUÁNTOS DÍAS ENTRENAS</div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[2,3,4,5,6].map(n => (
              <button key={n} onClick={() => handleCustomDayCount(n)} style={{
                flex: 1, background: customDayCount === n ? "#1a1a2e" : "#0e0e1a",
                border: `1px solid ${customDayCount === n ? "#a78bfa44" : "#1a1a2a"}`,
                color: customDayCount === n ? "#a78bfa" : "#475569",
                padding: "10px", borderRadius: 8, cursor: "pointer",
                fontSize: 16, fontFamily: "inherit",
              }}>{n}</button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 10 }}>NOMBRE DE CADA DÍA</div>
          {customDayNames.map((name, i) => (
            <input key={i} value={name}
              onChange={e => {
                const updated = [...customDayNames];
                updated[i] = e.target.value;
                setCustomDayNames(updated);
              }}
              placeholder={`Día ${i + 1}`}
              style={{
                width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
                color: "#f1f5f9", padding: "10px 12px", borderRadius: 8,
                fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 8,
              }}
            />
          ))}

          <button onClick={confirmDays} style={{
            width: "100%", padding: "13px", background: "#a78bfa", border: "none",
            borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 13,
            letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", marginTop: 8,
          }}>CONTINUAR →</button>
        </div>
      )}

      {/* ── DAYS CONFIRM (splits predefinidos) ── */}
      {step === "days" && splitType && splitType !== "custom" && (
        <div>
          <button onClick={() => setStep("split")} className="nbtn" style={{ color: "#475569", fontSize: 12, marginBottom: 16 }}>← VOLVER</button>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 14 }}>TUS DÍAS ({splitType})</div>
          {SPLITS[splitType].map(d => (
            <div key={d} style={{
              background: "#0e0e1a", border: "1px solid #1a1a2a", borderLeft: `3px solid ${accent}`,
              borderRadius: 8, padding: "12px 14px", marginBottom: 8, fontSize: 13, color: "#f1f5f9",
            }}>{d}</div>
          ))}
          <button onClick={confirmDays} style={{
            width: "100%", padding: "13px", background: accent, border: "none",
            borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 13,
            letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", marginTop: 8,
          }}>AGREGAR EJERCICIOS →</button>
        </div>
      )}

      {/* ── MANUAL: agregar ejercicios ── */}
      {step === "manual" && routine && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setStep(splitType === "custom" ? "custom" : "days")} className="nbtn" style={{ color: "#475569", fontSize: 12 }}>← VOLVER</button>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2 }}>AGREGA TUS EJERCICIOS</div>
          </div>

          {Object.entries(routine).map(([day, data]) => (
            <div key={day} className="card" style={{ marginBottom: 14 }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a1a2a" }}>
                <span style={{ fontSize: 14, color: "#f1f5f9" }}>{day}</span>
              </div>
              <div style={{ padding: "10px 14px" }}>
                {data.exercises.map((ex, ei) => (
                  <div key={ei} style={{ marginBottom: 12, background: "#0a0a14", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <input value={ex.name} onChange={e => updateExerciseName(day, ei, e.target.value)}
                        placeholder="Nombre del ejercicio"
                        style={{
                          flex: 1, background: "#080810", border: "1px solid #1a1a2a",
                          color: "#f1f5f9", padding: "7px 10px", borderRadius: 6,
                          fontSize: 13, fontFamily: "inherit", outline: "none",
                        }}
                      />
                      <button onClick={() => removeExercise(day, ei)} className="nbtn" style={{
                        color: "#ef4444", border: "1px solid #3f1010",
                        padding: "5px 8px", borderRadius: 6, fontSize: 11,
                      }}>✕</button>
                    </div>

                    {/* Sets */}
                    <div style={{ display: "grid", gridTemplateColumns: "16px 60px 60px 1fr", gap: 5, marginBottom: 4 }}>
                      <span/>
                      <span style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>KG</span>
                      <span style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>REPS</span>
                      <span style={{ fontSize: 9, color: "#334155" }}>NOTA</span>
                    </div>
                    {ex.sets.map((set, si) => (
                      <div key={si} style={{ display: "grid", gridTemplateColumns: "16px 60px 60px 1fr", gap: 5, marginBottom: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>{si+1}</span>
                        <input type="number" value={set.weight} onChange={e => updateSet(day, ei, si, "weight", parseFloat(e.target.value)||0)} style={{
                          background: "#080810", border: "1px solid #1a1a2a", color: accent,
                          padding: "5px 4px", borderRadius: 5, fontSize: 13, textAlign: "center",
                          fontFamily: "inherit", outline: "none", width: "100%",
                        }}/>
                        <input type="number" value={set.reps} onChange={e => updateSet(day, ei, si, "reps", parseInt(e.target.value)||0)} style={{
                          background: "#080810", border: "1px solid #1a1a2a", color: "#f1f5f9",
                          padding: "5px 4px", borderRadius: 5, fontSize: 13, textAlign: "center",
                          fontFamily: "inherit", outline: "none", width: "100%",
                        }}/>
                        <input value={set.note||""} onChange={e => updateSet(day, ei, si, "note", e.target.value)} placeholder="—" style={{
                          background: "#080810", border: "1px solid #1a1a2a", color: "#475569",
                          padding: "5px 7px", borderRadius: 5, fontSize: 10,
                          fontFamily: "inherit", outline: "none", width: "100%",
                        }}/>
                      </div>
                    ))}
                    <button onClick={() => addSet(day, ei)} className="nbtn" style={{
                      width: "100%", border: "1px dashed #1a1a2a", color: "#334155",
                      padding: "4px", borderRadius: 5, fontSize: 10, marginTop: 2,
                    }}>+ SERIE</button>
                  </div>
                ))}

                <button onClick={() => addExercise(day)} className="nbtn" style={{
                  width: "100%", border: `1px dashed ${accent}55`, color: accent,
                  padding: "9px", borderRadius: 8, fontSize: 11, letterSpacing: 1,
                }}>+ EJERCICIO</button>
              </div>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", padding: "14px", background: saving ? "#1e3a5f" : accent,
            border: "none", borderRadius: 10, color: "#000", fontWeight: 700,
            fontSize: 13, letterSpacing: 2, cursor: saving ? "default" : "pointer",
            fontFamily: "inherit", marginTop: 4,
          }}>
            {saving ? "GUARDANDO..." : "GUARDAR RUTINA ✓"}
          </button>
        </div>
      )}

      {/* ── IMPORT ── */}
      {step === "import" && (
        <div>
          <button onClick={() => setStep("choose")} className="nbtn" style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>← VOLVER</button>

          <div className="card" style={{ padding: "18px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#f1f5f9", marginBottom: 6 }}>1. Descarga la plantilla</div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>
              Rellena con tus días, ejercicios, series, pesos y reps.
            </div>
            <button onClick={downloadRoutineTemplate} style={{
              width: "100%", background: "#14532d", border: "1px solid #22c55e",
              color: "#22c55e", padding: "10px", borderRadius: 8,
              cursor: "pointer", fontSize: 12, letterSpacing: 2, fontFamily: "inherit",
            }}>↓ DESCARGAR PLANTILLA</button>
          </div>

          <div className="card" style={{ padding: "18px" }}>
            <div style={{ fontSize: 13, color: "#f1f5f9", marginBottom: 6 }}>2. Sube tu archivo</div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>
              Sube el Excel con tu rutina completada.
            </div>

            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange}
              style={{ display: "none" }} />

            <button onClick={() => fileRef.current.click()} disabled={importing} style={{
              width: "100%", background: importing ? "#1e3a5f" : "#0e0e1a",
              border: `1px solid ${accent}44`, color: accent,
              padding: "10px", borderRadius: 8, cursor: importing ? "default" : "pointer",
              fontSize: 12, letterSpacing: 2, fontFamily: "inherit",
            }}>
              {importing ? "LEYENDO ARCHIVO..." : "📂 SUBIR EXCEL"}
            </button>

            {importError && (
              <div style={{ color: "#ef4444", fontSize: 12, marginTop: 10 }}>{importError}</div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW (después de importar) ── */}
      {step === "preview" && routine && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => { setStep("import"); setRoutine(null); }} className="nbtn" style={{ color: "#475569", fontSize: 12 }}>← VOLVER</button>
            <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: 2 }}>✓ ARCHIVO LEÍDO</div>
          </div>

          <div style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>
            Revisa tu rutina antes de guardar:
          </div>

          {Object.entries(routine).map(([day, data]) => (
            <div key={day} className="card" style={{ marginBottom: 10, borderLeft: "3px solid #22c55e" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a1a2a", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#f1f5f9" }}>{day}</span>
                <span style={{ fontSize: 11, color: "#22c55e" }}>{data.exercises.length} ejercicios</span>
              </div>
              <div style={{ padding: "10px 14px" }}>
                {data.exercises.map((ex, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 3 }}>{ex.name}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {ex.sets.map((set, si) => (
                        <span key={si} style={{
                          fontSize: 10, background: "#1a1a2e", color: "#60a5fa",
                          padding: "2px 8px", borderRadius: 6,
                        }}>
                          {set.weight}kg × {set.reps}{set.note ? ` (${set.note})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", padding: "14px", background: saving ? "#14532d" : "#22c55e",
            border: "none", borderRadius: 10, color: "#000", fontWeight: 700,
            fontSize: 13, letterSpacing: 2, cursor: saving ? "default" : "pointer",
            fontFamily: "inherit", marginTop: 4,
          }}>
            {saving ? "GUARDANDO..." : "GUARDAR RUTINA ✓"}
          </button>
        </div>
      )}
    </div>
  );
}
