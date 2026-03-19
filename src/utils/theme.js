const THEME_KEY = "gymtracker_theme";

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  const current = getTheme();
  const next    = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") {
    // Tema claro premium — gris cálido, no blanco puro
    root.style.setProperty("--bg",     "#f0ede8");
    root.style.setProperty("--bg2",    "#e8e4de");
    root.style.setProperty("--bg3",    "#ddd9d2");
    root.style.setProperty("--border", "#c8c3bb");
    root.style.setProperty("--text",   "#1a1814");
    root.style.setProperty("--text2",  "#4a4540");
    root.style.setProperty("--text3",  "#7a7570");
    root.style.setProperty("--accent", "#2563eb");
    root.style.setProperty("--green",  "#16a34a");
    root.style.setProperty("--red",    "#dc2626");
    root.style.setProperty("--yellow", "#d97706");
  } else {
    root.style.setProperty("--bg",     "#080810");
    root.style.setProperty("--bg2",    "#0e0e1a");
    root.style.setProperty("--bg3",    "#0a0a14");
    root.style.setProperty("--border", "#1a1a2a");
    root.style.setProperty("--text",   "#f1f5f9");
    root.style.setProperty("--text2",  "#94a3b8");
    root.style.setProperty("--text3",  "#475569");
    root.style.setProperty("--accent", "#60a5fa");
    root.style.setProperty("--green",  "#22c55e");
    root.style.setProperty("--red",    "#ef4444");
    root.style.setProperty("--yellow", "#fbbf24");
  }
  document.body.style.background = `var(--bg)`;
  document.body.style.color      = `var(--text)`;
}

// Aplicar al importar
applyTheme(getTheme());
