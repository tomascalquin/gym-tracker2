import { ROUTINE, DAY_META } from "../data/routine";
import ExerciseCard from "../components/ExerciseCard";

/**
 * Vista de entrenamiento activo.
 * Muestra la nota de sesión, los ejercicios del día y el botón de guardar.
 */
export default function SessionView({
  activeDay,
  sessionDate,
  sessionData,
  completedSets,
  sessionNote,
  logs,
  onBack,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onChangeNote,
  onSave,
}) {
  const accent = DAY_META[activeDay].accent;

  const progress = (() => {
    const total = ROUTINE[activeDay].exercises.reduce((a, ex) => a + ex.sets.length, 0);
    const done = Object.values(completedSets).filter(Boolean).length;
    return total ? Math.round((done / total) * 100) : 0;
  })();

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", paddingBottom: 80 }}>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky", top: 0, background: "#080810",
          borderBottom: "1px solid #1a1a2a", padding: "12px 18px", zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onBack} className="nbtn" style={{ color: "#475569", fontSize: 11, letterSpacing: 1 }}>
            ← HOME
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: accent, letterSpacing: 2 }}>{activeDay}</div>
            <div style={{ fontSize: 9, color: "#2a2a3e" }}>{sessionDate}</div>
          </div>
          <button
            onClick={onSave}
            style={{
              background: accent, border: "none", color: "#000",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer",
              fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit",
            }}
          >
            SAVE
          </button>
        </div>

        {/* Barra de progreso */}
        <div style={{ marginTop: 8, background: "#1a1a2a", borderRadius: 3, height: 3 }}>
          <div style={{ height: 3, borderRadius: 3, background: accent, width: `${progress}%`, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontSize: 9, color: "#2a2a3e", textAlign: "right", marginTop: 2 }}>
          {progress}% completado
        </div>
      </div>

      <div style={{ padding: "14px 18px" }}>
        {/* Nota de sesión */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#2a2a3e", marginBottom: 5 }}>NOTA DE SESIÓN</div>
          <textarea
            value={sessionNote}
            onChange={(e) => onChangeNote(e.target.value)}
            placeholder="Sensaciones, fatiga, observaciones..."
            rows={2}
            style={{
              width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
              color: "#94a3b8", padding: "9px 12px", borderRadius: 8,
              fontSize: 11, fontFamily: "inherit", outline: "none",
            }}
          />
        </div>

        {/* Ejercicios */}
        {ROUTINE[activeDay].exercises.map((ex, ei) => {
          const sets = sessionData[ei] || ex.sets.map((s) => ({ weight: s.weight, reps: s.reps, note: s.note || "" }));
          return (
            <ExerciseCard
              key={ei}
              exercise={ex}
              exIndex={ei}
              sets={sets}
              completedSets={completedSets}
              accent={accent}
              dayName={activeDay}
              logs={logs}
              onUpdateSet={onUpdateSet}
              onToggleSet={onToggleSet}
              onAddSet={onAddSet}
            />
          );
        })}

        <button
          onClick={onSave}
          style={{
            width: "100%", padding: "13px", background: accent, border: "none",
            borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 12,
            letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", marginTop: 4,
          }}
        >
          GUARDAR SESIÓN
        </button>
      </div>
    </div>
  );
}
