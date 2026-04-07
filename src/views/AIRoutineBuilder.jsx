import { useState } from "react";

const EXAMPLE = `Pega tu rutina aquí en cualquier formato. Puede ser:
- Notas de WhatsApp o voz transcrita
- "Upper A: press banca serie1: 80kg 8 reps, serie2: 80kg 7 reps"
- "Lower B: prensa unilateral 40kg x lado 3x8, peso rumano 90kg RIR1"
- O exactamente como la tienes anotada, sin formato especial`;

const SYSTEM_PROMPT = `Eres un experto mundial en programación de entrenamiento de hipertrofia y fuerza. Tienes conocimiento profundo de ejercicios, nomenclaturas del gym, abreviaciones en español e inglés, y todos los formatos posibles en que las personas registran sus rutinas.

El usuario va a pegarte su rutina en CUALQUIER formato — desordenado, abreviado, con errores de tipeo, mezclado español/inglés, con notas personales, con alternativas de máquinas, etc.

DEBES retornar SOLO un objeto JSON válido, sin markdown, sin explicaciones, sin texto adicional.

FORMATO DE SALIDA EXACTO:
{
  "Nombre del Día": {
    "exercises": [
      {
        "name": "Nombre normalizado del ejercicio",
        "sets": [
          { "weight": 80.0, "reps": 8, "note": "" }
        ]
      }
    ]
  }
}

REGLAS CRÍTICAS — LEE TODAS:

SERIES VACÍAS O INCOMPLETAS:
- "Serie 1:" sin datos → { "weight": 0, "reps": 0, "note": "sin datos" }
- "serie 2:65kilos repeticiones" sin número de reps → reps: 0
- "serie 2:60kilos 9repeticiones" (sin espacio) → weight: 60, reps: 9
- NUNCA omitas una serie aunque esté vacía — inclúyela con weight:0 reps:0

EJERCICIOS CON "O" / ALTERNATIVAS:
- "sentadilla o hacka" → nombre: "Sentadilla" (quédate con el PRIMERO antes del "o")
- "máquina X // alternativa Y" → quédate con X
- "ejercicio A / ejercicio B" → quédate con A

TYPOS Y ERRORES:
- "tepeticiones", "repetciones", "repetticiones" → siempre son "repeticiones"
- "kilos" = "kg"
- "serie 2:60kilos" (sin espacio) → weight:60
- Números pegados: "9repeticiones" → reps:9

SERIES:
- "3x8 80kg" → 3 series idénticas
- "serie1: 80kg 8r, serie2: 77.5kg 7r" → series con pesos distintos
- Si solo hay "Serie 1" y "Serie 2" listadas → créalas ambas aunque estén vacías

PESOS:
- Comas decimales: "14,7" → 14.7
- "x lado" o "por lado" → agrega note:"x lado"
- "peso corporal" → weight: 0
- "barra vacía" → weight: 20

NOTAS EN PARÉNTESIS:
- "(mejora de 2 reps)", "(personal record)", "(técnica)" → va en note del set correspondiente
- No afecta el parseo de peso ni reps

NOMBRES:
- Normaliza con tildes: "extension" → "Extensión", "cuadriceps" → "Cuádriceps"
- "peso rumano" → "Peso Muerto Rumano"
- "hip trust" → "Hip Thrust"
- "curl femoral" → "Curl Femoral"
- "máquina aductores" → "Máquina de Aductores"
- "máquina gemelos" → "Máquina de Gemelos"
- Abreviaciones: RDL→Peso Muerto Rumano, OHP→Press Militar, BP→Press de Banca

DÍAS:
- Usa el nombre exacto del usuario: "Dia 2: Lower A" → clave: "Lower A" (sin el "Dia 2:")
- Si hay Upper A y Upper B → días distintos
- Mantén el orden exacto

REGLA FINAL: Nunca omitas un ejercicio ni una serie aunque tenga datos incompletos. Siempre incluye todo con weight:0 y reps:0 si faltan datos. SOLO retorna el JSON.`;

export default function AIRoutineBuilder({ onRoutineReady, onBack }) {
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function handleParse() {
    if (!input.trim()) { setError("Pega tu rutina arriba."); return; }
    setLoading(true);
    setError("");
    setPreview(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Aquí está mi rutina. Parsea todo y retorna el JSON:\n\n${input}`
            }
          ],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const text = data.content?.[0]?.text || "";

      // Intentar extraer JSON aunque venga con backticks o texto extra
      let jsonStr = text.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      jsonStr = jsonStr.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(jsonStr);

      // Validar estructura
      const days = Object.keys(parsed);
      if (!days.length) throw new Error("No se encontraron días.");

      const totalExercises = days.reduce((a, d) => a + (parsed[d]?.exercises?.length || 0), 0);
      if (!totalExercises) throw new Error("No se encontraron ejercicios.");

      setPreview(parsed);
      setAttempt(0);
    } catch (err) {
      const newAttempt = attempt + 1;
      setAttempt(newAttempt);
      if (newAttempt < 2) {
        setError(`Intento ${newAttempt} fallido. Reintentando...`);
        setTimeout(handleParse, 1000);
      } else {
        setError("No pude estructurar la rutina. Intenta agregar más detalle o separar los días más claramente.");
        setAttempt(0);
      }
      console.warn("Parse error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    await onRoutineReady(preview);
  }

  // Estadísticas del preview
  const previewStats = preview ? {
    days: Object.keys(preview).length,
    exercises: Object.values(preview).reduce((a, d) => a + (d.exercises?.length || 0), 0),
    sets: Object.values(preview).reduce((a, d) =>
      a + (d.exercises || []).reduce((b, ex) => b + (ex.sets?.length || 0), 0), 0
    ),
  } : null;

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", padding: "28px 18px",
      fontFamily: "DM Mono, monospace", minHeight: "100vh",
      background: "transparent",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 12, marginBottom: 16 }}>← VOLVER</button>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(240,240,240,0.30)", marginBottom: 6 }}>CONFIGURACIÓN INICIAL</div>
        <h1 style={{ fontSize: 22, fontWeight: 400, color: "var(--text)", margin: 0 }}>
          Crear rutina con IA 🤖
        </h1>
        <p style={{ fontSize: 13, color: "rgba(240,240,240,0.30)", marginTop: 8, lineHeight: 1.6 }}>
          Pega tu rutina en cualquier formato. La IA entiende pesos decimales, RIR, notas de máquina, formatos mezclados, abreviaciones — exactamente como lo tienes anotado.
        </p>
      </div>

      {/* Input */}
      {!preview && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(240,240,240,0.30)", marginBottom: 8 }}>TU RUTINA</div>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); setAttempt(0); }}
              placeholder={EXAMPLE}
              rows={12}
              style={{
                width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
                color: "var(--text)", padding: "12px 14px", borderRadius: 10,
                fontSize: 12, fontFamily: "inherit", outline: "none",
                lineHeight: 1.7, boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", marginTop: 4, textAlign: "right" }}>
              {input.length} caracteres
            </div>
          </div>

          {error && (
            <div style={{
              color: "var(--red)", fontSize: 12, marginBottom: 12,
              background: "#7f1d1d22", border: "1px solid #ef444433",
              padding: "8px 12px", borderRadius: 8,
            }}>{error}</div>
          )}

          <button onClick={handleParse} disabled={loading || !input.trim()} style={{
            width: "100%", padding: "14px",
            background: loading ? "var(--bg2)" : !input.trim() ? "var(--bg2)" : "#7c3aed",
            border: loading || !input.trim() ? "1px solid var(--border)" : "none",
            borderRadius: 10,
            color: loading || !input.trim() ? "var(--text3)" : "#fff",
            fontWeight: 700, fontSize: 13, letterSpacing: 2,
            cursor: loading || !input.trim() ? "default" : "pointer",
            fontFamily: "inherit", transition: "background 0.2s",
          }}>
            {loading ? "⏳ ANALIZANDO CON IA..." : "🤖 GENERAR RUTINA"}
          </button>

          {/* Tips */}
          <div style={{
            marginTop: 14, padding: "14px 16px",
            background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
            borderRadius: 10, fontSize: 11, color: "rgba(240,240,240,0.30)", lineHeight: 1.8,
          }}>
            <div style={{ color: "rgba(240,240,240,0.55)", fontSize: 12, marginBottom: 8 }}>💡 La IA entiende:</div>
            <div>✓ Pesos decimales: 14,7kg → 14.7kg</div>
            <div>✓ "x lado", "por lado" → lo agrega como nota</div>
            <div>✓ RIR, al fallo, ajustes de máquina</div>
            <div>✓ Formatos mixtos: 3x8, "3 series de 8", "serie1/serie2"</div>
            <div>✓ Abreviaciones: RDL, OHP, BP, etc.</div>
            <div>✓ Alternativas con // → usa el primer ejercicio</div>
          </div>
        </>
      )}

      {/* Preview */}
      {preview && (
        <div>
          {/* Stats */}
          <div style={{
            background: "#14532d22", border: "1px solid #22c55e44",
            borderRadius: 10, padding: "12px 16px", marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: 1 }}>✓ RUTINA DETECTADA</div>
            <div style={{ fontSize: 11, color: "rgba(240,240,240,0.30)" }}>
              {previewStats.days}d · {previewStats.exercises}ex · {previewStats.sets} series
            </div>
            <button onClick={() => setPreview(null)} className="nbtn" style={{
              fontSize: 11, color: "rgba(240,240,240,0.30)", border: "1px solid var(--glass-border)",
              padding: "4px 10px", borderRadius: 6,
            }}>EDITAR</button>
          </div>

          {/* Días */}
          {Object.entries(preview).map(([day, data]) => (
            <div key={day} style={{
              background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
              borderLeft: "3px solid #7c3aed", borderRadius: 10,
              marginBottom: 10, overflow: "hidden",
            }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: "var(--text)" }}>{day}</span>
                <span style={{ fontSize: 11, color: "#7c3aed" }}>{data.exercises?.length || 0} ejercicios</span>
              </div>
              <div style={{ padding: "10px 14px" }}>
                {(data.exercises || []).map((ex, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, color: "rgba(240,240,240,0.55)", marginBottom: 4 }}>{ex.name}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(ex.sets || []).map((set, si) => (
                        <span key={si} style={{
                          fontSize: 10, background: "#7c3aed22", color: "#a78bfa",
                          padding: "2px 8px", borderRadius: 6,
                        }}>
                          {set.weight}kg × {set.reps}{set.note ? ` (${set.note})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", padding: "14px",
            background: saving ? "#14532d" : "#22c55e",
            border: "none", borderRadius: 10, color: "#f0f0f0",
            fontWeight: 700, fontSize: 13, letterSpacing: 2,
            cursor: saving ? "default" : "pointer", fontFamily: "inherit",
            marginTop: 4,
          }}>
            {saving ? "GUARDANDO..." : "✓ USAR ESTA RUTINA"}
          </button>
        </div>
      )}
    </div>
  );
}
