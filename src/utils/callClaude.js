/**
 * callClaude.js
 * Llama al proxy Vercel (/api/claude) en lugar de api.anthropic.com directamente.
 * Esto resuelve el problema de CORS en PWA, iOS y APK de PWABuilder.
 */

export async function callClaude(prompt, { maxTokens = 600, system = null } = {}) {
  const body = { prompt, maxTokens };
  if (system) body.system = system;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data.text || "";
}
