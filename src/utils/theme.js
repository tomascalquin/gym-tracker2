const THEME_KEY = "gymtracker_theme";

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
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
  if (theme === "dark") {
    root.style.setProperty("--bg",     "#111111");
    root.style.setProperty("--bg2",    "#1a1a1a");
    root.style.setProperty("--bg3",    "#222222");
    root.style.setProperty("--border", "#2a2a2a");
    root.style.setProperty("--text",   "#f5f5f0");
    root.style.setProperty("--text2",  "#aaa9a0");
    root.style.setProperty("--text3",  "#666660");
    root.style.setProperty("--accent", "#f5f5f0");
    root.style.setProperty("--green",  "#4ade80");
    root.style.setProperty("--red",    "#f87171");
    root.style.setProperty("--yellow", "#fbbf24");
    document.body.style.background = "#111111";
  } else {
    root.style.setProperty("--bg",     "#f5f5f0");
    root.style.setProperty("--bg2",    "#ffffff");
    root.style.setProperty("--bg3",    "#eeede8");
    root.style.setProperty("--border", "#e0dfd8");
    root.style.setProperty("--text",   "#111111");
    root.style.setProperty("--text2",  "#555550");
    root.style.setProperty("--text3",  "#99998a");
    root.style.setProperty("--accent", "#111111");
    root.style.setProperty("--green",  "#1a6b3a");
    root.style.setProperty("--red",    "#c0392b");
    root.style.setProperty("--yellow", "#b8860b");
    document.body.style.background = "#f5f5f0";
  }
  document.body.style.color = "var(--text)";
}

// Aplicar al importar
applyTheme(getTheme());
