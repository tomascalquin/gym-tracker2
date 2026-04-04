/**
 * tooltips.js — Sistema de hints contextuales no invasivos
 * Se muestran una sola vez, solo cuando el usuario está en la pantalla relevante.
 * Guardado en localStorage.
 */

const KEY = (uid) => `gymtracker_hints_${uid}`;

export const HINTS = {
  progress: {
    id:   "progress",
    text: "Aquí ves cómo evoluciona tu fuerza en cada ejercicio con el tiempo.",
    icon: "📊",
  },
  progression: {
    id:   "progression",
    text: "Esta calculadora predice cuándo llegarás a tu próximo PR basándose en tu historial real.",
    icon: "🔮",
  },
  tools: {
    id:   "tools",
    text: "Calculá tu 1RM, convertí libras a kilos y sacá tu puntaje Wilks para compararte globalmente.",
    icon: "🔧",
  },
  weeklySummary: {
    id:   "weeklySummary",
    text: "Una IA analiza tu semana completa y te da recomendaciones personalizadas basadas en ciencia del entrenamiento.",
    icon: "🤖",
  },
  achievements: {
    id:   "achievements",
    text: "Los logros se desbloquean automáticamente. Algunos son secretos — descubrirlos es parte del juego.",
    icon: "🏅",
  },
  leaderboard: {
    id:   "leaderboard",
    text: "El ranking se basa en XP. Los PRs valen más que simplemente entrenar — la calidad supera la cantidad.",
    icon: "◈",
  },
  history: {
    id:   "history",
    text: "Swipeá una sesión hacia la izquierda para eliminarla. Tocá 'VER' para repetirla con los mismos pesos.",
    icon: "◫",
  },
  sleep: {
    id:   "sleep",
    text: "El sueño es cuando tu músculo crece. 8h optimiza la producción de hormona de crecimiento.",
    icon: "😴",
  },
  mesocycle: {
    id:   "mesocycle",
    text: "Un mesociclo planifica 4-8 semanas de entrenamiento con sobrecarga progresiva automática y deload incluido.",
    icon: "📅",
  },
  friends: {
    id:   "friends",
    text: "Tus amigos ven tu actividad cuando entrenas. La presión social positiva aumenta la adherencia un 30%.",
    icon: "◎",
  },
};

export function loadSeenHints(uid) {
  try {
    const raw = localStorage.getItem(KEY(uid));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function markHintSeen(uid, hintId) {
  const seen = loadSeenHints(uid);
  seen.add(hintId);
  try { localStorage.setItem(KEY(uid), JSON.stringify([...seen])); } catch {}
}

export function shouldShowHint(uid, hintId) {
  return !loadSeenHints(uid).has(hintId);
}
