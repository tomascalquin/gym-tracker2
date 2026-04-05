/**
 * i18n.js — Sistema de idioma simple (español / inglés)
 * Guarda la preferencia en localStorage.
 */

const LANG_KEY = "gymtracker_lang";

export function getLang() {
  return localStorage.getItem(LANG_KEY) || "es";
}

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new Event("langchange"));
}

// ── Traducciones ──────────────────────────────────────────────────────────────
export const T = {
  // ── Genérico
  back: { es: "‹", en: "‹" },
  save: { es: "Guardar", en: "Save" },
  cancel: { es: "Cancelar", en: "Cancel" },
  confirm: { es: "Confirmar", en: "Confirm" },
  close: { es: "Cerrar", en: "Close" },
  loading: { es: "Cargando...", en: "Loading..." },
  yes: { es: "Sí", en: "Yes" },
  no: { es: "No", en: "No" },

  // ── Home
  home_greeting_morning: { es: "Buenos días", en: "Good morning" },
  home_greeting_afternoon: { es: "Buenas tardes", en: "Good afternoon" },
  home_greeting_evening: { es: "Buenas noches", en: "Good evening" },
  home_streak: { es: "racha", en: "streak" },
  home_sessions: { es: "sesiones", en: "sessions" },
  home_this_week: { es: "esta semana", en: "this week" },
  home_start_session: { es: "Iniciar sesión", en: "Start session" },
  home_no_routine: { es: "Sin rutina configurada", en: "No routine configured" },
  home_configure_routine: { es: "Configura tu rutina", en: "Configure your routine" },

  // ── TabBar
  tab_home: { es: "Inicio", en: "Home" },
  tab_history: { es: "Historial", en: "History" },
  tab_progress: { es: "Progreso", en: "Progress" },
  tab_tools: { es: "Herramientas", en: "Tools" },
  tab_profile: { es: "Perfil", en: "Profile" },

  // ── Session / Banner
  banner_in_progress: { es: "EN PROGRESO", en: "IN PROGRESS" },
  banner_sets: { es: "series", en: "sets" },
  banner_tap_to_continue: { es: "toca para continuar", en: "tap to continue" },
  banner_go: { es: "IR", en: "GO" },

  // ── Tools
  tools_title: { es: "HERRAMIENTAS", en: "TOOLS" },
  tools_weight: { es: "⚖️ Peso", en: "⚖️ Weight" },
  tools_orm: { es: "💪 1RM", en: "💪 1RM" },
  tools_points: { es: "🏆 Wilks/IPF", en: "🏆 Wilks/IPF" },
  tools_rpe: { es: "🎯 RPE/RIR", en: "🎯 RPE/RIR" },
  tools_weight_converter: { es: "CONVERSOR KG ↔ LB", en: "KG ↔ LB CONVERTER" },
  tools_quick_weights: { es: "PESOS RÁPIDOS", en: "QUICK WEIGHTS" },
  tools_plate_ref: { es: "REFERENCIA DE PLATOS", en: "PLATE REFERENCE" },
  tools_plate: { es: "Plato", en: "Plate" },
  tools_bar: { es: "Barra olímpica", en: "Olympic barbell" },
  tools_1rm_title: { es: "CALCULADORA 1RM", en: "1RM CALCULATOR" },
  tools_1rm_formula: { es: "FÓRMULA", en: "FORMULA" },
  tools_1rm_result: { es: "1RM ESTIMADO", en: "ESTIMATED 1RM" },
  tools_pct_table: { es: "TABLA DE PORCENTAJES", en: "PERCENTAGE TABLE" },
  tools_weight_col: { es: "Peso", en: "Weight" },
  tools_reps_est: { es: "Reps est.", en: "Est. reps" },
  tools_rpe_table: { es: "📋 Tabla RPE", en: "📋 RPE Table" },
  tools_rpe_calc: { es: "🧮 Calculadora", en: "🧮 Calculator" },
  tools_rpe_description: { es: "Descripción", en: "Description" },
  tools_rpe_pct: { es: "% 1RM POR RPE Y REPS", en: "% 1RM BY RPE AND REPS" },
  tools_rpe_calc_hint: { es: "Ingresa el peso y reps que hiciste + el RPE percibido → obtienes tu 1RM estimado.", en: "Enter the weight and reps you did + perceived RPE → get your estimated 1RM." },
  tools_rpe_perceived: { es: "RPE PERCIBIDO", en: "PERCEIVED RPE" },
  tools_rpe_easy: { es: "RPE 7 — fácil", en: "RPE 7 — easy" },
  tools_rpe_failure: { es: "RPE 10 — fallo", en: "RPE 10 — failure" },
  tools_rpe_row_maxabs: { es: "Máximo absoluto, fallo total", en: "Absolute maximum, complete failure" },
  tools_rpe_row_nearf: { es: "Casi fallo, podría haber 1 con duda", en: "Near failure, maybe 1 more with doubt" },
  tools_rpe_row_1rit: { es: "Deja 1 rep en el tanque", en: "Leaves 1 rep in the tank" },
  tools_rpe_row_12rit: { es: "Entre 1 y 2 reps en reserva", en: "Between 1 and 2 reps in reserve" },
  tools_rpe_row_2rit: { es: "Deja 2 reps en el tanque", en: "Leaves 2 reps in the tank" },
  tools_rpe_row_23rit: { es: "Entre 2 y 3 reps en reserva", en: "Between 2 and 3 reps in reserve" },
  tools_rpe_row_3rit: { es: "Deja 3 reps en el tanque", en: "Leaves 3 reps in the tank" },
  tools_rpe_row_4rit: { es: "Esfuerzo moderado, 4+ reps de reserva", en: "Moderate effort, 4+ reps in reserve" },
  tools_rpe_row_5rit: { es: "Esfuerzo leve, muy fácil", en: "Light effort, very easy" },
  tools_wilks_sex_m: { es: "♂ Masculino", en: "♂ Male" },
  tools_wilks_sex_f: { es: "♀ Femenino", en: "♀ Female" },
  tools_wilks_bw: { es: "Peso corporal", en: "Body weight" },
  tools_wilks_squat: { es: "Sentadilla", en: "Squat" },
  tools_wilks_bench: { es: "Banca", en: "Bench" },
  tools_wilks_dead: { es: "Peso Muerto", en: "Deadlift" },
  tools_wilks_hint: { es: "También puedes ingresar un solo ejercicio en cualquier campo", en: "You can also enter just one exercise in any field" },
  tools_wilks_levels: { es: "NIVELES DE REFERENCIA (Wilks2)", en: "REFERENCE LEVELS (Wilks2)" },
  tools_wilks_level_reached: { es: "Nivel alcanzado:", en: "Level reached:" },
  tools_level_elite: { es: "Elite", en: "Elite" },
  tools_level_master: { es: "Maestro", en: "Master" },
  tools_level_advanced: { es: "Avanzado", en: "Advanced" },
  tools_level_intermediate: { es: "Intermedio", en: "Intermediate" },
  tools_level_novice: { es: "Novel", en: "Novice" },
  tools_kilogram: { es: "Kilogramos", en: "Kilograms" },
  tools_pound: { es: "Libras", en: "Pounds" },
  tools_done_reps: { es: "Reps hechas", en: "Reps done" },

  // ── Mesocycle
  meso_title: { es: "Mesociclo 📅", en: "Mesocycle 📅" },
  meso_planning: { es: "PLANIFICACIÓN", en: "PLANNING" },
  meso_what_is: { es: "¿Qué es?", en: "What is it?" },
  meso_new: { es: "NUEVO", en: "NEW" },
  meso_deload_abbr: { es: "DLD", en: "DLD" },
  meso_guide: { es: "GUÍA", en: "GUIDE" },
  meso_explainer_title: { es: "¿Qué es un mesociclo? 📅", en: "What is a mesocycle? 📅" },
  meso_explainer_def_title: { es: "Definición", en: "Definition" },
  meso_explainer_def: { es: "Un mesociclo es un bloque de entrenamiento de 4 a 8 semanas con progresión planificada. En lugar de entrenar siempre igual, cada semana sube el volumen o la intensidad hasta llegar a una semana de deload (descarga) que te permite recuperarte.", en: "A mesocycle is a training block of 4 to 8 weeks with planned progression. Instead of training the same way every time, each week the volume or intensity increases until reaching a deload week that allows you to recover." },
  meso_explainer_why_title: { es: "¿Por qué funciona?", en: "Why does it work?" },
  meso_explainer_why: { es: "Tu cuerpo se adapta al estrés en ciclos. Acumular estrés progresivo y luego reducirlo (deload) es el mecanismo base de la supercompensación — así es como progresas de verdad en fuerza e hipertrofia.", en: "Your body adapts to stress in cycles. Accumulating progressive stress and then reducing it (deload) is the base mechanism of supercompensation — that's how you truly progress in strength and hypertrophy." },
  meso_how_long: { es: "¿CUÁNTO TIEMPO?", en: "HOW LONG?" },
  meso_short: { es: "Corto", en: "Short" },
  meso_intermediate_dur: { es: "Intermedio", en: "Intermediate" },
  meso_long: { es: "Largo", en: "Long" },
  meso_short_desc: { es: "Cuando quieres cambiar de objetivo pronto, eres principiante, o tienes poca tolerancia al volumen.", en: "When you want to change your goal soon, are a beginner, or have low volume tolerance." },
  meso_intermediate_desc: { es: "El más común. Suficiente para acumular volumen y notar adaptaciones claras sin sobreentrenar.", en: "The most common. Enough to accumulate volume and notice clear adaptations without overtraining." },
  meso_long_desc: { es: "Para avanzados con buena tolerancia al volumen. Más tiempo acumulando = más potencial de adaptación.", en: "For advanced athletes with good volume tolerance. More accumulation time = more adaptation potential." },
  meso_deload_title: { es: "Semana de deload", en: "Deload week" },
  meso_deload_desc: { es: "La última semana siempre es un deload: baja el volumen e intensidad al ~50–60%. Esto no es perder el tiempo — es cuando el cuerpo consolida las adaptaciones. Sales más fuerte para el siguiente mesociclo.", en: "The last week is always a deload: lower volume and intensity to ~50–60%. This is not wasted time — it's when the body consolidates adaptations. You come out stronger for the next mesocycle." },
  meso_understood: { es: "ENTENDIDO, CONFIGURAR", en: "GOT IT, CONFIGURE" },
  meso_rec_title: { es: "Nuevo mesociclo 🔄", en: "New mesocycle 🔄" },
  meso_rec_subtitle: { es: "Basado en tu rutina actual, esto es lo que te recomendamos", en: "Based on your current routine, here's our recommendation" },
  meso_rec_split: { es: "SPLIT RECOMENDADO", en: "RECOMMENDED SPLIT" },
  meso_rec_footer: { es: "Puedes aceptar la recomendación o configurar el mesociclo manualmente con los parámetros que quieras.", en: "You can accept the recommendation or configure the mesocycle manually with your preferred parameters." },
  meso_configure_myself: { es: "CONFIGURAR YO", en: "CONFIGURE MYSELF" },
  meso_start_new: { es: "EMPEZAR NUEVO", en: "START NEW" },
  meso_objective: { es: "OBJETIVO", en: "GOAL" },
  meso_duration: { es: "DURACIÓN DEL MESOCICLO", en: "MESOCYCLE DURATION" },
  meso_days_week: { es: "DÍAS POR SEMANA", en: "DAYS PER WEEK" },
  meso_level: { es: "NIVEL DE ENTRENAMIENTO", en: "TRAINING LEVEL" },
  meso_bodyweight: { es: "PESO CORPORAL (opcional — para nutrición)", en: "BODY WEIGHT (optional — for nutrition)" },
  meso_bw_placeholder: { es: "ej. 75", en: "e.g. 75" },
  meso_few_sessions: { es: "Con 3+ sesiones registradas el plan se personaliza con tu historial real de fatiga y estancamiento.", en: "With 3+ logged sessions the plan is personalized with your real fatigue and stagnation history." },
  meso_generate: { es: "✦ GENERAR MESOCICLO", en: "✦ GENERATE MESOCYCLE" },
  meso_generating: { es: "CALCULANDO TU PLAN...", en: "CALCULATING YOUR PLAN..." },
  meso_deload_week: { es: "SEMANA DE DELOAD", en: "DELOAD WEEK" },
  meso_week_of: { es: "DE", en: "OF" },
  meso_sessions: { es: "SESIONES", en: "SESSIONS" },
  meso_days: { es: "DÍAS", en: "DAYS" },
  meso_total_sets: { es: "series total", en: "total sets" },
  meso_reps: { es: "reps", en: "reps" },
  meso_analysis: { es: "ANÁLISIS PERSONALIZADO", en: "PERSONALIZED ANALYSIS" },
  meso_deload_note: { es: "Semana de deload: baja los pesos ~40-50%, enfócate en la técnica", en: "Deload week: lower weights ~40-50%, focus on technique" },
  meso_rir_note: { es: "RIR objetivo:", en: "Target RIR:" },
  meso_rir_note2: { es: "— deja", en: "— leave" },
  meso_rir_note3: { es: "repeticiones en el tanque en cada serie", en: "reps in the tank each set" },
  meso_duration_short: { es: "Corto · Ideal para principiantes o cambio rápido de objetivo", en: "Short · Ideal for beginners or quick goal change" },
  meso_current_routine: { es: "TU RUTINA ACTUAL", en: "YOUR CURRENT ROUTINE" },
  meso_exercises: { es: "EJERCICIOS", en: "EXERCISES" },

  // ── Goals (mesocycle)
  goal_hypertrophy_label: { es: "Hipertrofia", en: "Hypertrophy" },
  goal_hypertrophy_desc: { es: "Maximizar músculo. Rango 6-15 reps, RIR 1-3.", en: "Maximize muscle. Range 6-15 reps, RIR 1-3." },
  goal_strength_label: { es: "Fuerza", en: "Strength" },
  goal_strength_desc: { es: "Maximizar 1RM. Rango 1-6 reps, RIR 0-2.", en: "Maximize 1RM. Range 1-6 reps, RIR 0-2." },
  goal_mixed_label: { es: "Fuerza + Hipertrofia", en: "Strength + Hypertrophy" },
  goal_mixed_desc: { es: "Balance entre ambos objetivos. Rango 4-12 reps.", en: "Balance between both goals. Range 4-12 reps." },

  // ── Levels (mesocycle)
  level_beginner_label: { es: "Principiante", en: "Beginner" },
  level_beginner_desc: { es: "< 1 año", en: "< 1 year" },
  level_intermediate_label: { es: "Intermedio", en: "Intermediate" },
  level_intermediate_desc: { es: "1-3 años", en: "1-3 years" },
  level_advanced_label: { es: "Avanzado", en: "Advanced" },
  level_advanced_desc: { es: "3+ años", en: "3+ years" },

  // ── Spam cooldown
  cooldown_title: { es: "Cooldown activo", en: "Cooldown active" },
  cooldown_msg: { es: "Ya guardaste esta sesión hace poco. Espera {min} min antes de volver a registrarla.", en: "You already saved this session recently. Wait {min} min before logging it again." },

  // ── Profile / settings
  profile_language: { es: "Idioma", en: "Language" },
  profile_lang_es: { es: "Español", en: "Spanish" },
  profile_lang_en: { es: "Inglés", en: "English" },

  // ── Offline
  offline_banner: { es: "Sin conexión — los cambios se sincronizarán al volver", en: "Offline — changes will sync when back online" },
  synced: { es: "Sincronizado: {n} cambio(s)", en: "Synced: {n} change(s)" },

  // ── Onboarding
  onboarding_step1_title: { es: "Completa tu primera sesión", en: "Complete your first session" },
  onboarding_step1_desc: { es: "Elige un día de tu rutina y registra el entrenamiento", en: "Pick a day from your routine and log the workout" },
  onboarding_step3_title: { es: "Completa 3 sesiones", en: "Complete 3 sessions" },

  // ── Streak
  streak_good: { es: "¡Vas bien!", en: "Going strong!" },

  // ── Week focus (mesocycle)
  week_focus_deload: { es: "Recuperación y técnica — no te exijas", en: "Recovery and technique — take it easy" },
  week_focus_base: { es: "Semana de acumulación — establecer línea base", en: "Accumulation week — establish baseline" },
  week_focus_accumulate: { es: "Fase de acumulación — construir volumen", en: "Accumulation phase — build volume" },
  week_focus_intensify: { es: "Fase de intensificación — más carga, menos volumen", en: "Intensification phase — more load, less volume" },

  // ── Muscle labels
  muscle_chest: { es: "Pecho", en: "Chest" },
  muscle_back: { es: "Espalda", en: "Back" },
  muscle_shoulders: { es: "Hombros", en: "Shoulders" },
  muscle_biceps: { es: "Bíceps", en: "Biceps" },
  muscle_triceps: { es: "Tríceps", en: "Triceps" },
  muscle_quads: { es: "Cuádriceps", en: "Quads" },
  muscle_hamstrings: { es: "Isquiotibiales", en: "Hamstrings" },
  muscle_glutes: { es: "Glúteos", en: "Glutes" },
  muscle_calves: { es: "Pantorrillas", en: "Calves" },
  muscle_adductors: { es: "Aductores", en: "Adductors" },
};

/** Retorna el texto traducido para la clave dada. */
export function t(key, lang, vars = {}) {
  const entry = T[key];
  if (!entry) return key;
  let text = entry[lang] || entry["es"] || key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}
