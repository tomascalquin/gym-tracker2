  /**
 * api/claude.js — Vercel Serverless Function
 *
 * Proxy para api.anthropic.com. Resuelve el problema de CORS
 * que impide llamar directamente desde una PWA/APK.
 *
 * La API key vive en una variable de entorno de Vercel (ANTHROPIC_API_KEY),
 * nunca se expone al cliente.
 *
 * Endpoint: POST /api/claude
 * Body: { prompt, maxTokens?, system? }
 * Respuesta: { text: string }
 */

export const config = {
  runtime: "edge", // Edge runtime — más rápido y sin cold starts
};

export default async function handler(req) {
  // Solo POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // CORS — permite llamadas desde cualquier origen (tu PWA en cualquier dominio)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada en Vercel" }),
      { status: 500, headers: corsHeaders }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Body inválido" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { prompt, maxTokens = 600, system = null } = body;
  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "Falta el campo prompt" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Construir request para Anthropic
  const anthropicBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  if (system) anthropicBody.system = system;

  try {
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
      return new Response(
        JSON.stringify({ error: data.error?.message || `HTTP ${response.status}` }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const text = data.content?.map(b => b.text || "").join("") || "";
    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
