/**
 * Calcula series de aproximamiento (warm-up) para un peso de trabajo.
 *
 * Protocolo estándar de powerlifting:
 * - Serie 1: 40% × 8 reps (barra / muy ligero)
 * - Serie 2: 55% × 5 reps
 * - Serie 3: 70% × 3 reps
 * - Serie 4: 85% × 1-2 reps
 * - Serie 5 (opcional): 92% × 1 rep si el peso de trabajo es > 100kg
 *
 * El objetivo es llegar al peso de trabajo con el sistema nervioso activado
 * sin acumular fatiga.
 *
 * @param {number} workingWeight - Peso de trabajo en kg
 * @param {number} workingReps   - Reps de trabajo (afecta si necesitas más aproximamiento)
 * @returns {Array<{ pct, weight, reps, note }>}
 */
export function calcWarmupSets(workingWeight, workingReps = 5) {
  if (!workingWeight || workingWeight <= 20) return [];

  const sets = [];

  // Definir porcentajes según el peso de trabajo
  let protocol;
  if (workingWeight < 60) {
    protocol = [
      { pct: 40, reps: 8 },
      { pct: 65, reps: 5 },
      { pct: 80, reps: 3 },
    ];
  } else if (workingWeight < 100) {
    protocol = [
      { pct: 40, reps: 8,  note: "barra / muy ligero" },
      { pct: 55, reps: 5 },
      { pct: 70, reps: 3 },
      { pct: 85, reps: 2 },
    ];
  } else {
    protocol = [
      { pct: 40, reps: 8,  note: "solo barra" },
      { pct: 55, reps: 5 },
      { pct: 70, reps: 3 },
      { pct: 82, reps: 2 },
      { pct: 92, reps: 1,  note: "potenciador" },
    ];
  }

  // Si las reps de trabajo son altas (≥8), reducir aproximamiento
  if (workingReps >= 8) {
    protocol = protocol.slice(0, -1); // quitar última serie
  }

  protocol.forEach(({ pct, reps, note }) => {
    const raw    = workingWeight * (pct / 100);
    const weight = roundToPlate(raw);
    if (weight >= 20) { // no sugerir menos de barra vacía
      sets.push({ pct, weight, reps, note: note || "" });
    }
  });

  return sets;
}

/**
 * Redondea al múltiplo de 2.5 más cercano (discos estándar).
 */
function roundToPlate(weight) {
  return Math.round(weight / 2.5) * 2.5;
}

/**
 * Tiempo total estimado de warm-up en minutos.
 */
export function warmupTime(sets) {
  // ~45s por serie + 60s de descanso entre series
  return Math.ceil((sets.length * 1.75));
}
