/**
 * intelligence.js
 * Lógica de análisis inteligente basada en la investigación de Chris Beardsley
 * y evidencia actual en ciencia del entrenamiento.
 *
 * Principios clave aplicados:
 * - Fatigue: el volumen acumulado semana a semana es el principal driver de fatiga
 *   (Beardsley: "Fatigue is best tracked via rolling weekly volume")
 * - Estancamiento: stagnation ocurre cuando el 1RM estimado no sube en 3+ sesiones
 *   consecutivas del mismo día. La detección distingue estancamiento real (plateau)
 *   de deload o baja adherencia.
 * - SRA (Stimulus-Recovery-Adaptation): para detectar si el volumen actual permite
 *   recuperación suficiente (si el volumen sube >10% semanal → fatigue spike risk)
 * - MEV/MAV/MRV: Mínimo Volumen Efectivo, Máximo Volumen Adaptativo, Máximo Volumen
 *   Recuperable. Rangos por músculo según consenso actual (Israetel/Beardsley).
 */

import { calc1RM, bestSet, sessionVolume } from "./fitness";

// ─── MRV / MEV / MAV por grupo muscular ─────────────────────────────────────
// Fuente: Mike Israetel / Beardsley compilations
// Unidad: series de trabajo por semana (≥60% 1RM, RIR 0-3)
export const MUSCLE_RANGES = {
  chest:     { mev: 8,  mav: 16, mrv: 22, label: "Pecho" },
  back:      { mev: 10, mav: 18, mrv: 25, label: "Espalda" },
  shoulders: { mev: 8,  mav: 16, mrv: 22, label: "Hombros" },
  biceps:    { mev: 6,  mav: 14, mrv: 20, label: "Bíceps" },
  triceps:   { mev: 6,  mav: 14, mrv: 18, label: "Tríceps" },
  quads:     { mev: 8,  mav: 16, mrv: 20, label: "Cuádriceps" },
  hamstrings:{ mev: 6,  mav: 12, mrv: 16, label: "Isquiotibiales" },
  glutes:    { mev: 4,  mav: 12, mrv: 16, label: "Glúteos" },
  calves:    { mev: 8,  mav: 16, mrv: 20, label: "Pantorrillas" },
  adductors: { mev: 4,  mav: 10, mrv: 14, label: "Aductores" },
};

// Mapeo ejercicio → músculos. Puedes extender esto.
export const EXERCISE_MUSCLES = {
  "Máquina Pecho":           ["chest", "triceps"],
  "Peck Deck":               ["chest"],
  "Press Francés":           ["triceps"],
  "Extensión Tríceps":       ["triceps"],
  "Jalón al Pecho":          ["back", "biceps"],
  "Remo T":                  ["back"],
  "Remo Agarre Amplio":      ["back"],
  "Bayesian (Bíceps)":       ["biceps"],
  "Curl Bayesian":           ["biceps"],
  "Predicador en Banco":     ["biceps"],
  "Curl Bíceps Predicador":  ["biceps"],
  "Reverse Curl":            ["biceps"],
  "Reverse Curl Bíceps":     ["biceps"],
  "Elevaciones Laterales":   ["shoulders"],
  "Press Militar Barra":     ["shoulders", "triceps"],
  "Hack Squat":              ["quads", "glutes"],
  "Prensa Unilateral":       ["quads", "glutes"],
  "Extensión de Cuádriceps": ["quads"],
  "Peso Rumano":             ["hamstrings", "glutes"],
  "Curl Femoral Sentado":    ["hamstrings"],
  "Búlgara (Smith)":         ["quads", "glutes", "hamstrings"],
  "Aductores (máquina)":     ["adductors"],
  "Aductor Sentado":         ["adductors"],
  "Aducción":                ["adductors"],
};

// ─── FATIGUE TRACKER ─────────────────────────────────────────────────────────

/**
 * Calcula la fatiga acumulada de la última semana y la tendencia vs la anterior.
 *
 * Beardsley: "Weekly tonnage (sets × reps × weight) is the best proxy for
 * mechanical fatigue. A >10% jump week-over-week indicates a spike risk."
 *
 * Returns:
 *   currentWeekVolume: tonelaje esta semana
 *   prevWeekVolume: tonelaje semana pasada
 *   weeklyChangePct: % de cambio
 *   fatigueLevel: "low" | "moderate" | "high" | "spike"
 *   sessionCount: sesiones esta semana
 *   weekSets: total series esta semana
 *   alert: mensaje si hay spike
 */
export function calcFatigue(logs) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Lunes de esta semana
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  // Lunes de la semana pasada
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);

  const sessions = Object.values(logs);

  function weekStats(from, to) {
    const ws = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= from && d < to;
    });
    const volume = ws.reduce((a, s) => a + sessionVolume(s.sets || {}), 0);
    const sets   = ws.reduce((a, s) =>
      a + Object.values(s.sets || {}).flat().length, 0
    );
    return { volume: Math.round(volume), sets, count: ws.length };
  }

  const curr = weekStats(monday, new Date(monday.getTime() + 7 * 86400000));
  const prev = weekStats(prevMonday, monday);

  let changePct = 0;
  if (prev.volume > 0) {
    changePct = Math.round(((curr.volume - prev.volume) / prev.volume) * 100);
  }

  // Determinar nivel de fatiga
  // Basado en: volumen absoluto + spike relativo
  let fatigueLevel = "low";
  let alert = null;

  if (curr.count >= 5 && changePct > 20) {
    fatigueLevel = "spike";
    alert = `Subiste el volumen un ${changePct}% vs la semana pasada. Riesgo de acumulación de fatiga — considera un día extra de descanso.`;
  } else if (curr.count >= 4 || changePct > 10) {
    fatigueLevel = "high";
    if (changePct > 10) alert = `Volumen un ${changePct}% más alto que la semana anterior. Mantén buena nutrición y sueño.`;
  } else if (curr.count >= 3) {
    fatigueLevel = "moderate";
  }

  return {
    currentWeekVolume: curr.volume,
    prevWeekVolume: prev.volume,
    weeklyChangePct: changePct,
    fatigueLevel,
    sessionCount: curr.count,
    weekSets: curr.sets,
    alert,
  };
}

/**
 * Calcula las series semanales por grupo muscular en las últimas 2 semanas.
 * Útil para detectar si estás en MEV, MAV o MRV.
 */
export function calcWeeklyVolumeByMuscle(logs, routine) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const thisWeekSessions = Object.values(logs).filter(s => {
    return new Date(s.date) >= monday;
  });

  const muscleSets = {};

  thisWeekSessions.forEach(session => {
    const exercises = routine?.[session.day]?.exercises || [];
    exercises.forEach((ex, ei) => {
      const sets = session.sets?.[ei] || [];
      if (!sets.length) return;
      const muscles = EXERCISE_MUSCLES[ex.name] || [];
      muscles.forEach(m => {
        muscleSets[m] = (muscleSets[m] || 0) + sets.length;
      });
    });
  });

  return muscleSets;
}

// ─── DETECCIÓN DE ESTANCAMIENTO ──────────────────────────────────────────────

/**
 * Detecta estancamiento por ejercicio basándose en el 1RM estimado.
 *
 * Beardsley: Un plateau real es cuando el 1RM estimado no sube en ≥3 sesiones
 * consecutivas del mismo día de entrenamiento.
 * Distingue plateau de:
 *   - Baja adherencia (< 3 sesiones totales)
 *   - Variabilidad normal (±2% entre sesiones es ruido, no plateau)
 *
 * Returns array de { day, exName, sessions, rmHistory, stagnantFor, suggestion }
 */
export function detectStagnation(logs, routine) {
  const stagnant = [];

  if (!routine) return stagnant;

  Object.entries(routine).forEach(([day, dayData]) => {
    const exercises = dayData.exercises || [];

    exercises.forEach((ex, ei) => {
      const history = Object.values(logs)
        .filter(s => s.day === day && s.sets?.[ei]?.length)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(s => {
          const b = bestSet(s.sets[ei]);
          return b ? { date: s.date, rm: calc1RM(b.weight, b.reps), weight: b.weight, reps: b.reps } : null;
        })
        .filter(Boolean);

      if (history.length < 3) return; // no hay suficientes datos

      // Tomar las últimas 4 sesiones
      const recent = history.slice(-4);

      // Chequear si hay mejora real (>2% del 1RM entre primera y última sesión reciente)
      const first = recent[0].rm;
      const last  = recent[recent.length - 1].rm;
      const changePct = ((last - first) / first) * 100;

      // Si no subió más del 2% en las últimas 3-4 sesiones → plateau
      if (Math.abs(changePct) <= 2 && recent.length >= 3) {
        const stagnantSessions = recent.length;

        // Generar sugerencia basada en Beardsley:
        // 1. Si estancado en hipertrofia → subir volumen o cambiar ROM
        // 2. Si estancado en fuerza → deload + cambiar variante
        let suggestion;
        const lastWeight = recent[recent.length - 1].weight;
        const lastReps   = recent[recent.length - 1].reps;

        if (lastReps >= 10) {
          // Zona de hipertrofia: subir carga
          suggestion = `Tu 1RM lleva ${stagnantSessions} sesiones sin subir. Intenta agregar +2.5kg la próxima sesión aunque bajes 1-2 reps.`;
        } else if (lastReps >= 6) {
          // Zona intermedia: puede ser acumulación de fatiga
          suggestion = `${stagnantSessions} sesiones sin progresar en 1RM. Considera 1 semana de deload (60-70% del peso habitual) y luego reinicia.`;
        } else {
          // Zona de fuerza: cambiar variante o periodizar
          suggestion = `Plateau en zona de fuerza (${stagnantSessions} sesiones). Beardsley recomienda cambiar la variante del ejercicio o introducir periodización ondulante.`;
        }

        stagnant.push({
          day,
          exName: ex.name,
          stagnantFor: stagnantSessions,
          currentRM: Math.round(last),
          rmHistory: recent,
          suggestion,
          changePct: changePct.toFixed(1),
        });
      }
    });
  });

  return stagnant;
}

// ─── DATOS PARA EL RESUMEN SEMANAL ──────────────────────────────────────────

/**
 * Recopila todos los datos de la semana actual para pasarlos a la IA.
 * No llama a la IA — eso lo hace el componente.
 */
export function buildWeeklySummaryData(logs, routine) {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);

  const thisWeek = Object.values(logs).filter(s => new Date(s.date) >= monday);
  const prevWeek = Object.values(logs).filter(s => {
    const d = new Date(s.date);
    return d >= prevMonday && d < monday;
  });

  // PRs de la semana (1RM estimado más alto que cualquier sesión anterior)
  const prs = [];
  thisWeek.forEach(session => {
    const exercises = routine?.[session.day]?.exercises || [];
    exercises.forEach((ex, ei) => {
      const sets = session.sets?.[ei] || [];
      if (!sets.length) return;
      const best = bestSet(sets);
      if (!best) return;
      const currentRM = calc1RM(best.weight, best.reps);

      // Comparar con historial previo
      const historicSessions = Object.values(logs).filter(s =>
        s.day === session.day &&
        s.date < session.date &&
        s.sets?.[ei]?.length
      );
      const historicBest = historicSessions.reduce((max, s) => {
        const b = bestSet(s.sets[ei]);
        return b ? Math.max(max, calc1RM(b.weight, b.reps)) : max;
      }, 0);

      if (currentRM > historicBest && historicBest > 0) {
        prs.push({ name: ex.name, rm: currentRM, prev: historicBest });
      }
    });
  });

  const thisVolume = thisWeek.reduce((a, s) => a + sessionVolume(s.sets || {}), 0);
  const prevVolume = prevWeek.reduce((a, s) => a + sessionVolume(s.sets || {}), 0);
  const fatigue    = calcFatigue(logs);
  const stagnation = detectStagnation(logs, routine);

  // Días entrenados esta semana
  const daysTrainedNames = [...new Set(thisWeek.map(s => s.day))];

  return {
    sessionCount: thisWeek.length,
    prevSessionCount: prevWeek.length,
    daysTrainedNames,
    totalVolume: Math.round(thisVolume),
    prevVolume: Math.round(prevVolume),
    volumeChangePct: prevVolume > 0
      ? Math.round(((thisVolume - prevVolume) / prevVolume) * 100)
      : null,
    prs,
    stagnation,
    fatigue,
  };
}

/**
 * Construye el prompt para el resumen semanal con IA.
 */
export function buildWeeklySummaryPrompt(data) {
  const { sessionCount, prevSessionCount, daysTrainedNames, totalVolume, prevVolume,
    volumeChangePct, prs, stagnation, fatigue } = data;

  const prText = prs.length
    ? prs.map(p => `${p.name}: nuevo 1RM estimado de ${p.rm}kg (antes ${p.prev}kg)`).join(", ")
    : "ningún PR esta semana";

  const stagnationText = stagnation.length
    ? stagnation.map(s => `${s.exName} (${s.day}): ${s.stagnantFor} sesiones sin progresar`).join("; ")
    : "ninguno detectado";

  const fatigueText = {
    low:      "baja — el atleta puede manejar más volumen",
    moderate: "moderada — volumen apropiado",
    high:     "alta — cerca del MRV semanal",
    spike:    `MUY ALTA — spike de ${fatigue.weeklyChangePct}% vs semana anterior`,
  }[fatigue.fatigueLevel];

  return `Eres un coach de fuerza e hipertrofia que sigue la metodología de Chris Beardsley y Renaissance Periodization. Genera un resumen semanal de entrenamiento conciso, motivador y accionable en ESPAÑOL, en máximo 5 oraciones. 

Datos de la semana:
- Sesiones: ${sessionCount} (semana pasada: ${prevSessionCount})
- Días entrenados: ${daysTrainedNames.join(", ") || "ninguno"}
- Tonelaje total: ${totalVolume}kg ${volumeChangePct !== null ? `(${volumeChangePct > 0 ? "+" : ""}${volumeChangePct}% vs semana pasada)` : ""}
- PRs: ${prText}
- Estancamiento detectado: ${stagnationText}
- Nivel de fatiga acumulada: ${fatigueText}
- Series totales esta semana: ${fatigue.weekSets}

Instrucciones:
1. Empieza reconociendo el trabajo de la semana con datos específicos
2. Menciona los PRs si los hubo
3. Si hay estancamiento, da UNA recomendación concreta basada en evidencia
4. Si la fatiga es alta o spike, menciona la importancia del sueño y la nutrición
5. Termina con UNA acción prioritaria para la próxima semana
6. Tono directo, como un coach real, sin ser genérico. Usa "tú" y sé específico con los ejercicios mencionados.
7. NO uses markdown, solo texto plano.`;
}
