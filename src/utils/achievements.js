/**
 * achievements.js
 * Sistema de logros/achievements.
 *
 * Cada logro tiene:
 *   id, title, desc, icon, category, rarity
 *   check(logs, routine, userXP, streak): boolean
 *
 * Categorías: "consistency" | "strength" | "volume" | "social" | "milestone"
 * Rareza: "common" | "rare" | "epic" | "legendary"
 */

import { calc1RM, bestSet, sessionVolume } from "./fitness";
import { calcStreak } from "./streak";
import { getRank } from "./ranks";

// ─── Definición de logros ────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // ── MILESTONE ──────────────────────────────────────────────────────────────
  {
    id: "first_session",
    title: "Primer Paso",
    desc: "Completa tu primera sesión de entrenamiento.",
    icon: "🏁",
    category: "milestone",
    rarity: "common",
    check: (logs) => Object.keys(logs).length >= 1,
  },
  {
    id: "sessions_10",
    title: "10 Sesiones",
    desc: "Completa 10 sesiones de entrenamiento.",
    icon: "💪",
    category: "milestone",
    rarity: "common",
    check: (logs) => Object.keys(logs).length >= 10,
  },
  {
    id: "sessions_25",
    title: "Constante",
    desc: "25 sesiones completadas. Ya es un hábito.",
    icon: "🏅",
    category: "milestone",
    rarity: "rare",
    check: (logs) => Object.keys(logs).length >= 25,
  },
  {
    id: "sessions_50",
    title: "Medio Centenar",
    desc: "50 sesiones. Esto ya es un estilo de vida.",
    icon: "⭐",
    category: "milestone",
    rarity: "rare",
    check: (logs) => Object.keys(logs).length >= 50,
  },
  {
    id: "sessions_100",
    title: "Centenario",
    desc: "100 sesiones de entrenamiento. Élite.",
    icon: "💯",
    category: "milestone",
    rarity: "epic",
    check: (logs) => Object.keys(logs).length >= 100,
  },
  {
    id: "sessions_200",
    title: "Veterano",
    desc: "200 sesiones. Eres un atlas del gym.",
    icon: "🗿",
    category: "milestone",
    rarity: "legendary",
    check: (logs) => Object.keys(logs).length >= 200,
  },

  // ── CONSISTENCY ─────────────────────────────────────────────────────────────
  {
    id: "streak_3",
    title: "Racha de 3",
    desc: "3 días consecutivos de entrenamiento.",
    icon: "🔥",
    category: "consistency",
    rarity: "common",
    check: (logs) => calcStreak(logs) >= 3,
  },
  {
    id: "streak_7",
    title: "Semana Perfecta",
    desc: "7 días seguidos entrenando.",
    icon: "🔥🔥",
    category: "consistency",
    rarity: "rare",
    check: (logs) => calcStreak(logs) >= 7,
  },
  {
    id: "streak_14",
    title: "Dos Semanas",
    desc: "14 días consecutivos. Sin excusas.",
    icon: "⚡",
    category: "consistency",
    rarity: "epic",
    check: (logs) => calcStreak(logs) >= 14,
  },
  {
    id: "streak_30",
    title: "El Mes",
    desc: "30 días seguidos. Eso es disciplina real.",
    icon: "👑",
    category: "consistency",
    rarity: "legendary",
    check: (logs) => calcStreak(logs) >= 30,
  },
  {
    id: "full_upper_lower",
    title: "Upper/Lower Completo",
    desc: "Completa Upper A, Lower A, Upper B y Lower B en una semana.",
    icon: "⚔️",
    category: "consistency",
    rarity: "rare",
    check: (logs, routine) => {
      const now = new Date();
      const monday = new Date(now);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const weekLogs = Object.values(logs).filter(s => new Date(s.date) >= monday);
      const days = new Set(weekLogs.map(s => s.day));
      const allDays = Object.keys(routine || {});
      return allDays.length > 0 && allDays.every(d => days.has(d));
    },
  },

  // ── VOLUME ──────────────────────────────────────────────────────────────────
  {
    id: "volume_10k",
    title: "10 Toneladas",
    desc: "Mueve 10,000kg en una sesión.",
    icon: "🏋️",
    category: "volume",
    rarity: "rare",
    check: (logs) => Object.values(logs).some(s => sessionVolume(s.sets || {}) >= 10000),
  },
  {
    id: "volume_20k",
    title: "20 Toneladas",
    desc: "20,000kg en una sola sesión. Bestia.",
    icon: "🔩",
    category: "volume",
    rarity: "epic",
    check: (logs) => Object.values(logs).some(s => sessionVolume(s.sets || {}) >= 20000),
  },
  {
    id: "total_volume_100k",
    title: "100,000kg Totales",
    desc: "Tonelaje acumulado total supera los 100,000kg.",
    icon: "🌋",
    category: "volume",
    rarity: "epic",
    check: (logs) => {
      const total = Object.values(logs).reduce((a, s) => a + sessionVolume(s.sets || {}), 0);
      return total >= 100000;
    },
  },
  {
    id: "total_volume_500k",
    title: "Medio Millón",
    desc: "500,000kg acumulados en toda tu historia.",
    icon: "🌌",
    category: "volume",
    rarity: "legendary",
    check: (logs) => {
      const total = Object.values(logs).reduce((a, s) => a + sessionVolume(s.sets || {}), 0);
      return total >= 500000;
    },
  },

  // ── STRENGTH ─────────────────────────────────────────────────────────────────
  {
    id: "first_pr",
    title: "Primer PR",
    desc: "Supera tu récord personal estimado en algún ejercicio.",
    icon: "🎯",
    category: "strength",
    rarity: "common",
    check: (logs, routine) => {
      if (!routine) return false;
      // Verificar si en alguna sesión hay un 1RM mayor que el promedio histórico
      const sessions = Object.values(logs).sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 1; i < sessions.length; i++) {
        const curr = sessions[i];
        const exercises = routine?.[curr.day]?.exercises || [];
        for (let ei = 0; ei < exercises.length; ei++) {
          const currSets = curr.sets?.[ei] || [];
          if (!currSets.length) continue;
          const currBest = bestSet(currSets);
          if (!currBest) continue;
          const currRM = calc1RM(currBest.weight, currBest.reps);
          const historic = sessions.slice(0, i).filter(s => s.day === curr.day);
          const maxHistoric = historic.reduce((max, s) => {
            const b = bestSet(s.sets?.[ei] || []);
            return b ? Math.max(max, calc1RM(b.weight, b.reps)) : max;
          }, 0);
          if (maxHistoric > 0 && currRM > maxHistoric) return true;
        }
      }
      return false;
    },
  },
  {
    id: "pr_5_exercises",
    title: "Múltiple PR",
    desc: "Logra PR en 5 ejercicios diferentes a lo largo del tiempo.",
    icon: "🏆",
    category: "strength",
    rarity: "epic",
    check: (logs, routine) => {
      if (!routine) return false;
      const prExercises = new Set();
      const sessions = Object.values(logs).sort((a, b) => a.date.localeCompare(b.date));
      sessions.forEach((curr, i) => {
        const exercises = routine?.[curr.day]?.exercises || [];
        exercises.forEach((ex, ei) => {
          if (prExercises.has(ex.name)) return;
          const currSets = curr.sets?.[ei] || [];
          if (!currSets.length) return;
          const currBest = bestSet(currSets);
          if (!currBest) return;
          const currRM = calc1RM(currBest.weight, currBest.reps);
          const historic = sessions.slice(0, i).filter(s => s.day === curr.day);
          const maxHistoric = historic.reduce((max, s) => {
            const b = bestSet(s.sets?.[ei] || []);
            return b ? Math.max(max, calc1RM(b.weight, b.reps)) : max;
          }, 0);
          if (maxHistoric > 0 && currRM > maxHistoric) prExercises.add(ex.name);
        });
      });
      return prExercises.size >= 5;
    },
  },

  // ── XP / RANK ────────────────────────────────────────────────────────────────
  {
    id: "reach_bronze",
    title: "Bronce",
    desc: "Alcanza el rango Bronce.",
    icon: "🥉",
    category: "milestone",
    rarity: "common",
    check: (_, __, userXP) => userXP >= 500,
  },
  {
    id: "reach_silver",
    title: "Plata",
    desc: "Alcanza el rango Plata.",
    icon: "🥈",
    category: "milestone",
    rarity: "common",
    check: (_, __, userXP) => userXP >= 1500,
  },
  {
    id: "reach_gold",
    title: "Oro",
    desc: "Alcanza el rango Oro.",
    icon: "🥇",
    category: "milestone",
    rarity: "rare",
    check: (_, __, userXP) => userXP >= 3500,
  },
  {
    id: "reach_diamond",
    title: "Diamante",
    desc: "Alcanza el rango Diamante.",
    icon: "💎",
    category: "milestone",
    rarity: "epic",
    check: (_, __, userXP) => userXP >= 7500,
  },
  {
    id: "reach_legend",
    title: "Leyenda",
    desc: "El rango más alto. Hay muy pocos aquí.",
    icon: "👑",
    category: "milestone",
    rarity: "legendary",
    check: (_, __, userXP) => userXP >= 15000,
  },
];

// ─── Colores por rareza ───────────────────────────────────────────────────────
export const RARITY_COLORS = {
  common:    { bg: "#1c1c1c", border: "#374151", text: "#9ca3af", label: "COMÚN" },
  rare:      { bg: "#0c1a2e", border: "#185fa5", text: "#378add", label: "RARO" },
  epic:      { bg: "#1e1b4b", border: "#534ab7", text: "#a78bfa", label: "ÉPICO" },
  legendary: { bg: "#1c1100", border: "#854f0b", text: "#ef9f27", label: "LEGENDARIO" },
};

// ─── Evaluación ──────────────────────────────────────────────────────────────

/**
 * Evalúa todos los logros y retorna cuáles están desbloqueados.
 * @returns { unlocked: Set<string>, progress: Array<Achievement> }
 */
export function evaluateAchievements(logs, routine, userXP) {
  const unlocked = new Set();

  ACHIEVEMENTS.forEach(ach => {
    try {
      if (ach.check(logs, routine, userXP)) {
        unlocked.add(ach.id);
      }
    } catch (e) {
      // no romper si falla un check
    }
  });

  return unlocked;
}

/**
 * Detecta logros recién desbloqueados comparando con los logros previos guardados.
 * Llama esto después de cada sesión para mostrar notificaciones.
 * @param {Set<string>} prevUnlocked - Set de IDs previamente desbloqueados
 * @param {Set<string>} currUnlocked - Set de IDs actualmente desbloqueados
 * @returns {Array} logros recién desbloqueados
 */
export function getNewlyUnlocked(prevUnlocked, currUnlocked) {
  return ACHIEVEMENTS.filter(
    a => currUnlocked.has(a.id) && !prevUnlocked.has(a.id)
  );
}

/**
 * Guarda logros desbloqueados en localStorage.
 */
export function saveUnlockedAchievements(uid, unlockedSet) {
  localStorage.setItem(
    `achievements_${uid}`,
    JSON.stringify([...unlockedSet])
  );
}

/**
 * Carga logros desbloqueados desde localStorage.
 */
export function loadUnlockedAchievements(uid) {
  try {
    const raw = localStorage.getItem(`achievements_${uid}`);
    return new Set(JSON.parse(raw || "[]"));
  } catch {
    return new Set();
  }
}
