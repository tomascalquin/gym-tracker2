/**
 * api/claude.js — Vercel Serverless Function (CommonJS)
 * Proxy para api.anthropic.com. Resuelve CORS en PWA/APK.
 * La API key vive en ANTHROPIC_API_KEY (Vercel Environment Variables).
 */

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada" });

  const { prompt, maxTokens = 600, system = null } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Falta prompt" });

  try {
    const anthropicBody = {
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    };
    if (system) anthropicBody.system = system;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(response.status).json({ error: data.error?.message || `HTTP ${response.status}` });
    }

    const text = (data.content || []).map(b => b.text || "").join("");
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
