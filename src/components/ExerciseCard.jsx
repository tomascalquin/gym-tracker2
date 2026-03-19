import { useState } from "react";
import SetRow from "./SetRow";
import ExerciseChart from "./ExerciseChart";

/**
 * Card de un ejercicio dentro de la vista de sesión.
 * Contiene el header, filas de series, botón "+ SERIE" y gráfico colapsable.
 *
 * @param {Object}   exercise      - { name, sets } desde ROUTINE
 * @param {number}   exIndex       - Índice del ejercicio en el día
 * @param {Array}    sets          - Sets actuales del estado de sesión
 * @param {Object}   completedSets - { "ei-si": boolean }
 * @param {string}   accent        - Color hex del día
 * @param {string}   dayName       - Nombre del día para el gráfico
 * @param {Object}   logs          - Historial para el gráfico
 * @param {Object}   routine       - Rutina completa desde Firestore
 * @param {Function} onUpdateSet   - (ei, si, field, value) => void
 * @param {Function} onToggleSet   - (ei, si) => void
 * @param {Function} onAddSet      - (ei) => void
 * @param {Function} onRemoveSet  - (ei, si) => void
 * @param {boolean}  isCustom      - Si es un ejercicio agregado por el usuario
 * @param {Function} onRemove      - () => void — solo presente si isCustom
 */
export default function ExerciseCard({
  exercise,
  exIndex,
  sets,
  completedSets,
  accent,
  dayName,
  logs,
  routine,
  isCustom,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onRemoveSet,
  onRemove,
}) {
  const [chartOpen, setChartOpen] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #1a1a2a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 15, fontWeight: 400, color: "#f1f5f9" }}>
            {exercise.name}
          </span>
          {isCustom && (
            <span style={{ fontSize: 12, background: accent + "22", color: accent, padding: "2px 6px", borderRadius: 8, letterSpacing: 1 }}>
              CUSTOM
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>{sets.length}s</span>
          <button
            onClick={() => setChartOpen((v) => !v)}
            className="nbtn"
            style={{
              fontSize: 12,
              color: chartOpen ? accent : "#334155",
              border: `1px solid ${chartOpen ? accent + "55" : "#1a1a2a"}`,
              padding: "3px 8px",
              borderRadius: 5,
              letterSpacing: 1,
            }}
          >
            {chartOpen ? "▲" : "▼ CHART"}
          </button>
          {isCustom && onRemove && (
            <button
              onClick={onRemove}
              className="nbtn"
              title="Eliminar ejercicio"
              style={{
                fontSize: 13, color: "#ef4444",
                border: "1px solid #3f1010",
                width: 22, height: 22, borderRadius: 5,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Sets */}
      <div style={{ padding: "9px 14px 11px" }}>
        {/* Column labels */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "18px 1fr 68px 68px 24px",
            gap: 5,
            marginBottom: 4,
          }}
        >
          <span />
          <span style={{ fontSize: 12, color: "#64748b", letterSpacing: 1 }}>NOTA</span>
          <span style={{ fontSize: 12, color: "#64748b", letterSpacing: 1, textAlign: "center" }}>KG</span>
          <span style={{ fontSize: 12, color: "#64748b", letterSpacing: 1, textAlign: "center" }}>REPS</span>
          <span />
        </div>

        {sets.map((set, si) => (
          <SetRow
            key={si}
            index={si}
            set={set}
            done={!!completedSets[`${exIndex}-${si}`]}
            accent={accent}
            onChange={(field, val) => onUpdateSet(exIndex, si, field, val)}
            onToggle={() => onToggleSet(exIndex, si)}
            onDelete={() => onRemoveSet(exIndex, si)}
            canDelete={sets.length > 1}
          />
        ))}

        <button
          onClick={() => onAddSet(exIndex)}
          className="nbtn"
          style={{
            marginTop: 2,
            width: "100%",
            border: "1px dashed #1a1a2a",
            color: "#64748b",
            padding: "5px",
            borderRadius: 6,
            fontSize: 12,
            letterSpacing: 1,
          }}
        >
          + SERIE
        </button>
      </div>

      {/* Chart colapsable */}
      {chartOpen && (
        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid #1a1a2a",
            background: "#0b0b18",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: accent,
              marginBottom: 10,
              letterSpacing: 2,
            }}
          >
            PROGRESO · {exercise.name}
          </div>
          <ExerciseChart
            exName={exercise.name}
            dayName={dayName}
            logs={logs}
            accent={accent}
            routine={routine}
          />
        </div>
      )}
    </div>
  );
}
