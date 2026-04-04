/**
 * mesocycle.js — Planificador de mesociclos con metodología Beardsley/RP
 *
 * Principios aplicados:
 * 1. SRA (Stimulus-Recovery-Adaptation): cada músculo necesita 48-72h de recuperación
 * 2. MEV/MAV/MRV: volumen mínimo efectivo → máximo adaptativo → máximo recuperable
 * 3. Progresión de volumen: +1-2 series por grupo muscular por semana
 * 4. Deload automático: semana 4-6 con 40-50% reducción de volumen
 * 5. Intensidad progresiva: semana 1 (RIR 3-4) → semana final (RIR 0-1)
 * 6. Detección de fatiga: si hay spike >15% de volumen semanal → ajuste automático
 *
 * Fuentes:
 * - Beardsley: "How to design a training program" (2022)
 * - Israetel: "Scientific Principles of Strength Training" (RP, 2015-2023)
 * - Schoenfeld: "Science and Development of Muscle Hypertrophy" (2020)
 */

import { MUSCLE_RANGES, EXERCISE_MUSCLES, calcFatigue, detectStagnation } from "./intelligence";
import { calc1RM, bestSet, sessionVolume } from "./fitness";

// ── Configuración de perfil ───────────────────────────────────────────────
export const GOALS = {
  hypertrophy: {
    label:       "Hipertrofia",
    desc:        "Maximizar músculo. Rango 6-15 reps, RIR 1-3.",
    repRange:    [6, 15],
    rirStart:    3,
    rirEnd:      1,
    weeklyInc:   2,   // series extra por músculo por semana
    deloadPct:   0.50,
    icon:        "💪",
  },
  strength: {
    label:       "Fuerza",
    desc:        "Maximizar 1RM. Rango 1-6 reps, RIR 0-2.",
    repRange:    [1, 6],
    rirStart:    2,
    rirEnd:      0,
    weeklyInc:   1,
    deloadPct:   0.40,
    icon:        "🏋️",
  },
  mixed: {
    label:       "Fuerza + Hipertrofia",
    desc:        "Balance entre ambos objetivos. Rango 4-12 reps.",
    repRange:    [4, 12],
    rirStart:    3,
    rirEnd:      1,
    weeklyInc:   1,
    deloadPct:   0.45,
    icon:        "⚡",
  },
};

export const FREQUENCIES = {
  3: { label: "3 días/semana", days: 3 },
  4: { label: "4 días/semana", days: 4 },
  5: { label: "5 días/semana", days: 5 },
  6: { label: "6 días/semana", days: 6 },
};

export const LEVELS = {
  beginner:     { label: "Principiante",  desc: "< 1 año entrenando", mevMult: 0.7 },
  intermediate: { label: "Intermedio",    desc: "1-3 años",           mevMult: 1.0 },
  advanced:     { label: "Avanzado",      desc: "3+ años",            mevMult: 1.2 },
};

// ── Planificador principal ────────────────────────────────────────────────

export function planMesocycle({ goal, weeks, daysPerWeek, level, bodyweight, logs, routine }) {
  const cfg   = GOALS[goal];
  const lvl   = LEVELS[level];
  const hasData = logs && Object.keys(logs).length >= 3;

  // Detectar fatiga y estancamiento actuales si hay datos
  const currentFatigue     = hasData ? calcFatigue(logs) : null;
  const currentStagnation  = hasData && routine ? detectStagnation(logs, routine) : [];

  // Calcular volumen de inicio por músculo (MEV ajustado por nivel)
  const startVolume = {};
  Object.entries(MUSCLE_RANGES).forEach(([muscle, ranges]) => {
    startVolume[muscle] = Math.round(ranges.mev * lvl.mevMult);
  });

  // Si hay stagnation → aumentar volumen en esos músculos
  currentStagnation.forEach(s => {
    const muscles = getMusclesFromExercise(s.exName);
    muscles.forEach(m => {
      if (startVolume[m]) startVolume[m] = Math.min(startVolume[m] + 2, MUSCLE_RANGES[m].mav);
    });
  });

  // Si hay fatiga alta → empezar con menos volumen
  if (currentFatigue?.fatigueLevel === "high" || currentFatigue?.fatigueLevel === "spike") {
    Object.keys(startVolume).forEach(m => {
      startVolume[m] = Math.max(startVolume[m] - 2, MUSCLE_RANGES[m].mev - 2);
    });
  }

  // ── Generar semanas ──────────────────────────────────────────────────────
  const mesocycle = [];
  const deloadWeek = weeks; // última semana siempre deload

  for (let w = 1; w <= weeks; w++) {
    const isDeload = w === deloadWeek;
    const weekNum  = w;

    // Intensidad progresiva (RIR decrece)
    const rir = isDeload
      ? cfg.rirStart + 1
      : Math.round(cfg.rirStart - ((cfg.rirStart - cfg.rirEnd) / (weeks - 2)) * (w - 1));

    // Volumen semanal por músculo
    const weekVolume = {};
    Object.keys(startVolume).forEach(m => {
      const base  = startVolume[m] + cfg.weeklyInc * (w - 1);
      const cap   = MUSCLE_RANGES[m].mrv;
      const sets  = Math.min(base, cap);
      weekVolume[m] = isDeload ? Math.round(sets * (1 - cfg.deloadPct)) : sets;
    });

    // Distribución en días de entrenamiento
    const sessions = buildWeekSessions(daysPerWeek, weekVolume, cfg, rir, w, isDeload);

    // Rango de peso sugerido (basado en historial si hay)
    const intensityNote = isDeload
      ? "Semana de deload: bajá los pesos ~40-50%, enfocate en la técnica"
      : `RIR objetivo: ${rir} — dejá ${rir} repeticiones en el tanque en cada serie`;

    mesocycle.push({
      week:          w,
      isDeload,
      rir,
      weekVolume,
      sessions,
      intensityNote,
      focus:         getWeekFocus(w, weeks, isDeload),
    });
  }

  // ── Insights personalizados ──────────────────────────────────────────────
  const insights = buildInsights({
    goal, weeks, daysPerWeek, level,
    currentFatigue, currentStagnation,
    bodyweight, hasData,
  });

  return { mesocycle, insights, goal: cfg, level: lvl };
}

function buildWeekSessions(daysPerWeek, weekVolume, cfg, rir, weekNum, isDeload) {
  // Splits predefinidos por días/semana
  const splits = {
    3: [
      { name: "Full Body A", muscles: ["chest","back","shoulders","quads","hamstrings"] },
      { name: "Full Body B", muscles: ["chest","back","triceps","biceps","glutes","calves"] },
      { name: "Full Body C", muscles: ["shoulders","back","quads","hamstrings","adductors"] },
    ],
    4: [
      { name: "Upper A",  muscles: ["chest","shoulders","triceps","back","biceps"] },
      { name: "Lower A",  muscles: ["quads","hamstrings","glutes","calves","adductors"] },
      { name: "Upper B",  muscles: ["chest","back","shoulders","triceps","biceps"] },
      { name: "Lower B",  muscles: ["quads","hamstrings","glutes","calves"] },
    ],
    5: [
      { name: "Push A",   muscles: ["chest","shoulders","triceps"] },
      { name: "Pull A",   muscles: ["back","biceps"] },
      { name: "Legs A",   muscles: ["quads","hamstrings","glutes","calves"] },
      { name: "Push B",   muscles: ["chest","shoulders","triceps"] },
      { name: "Pull B",   muscles: ["back","biceps","adductors"] },
    ],
    6: [
      { name: "Push A",   muscles: ["chest","shoulders","triceps"] },
      { name: "Pull A",   muscles: ["back","biceps"] },
      { name: "Legs A",   muscles: ["quads","hamstrings","glutes"] },
      { name: "Push B",   muscles: ["chest","shoulders","triceps"] },
      { name: "Pull B",   muscles: ["back","biceps"] },
      { name: "Legs B",   muscles: ["quads","hamstrings","calves","adductors"] },
    ],
  };

  const template = splits[daysPerWeek] || splits[4];

  return template.map((day, i) => {
    // Series por músculo en esta sesión
    const sessionSets = {};
    day.muscles.forEach(m => {
      const total    = weekVolume[m] || 0;
      // Dividir entre sesiones que trabajan ese músculo
      const sessionsWithMuscle = template.filter(d => d.muscles.includes(m)).length;
      sessionSets[m] = Math.max(1, Math.round(total / sessionsWithMuscle));
    });

    // Rango de reps según objetivo y semana
    const [minRep, maxRep] = cfg.repRange;
    const repRange = isDeload
      ? `${minRep + 2}-${maxRep + 4} (técnica, poco peso)`
      : `${minRep}-${maxRep}`;

    return {
      day:       i + 1,
      name:      day.name,
      muscles:   day.muscles,
      sets:      sessionSets,
      repRange,
      rir,
      totalSets: Object.values(sessionSets).reduce((a, b) => a + b, 0),
    };
  });
}

function getWeekFocus(week, total, isDeload) {
  if (isDeload) return "Recuperación y técnica — no te exijas";
  if (week === 1) return "Semana de acumulación — establecer línea base";
  if (week <= Math.floor(total / 2)) return "Fase de acumulación — construir volumen";
  return "Fase de intensificación — más carga, menos volumen";
}

function buildInsights({ goal, weeks, daysPerWeek, level, currentFatigue, currentStagnation, bodyweight, hasData }) {
  const insights = [];

  if (!hasData) {
    insights.push({ type: "info", text: "Completá 3+ sesiones para que el plan se personalice con tu historial real." });
  }

  if (currentFatigue?.fatigueLevel === "high" || currentFatigue?.fatigueLevel === "spike") {
    insights.push({ type: "warning", text: `Fatiga acumulada alta (${currentFatigue.weekSets} series/semana). El plan arranca con volumen reducido para que te recuperes antes de acumular.` });
  }

  if (currentStagnation.length > 0) {
    insights.push({ type: "alert", text: `Estancamiento en: ${currentStagnation.map(s => s.exName).join(", ")}. El plan aumenta el volumen en esos grupos musculares.` });
  }

  if (level === "beginner") {
    insights.push({ type: "info", text: "Como principiante, vas a progresar con casi cualquier estímulo. La clave es la constancia y la técnica, no el volumen." });
  }

  if (goal === "strength") {
    insights.push({ type: "info", text: "Para fuerza máxima: los últimos 2 ejercicios de cada sesión pueden ser de hipertrofia (6-12 reps) para construir base muscular." });
  }

  insights.push({ type: "tip", text: `La última semana siempre es deload: reducí el volumen 40-50% pero mantené la intensidad. El deload es donde ocurre la supercompensación.` });

  if (bodyweight) {
    const proteinTarget = Math.round(bodyweight * 1.8);
    insights.push({ type: "nutrition", text: `Para ${bodyweight}kg: objetivo proteico ~${proteinTarget}g/día (1.8g/kg). La proteína es el factor nutricional más importante para la hipertrofia.` });
  }

  return insights;
}

function getMusclesFromExercise(name) {
  if (!name) return [];
  const lower = name.toLowerCase();
  // Búsqueda aproximada en el mapa de músculos
  for (const [ex, muscles] of Object.entries(EXERCISE_MUSCLES)) {
    if (ex.toLowerCase().includes(lower) || lower.includes(ex.toLowerCase().split(" ")[0])) {
      return muscles;
    }
  }
  return [];
}

// ── Guardar mesociclo en localStorage ────────────────────────────────────
const MESO_KEY = (uid) => `gymtracker_mesocycle_${uid}`;

export function saveMesocycle(uid, plan) {
  try { localStorage.setItem(MESO_KEY(uid), JSON.stringify({ ...plan, savedAt: Date.now() })); } catch {}
}

export function loadMesocycle(uid) {
  try {
    const raw = localStorage.getItem(MESO_KEY(uid));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearMesocycle(uid) {
  localStorage.removeItem(MESO_KEY(uid));
}
