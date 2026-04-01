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

  const c        = DAY_META[activeDay] || { accent: "#60a5fa", dim: "#1e3a5f", tag: "DÍA" };
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
      {/* Header fijo */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(8,8,16,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${c.accent}22`,
        padding: "12px 18px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(240,240,240,0.30)", fontSize: 20, display: "flex", alignItems: "center",
            gap: 6, fontFamily: "inherit", minHeight: 44, padding: "0 4px",
            WebkitTapHighlightColor: "transparent",
          }}>←</button>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: c.accent, marginBottom: 2 }}>{c.tag || "DÍA"}</div>
            <div style={{ fontSize: 16, color: "var(--text)", fontWeight: 400 }}>{activeDay}</div>
          </div>

<SaveButton onClick={handleSave} saving={saving} accent={c.accent} />
        </div>

        {/* Barra de progreso */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 1 }}>PROGRESO</span>
            <span style={{ fontSize: 9, color: c.accent }}>{doneSets}/{totalSets} series</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2, background: c.accent,
              width: `${progress}%`, transition: "width 0.4s ease",
              boxShadow: progress > 0 ? `0 0 8px ${c.accent}88` : "none",
            }} />
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "16px 18px", maxWidth: 460, margin: "0 auto" }}>
        {/* Fecha */}
        <div style={{ marginBottom: 14, fontSize: 11, color: "rgba(240,240,240,0.30)", textAlign: "center" }}>
          📅 {sessionDate}
        </div>

        {/* Ejercicios */}
        {exercises.map((ex, ei) => (
          <ExerciseCardCompact
            key={ei} exercise={ex} exIndex={ei}
            sets={sessionData[ei] || ex.sets}
            completedSets={completedSets}
            accent={c.accent}
            onUpdateSet={onUpdateSet}
            onToggleSet={onToggleSet}
            onAddSet={onAddSet}
            onRemoveSet={onRemoveSet}
          />
        ))}

        {/* Nota */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>NOTA DE SESIÓN</div>
          <textarea
            value={sessionNote}
            onChange={e => onChangeNote(e.target.value)}
            placeholder="¿Cómo fue la sesión? ¿Algo que destacar?"
            rows={2}
            style={{
              width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
              color: "var(--text)", padding: "11px 14px", borderRadius: 12,
              fontSize: 13, fontFamily: "inherit", outline: "none",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Botón agregar ejercicio */}
        <button onClick={() => setModalOpen(true)} style={{
          width: "100%", background: "transparent",
          border: `1px dashed ${c.accent}44`, color: c.accent,
          padding: "13px", borderRadius: 18,
          fontSize: 11, letterSpacing: 2, fontFamily: "inherit",
          cursor: "pointer", marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          + AGREGAR EJERCICIO
        </button>

        {/* Guardar */}
        <SaveButton onClick={handleSave} saving={saving} accent={c.accent} full />
      </div>

      {/* FAB Timer */}
      <button onClick={() => setTimerOpen(true)} style={{
        position: "fixed", bottom: "calc(72px + env(safe-area-inset-bottom))", right: 20,
        width: 54, height: 54, borderRadius: "50%",
        background: c.accent, border: "none",
        boxShadow: `0 4px 20px ${c.accent}66, 0 0 0 1px ${c.accent}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, cursor: "pointer", zIndex: 50,
        animation: "scaleIn 0.3s ease",
        WebkitTapHighlightColor: "transparent",
      }}>⏱️</button>

      {timerOpen && <RestTimer onClose={() => setTimerOpen(false)} />}

      {modalOpen && (
        <AddExerciseModal accent={c.accent}
          onAdd={ex => { onAddExercise(activeDay, ex); setModalOpen(false); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function SaveButton({ onClick, saving, accent, full }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick} disabled={saving}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{
        width: full ? "100%" : "auto",
        background: saving ? "var(--bg2)" : pressed ? accent + "dd" : accent,
        border: saving ? "1px solid var(--border)" : "none",
        color: saving ? "var(--text3)" : "#000",
        padding: full ? "14px" : "8px 16px",
        borderRadius: full ? tokens.radius.lg : tokens.radius.md,
        cursor: saving ? "default" : "pointer",
        fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        boxShadow: saving ? "none" : `0 4px 16px ${accent}44`,
        transition: "all 0.12s ease",
        minHeight: 44, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8,
        WebkitTapHighlightColor: "transparent",
      }}>
      {saving ? "GUARDANDO..." : full ? "✓ GUARDAR SESIÓN" : "GUARDAR"}
    </button>
  );
}
