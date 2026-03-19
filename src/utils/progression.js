import { calc1RM, bestSet } from "./fitness";

/**
 * DOBLE PROGRESIÓN
 * El usuario trabaja dentro de un rango de reps (ej: 8-12).
 * Cuando llega al techo del rango en todas las series → sube peso.
 * Cuando sube peso → vuelve al piso del rango.
 *
 * @param {number} currentWeight - Peso actual
 * @param {number} currentReps   - Reps actuales (mejor serie)
 * @param {number} repFloor      - Piso del rango (ej: 8)
 * @param {number} repCeiling    - Techo del rango (ej: 12)
 * @param {number} increment     - Incremento de peso (ej: 2.5)
 */
export function calcDoubleProgression(currentWeight, currentReps, repFloor, repCeiling, increment = 2.5) {
  const reachedCeiling = currentReps >= repCeiling;

  if (reachedCeiling) {
    const newWeight = currentWeight + increment;
    return {
      type: "SUBIR PESO",
      action: "up",
      message: `¡Llegaste al techo! Sube a ${newWeight}kg y vuelve a ${repFloor} reps`,
      nextWeight: newWeight,
      nextReps: repFloor,
      increment,
      progress: 100,
    };
  }

  const repsToGo  = repCeiling - currentReps;
  const progress  = Math.round(((currentReps - repFloor) / (repCeiling - repFloor)) * 100);

  return {
    type: "MANTENER PESO",
    action: "maintain",
    message: `Intenta llegar a ${repCeiling} reps. Te faltan ${repsToGo} rep${repsToGo > 1 ? "s" : ""}`,
    nextWeight: currentWeight,
    nextReps: currentReps + 1,
    repsToGo,
    progress: Math.max(0, progress),
  };
}

/**
 * PROGRESIÓN LINEAL
 * Sube el peso una cantidad fija cada sesión o cada N sesiones.
 * Si falla las reps objetivo → deload (bajar peso).
 *
 * @param {number} currentWeight  - Peso actual
 * @param {number} currentReps    - Reps logradas
 * @param {number} targetReps     - Reps objetivo
 * @param {number} increment      - Cuánto sube cada vez
 * @param {number} failCount      - Cuántas veces consecutivas falló
 */
export function calcLinearProgression(currentWeight, currentReps, targetReps, increment = 2.5, failCount = 0) {
  const succeeded = currentReps >= targetReps;

  if (failCount >= 3) {
    // Deload después de 3 fallos consecutivos
    const deloadWeight = Math.round((currentWeight * 0.9) / 2.5) * 2.5;
    return {
      type: "DELOAD",
      action: "deload",
      message: `3 fallos consecutivos. Deload a ${deloadWeight}kg para recuperar`,
      nextWeight: deloadWeight,
      nextReps: targetReps,
      color: "#ef4444",
    };
  }

  if (succeeded) {
    const newWeight = currentWeight + increment;
    return {
      type: "SUBIR PESO",
      action: "up",
      message: `¡Completaste ${targetReps} reps! Sube a ${newWeight}kg la próxima sesión`,
      nextWeight: newWeight,
      nextReps: targetReps,
      increment,
      color: "#22c55e",
    };
  }

  return {
    type: "REPETIR PESO",
    action: "repeat",
    message: `No llegaste a ${targetReps} reps. Repite ${currentWeight}kg hasta lograrlo`,
    nextWeight: currentWeight,
    nextReps: targetReps,
    failCount: failCount + 1,
    color: "#f59e0b",
  };
}

/**
 * Analiza el historial de un ejercicio y sugiere la progresión.
 * Detecta automáticamente si está estancado.
 */
export function analyzeProgression(logs, routine, day, exName) {
  const exercises = routine?.[day]?.exercises || [];
  const ei = exercises.findIndex(e => e.name === exName);
  if (ei === -1) return null;

  const sessions = Object.values(logs)
    .filter(s => s.day === day && s.sets?.[ei]?.length)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5); // últimas 5 sesiones

  if (sessions.length < 2) return null;

  const history = sessions.map(s => {
    const b = bestSet(s.sets[ei]);
    return b ? { date: s.date, weight: b.weight, reps: b.reps, rm: calc1RM(b.weight, b.reps) } : null;
  }).filter(Boolean);

  if (history.length < 2) return null;

  const last    = history[history.length - 1];
  const prev    = history[history.length - 2];
  const oldest  = history[0];

  // ¿Está estancado? Mismo peso en las últimas 3+ sesiones
  const lastThree = history.slice(-3);
  const stagnant  = lastThree.length >= 3 && lastThree.every(h => h.weight === lastThree[0].weight);

  // Tendencia de 1RM
  const rmGain    = last.rm - oldest.rm;
  const sessions_ = history.length - 1;
  const rmPerSession = sessions_ > 0 ? (rmGain / sessions_).toFixed(1) : 0;

  return {
    last, prev, history,
    stagnant,
    rmGain,
    rmPerSession,
    trend: rmGain > 0 ? "up" : rmGain < 0 ? "down" : "flat",
  };
}
