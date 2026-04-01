import { useState } from "react";
import { tokens } from "../design";
import { getHypertrophyZone } from "../utils/hypertrophyZone";

// Rutinas de viaje por grupo muscular — sin equipamiento
// Basadas en los principios de Beardsley: el músculo no distingue
// entre resistencia externa e interna si el esfuerzo es suficiente
const TRAVEL_ROUTINES = {
  "Upper — Empuje": {
    accent: "#60a5fa",
    exercises: [
      { name: "Push-ups", sets: 3, reps: "15-20", tip: "Pausa 1s abajo para más TUT" },
      { name: "Push-ups Diamante", sets: 3, reps: "10-15", tip: "Enfoca el tríceps" },
      { name: "Pike Push-ups", sets: 3, reps: "10-12", tip: "Simula el press militar" },
      { name: "Pseudo Planche Push-ups", sets: 3, reps: "8-12", tip: "Manos hacia pies, carga el pecho bajo" },
      { name: "Dips en silla", sets: 3, reps: "12-15", tip: "Baja hasta 90° en codo" },
    ],
  },
  "Upper — Tirón": {
    accent: "#a78bfa",
    exercises: [
      { name: "Remo con mochila", sets: 3, reps: "12-15", tip: "Mochila cargada bajo una mesa" },
      { name: "Towel Row", sets: 3, reps: "10-12", tip: "Toalla en puerta cerrada" },
      { name: "Curl con mochila", sets: 3, reps: "12-15", tip: "Controla la excéntrica 3s" },
      { name: "Face Pull con toalla", sets: 3, reps: "15-20", tip: "Ancla la toalla en una puerta" },
      { name: "Chin-ups", sets: 3, reps: "max", tip: "Si tienes una barra de puerta" },
    ],
  },
  "Lower": {
    accent: "#34d399",
    exercises: [
      { name: "Bulgarian Split Squat", sets: 3, reps: "10-15", tip: "Pie trasero en silla, 2s excéntrica" },
      { name: "Romanian Deadlift 1 pierna", sets: 3, reps: "10-12", tip: "Control total de la caída" },
      { name: "Hip Thrust con silla", sets: 3, reps: "15-20", tip: "Pausa 2s arriba, aprieta glúteo" },
      { name: "Wall Sit", sets: 3, reps: "45-60s", tip: "90° en rodilla, isométrico" },
      { name: "Nordic Curl", sets: 3, reps: "5-8", tip: "El más difícil — isquios al máximo" },
    ],
  },
  "Full Body": {
    accent: "#fb923c",
    exercises: [
      { name: "Burpees", sets: 4, reps: "10-15", tip: "Máxima explosividad en el salto" },
      { name: "Jump Squats", sets: 3, reps: "15-20", tip: "Aterriza suave para rodillas" },
      { name: "Mountain Climbers", sets: 3, reps: "30s", tip: "Core apretado todo el tiempo" },
      { name: "Push-up a Pike", sets: 3, reps: "10-12", tip: "Combina empuje y hombros" },
      { name: "Lunge con rotación", sets: 3, reps: "10/lado", tip: "Rota hacia la pierna delantera" },
    ],
  },
};

export default function TravelModeView({ onBack, onStartTravelSession }) {
  const [selected, setSelected] = useState(null);

  const days = Object.keys(TRAVEL_ROUTINES);

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>
      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ color: "rgba(240,240,240,0.30)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 3 }}>SIN GYM</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: -0.8 }}>Modo Viaje ✈️</h2>
          </div>
        </div>

        <div style={{
          background: "#0c1a2e", border: "1px solid #185fa544",
          borderRadius: 12, padding: "10px 14px", marginBottom: 20,
          fontSize: 11, color: "#60a5fa", lineHeight: 1.6,
        }}>
          💡 Beardsley: el músculo responde al esfuerzo relativo, no al tipo de resistencia. Entrena cerca del fallo y el estímulo es equivalente.
        </div>
      </div>

      <div style={{ padding: "0 18px 100px" }}>
        {/* Selector de día */}
        {!selected && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 12 }}>ELIGE TU SESIÓN</div>
            {days.map(day => {
              const r = TRAVEL_ROUTINES[day];
              return (
                <button key={day} onClick={() => setSelected(day)} style={{
                  width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                  border: `1px solid ${r.accent}33`,
                  borderLeft: `3px solid ${r.accent}`,
                  borderRadius: 18,
                  padding: "16px", marginBottom: 10,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  WebkitTapHighlightColor: "transparent",
                  transition: "all 0.15s",
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: r.accent, marginBottom: 4 }}>{day}</div>
                    <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)" }}>
                      {r.exercises.length} ejercicios · Sin equipamiento
                    </div>
                  </div>
                  <span style={{ color: "rgba(240,240,240,0.30)", fontSize: 16 }}>→</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Detalle del día seleccionado */}
        {selected && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <button onClick={() => setSelected(null)} style={{
              background: "none", border: "none", color: "rgba(240,240,240,0.30)",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              marginBottom: 14, padding: 0, display: "flex", alignItems: "center", gap: 6,
            }}>← Volver</button>

            <div style={{ fontSize: 9, color: TRAVEL_ROUTINES[selected].accent, letterSpacing: 3, marginBottom: 16 }}>
              {selected.toUpperCase()}
            </div>

            {TRAVEL_ROUTINES[selected].exercises.map((ex, i) => {
              // Estimar reps para zona (tomar el número del rango)
              const repsNum = parseInt(ex.reps);
              const zone = !isNaN(repsNum) ? getHypertrophyZone(repsNum) : null;
              const accent = TRAVEL_ROUTINES[selected].accent;

              return (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1px solid var(--glass-border)`,
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: 12,
                  padding: "12px 14px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, color: "var(--text)" }}>{ex.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {zone && (
                        <span style={{
                          fontSize: 8, color: zone.color, background: zone.bg,
                          border: `1px solid ${zone.border}`,
                          padding: "1px 6px", borderRadius: 99, letterSpacing: 1,
                        }}>{zone.label}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: accent }}>{ex.sets} series</span>
                    <span style={{ fontSize: 11, color: "rgba(240,240,240,0.55)" }}>{ex.reps} reps</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", lineHeight: 1.5 }}>
                    💡 {ex.tip}
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => onStartTravelSession && onStartTravelSession(selected, TRAVEL_ROUTINES[selected])}
              style={{
                width: "100%", marginTop: 8,
                background: TRAVEL_ROUTINES[selected].accent + "22",
                border: `1px solid ${TRAVEL_ROUTINES[selected].accent}44`,
                color: TRAVEL_ROUTINES[selected].accent,
                padding: "14px", borderRadius: 18,
                fontSize: 11, letterSpacing: 2, fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              EMPEZAR SESIÓN →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
