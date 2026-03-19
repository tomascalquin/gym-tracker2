const THEME_KEY = "gym_theme";

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export const THEMES = {
  dark: {
    bg:        "#080810",
    bgCard:    "#0e0e1a",
    bgInput:   "#0a0a14",
    border:    "#1a1a2a",
    text:      "#f1f5f9",
    textSub:   "#94a3b8",
    textMuted: "#475569",
    textDim:   "#334155",
  },
  light: {
    bg:        "#f1f5f9",
    bgCard:    "#ffffff",
    bgInput:   "#f8fafc",
    border:    "#e2e8f0",
    text:      "#0f172a",
    textSub:   "#334155",
    textMuted: "#64748b",
    textDim:   "#94a3b8",
  },
};
