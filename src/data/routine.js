/**
 * Rutina Upper/Lower 4 días — Tomás
 * Fuente de verdad para ejercicios y sets base.
 * Modificar acá si cambia la rutina.
 */

export const ROUTINE = {
  "Upper A": {
    exercises: [
      { name: "Máquina Pecho",         sets: [{ weight: 40,    reps: 7 }, { weight: 40,    reps: 6 }] },
      { name: "Jalón al Pecho",         sets: [{ weight: 86,    reps: 6 }, { weight: 79,    reps: 7 }] },
      { name: "Extensión Tríceps",      sets: [{ weight: 30,    reps: 9 }, { weight: 30,    reps: 7 }] },
      { name: "Bayesian (Bíceps)",      sets: [{ weight: 14.7,  reps: 7 }, { weight: 14.7,  reps: 6 }] },
      { name: "Peck Deck",              sets: [{ weight: 113,   reps: 7 }, { weight: 107,   reps: 7 }] },
      { name: "Press Francés",          sets: [{ weight: 14,    reps: 6 }, { weight: 14,    reps: 6 }] },
      { name: "Predicador en Banco",    sets: [{ weight: 16,    reps: 6 }, { weight: 16,    reps: 5 }] },
      { name: "Elevaciones Laterales",  sets: [{ weight: 14,    reps: 8 }, { weight: 14,    reps: 6 }] },
      { name: "Remo T",                 sets: [{ weight: 30,    reps: 8, note: "x lado" }, { weight: 30, reps: 7, note: "x lado" }] },
      { name: "Reverse Curl",           sets: [{ weight: 14.5,  reps: 6 }, { weight: 12,    reps: 7 }] },
    ],
  },
  "Upper B": {
    exercises: [
      { name: "Curl Bíceps Predicador", sets: [{ weight: 35,    reps: 7, note: "lbs" }, { weight: 35, reps: 6 }] },
      { name: "Press Militar Barra",    sets: [{ weight: 65,    reps: 6 }, { weight: 60,    reps: 6 }] },
      { name: "Extensión Tríceps",      sets: [{ weight: 38.75, reps: 6 }, { weight: 38.75, reps: 6 }] },
      { name: "Peck Deck",              sets: [{ weight: 96,    reps: 6 }, { weight: 96,    reps: 6 }] },
      { name: "Press Francés",          sets: [{ weight: 14,    reps: 7 }, { weight: 14,    reps: 6 }] },
      { name: "Curl Bayesian",          sets: [{ weight: 16,    reps: 8 }, { weight: 16,    reps: 7 }] },
      { name: "Remo Agarre Amplio",     sets: [{ weight: 34,    reps: 8 }, { weight: 34,    reps: 7 }] },
      { name: "Reverse Curl Bíceps",    sets: [{ weight: 13.5,  reps: 7 }, { weight: 13.5,  reps: 7 }, { weight: 13.5, reps: 7 }] },
    ],
  },
  "Lower A": {
    exercises: [
      { name: "Hack Squat",             sets: [{ weight: 35, reps: 8, note: "pies cerrados" }, { weight: 35, reps: 5, note: "pies cerrados" }] },
      { name: "Peso Rumano",            sets: [{ weight: 90, reps: 6 }, { weight: 90, reps: 5 }] },
      { name: "Extensión de Cuádriceps",sets: [{ weight: 90, reps: 6 }, { weight: 90, reps: 5 }] },
      { name: "Curl Femoral Sentado",   sets: [{ weight: 54, reps: 9 }, { weight: 59, reps: 8 }] },
      { name: "Aductores (máquina)",    sets: [{ weight: 77, reps: 6 }, { weight: 72, reps: 6 }] },
    ],
  },
  "Lower B": {
    exercises: [
      { name: "Prensa Unilateral",      sets: [{ weight: 40,  reps: 9, note: "x lado" }, { weight: 40,  reps: 8, note: "x lado" }, { weight: 40, reps: 7, note: "x lado" }] },
      { name: "Peso Rumano",            sets: [{ weight: 90,  reps: 6, note: "RIR 1"  }, { weight: 90,  reps: 6 }] },
      { name: "Búlgara (Smith)",        sets: [{ weight: 25,  reps: 7, note: "x lado" }] },
      { name: "Extensión de Cuádriceps",sets: [{ weight: 110, reps: 7 }, { weight: 103, reps: 7 }] },
      { name: "Curl Femoral Sentado",   sets: [{ weight: 75,  reps: 10 }, { weight: 75, reps: 9 }, { weight: 75, reps: 8 }] },
      { name: "Aductor Sentado",        sets: [{ weight: 140, reps: 9  }, { weight: 140, reps: 5 }, { weight: 139, reps: 5 }] },
      { name: "Aducción",               sets: [{ weight: 110, reps: 7  }, { weight: 110, reps: 7 }] },
    ],
  },
};

export const DAY_ORDER = ["Upper A", "Lower A", "Upper B", "Lower B"];

export const DAY_META = {
  "Upper A": { accent: "#60a5fa", dim: "#1e3a5f", tag: "UPPER" },
  "Upper B": { accent: "#a78bfa", dim: "#2d1b69", tag: "UPPER" },
  "Lower A": { accent: "#34d399", dim: "#064e3b", tag: "LOWER" },
  "Lower B": { accent: "#fb923c", dim: "#431407", tag: "LOWER" },
};
