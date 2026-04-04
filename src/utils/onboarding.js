/**
 * onboarding.js — Checklist de activación del usuario nuevo
 * Guarda estado en localStorage. Limpio, sin Firebase.
 */

const KEY = (uid) => `gymtracker_onboarding_${uid}`;

export const CHECKLIST = [
  {
    id:    "first_session",
    icon:  "💪",
    title: "Completá tu primera sesión",
    desc:  "Elegí un día de tu rutina y registrá el entrenamiento",
    xp:    200,
    check: ({ logs }) => Object.keys(logs).length >= 1,
  },
  {
    id:    "see_progress",
    icon:  "📊",
    title: "Mirá tu progresión",
    desc:  "Abrí Progreso para ver cómo evoluciona tu fuerza",
    xp:    100,
    check: ({ visited }) => visited?.has("progress"),
  },
  {
    id:    "three_sessions",
    icon:  "🔥",
    title: "Completá 3 sesiones",
    desc:  "La constancia es la clave del progreso",
    xp:    300,
    check: ({ logs }) => Object.keys(logs).length >= 3,
  },
  {
    id:    "add_friend",
    icon:  "👥",
    title: "Agregá un amigo",
    desc:  "Entrená con compañía — es más fácil mantener la racha",
    xp:    150,
    check: ({ hasFriend }) => !!hasFriend,
  },
  {
    id:    "weekly_ai",
    icon:  "🤖",
    title: "Leé tu resumen IA",
    desc:  "Después de tu primera semana, revisá el análisis inteligente",
    xp:    100,
    check: ({ visited }) => visited?.has("weeklySummary"),
  },
];

export const BONUS_XP = 500; // bonus al completar toda la checklist

export function loadOnboarding(uid) {
  try {
    const raw = localStorage.getItem(KEY(uid));
    return raw ? JSON.parse(raw) : { completed: [], dismissed: false, bonusClaimed: false };
  } catch {
    return { completed: [], dismissed: false, bonusClaimed: false };
  }
}

export function saveOnboarding(uid, state) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(state)); } catch {}
}

export function dismissOnboarding(uid) {
  const state = loadOnboarding(uid);
  saveOnboarding(uid, { ...state, dismissed: true });
}

export function markVisited(uid, view) {
  const state = loadOnboarding(uid);
  const visited = new Set(state.visited || []);
  visited.add(view);
  saveOnboarding(uid, { ...state, visited: [...visited] });
}

/**
 * Evalúa qué items están completados y retorna los nuevos.
 * Retorna { newlyCompleted, allCompleted, allDone }
 */
export function evaluateChecklist(uid, context) {
  const state      = loadOnboarding(uid);
  const prevDone   = new Set(state.completed || []);
  const visited    = new Set(state.visited || []);
  const ctx        = { ...context, visited };

  const nowDone    = CHECKLIST.filter(item => item.check(ctx)).map(i => i.id);
  const newlyDone  = nowDone.filter(id => !prevDone.has(id));
  const allDone    = nowDone.length === CHECKLIST.length;

  if (newlyDone.length > 0) {
    saveOnboarding(uid, { ...state, completed: nowDone });
  }

  return {
    newlyCompleted: newlyDone,
    allCompleted:   nowDone,
    allDone,
    bonusClaimed:   state.bonusClaimed,
  };
}

export function claimBonus(uid) {
  const state = loadOnboarding(uid);
  saveOnboarding(uid, { ...state, bonusClaimed: true });
}
