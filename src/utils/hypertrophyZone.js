/**
 * hypertrophyZone.js
 * Zona óptima de hipertrofia por set, basada en investigación actual.
 *
 * Beardsley / Schoenfeld 2017+:
 * - La hipertrofia ocurre en un rango amplio (5-30 reps) siempre que se entrene
 *   cerca del fallo (RIR 0-3)
 * - El rango "óptimo práctico" para la mayoría de ejercicios es 6-20 reps
 * - Reps muy bajas (<5) favorecen fuerza pero menor estímulo metabólico
 * - Reps muy altas (>30) requieren más esfuerzo percibido para el mismo estímulo
 *
 * Zonas:
 *   "strength"    → 1-4 reps   → fuerza, poco estímulo hipertrofia
 *   "optimal"     → 5-20 reps  → zona dorada hipertrofia
 *   "endurance"   → 21-30 reps → hipertrofia posible pero subóptima
 *   "too_high"    → >30 reps   → cardio, mínima hipertrofia
 */

export const HYPERTROPHY_ZONES = {
  strength: {
    label: "FUERZA",
    color: "#60a5fa",
    bg: "#0c1a2e",
    border: "#185fa544",
    emoji: "💪",
    tip: "Zona de fuerza. Válido para fuerza máxima, pero el estímulo de hipertrofia es menor.",
    range: [1, 4],
  },
  optimal: {
    label: "HIPERTROFIA",
    color: "#22c55e",
    bg: "#14532d22",
    border: "#22c55e44",
    emoji: "🎯",
    tip: "Zona óptima. Máximo estímulo de hipertrofia según Schoenfeld.",
    range: [5, 20],
  },
  endurance: {
    label: "RESISTENCIA",
    color: "#f59e0b",
    bg: "#78350f22",
    border: "#f59e0b44",
    emoji: "⚡",
    tip: "Hipertrofia posible pero requiere más esfuerzo. Considera bajar reps.",
    range: [21, 30],
  },
  too_high: {
    label: "CARDIO",
    color: "#ef4444",
    bg: "#7f1d1d22",
    border: "#ef444444",
    emoji: "🏃",
    tip: "Demasiadas reps para hipertrofia óptima.",
    range: [31, Infinity],
  },
};

/**
 * Retorna la zona de hipertrofia para un número de reps dado.
 */
export function getHypertrophyZone(reps) {
  if (!reps || reps <= 0) return null;
  if (reps <= 4)  return HYPERTROPHY_ZONES.strength;
  if (reps <= 20) return HYPERTROPHY_ZONES.optimal;
  if (reps <= 30) return HYPERTROPHY_ZONES.endurance;
  return HYPERTROPHY_ZONES.too_high;
}

/**
 * Dado un array de sets, retorna la zona predominante
 * (la que más sets tiene).
 */
export function getDominantZone(sets) {
  if (!sets?.length) return null;
  const counts = {};
  sets.forEach(s => {
    const zone = getHypertrophyZone(s.reps);
    if (zone) counts[zone.label] = (counts[zone.label] || 0) + 1;
  });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!dominant) return null;
  return Object.values(HYPERTROPHY_ZONES).find(z => z.label === dominant[0]);
}

/**
 * Sugiere el rango de reps óptimo para un ejercicio dado el peso actual.
 * Si está en zona de fuerza, sugiere bajar peso para entrar en zona óptima.
 * Si está en zona de resistencia, sugiere subir peso.
 */
export function getRepSuggestion(weight, reps) {
  const zone = getHypertrophyZone(reps);
  if (!zone) return null;

  if (zone.label === "FUERZA") {
    return `Estás en zona de fuerza. Para hipertrofia óptima, intenta bajar a ~${Math.round(weight * 0.8)}kg y hacer 8-12 reps.`;
  }
  if (zone.label === "RESISTENCIA") {
    return `Demasiadas reps. Sube a ~${Math.round(weight * 1.2)}kg y apunta a 10-15 reps para mejor estímulo.`;
  }
  if (zone.label === "CARDIO") {
    return `Zona cardio — mínima hipertrofia. Sube el peso significativamente.`;
  }
  return null;
}
