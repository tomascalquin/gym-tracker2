import { useMemo, useState } from "react";

// ─── Mapeo ejercicio → músculos ───────────────────────────────────────────────
const EXERCISE_MUSCLES = {
  "press de banca":          ["pecho","triceps","deltoides_ant","antebrazo"],
  "press banca":             ["pecho","triceps","deltoides_ant","antebrazo"],
  "press inclinado":         ["pecho","triceps","deltoides_ant"],
  "press declinado":         ["pecho","triceps"],
  "aperturas":               ["pecho"],
  "aperturas con cable":     ["pecho"],
  "fondos":                  ["pecho","triceps"],
  "pullover":                ["pecho","dorsal"],
  "dominadas":               ["dorsal","biceps","trapecio","redondo_mayor"],
  "jalón":                   ["dorsal","biceps","redondo_mayor"],
  "jalón al pecho":          ["dorsal","biceps","redondo_mayor"],
  "remo con barra":          ["dorsal","trapecio","biceps","redondo_mayor","antebrazo"],
  "remo mancuerna":          ["dorsal","trapecio","redondo_mayor","antebrazo"],
  "remo en polea":           ["dorsal","biceps","antebrazo"],
  "peso muerto":             ["lumbar","gluteo","isquios","trapecio","dorsal","antebrazo"],
  "peso muerto rumano":      ["isquios","gluteo","lumbar"],
  "face pull":               ["deltoides_post","trapecio"],
  "press militar":           ["deltoides_ant","deltoides_lat","triceps"],
  "press arnold":            ["deltoides_ant","deltoides_lat","triceps"],
  "elevaciones laterales":   ["deltoides_lat"],
  "elevaciones frontales":   ["deltoides_ant"],
  "curl bíceps":             ["biceps","antebrazo"],
  "curl bíceps barra":       ["biceps","antebrazo"],
  "curl martillo":           ["biceps","antebrazo"],
  "curl predicador":         ["biceps","antebrazo"],
  "curl concentrado":        ["biceps","antebrazo"],
  "press francés":           ["triceps"],
  "rompecráneos":            ["triceps"],
  "extensión tríceps":       ["triceps"],
  "fondos tríceps":          ["triceps"],
  "sentadilla":              ["cuadriceps","gluteo","isquios","lumbar"],
  "sentadilla búlgara":      ["cuadriceps","gluteo"],
  "sentadilla frontal":      ["cuadriceps","gluteo"],
  "prensa de piernas":       ["cuadriceps","gluteo"],
  "extensión de cuádriceps": ["cuadriceps"],
  "curl femoral":            ["isquios"],
  "curl femoral sentado":    ["isquios"],
  "hip thrust":              ["gluteo","isquios"],
  "hack squat":              ["cuadriceps","gluteo"],
  "zancadas":                ["cuadriceps","gluteo"],
  "gemelos":                 ["gemelos"],
  "gemelos de pie":          ["gemelos"],
  "gemelos sentado":         ["gemelos"],
  "abdominales":             ["abdomen"],
  "plancha":                 ["abdomen","lumbar"],
  "aductores":               ["aductores"],
  "máquina de aductores":    ["aductores"],
  "curl de muñeca":          ["antebrazo"],
  "extensión de muñeca":     ["antebrazo"],
  "farmer walk":             ["antebrazo"],
};

function getMuscles(name) {
  const lower = name.toLowerCase();
  for (const [key, muscles] of Object.entries(EXERCISE_MUSCLES)) {
    if (lower.includes(key)) return muscles;
  }
  return [];
}

function calcIntensity(logs, routine, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const counts = {};
  Object.values(logs).forEach(session => {
    if (new Date(session.date) < cutoff) return;
    const exs = routine?.[session.day]?.exercises || [];
    exs.forEach((ex, ei) => {
      const sets = session.sets?.[ei] || [];
      if (sets.length > 0) {
        getMuscles(ex.name).forEach(m => {
          counts[m] = (counts[m] || 0) + sets.length;
        });
      }
    });
  });
  const max = Math.max(...Object.values(counts), 1);
  const out = {};
  Object.entries(counts).forEach(([m, c]) => { out[m] = Math.min(c / max, 1); });
  return out;
}

function getOverlayColor(v) {
  if (!v || v <= 0) return null;
  if (v < 0.3)  return `rgba(59,130,246,${0.35 + v * 0.5})`;
  if (v < 0.65) return `rgba(251,146,60,${0.5 + v * 0.3})`;
  return `rgba(239,68,68,${0.65 + v * 0.25})`;
}

function getGlow(v) {
  if (!v || v <= 0) return "none";
  if (v < 0.3)  return "0 0 12px rgba(59,130,246,0.8)";
  if (v < 0.65) return "0 0 16px rgba(251,146,60,0.9)";
  return "0 0 24px rgba(239,68,68,1), 0 0 8px rgba(255,80,80,0.6)";
}

const LABELS = {
  pecho:          "Pecho",
  dorsal:         "Dorsal",
  trapecio:       "Trapecio",
  deltoides_ant:  "Deltoides ant.",
  deltoides_lat:  "Deltoides lat.",
  deltoides_post: "Deltoides post.",
  biceps:         "Bíceps",
  triceps:        "Tríceps",
  abdomen:        "Abdomen",
  cuadriceps:     "Cuádriceps",
  isquios:        "Isquios",
  gluteo:         "Glúteo",
  gemelos:        "Gemelos",
  lumbar:         "Lumbar",
  aductores:      "Aductores",
  antebrazo:      "Antebrazos",
  redondo_mayor:  "Redondo Mayor",
};

// ─── Zonas de overlay sobre la imagen (en % del tamaño de imagen 280x746) ────
// Cada zona es un polígono o elipse posicionado sobre la imagen real
// Coordenadas ajustadas a la imagen 280x746

const FRONT_ZONES = [
  { id: "pecho",         shape: "poly", points: "80,195 89,212 100,224 124,224 135,213 135,189 130,163 117,156 101,160 81,166 81,187" },
  { id: "pecho",         shape: "poly", points: "149,163 144,178 144,199 156,219 178,219 195,210 201,189 201,170 189,158 172,156 161,156" },
  { id: "abdomen",       shape: "poly", points: "110,247 109,275 115,317 118,330 140,337 166,337 170,304 175,264 175,229 156,219 137,221 115,230" },
  { id: "abdomen",       shape: "poly", points: "179,232 183,264 176,296 176,311 184,322 190,322 193,304 196,273 201,247 201,218 179,225" },
  { id: "abdomen",       shape: "poly", points: "112,236 112,261 110,290 110,313 104,319 97,317 95,288 95,264 90,242 100,238" },
  { id: "biceps",        shape: "poly", points: "206,210 209,229 218,247 224,259 235,264 241,253 238,224 227,198 213,187 209,183 207,196" },
  { id: "biceps",        shape: "poly", points: "75,189 61,202 52,222 48,245 49,267 55,270 63,261 80,230 81,219 81,190" },
  { id: "trapecio",      shape: "poly", points: "161,146 160,133 161,129 173,132 186,138 195,146 181,147 173,150" },
  { id: "trapecio",      shape: "poly", points: "84,150 98,155 109,156 118,155 120,146 120,132 110,132 101,140 87,143" },
  { id: "cuadriceps",    shape: "poly", points: "183,357 181,379 178,416 173,445 176,471 183,494 192,506 201,503 201,492 209,488 221,491 222,471 224,454 221,411 213,394 202,379 196,363 192,359" },
  { id: "cuadriceps",    shape: "poly", points: "129,495 118,505 107,497 107,482 94,482 98,495 89,491 83,462 83,448 78,416 77,402 80,383 89,370 98,356 104,368 112,396 123,420 124,433 127,451 129,465 132,488" },
  { id: "deltoides_ant", shape: "poly", points: "183,155 193,161 202,172 204,181 222,190 233,195 232,179 232,163 221,146 204,144 193,146" },
  { id: "deltoides_ant", shape: "poly", points: "103,160 92,163 83,175 78,187 63,195 52,210 46,198 49,181 54,169 69,156 80,150 92,153" },
  { id: "aductores",     shape: "poly", points: "147,388 152,410 158,429 166,449 172,433 173,414 173,390 176,371 176,356 176,340 166,354 163,365 149,376" },
  { id: "aductores",     shape: "poly", points: "103,354 107,376 112,393 121,419 124,439 130,457 135,466 138,442 143,422 144,403 141,390 129,363 120,348 109,336 104,347" },
  { id: "antebrazo",     shape: "poly", points: "37,261 31,282 25,304 26,328 32,342 49,331 55,316 64,284 63,268 55,267 48,267" },
  { id: "antebrazo",     shape: "poly", points: "218,273 225,301 239,321 253,331 261,317 258,311 255,288 250,268 247,255 225,258 224,267" },
];

const BACK_ZONES = [
  { id: "deltoides_post", shape: "poly", points: "126,149 110,156 98,173 77,187 77,172 84,156 100,144 112,150" },
  { id: "deltoides_post", shape: "poly", points: "219,164 224,169 236,179 244,190 241,175 233,161 224,153 218,158" },
  { id: "deltoides_lat",  shape: "poly", points: "72,184 66,172 69,163 72,153 89,146 101,141 84,153 80,161 75,172 72,178" },
  { id: "trapecio",       shape: "poly", points: "149,137 152,149 144,149 123,140 112,133 129,127 144,121 149,115 149,130" },
  { id: "trapecio",       shape: "poly", points: "166,121 170,137 173,147 179,149 192,150 199,150 206,146 186,133 178,126" },
  { id: "gemelos",        shape: "poly", points: "155,529 153,549 158,569 163,586 170,601 176,615 187,617 193,609 193,587 196,569 192,546 190,529 179,509 172,500 158,520 156,529" },
  { id: "gemelos",        shape: "poly", points: "95,505 80,529 77,546 80,569 86,589 92,607 97,627 104,643 110,620 115,598 120,572 117,554 112,532 107,512 106,505" },
  { id: "dorsal",         shape: "poly", points: "120,310 109,287 98,259 95,247 106,230 107,212 110,202 132,201 141,216 146,235 150,250 152,265 135,275 130,298" },
  { id: "dorsal",         shape: "poly", points: "190,314 189,285 190,267 204,252 213,232 212,216 202,209 196,207 187,216 179,227 175,239 170,253 170,262 170,276 175,294 183,307 187,316" },
  { id: "lumbar",         shape: "poly", points: "118,319 129,308 133,293 137,276 144,268 158,264 166,273 169,291 184,308 181,319 173,330 161,347 158,357 144,345 138,331 120,317" },
  { id: "gluteo",         shape: "poly", points: "106,316 95,333 95,348 97,368 109,388 121,400 138,400 144,383 152,363 147,351 133,333 123,321" },
  { id: "gluteo",         shape: "poly", points: "186,328 164,347 160,359 150,373 152,388 164,397 189,400 193,388 196,373 192,356 192,336" },
  { id: "isquios",        shape: "poly", points: "90,377 81,403 78,433 78,452 80,479 84,495 86,509 98,505 106,503 120,494 124,477 126,449 129,429 133,408 132,399 118,400 100,385" },
  { id: "isquios",        shape: "poly", points: "152,528 144,512 138,495 140,474 138,451 138,428 138,413 144,394 158,393 175,397 189,400 190,417 189,442 189,457 181,480 178,497 170,502 155,506 156,518" },
  { id: "triceps",        shape: "poly", points: "74,198 66,222 63,241 67,259 74,271 92,276 90,261 95,247 97,238 103,224 104,210 104,198 106,184 98,176 89,183 80,195" },
  { id: "triceps",        shape: "poly", points: "224,189 219,210 215,227 219,244 227,258 239,273 253,276 258,264 255,248 252,229 248,206 242,190 235,183" },
  { id: "redondo_mayor", shape: "poly", points: "133,199 120,201 107,195 106,186 95,169 100,160 113,158 127,153 140,163 135,186" },
  { id: "redondo_mayor", shape: "poly", points: "202,169 199,184 199,198 206,210 221,212 219,201 222,192 224,178 216,167 206,163" },
  { id: "antebrazo",     shape: "poly", points: "51,267 44,284 34,319 26,340 38,337 55,322 69,307 81,285 74,270 64,267" },
  { id: "antebrazo",     shape: "poly", points: "227,275 225,301 230,327 235,347 252,348 259,330 261,304 253,287 242,275" },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MuscleMap({ logs, routine }) {
  const [period, setPeriod]   = useState(7);
  const [side, setSide]       = useState("front");
  const [hovered, setHovered] = useState(null);

  const intensity = useMemo(
    () => calcIntensity(logs, routine, period),
    [logs, routine, period]
  );

  const top = Object.entries(intensity)
    .filter(([,v]) => v > 0)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5);

  const zones = side === "front" ? FRONT_ZONES : BACK_ZONES;
  const img   = side === "front" ? "/muscle_front.png" : "/muscle_back.png";

  // Mostrar imagen a su tamaño natural — las coordenadas del calibrador son 280x746
  const DISPLAY_W = 280;
  const DISPLAY_H = 746;

  function scalePoints(points) {
    return points; // coordenadas ya están en espacio 280x746, no escalar
  }

  return (
    <div style={{ fontFamily: "DM Mono, monospace" }}>

      {/* Controles */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[{l:"HOY",d:1},{l:"7D",d:7},{l:"30D",d:30}].map(p => (
            <button key={p.d} onClick={() => setPeriod(p.d)} style={{
              background: period===p.d ? "#60a5fa22" : "var(--bg3)",
              border: `1px solid ${period===p.d ? "#60a5fa55" : "var(--border)"}`,
              color: period===p.d ? "#60a5fa" : "var(--text3)",
              padding: "4px 10px", borderRadius: 99, fontSize: 9,
              letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
            }}>{p.l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["front","back"].map(s => (
            <button key={s} onClick={() => setSide(s)} style={{
              background: side===s ? "#60a5fa22" : "var(--bg3)",
              border: `1px solid ${side===s ? "#60a5fa44" : "var(--border)"}`,
              color: side===s ? "#60a5fa" : "var(--text3)",
              padding: "4px 10px", borderRadius: 8, fontSize: 9,
              letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
            }}>{s==="front" ? "FRENTE" : "ESPALDA"}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>

        {/* Imagen + SVG overlay */}
        <div style={{ position: "relative", width: DISPLAY_W, height: DISPLAY_H, flexShrink: 0 }}>
          {/* Imagen base */}
          <img
            src={img}
            alt="muscle anatomy"
            style={{
              width: DISPLAY_W, height: DISPLAY_H,
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* SVG overlay con zonas interactivas */}
          <svg
            viewBox={`0 0 ${DISPLAY_W} ${DISPLAY_H}`}
            width={DISPLAY_W}
            height={DISPLAY_H}
            style={{
              position: "absolute", top: 0, left: 0,
              pointerEvents: "none",
            }}
          >
            <defs>
              {/* Filtro blur para el glow */}
              <filter id="glow-low">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-mid">
                <feGaussianBlur stdDeviation="5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-high">
                <feGaussianBlur stdDeviation="8" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {zones.map((zone, i) => {
              const v      = intensity[zone.id] || 0;
              const color  = getOverlayColor(v);
              const isHov  = hovered === zone.id;

              const fillColor = isHov
                ? "rgba(255,255,255,0.22)"
                : color || "rgba(255,255,255,0)";

              const strokeColor = isHov
                ? "#ffffff"
                : color || "rgba(255,255,255,0.08)";

              const filter = v >= 0.65 ? "url(#glow-high)"
                           : v >= 0.3  ? "url(#glow-mid)"
                           : v > 0     ? "url(#glow-low)"
                           : "none";

              return (
                <polygon
                  key={i}
                  points={scalePoints(zone.points)}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isHov ? 1.5 : 0.4}
                  strokeOpacity={isHov ? 0.8 : 0.3}
                  filter={filter}
                  style={{
                    pointerEvents: "all",
                    cursor: "pointer",
                    transition: "fill 0.4s ease",
                    mixBlendMode: v > 0 ? "screen" : "normal",
                  }}
                  onMouseEnter={() => setHovered(zone.id)}
                  onMouseLeave={() => setHovered(null)}
                  onTouchStart={() => setHovered(zone.id)}
                  onTouchEnd={() => setTimeout(() => setHovered(null), 1500)}
                />
              );
            })}
          </svg>
        </div>

        {/* Panel lateral */}
        <div style={{ flex: 1 }}>
          {/* Tooltip hover */}
          {hovered && (
            <div style={{
              marginBottom: 12,
              background: "#60a5fa15",
              border: "1px solid #60a5fa44",
              borderRadius: 10, padding: "10px 12px",
              animation: "scaleIn 0.15s ease",
            }}>
              <div style={{ fontSize: 12, color: "#60a5fa", marginBottom: 3 }}>
                {LABELS[hovered] || hovered}
              </div>
              <div style={{ fontSize: 18, color: "var(--text)", fontWeight: 300 }}>
                {intensity[hovered] > 0
                  ? `${Math.round((intensity[hovered] || 0) * 100)}%`
                  : "Sin trabajar"
                }
              </div>
            </div>
          )}

          {/* Top músculos */}
          {top.length > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 8, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 8 }}>
                MÁS TRABAJADOS
              </div>
              {top.map(([id, v]) => {
                const c = v < 0.3 ? "#3b82f6" : v < 0.65 ? "#fb923c" : "#ef4444";
                return (
                  <div key={id} style={{ marginBottom: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 9, color: "rgba(240,240,240,0.55)" }}>{LABELS[id]||id}</span>
                      <span style={{ fontSize: 9, color: c }}>{Math.round(v*100)}%</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${v*100}%`,
                        background: c, borderRadius: 99,
                        transition: "width 0.6s ease",
                        boxShadow: `0 0 6px ${c}`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: "16px 10px", textAlign: "center",
              background: "rgba(255,255,255,0.05)", borderRadius: 10,
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>💪</div>
              <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", lineHeight: 1.6 }}>
                Sin sesiones en este período. ¡Empieza a entrenar!
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div>
            <div style={{ fontSize: 8, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>
              INTENSIDAD
            </div>
            {[
              { l: "Máxima", c: "#ef4444" },
              { l: "Alta",   c: "#fb923c" },
              { l: "Baja",   c: "#3b82f6" },
              { l: "Sin",    c: "#1a1a2e" },
            ].map(s => (
              <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: s.c,
                  boxShadow: s.c !== "#1a1a2e" ? `0 0 6px ${s.c}` : "none",
                  border: s.c === "#1a1a2e" ? "1px solid #333" : "none",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 10, color: "rgba(240,240,240,0.30)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
