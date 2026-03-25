/**
 * api/claude.js — Vercel Serverless Function
 * Proxy para Groq API. 100% gratis sin tarjeta de crédito.
 * Consigue tu key gratis en: console.groq.com
 */

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY no configurada en Vercel" });

  const { prompt, maxTokens = 600, system = null } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Falta prompt" });

  try {
    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: maxTokens,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(response.status).json({ error: data.error?.message || `HTTP ${response.status}` });
    }

    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
