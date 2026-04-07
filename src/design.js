/**
 * Design tokens — Liquid Glass Dark
 */
export const tokens = {
  radius: { sm: 8, md: 12, lg: 18, xl: 24, full: 999 },
  shadow: {
    sm:   "0 2px 8px rgba(0,0,0,0.3)",
    md:   "0 4px 20px rgba(0,0,0,0.4)",
    lg:   "0 8px 40px rgba(0,0,0,0.5)",
    dark: "0 4px 20px rgba(0,0,0,0.6)",
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
  glass: {
    bg:      "rgba(255,255,255,0.08)",
    bgHover: "rgba(255,255,255,0.12)",
    bgDone:  "rgba(167,139,250,0.18)",
    border:  "rgba(255,255,255,0.14)",
    border2: "rgba(255,255,255,0.22)",
    blur:    "blur(40px) saturate(180%)",
    blurSm:  "blur(20px) saturate(160%)",
  },
};

export const GLASS = {
  card: {
    background:          "var(--glass-bg)",
    backdropFilter:      "var(--glass-blur)",
    WebkitBackdropFilter:"var(--glass-blur)",
    border:              "1px solid var(--glass-border)",
    borderRadius:        18,
  },
  cardSm: {
    background:          "var(--glass-bg)",
    backdropFilter:      "var(--glass-blur-sm)",
    WebkitBackdropFilter:"var(--glass-blur-sm)",
    border:              "1px solid var(--glass-border)",
    borderRadius:        14,
  },
  cardDone: {
    background:          "rgba(167,139,250,0.18)",
    backdropFilter:      "var(--glass-blur)",
    WebkitBackdropFilter:"var(--glass-blur)",
    border:              "1px solid rgba(167,139,250,0.35)",
    borderRadius:        18,
  },
};

export function btnPrimary(disabled = false) {
  return {
    background:          disabled ? "rgba(255,255,255,0.10)" : "rgba(167,139,250,0.18)",
    backdropFilter:      "var(--glass-blur-sm)",
    WebkitBackdropFilter:"var(--glass-blur-sm)",
    border:              "1px solid rgba(167,139,250,0.35)",
    color:               disabled ? "rgba(255,255,255,0.30)" : "#080810",
    padding:             "14px 20px",
    borderRadius: 18,
    cursor:              disabled ? "default" : "pointer",
    fontSize:            11,
    fontWeight:          700,
    letterSpacing:       2,
    fontFamily:          "inherit",
    width:               "100%",
    minHeight:           50,
    transition:          tokens.transition.fast,
    WebkitTapHighlightColor: "transparent",
  };
}

export function btnSecondary() {
  return {
    background:          "var(--glass-bg)",
    backdropFilter:      "var(--glass-blur-sm)",
    WebkitBackdropFilter:"var(--glass-blur-sm)",
    border:              "1px solid var(--glass-border)",
    color: "rgba(240,240,240,0.55)",
    padding:             "12px 16px",
    borderRadius: 18,
    cursor:              "pointer",
    fontSize:            10,
    letterSpacing:       2,
    fontWeight:          700,
    fontFamily:          "inherit",
    minHeight:           44,
    transition:          tokens.transition.fast,
    WebkitTapHighlightColor: "transparent",
  };
}

export function card() {
  return { ...GLASS.card };
}

export function cardDark() {
  return {
    background:          "rgba(0,0,0,0.50)",
    backdropFilter:      "var(--glass-blur)",
    WebkitBackdropFilter:"var(--glass-blur)",
    border:              "1px solid var(--glass-border)",
    borderRadius: 18,
    overflow:            "hidden",
  };
}

export function input(options = {}) {
  const { focused, error } = options;
  return {
    width:               "100%",
    background:          "rgba(255,255,255,0.08)",
    border:              `1px solid ${error ? "#f87171" : focused ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.14)"}`,
    color:               "#f0f0f0",
    padding:             "11px 14px",
    borderRadius: 12,
    fontSize:            14,
    fontFamily:          "inherit",
    outline:             "none",
    transition:          tokens.transition.fast,
  };
}
