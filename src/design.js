/**
 * Sistema de diseño de Gym Tracker.
 * Todos los componentes deben usar estos tokens.
 */

export const tokens = {
  radius: {
    sm:   6,
    md:   10,
    lg:   14,
    xl:   20,
    full: 999,
  },
  shadow: {
    sm:  "0 1px 3px rgba(0,0,0,0.4)",
    md:  "0 4px 12px rgba(0,0,0,0.4)",
    lg:  "0 8px 28px rgba(0,0,0,0.5)",
    glow: (color) => `0 0 20px ${color}44, 0 4px 12px ${color}22`,
  },
  spacing: {
    xs: 4, sm: 8, md: 14, lg: 20, xl: 28,
  },
  font: {
    xs:  9,
    sm:  11,
    md:  13,
    lg:  16,
    xl:  20,
    xxl: 28,
  },
  transition: {
    fast:   "all 0.12s ease",
    normal: "all 0.22s ease",
    spring: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
    fade:   "opacity 0.2s ease",
  },
};

// Botón primario
export function btnPrimary(color = "#60a5fa", disabled = false) {
  return {
    background:    disabled ? "var(--bg2)" : color,
    border:        disabled ? "1px solid var(--border)" : "none",
    color:         disabled ? "var(--text3)" : "#000",
    padding:       "13px 20px",
    borderRadius:  tokens.radius.lg,
    cursor:        disabled ? "default" : "pointer",
    fontSize:      tokens.font.sm,
    fontWeight:    700,
    letterSpacing: 2,
    fontFamily:    "inherit",
    width:         "100%",
    minHeight:     48,
    transition:    tokens.transition.fast,
    boxShadow:     disabled ? "none" : tokens.shadow.glow(color),
    WebkitTapHighlightColor: "transparent",
  };
}

// Botón secundario (outline)
export function btnSecondary(color = "var(--text3)") {
  return {
    background:    "transparent",
    border:        `1px solid var(--border)`,
    color,
    padding:       "11px 16px",
    borderRadius:  tokens.radius.lg,
    cursor:        "pointer",
    fontSize:      tokens.font.sm,
    letterSpacing: 1,
    fontFamily:    "inherit",
    minHeight:     44,
    transition:    tokens.transition.fast,
    WebkitTapHighlightColor: "transparent",
  };
}

// Card estándar
export function card(options = {}) {
  const { accent, glow, active } = options;
  return {
    background:   "var(--bg2)",
    border:       `1px solid ${active && accent ? accent + "55" : "var(--border)"}`,
    borderRadius: tokens.radius.lg,
    overflow:     "hidden",
    boxShadow:    glow && accent ? tokens.shadow.glow(accent) : tokens.shadow.sm,
    transition:   tokens.transition.normal,
  };
}

// Input estándar
export function input(options = {}) {
  const { accent, error } = options;
  return {
    width:        "100%",
    background:   "var(--bg3)",
    border:       `1px solid ${error ? "var(--red)" : accent ? accent + "44" : "var(--border)"}`,
    color:        "var(--text)",
    padding:      "11px 14px",
    borderRadius: tokens.radius.md,
    fontSize:     tokens.font.md,
    fontFamily:   "inherit",
    outline:      "none",
    transition:   tokens.transition.fast,
  };
}
