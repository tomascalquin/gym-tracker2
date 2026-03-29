/**
 * Design tokens — Cream & Black Editorial
 */
export const tokens = {
  radius: { sm: 6, md: 10, lg: 16, xl: 22, full: 999 },
  shadow: {
    sm:  "0 1px 4px rgba(0,0,0,0.06)",
    md:  "0 4px 16px rgba(0,0,0,0.08)",
    lg:  "0 8px 32px rgba(0,0,0,0.10)",
    dark: "0 4px 20px rgba(0,0,0,0.25)",
    glow: () => "none",
  },
  spacing: { xs: 4, sm: 8, md: 14, lg: 20, xl: 28 },
  font: { xs: 8, sm: 10, md: 13, lg: 16, xl: 22, xxl: 32 },
  transition: {
    fast:   "all 0.12s ease",
    normal: "all 0.22s ease",
    spring: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    fade:   "opacity 0.2s ease",
  },
  // Colores del concepto editorial
  cream: "#f5f5f0",
  black: "#111111",
  cream2: "#ffffff",
  cream3: "#eeede8",
  border: "#e0dfd8",
  muted: "#99998a",
  muted2: "#555550",
};

// Pill de color de día — sobre fondo crema
export const DAY_PILL = {
  "Upper A": { bg: "#111", color: "#f5f5f0" },
  "Upper B": { bg: "#111", color: "#f5f5f0" },
  "Lower A": { bg: "#111", color: "#f5f5f0" },
  "Lower B": { bg: "#111", color: "#f5f5f0" },
};

export function btnPrimary(disabled = false) {
  return {
    background:    disabled ? tokens.cream3 : tokens.black,
    border:        "none",
    color:         disabled ? tokens.muted : tokens.cream,
    padding:       "14px 20px",
    borderRadius:  tokens.radius.lg,
    cursor:        disabled ? "default" : "pointer",
    fontSize:      11,
    fontWeight:    700,
    letterSpacing: 2,
    fontFamily:    "inherit",
    width:         "100%",
    minHeight:     50,
    transition:    tokens.transition.fast,
    WebkitTapHighlightColor: "transparent",
  };
}

export function btnSecondary() {
  return {
    background:    "transparent",
    border:        `1.5px solid ${tokens.border}`,
    color:         tokens.muted2,
    padding:       "12px 16px",
    borderRadius:  tokens.radius.lg,
    cursor:        "pointer",
    fontSize:      10,
    letterSpacing: 2,
    fontWeight:    700,
    fontFamily:    "inherit",
    minHeight:     44,
    transition:    tokens.transition.fast,
    WebkitTapHighlightColor: "transparent",
  };
}

export function card() {
  return {
    background:   tokens.cream2,
    border:       `1px solid ${tokens.border}`,
    borderRadius: tokens.radius.lg,
    overflow:     "hidden",
  };
}

export function cardDark() {
  return {
    background:   tokens.black,
    borderRadius: tokens.radius.lg,
    overflow:     "hidden",
  };
}

export function input(options = {}) {
  const { focused, error } = options;
  return {
    width:        "100%",
    background:   tokens.cream3,
    border:       `1px solid ${error ? "#c0392b" : focused ? tokens.black : tokens.border}`,
    color:        tokens.black,
    padding:      "11px 14px",
    borderRadius: tokens.radius.md,
    fontSize:     14,
    fontFamily:   "inherit",
    outline:      "none",
    transition:   tokens.transition.fast,
  };
}
