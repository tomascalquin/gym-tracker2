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
 * @param {Function} onUpdateSet   - (ei, si, field, value) => void
 * @param {Function} onToggleSet   - (ei, si) => void
 * @param {Function} onAddSet      - (ei) => void
 */
export default function ExerciseCard({
  exercise,
  exIndex,
  sets,
  completedSets,
  accent,
  dayName,
  logs,
  onUpdateSet,
  onToggleSet,
  onAddSet,
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
        <span style={{ fontSize: 13, fontWeight: 400, color: "#f1f5f9" }}>
          {exercise.name}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#2a2a3e" }}>{sets.length}s</span>
          <button
            onClick={() => setChartOpen((v) => !v)}
            className="nbtn"
            style={{
              fontSize: 9,
              color: chartOpen ? accent : "#334155",
              border: `1px solid ${chartOpen ? accent + "55" : "#1a1a2a"}`,
              padding: "3px 8px",
              borderRadius: 5,
              letterSpacing: 1,
            }}
          >
            {chartOpen ? "▲" : "▼ CHART"}
          </button>
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
          <span style={{ fontSize: 8, color: "#2a2a3e", letterSpacing: 1 }}>NOTA</span>
          <span style={{ fontSize: 8, color: "#2a2a3e", letterSpacing: 1, textAlign: "center" }}>KG</span>
          <span style={{ fontSize: 8, color: "#2a2a3e", letterSpacing: 1, textAlign: "center" }}>REPS</span>
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
          />
        ))}

        <button
          onClick={() => onAddSet(exIndex)}
          className="nbtn"
          style={{
            marginTop: 2,
            width: "100%",
            border: "1px dashed #1a1a2a",
            color: "#2a2a3e",
            padding: "5px",
            borderRadius: 6,
            fontSize: 9,
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
              fontSize: 9,
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
          />
        </div>
      )}
    </div>
  );
}
