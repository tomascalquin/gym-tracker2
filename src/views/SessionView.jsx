import { useState } from "react";
import { DAY_META } from "../data/routine";
import ExerciseCardCompact from "../components/ExerciseCardCompact";
import AddExerciseModal from "../components/AddExerciseModal";
import RestTimer from "../components/RestTimer";

export default function SessionView({
  activeDay, sessionDate, sessionData, completedSets,
  sessionNote, logs, routine, onBack, onUpdateSet,
  onToggleSet, onAddSet, onRemoveSet, onChangeNote,
  onSave, onAddExercise, onRemoveExercise,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [noteOpen, setNoteOpen]   = useState(!!sessionNote);

  const c         = DAY_META[activeDay] || { accent: "#a78bfa", dim: "#2d1f5e", tag: "DÍA" };
  const exercises = routine[activeDay]?.exercises || [];
  const totalSets = exercises.reduce((a, ex) => a + (sessionData[exercises.indexOf(ex)]?.length || ex.sets.length), 0);
  const doneSets  = Object.values(completedSets).filter(Boolean).length;
  const progress  = totalSets > 0 ? doneSets / totalSets : 0;
  const allDone   = totalSets > 0 && doneSets >= totalSets;

  async function handleSave() {
    setSaving(true);
    await onSave();
    setSaving(false);
  }

  return (
    <>
      {/* ── Header sticky glass ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(8,8,16,0.80)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        borderBottom: `1px solid ${c.accent}30`,
      }}>
        {/* Barra de progreso fina arriba del todo */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: allDone
              ? `linear-gradient(90deg, ${c.accent}, ${c.accent}cc)`
              : c.accent,
            width: `${progress * 100}%`,
            transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
            boxShadow: progress > 0 ? `0 0 12px ${c.accent}66` : "none",
          }} />
        </div>

        <div style={{ padding: "12px 18px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Back */}
            <button onClick={onBack} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(240,240,240,0.50)", fontSize: 22,
              fontFamily: "inherit", minHeight: 44, padding: "0 4px",
              display: "flex", alignItems: "center",
              WebkitTapHighlightColor: "transparent",
            }}>←</button>

            {/* Título centrado */}
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{
                fontSize: 9, letterSpacing: 3, fontWeight: 700, marginBottom: 2,
                color: c.accent,
              }}>{c.tag || "SESIÓN"}</div>
              <div style={{ fontSize: 17, color: "#fff", fontWeight: 800, letterSpacing: -0.5 }}>
                {activeDay}
              </div>
            </div>

            {/* Guardar compacto */}
            <SaveButton onClick={handleSave} saving={saving} accent={c.accent} />
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 10,
          }}>
            <div style={{
              flex: 1, height: 2,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 99, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 99,
                background: c.accent,
                width: `${progress * 100}%`,
                transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
            <div style={{ fontSize: 9, color: c.accent, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>
              {doneSets}/{totalSets} series
            </div>
            {allDone && (
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 1,
                color: "#4ade80",
                animation: "fadeIn 0.3s ease",
              }}>✓ LISTO</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ padding: "12px 16px", maxWidth: 460, margin: "0 auto" }}>

        {/* Info de sesión */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14, padding: "8px 14px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 11, color: "rgba(240,240,240,0.40)", letterSpacing: 0.5 }}>
            📅 {sessionDate}
          </div>
          <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)" }}>
            {exercises.length} ejercicios
          </div>
        </div>

        {/* Ejercicios */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
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
        </div>

        {/* Agregar ejercicio */}
        <button onClick={() => setModalOpen(true)} style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: `1px dashed rgba(255,255,255,0.15)`,
          color: "rgba(240,240,240,0.30)",
          padding: "13px",
          borderRadius: 16,
          fontSize: 10, letterSpacing: 2.5, fontWeight: 700,
          fontFamily: "inherit", cursor: "pointer", marginBottom: 10,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          WebkitTapHighlightColor: "transparent",
          transition: "all 0.15s",
        }}>
          + AGREGAR EJERCICIO
        </button>

        {/* Nota de sesión - colapsable */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setNoteOpen(v => !v)}
            style={{
              width: "100%", background: "transparent", border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 2px", cursor: "pointer", fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2.5, fontWeight: 700 }}>
              NOTA DE SESIÓN
            </div>
            <span style={{ fontSize: 14, color: "rgba(240,240,240,0.25)", transition: "transform 0.2s", display: "block", transform: noteOpen ? "rotate(180deg)" : "rotate(0)" }}>
              ˅
            </span>
          </button>
          {noteOpen && (
            <textarea
              autoFocus={!sessionNote}
              value={sessionNote}
              onChange={e => onChangeNote(e.target.value)}
              placeholder="¿Cómo fue? PR, sensaciones, notas..."
              rows={3}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(240,240,240,0.85)",
                padding: "12px 14px",
                borderRadius: 14,
                fontSize: 13, fontFamily: "inherit", outline: "none",
                lineHeight: 1.6, marginTop: 8,
                animation: "slideDown 0.18s ease",
              }}
            />
          )}
        </div>

        {/* Guardar full - destacado cuando todo listo */}
        <SaveButton onClick={handleSave} saving={saving} accent={c.accent} full allDone={allDone} />

        <div style={{ height: 100 }} />
      </div>

      {/* FAB Timer */}
      <button onClick={() => setTimerOpen(true)} style={{
        position: "fixed",
        bottom: "calc(100px + env(safe-area-inset-bottom))",
        right: 20,
        width: 52, height: 52, borderRadius: "50%", minHeight: 0,
        background: "rgba(8,8,16,0.70)",
        backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
        border: `1px solid ${c.accent}33`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${c.accent}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, cursor: "pointer", zIndex: 50,
        WebkitTapHighlightColor: "transparent",
      }}>⏱️</button>

      {timerOpen && <RestTimer onClose={() => setTimerOpen(false)} />}

      {modalOpen && (
        <AddExerciseModal
          accent={c.accent}
          onAdd={ex => { onAddExercise(activeDay, ex); setModalOpen(false); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function SaveButton({ onClick, saving, accent, full, allDone }) {
  const [pressed, setPressed] = useState(false);

  const bgActive = allDone
    ? `linear-gradient(135deg, ${accent}dd, ${accent}aa)`
    : "rgba(255,255,255,0.90)";

  return (
    <button
      onClick={onClick}
      disabled={saving}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: full ? "100%" : "auto",
        background: saving
          ? "rgba(255,255,255,0.07)"
          : pressed
            ? "rgba(255,255,255,0.75)"
            : full ? bgActive : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: saving
          ? "1px solid rgba(255,255,255,0.10)"
          : full && allDone
            ? `1px solid ${accent}88`
            : "1px solid rgba(255,255,255,0.30)",
        color: saving ? "rgba(240,240,240,0.30)" : full && allDone ? "#fff" : "#080810",
        padding: full ? "15px" : "8px 14px",
        borderRadius: full ? 18 : 12,
        cursor: saving ? "default" : "pointer",
        fontSize: 10, fontWeight: 700, letterSpacing: 2,
        fontFamily: "inherit",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.12s ease",
        minHeight: full ? 54 : 36,
        display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8,
        WebkitTapHighlightColor: "transparent",
        boxShadow: full && allDone && !saving ? `0 4px 20px ${accent}44` : "none",
      }}
    >
      {saving ? "GUARDANDO..." : full ? (allDone ? "✦ GUARDAR SESIÓN" : "GUARDAR SESIÓN") : "GUARDAR"}
    </button>
  );
}
