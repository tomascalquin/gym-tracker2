/**
 * api/claude.js — Vercel Serverless Function
 * Proxy a Groq con validaciones de origen y rate limit básico por IP.
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const GROQ_TIMEOUT_MS = 15000;
const ipHits = new Map();

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isAllowedOrigin(originHeader, req) {
  if (!originHeader) return false;
  const raw = process.env.ALLOWED_ORIGINS || "";
  const allowed = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!allowed.length) {
    const host = req.headers.host;
    if (!host) return false;
    const sameOriginCandidates = [`https://${host}`, `http://${host}`];
    if (host.includes("localhost")) {
      sameOriginCandidates.push("http://localhost:5173");
    }
    return sameOriginCandidates.includes(originHeader);
  }
  return allowed.includes(originHeader);
}

function applyRateLimit(ip) {
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || now - record.startedAt > WINDOW_MS) {
    ipHits.set(ip, { count: 1, startedAt: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;
  record.count += 1;
  ipHits.set(ip, record);
  return true;
}

function cleanupOldRateLimitEntries() {
  const now = Date.now();
  for (const [ip, data] of ipHits.entries()) {
    if (now - data.startedAt > WINDOW_MS * 2) {
      ipHits.delete(ip);
    }
  }
}

module.exports = async function handler(req, res) {
  cleanupOldRateLimitEntries();

  const origin = req.headers.origin;
  const originAllowed = isAllowedOrigin(origin, req);

  if (originAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    if (!originAllowed) return res.status(403).json({ error: "Origin not allowed" });
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!originAllowed) return res.status(403).json({ error: "Origin not allowed" });

  const ip = getClientIp(req);
  if (!applyRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in one minute." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing GROQ_API_KEY in environment" });

  const { prompt, maxTokens = 600, system = null } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt" });
  }
  if (prompt.length > 8000) {
    return res.status(400).json({ error: "Prompt too long" });
  }

  const safeMaxTokens = Math.max(1, Math.min(Number(maxTokens) || 600, 1000));

  try {
    const messages = [];
    if (typeof system === "string" && system.trim()) {
      messages.push({ role: "system", content: system.slice(0, 2000) });
    }
    messages.push({ role: "user", content: prompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: safeMaxTokens,
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_parseError) {
      return res.status(502).json({ error: "Invalid upstream response format" });
    }
    if (!response.ok || data.error) {
      return res.status(response.status).json({ error: data.error?.message || `HTTP ${response.status}` });
    }

    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (err) {
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "Upstream timeout" });
    }
    return res.status(500).json({ error: err.message || "Unexpected server error" });
  }
};
