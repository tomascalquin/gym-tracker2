import { useState } from "react";
import { DAY_META } from "../data/routine";
import ExerciseCardCompact from "../components/ExerciseCardCompact";
import AddExerciseModal from "../components/AddExerciseModal";
import RestTimer from "../components/RestTimer";
import { tokens } from "../design";

export default function SessionView({
  activeDay, sessionDate, sessionData, completedSets,
  sessionNote, logs, routine, onBack, onUpdateSet,
  onToggleSet, onAddSet, onRemoveSet, onChangeNote,
  onSave, onAddExercise, onRemoveExercise,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [saving, setSaving]       = useState(false);

  const exercises = routine[activeDay]?.exercises || [];
  const totalSets = exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const doneSets  = Object.values(completedSets).filter(Boolean).length;
  const progress  = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  async function handleSave() {
    setSaving(true);
    await onSave();
    setSaving(false);
  }

  return (
    <>
      {/* ── Header sticky editorial ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(8,8,16,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--glass-border)",
        padding: "14px 20px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text)", fontSize: 20,
            fontFamily: "inherit", minHeight: 44, padding: "0 4px",
            WebkitTapHighlightColor: "transparent",
          }}>←</button>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 2 }}>SESIÓN</div>
            <div style={{ fontSize: 16, color: "var(--text)", fontWeight: 800, letterSpacing: -0.3 }}>{activeDay}</div>
          </div>

          <SaveButton onClick={handleSave} saving={saving} />
        </div>

        {/* Barra de progreso — blanca sobre crema */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: "rgba(255,255,255,0.80)",
              width: `${progress}%`, transition: "width 0.4s ease",
              borderRadius: 2,
            }} />
          </div>
          <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>
            {doneSets}/{totalSets}
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ padding: "16px 20px", maxWidth: 460, margin: "0 auto" }}>

        {/* Fecha pequeña */}
        <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", textAlign: "center", marginBottom: 16, letterSpacing: 1 }}>
          {sessionDate}
        </div>

        {/* Ejercicios */}
        {exercises.map((ex, ei) => (
          <ExerciseCardCompact
            key={ei} exercise={ex} exIndex={ei}
            sets={sessionData[ei] || ex.sets}
            completedSets={completedSets}
            accent="var(--text)"
            onUpdateSet={onUpdateSet}
            onToggleSet={onToggleSet}
            onAddSet={onAddSet}
            onRemoveSet={onRemoveSet}
          />
        ))}

        {/* Nota de sesión */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 8 }}>
            NOTA DE SESIÓN
          </div>
          <textarea
            value={sessionNote}
            onChange={e => onChangeNote(e.target.value)}
            placeholder="¿Cómo fue la sesión?"
            rows={2}
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              color: "var(--text)", padding: "11px 14px",
              borderRadius: 12,
              fontSize: 13, fontFamily: "inherit", outline: "none",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Agregar ejercicio */}
        <button onClick={() => setModalOpen(true)} style={{
          width: "100%", background: "transparent",
          border: "1.5px dashed var(--border)", color: "rgba(240,240,240,0.30)",
          padding: "13px", borderRadius: 18,
          fontSize: 10, letterSpacing: 2.5, fontWeight: 700,
          fontFamily: "inherit", cursor: "pointer", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          + AGREGAR EJERCICIO
        </button>

        {/* Guardar full */}
        <SaveButton onClick={handleSave} saving={saving} full />
      </div>

      {/* FAB Timer */}
      <button onClick={() => setTimerOpen(true)} style={{
        position: "fixed",
        bottom: "calc(72px + env(safe-area-inset-bottom))",
        right: 20,
        width: 52, height: 52, borderRadius: "50%",
        background: "rgba(8,8,16,0.70)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, cursor: "pointer", zIndex: 50,
        WebkitTapHighlightColor: "transparent",
      }}>⏱️</button>

      {timerOpen && <RestTimer onClose={() => setTimerOpen(false)} />}

      {modalOpen && (
        <AddExerciseModal
          accent="var(--text)"
          onAdd={ex => { onAddExercise(activeDay, ex); setModalOpen(false); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function SaveButton({ onClick, saving, full }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={saving}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: full ? "100%" : "auto",
        background: saving ? "rgba(255,255,255,0.07)" : pressed ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.30)",
        color: saving ? "rgba(240,240,240,0.30)" : "#080810",
        padding: full ? "14px" : "9px 16px",
        borderRadius: full ? tokens.radius.lg : tokens.radius.md,
        cursor: saving ? "default" : "pointer",
        fontSize: 10, fontWeight: 700, letterSpacing: 2,
        fontFamily: "inherit",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.12s ease",
        minHeight: full ? 50 : 38,
        display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {saving ? "GUARDANDO..." : full ? "✓ GUARDAR SESIÓN" : "GUARDAR"}
    </button>
  );
}
