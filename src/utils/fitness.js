/**
 * Utilidades de cálculo de fitness.
 */

/**
 * 1RM estimado con fórmula de Epley.
 * @param {number} weight - Peso en kg
 * @param {number} reps   - Repeticiones
 * @returns {number}
 */
export function calc1RM(weight, reps) {
  return reps === 1 ? weight : Math.round(weight * (1 + reps / 30));
}

/**
 * Volumen total de una sesión (suma de peso × reps por set).
 * @param {Object} sets - { [exIdx]: Array<{ weight, reps }> }
 * @returns {number}
 */
export function sessionVolume(sets) {
  return Object.values(sets)
    .flat()
    .reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);
}

/**
 * Mejor set de un array de sets (mayor 1RM estimado).
 * @param {Array<{ weight, reps }>} sets
 * @returns {{ weight, reps } | null}
 */
export function bestSet(sets) {
  if (!sets?.length) return null;
  return sets.reduce(
    (best, s) => (calc1RM(s.weight, s.reps) > calc1RM(best.weight, best.reps) ? s : best),
    sets[0]
  );
}

/**
 * Número de semana ISO del año actual.
 * @returns {number}
 */
export function getWeekNumber() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}
