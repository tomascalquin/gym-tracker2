/**
 * Calcula la racha actual de entrenamientos.
 * Una racha se mantiene si entrenaste hoy o ayer.
 * Se rompe si no hay sesión en los últimos 2 días calendario.
 *
 * @param {Object} logs - { key: { date, ... } }
 * @returns {number} días de racha actual
 */
export function calcStreak(logs) {
  if (!logs || !Object.keys(logs).length) return 0;

  // Obtener fechas únicas ordenadas descendente
  const dates = [...new Set(Object.values(logs).map(s => s.date))]
    .sort((a, b) => b.localeCompare(a));

  if (!dates.length) return 0;

  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr     = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // La racha solo cuenta si entrenaste hoy o ayer
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak  = 0;
  let current = new Date(dates[0]);
  current.setHours(0, 0, 0, 0);

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);

    const diffDays = Math.round((current - d) / 86400000);

    if (diffDays === 0) {
      // Mismo día, no sumar
      continue;
    } else if (diffDays === 1) {
      // Día consecutivo
      streak++;
      current = d;
    } else {
      // Hubo un gap — rompe la racha
      break;
    }
  }

  // Sumar el día más reciente
  streak++;

  return streak;
}

/**
 * Emoji según el nivel de racha.
 */
export function streakEmoji(streak) {
  if (streak === 0)  return "";
  if (streak < 3)    return "🔥";
  if (streak < 7)    return "🔥🔥";
  if (streak < 14)   return "🔥🔥🔥";
  if (streak < 30)   return "⚡";
  return "💀";
}

/**
 * Mensaje motivacional según la racha.
 */
export function streakMessage(streak) {
  if (streak === 0)  return "Sin racha activa";
  if (streak === 1)  return "¡Empezando!";
  if (streak < 3)    return "¡Buen comienzo!";
  if (streak < 7)    return "¡Vas bien!";
  if (streak < 14)   return "¡Una semana seguida!";
  if (streak < 30)   return "¡Imparable!";
  return "¡Leyenda!";
}
