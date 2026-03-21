/**
 * Haptic feedback usando la Vibration API.
 * Funciona en Android Chrome y algunos iOS con PWA.
 */

const supported = typeof navigator !== "undefined" && "vibrate" in navigator;

export const haptics = {
  // Serie completada — tap suave
  light: () => supported && navigator.vibrate(10),

  // Acción confirmada — tap medio
  medium: () => supported && navigator.vibrate(20),

  // Éxito — doble tap
  success: () => supported && navigator.vibrate([15, 50, 15]),

  // Error — vibración larga
  error: () => supported && navigator.vibrate([50, 30, 50]),

  // PR / rango subido — celebración
  celebrate: () => supported && navigator.vibrate([20, 40, 20, 40, 60]),

  // Eliminar — advertencia
  warning: () => supported && navigator.vibrate([0, 30, 60]),
};
