import { useState } from "react";
import { DAY_META } from "../data/routine";
import ExerciseCard from "../components/ExerciseCard";
import AddExerciseModal from "../components/AddExerciseModal";

/**
 * Vista de entrenamiento activo.
 * Permite agregar ejercicios nuevos via modal — persisten en la rutina base.
 */
export default function SessionView({
  activeDay,
  sessionDate,
  sessionData,
  completedSets,
  sessionNote,
  logs,
  routine,
  onBack,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onChangeNote,
  onSave,
  onAddExercise,
  onRemoveExercise,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const accent = DAY_META[activeDay].accent;
  const exercises = routine[activeDay]?.exercises || [];

  const progress = (() => {
    const total = exercises.reduce((a, ex) => a + ex.sets.length, 0);
    const done = Object.values(completedSets).filter(Boolean).length;
    return total ? Math.round((done / total) * 100) : 0;
  })();

  function handleAddExercise(exercise) {
    onAddExercise(activeDay, exercise);
    setModalOpen(false);
  }

  return (
    <>
      <div style={{ maxWidth: 500, margin: "0 auto", paddingBottom: 80 }}>
        {/* Sticky header */}
        <div style={{
          position: "sticky", top: 0, background: "#080810",
          borderBottom: "1px solid #1a1a2a", padding: "12px 18px", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 14, letterSpacing: 1 }}>
              ← HOME
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, color: accent, letterSpacing: 2 }}>{activeDay}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{sessionDate}</div>
            </div>
            <button onClick={onSave} style={{
              background: accent, border: "none", color: "#000",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer",
              fontSize: 13, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit",
            }}>SAVE</button>
          </div>

          <div style={{ marginTop: 8, background: "#1a1a2a", borderRadius: 3, height: 3 }}>
            <div style={{ height: 3, borderRadius: 3, background: accent, width: `${progress}%`, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 12, color: "#64748b", textAlign: "right", marginTop: 2 }}>
            {progress}% completado
          </div>
        </div>

        <div style={{ padding: "14px 18px" }}>
          {/* Nota de sesión */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, letterSpacing: 3, color: "#64748b", marginBottom: 5 }}>NOTA DE SESIÓN</div>
            <textarea
              value={sessionNote}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Sensaciones, fatiga, observaciones..."
              rows={2}
              style={{
                width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
                color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
                fontSize: 14, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>

          {/* Ejercicios */}
          {exercises.map((ex, ei) => {
            const sets = sessionData[ei] || ex.sets.map((s) => ({ weight: s.weight, reps: s.reps, note: s.note || "" }));
            return (
              <ExerciseCard
                key={`${ex.name}-${ei}`}
                exercise={ex}
                exIndex={ei}
                sets={sets}
                completedSets={completedSets}
                accent={accent}
                dayName={activeDay}
                logs={logs}
                routine={routine}
                isCustom={!!ex.custom}
                onUpdateSet={onUpdateSet}
                onToggleSet={onToggleSet}
                onAddSet={onAddSet}
                onRemove={ex.custom ? () => onRemoveExercise(activeDay, ei) : null}
              />
            );
          })}

          {/* Botón agregar ejercicio */}
          <button
            onClick={() => setModalOpen(true)}
            className="nbtn"
            style={{
              width: "100%", border: `1px dashed ${accent}55`,
              color: accent, padding: "12px", borderRadius: 10,
              fontSize: 14, letterSpacing: 2, marginBottom: 10,
            }}
          >
            + AGREGAR EJERCICIO
          </button>

          <button onClick={onSave} style={{
            width: "100%", padding: "13px", background: accent, border: "none",
            borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 15,
            letterSpacing: 2, cursor: "pointer", fontFamily: "inherit",
          }}>GUARDAR SESIÓN</button>
        </div>
      </div>

      {modalOpen && (
        <AddExerciseModal
          accent={accent}
          onAdd={handleAddExercise}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
