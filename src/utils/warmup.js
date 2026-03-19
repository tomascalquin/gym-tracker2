/**
 * Calcula series de aproximamiento basadas en el peso de trabajo.
 * Protocolo estándar de powerlifting con redondeo a múltiplos de 2.5kg.
 */
export function calcWarmup(workingWeight, workingReps) {
  if (!workingWeight || workingWeight <= 0) return [];

  const est1RM = workingReps === 1
    ? workingWeight
    : Math.round(workingWeight * (1 + workingReps / 30));

  let protocol;
  if (workingWeight < 40) {
    protocol = [
      { pct: 0.50, reps: 8, label: "Activación" },
      { pct: 0.70, reps: 5, label: "Técnica" },
    ];
  } else if (workingWeight < 80) {
    protocol = [
      { pct: 0.40, reps: 8, label: "Activación" },
      { pct: 0.60, reps: 5, label: "Técnica" },
      { pct: 0.75, reps: 3, label: "Potenciación" },
    ];
  } else {
    protocol = [
      { pct: 0.40, reps: 8, label: "Activación" },
      { pct: 0.55, reps: 5, label: "Técnica" },
      { pct: 0.70, reps: 3, label: "Potenciación" },
      { pct: 0.85, reps: 1, label: "Específica" },
    ];
  }

  return protocol.map((step, i) => ({
    series: i + 1,
    weight: Math.max(Math.round((est1RM * step.pct) / 2.5) * 2.5, 20),
    reps:   step.reps,
    pct:    Math.round(step.pct * 100),
    label:  step.label,
  }));
}
