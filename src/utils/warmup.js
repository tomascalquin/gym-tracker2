import { calc1RM } from "./fitness";

/**
 * Calcula series de aproximamiento inteligentes.
 *
 * Lógica:
 * - Estima el 1RM a partir del peso y reps de trabajo
 * - Si el peso de trabajo es < 60% del 1RM → no aplica warm-up (ya es ligero)
 * - Si el peso es 60-75% → 2 series de activación
 * - Si el peso es > 75% → protocolo completo 3-4 series
 * - La última serie de aproximamiento NUNCA supera el peso de trabajo
 */
export function calcWarmup(workingWeight, workingReps) {
  if (!workingWeight || workingWeight <= 0) return [];

  // 1RM estimado
  const est1RM = workingReps === 1
    ? workingWeight
    : Math.round(calc1RM(workingWeight, workingReps));

  if (est1RM <= 0) return [];

  // Intensidad relativa del peso de trabajo
  const intensity = workingWeight / est1RM;

  // Si ya está trabajando liviano (< 60% 1RM) → no acumula fatiga, sin warm-up
  if (intensity < 0.60) return [];

  // Peso mínimo útil para aproximamiento (barra vacía = 20kg)
  const minWeight = 20;

  let protocol;

  if (intensity < 0.75) {
    // Zona moderada: solo 1 serie de activación neural
    protocol = [
      { pct: 0.50, reps: 8, label: "Activación" },
    ];
  } else if (intensity < 0.85) {
    // Zona hipertrofia alta: 2 series
    protocol = [
      { pct: 0.45, reps: 8, label: "Activación" },
      { pct: 0.65, reps: 5, label: "Técnica" },
    ];
  } else if (intensity < 0.93) {
    // Zona fuerza: 3 series
    protocol = [
      { pct: 0.40, reps: 8, label: "Activación" },
      { pct: 0.60, reps: 5, label: "Técnica" },
      { pct: 0.80, reps: 2, label: "Potenciación" },
    ];
  } else {
    // Máximos / 1-3 RM: 4 series
    protocol = [
      { pct: 0.40, reps: 8, label: "Activación" },
      { pct: 0.55, reps: 5, label: "Técnica" },
      { pct: 0.70, reps: 3, label: "Potenciación" },
      { pct: 0.88, reps: 1, label: "Específica" },
    ];
  }

  return protocol
    .map((step, i) => {
      const raw     = est1RM * step.pct;
      const rounded = Math.round(raw / 2.5) * 2.5;
      const weight  = Math.max(rounded, minWeight);
      return {
        series:  i + 1,
        weight,
        reps:    step.reps,
        pct:     Math.round(step.pct * 100),
        label:   step.label,
      };
    })
    // Filtrar series que tengan el mismo peso o más que la serie de trabajo
    .filter(s => s.weight < workingWeight);
}
