import { calc1RM, bestSet } from "./fitness";

/**
 * Calcula la progresión histórica de 1RM para un ejercicio.
 * Retorna array de { date, rm } ordenado por fecha.
 */
export function getProgressionHistory(logs, routine, day, exName) {
  const sessions = Object.values(logs)
    .filter(s => s.day === day)
    .sort((a, b) => a.date.localeCompare(b.date));

  const history = [];
  sessions.forEach(s => {
    const exercises = routine?.[day]?.exercises || [];
    const ei = exercises.findIndex(e => e.name === exName);
    if (ei === -1) return;
    const sets = s.sets?.[ei];
    if (!sets?.length) return;
    const best = bestSet(sets);
    if (!best) return;
    history.push({ date: s.date, rm: calc1RM(best.weight, best.reps) });
  });

  return history;
}

/**
 * Predice el 1RM futuro usando regresión lineal simple.
 * @param {Array} history - [{ date, rm }]
 * @param {number} daysAhead - cuántos días hacia el futuro predecir
 * @returns {{ slope, intercept, predictions, r2 }}
 */
export function predictRM(history, daysAhead = 90) {
  if (history.length < 2) return null;

  // Convertir fechas a días desde la primera sesión
  const t0 = new Date(history[0].date).getTime();
  const points = history.map(h => ({
    x: (new Date(h.date).getTime() - t0) / 86400000,
    y: h.rm,
  }));

  // Regresión lineal: y = slope * x + intercept
  const n     = points.length;
  const sumX  = points.reduce((a, p) => a + p.x, 0);
  const sumY  = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² — qué tan buena es la correlación
  const meanY = sumY / n;
  const ssTot = points.reduce((a, p) => a + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((a, p) => a + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2    = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generar predicciones futuras
  const lastX = points[points.length - 1].x;
  const lastDate = new Date(history[history.length - 1].date);

  const predictions = [];
  for (let d = 7; d <= daysAhead; d += 7) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + d);
    const predictedRM = Math.round(slope * (lastX + d) + intercept);
    if (predictedRM > 0) {
      predictions.push({
        date: futureDate.toISOString().split("T")[0],
        rm: predictedRM,
        label: `+${d}d`,
      });
    }
  }

  return { slope, intercept, r2: Math.max(0, r2), predictions, lastX };
}

/**
 * Dado un objetivo de peso, calcula en cuántos días llegarás.
 */
export function daysToTarget(history, targetRM) {
  const result = predictRM(history, 365);
  if (!result || result.slope <= 0) return null;

  const t0      = new Date(history[0].date).getTime();
  const lastX   = result.lastX;
  const current = result.slope * lastX + result.intercept;

  if (current >= targetRM) return 0;

  const daysNeeded = Math.ceil((targetRM - result.intercept) / result.slope);
  const targetDate = new Date(history[0].date);
  targetDate.setDate(targetDate.getDate() + daysNeeded);

  return {
    days: Math.max(0, daysNeeded - lastX),
    date: targetDate.toISOString().split("T")[0],
  };
}
