// Liquid Glass — siempre dark, solo cambia la paleta de orbs de fondo
const THEME_KEY = "gymtracker_theme";

// Ambos modos usan glass dark. "light" = orbs más suaves / menos saturados
export const THEMES = {
  dark: {
    "--bg":      "#080810",
    "--bg2":     "rgba(255,255,255,0.07)",
    "--bg3":     "rgba(255,255,255,0.04)",
    "--border":  "rgba(255,255,255,0.12)",
    "--border2": "rgba(255,255,255,0.20)",
    "--text":    "#f0f0f0",
    "--text2":   "rgba(240,240,240,0.55)",
    "--text3":   "rgba(240,240,240,0.30)",
    "--accent":  "#f0f0f0",
    "--green":   "#4ade80",
    "--red":     "#f87171",
    "--yellow":  "#fbbf24",
    "--glass-bg":      "rgba(255,255,255,0.08)",
    "--glass-bg-hover":"rgba(255,255,255,0.12)",
    "--glass-border":  "rgba(255,255,255,0.14)",
    "--glass-border2": "rgba(255,255,255,0.22)",
    "--orb1": "radial-gradient(ellipse 60% 50% at 20% 10%, rgba(88,56,230,0.45) 0%, transparent 70%)",
    "--orb2": "radial-gradient(ellipse 50% 60% at 80% 30%, rgba(14,100,200,0.35) 0%, transparent 70%)",
    "--orb3": "radial-gradient(ellipse 55% 45% at 50% 85%, rgba(120,40,180,0.30) 0%, transparent 70%)",
  },
  light: {
    "--bg":      "#0a0a18",
    "--bg2":     "rgba(255,255,255,0.07)",
    "--bg3":     "rgba(255,255,255,0.04)",
    "--border":  "rgba(255,255,255,0.12)",
    "--border2": "rgba(255,255,255,0.20)",
    "--text":    "#f0f0f0",
    "--text2":   "rgba(240,240,240,0.55)",
    "--text3":   "rgba(240,240,240,0.30)",
    "--accent":  "#f0f0f0",
    "--green":   "#4ade80",
    "--red":     "#f87171",
    "--yellow":  "#fbbf24",
    "--glass-bg":      "rgba(255,255,255,0.08)",
    "--glass-bg-hover":"rgba(255,255,255,0.12)",
    "--glass-border":  "rgba(255,255,255,0.14)",
    "--glass-border2": "rgba(255,255,255,0.22)",
    "--orb1": "radial-gradient(ellipse 60% 50% at 20% 10%, rgba(20,140,80,0.40) 0%, transparent 70%)",
    "--orb2": "radial-gradient(ellipse 50% 60% at 80% 30%, rgba(14,100,200,0.30) 0%, transparent 70%)",
    "--orb3": "radial-gradient(ellipse 55% 45% at 50% 85%, rgba(60,40,180,0.25) 0%, transparent 70%)",
  },
};

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function applyTheme(theme) {
  const vars = THEMES[theme] || THEMES.dark;
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
  document.body.style.background = vars["--bg"];
  document.body.style.color = vars["--text"];
  document.documentElement.setAttribute("data-theme", theme);
}

applyTheme(getTheme());
