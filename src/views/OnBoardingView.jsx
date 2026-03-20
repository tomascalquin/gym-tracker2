import { useState } from "react";

// ─── Splits predeterminados CON ejercicios ─────────────────────────────────
const PRESET_ROUTINES = {
  "Upper/Lower": {
    description: "4 días · Fuerza + Hipertrofia",
    days: {
      "Upper A": {
        exercises: [
          { name: "Press de Banca", sets: [{ weight: 80, reps: 6 }, { weight: 80, reps: 6 }, { weight: 80, reps: 6 }] },
          { name: "Remo con Barra", sets: [{ weight: 70, reps: 6 }, { weight: 70, reps: 6 }, { weight: 70, reps: 6 }] },
          { name: "Press Militar", sets: [{ weight: 50, reps: 8 }, { weight: 50, reps: 8 }, { weight: 50, reps: 8 }] },
          { name: "Curl Bíceps Barra", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
          { name: "Press Francés", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
        ]
      },
      "Lower A": {
        exercises: [
          { name: "Sentadilla", sets: [{ weight: 100, reps: 6 }, { weight: 100, reps: 6 }, { weight: 100, reps: 6 }] },
          { name: "Peso Muerto Rumano", sets: [{ weight: 90, reps: 8 }, { weight: 90, reps: 8 }, { weight: 90, reps: 8 }] },
          { name: "Prensa de Piernas", sets: [{ weight: 150, reps: 10 }, { weight: 150, reps: 10 }] },
          { name: "Curl Femoral", sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }] },
          { name: "Gemelos de Pie", sets: [{ weight: 80, reps: 12 }, { weight: 80, reps: 12 }] },
        ]
      },
      "Upper B": {
        exercises: [
          { name: "Press Inclinado", sets: [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }, { weight: 70, reps: 8 }] },
          { name: "Jalón al Pecho", sets: [{ weight: 65, reps: 8 }, { weight: 65, reps: 8 }, { weight: 65, reps: 8 }] },
          { name: "Elevaciones Laterales", sets: [{ weight: 12, reps: 12 }, { weight: 12, reps: 12 }, { weight: 12, reps: 12 }] },
          { name: "Curl Martillo", sets: [{ weight: 16, reps: 12 }, { weight: 16, reps: 12 }] },
          { name: "Extensión Tríceps Polea", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
        ]
      },
      "Lower B": {
        exercises: [
          { name: "Peso Muerto", sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 120, reps: 5 }] },
          { name: "Sentadilla Búlgara", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Extensión de Cuádriceps", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }] },
          { name: "Curl Femoral Sentado", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }] },
          { name: "Hip Thrust", sets: [{ weight: 80, reps: 12 }, { weight: 80, reps: 12 }] },
        ]
      },
    }
  },
  "PPL": {
    description: "6 días · Volumen alto",
    days: {
      "Push A": {
        exercises: [
          { name: "Press de Banca", sets: [{ weight: 80, reps: 6 }, { weight: 80, reps: 6 }, { weight: 80, reps: 6 }] },
          { name: "Press Inclinado Mancuernas", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Press Militar", sets: [{ weight: 50, reps: 8 }, { weight: 50, reps: 8 }] },
          { name: "Elevaciones Laterales", sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 15 }, { weight: 12, reps: 15 }] },
          { name: "Press Francés", sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 12 }] },
          { name: "Extensión Tríceps Polea", sets: [{ weight: 25, reps: 15 }, { weight: 25, reps: 15 }] },
        ]
      },
      "Pull A": {
        exercises: [
          { name: "Remo con Barra", sets: [{ weight: 70, reps: 6 }, { weight: 70, reps: 6 }, { weight: 70, reps: 6 }] },
          { name: "Jalón al Pecho", sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 65, reps: 10 }] },
          { name: "Remo en Polea", sets: [{ weight: 55, reps: 12 }, { weight: 55, reps: 12 }] },
          { name: "Curl Bíceps Barra", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
          { name: "Curl Martillo", sets: [{ weight: 16, reps: 12 }, { weight: 16, reps: 12 }] },
          { name: "Face Pull", sets: [{ weight: 20, reps: 15 }, { weight: 20, reps: 15 }] },
        ]
      },
      "Legs A": {
        exercises: [
          { name: "Sentadilla", sets: [{ weight: 100, reps: 6 }, { weight: 100, reps: 6 }, { weight: 100, reps: 6 }] },
          { name: "Prensa de Piernas", sets: [{ weight: 150, reps: 10 }, { weight: 150, reps: 10 }] },
          { name: "Extensión de Cuádriceps", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }] },
          { name: "Peso Muerto Rumano", sets: [{ weight: 90, reps: 10 }, { weight: 90, reps: 10 }] },
          { name: "Curl Femoral", sets: [{ weight: 50, reps: 12 }, { weight: 50, reps: 12 }] },
          { name: "Gemelos de Pie", sets: [{ weight: 80, reps: 15 }, { weight: 80, reps: 15 }] },
        ]
      },
      "Push B": {
        exercises: [
          { name: "Press Banca Inclinado", sets: [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }, { weight: 70, reps: 8 }] },
          { name: "Aperturas con Mancuernas", sets: [{ weight: 18, reps: 12 }, { weight: 18, reps: 12 }, { weight: 18, reps: 12 }] },
          { name: "Press Arnold", sets: [{ weight: 22, reps: 10 }, { weight: 22, reps: 10 }] },
          { name: "Elevaciones Frontales", sets: [{ weight: 10, reps: 12 }, { weight: 10, reps: 12 }] },
          { name: "Press Tríceps Polea", sets: [{ weight: 28, reps: 12 }, { weight: 28, reps: 12 }, { weight: 28, reps: 12 }] },
        ]
      },
      "Pull B": {
        exercises: [
          { name: "Dominadas", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
          { name: "Remo Mancuerna", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
          { name: "Pullover en Polea", sets: [{ weight: 40, reps: 12 }, { weight: 40, reps: 12 }] },
          { name: "Curl Predicador", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Curl Concentrado", sets: [{ weight: 14, reps: 12 }, { weight: 14, reps: 12 }] },
        ]
      },
      "Legs B": {
        exercises: [
          { name: "Peso Muerto", sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 120, reps: 5 }] },
          { name: "Sentadilla Búlgara", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Hip Thrust", sets: [{ weight: 80, reps: 12 }, { weight: 80, reps: 12 }, { weight: 80, reps: 12 }] },
          { name: "Curl Femoral Sentado", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }] },
          { name: "Máquina de Aductores", sets: [{ weight: 50, reps: 15 }, { weight: 50, reps: 15 }] },
          { name: "Gemelos Sentado", sets: [{ weight: 60, reps: 15 }, { weight: 60, reps: 15 }] },
        ]
      },
    }
  },
  "Arnold Split (PPL)": {
    description: "6 días · Pecho/Espalda · Hombros/Brazos · Piernas",
    days: {
      "Pecho/Espalda A": {
        exercises: [
          { name: "Press de Banca", sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }, { weight: 80, reps: 8 }] },
          { name: "Remo con Barra", sets: [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }, { weight: 70, reps: 8 }] },
          { name: "Press Inclinado", sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }] },
          { name: "Jalón al Pecho", sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }] },
          { name: "Aperturas con Cable", sets: [{ weight: 15, reps: 12 }, { weight: 15, reps: 12 }] },
          { name: "Remo en Polea", sets: [{ weight: 55, reps: 12 }, { weight: 55, reps: 12 }] },
        ]
      },
      "Hombros/Brazos A": {
        exercises: [
          { name: "Press Militar", sets: [{ weight: 50, reps: 8 }, { weight: 50, reps: 8 }, { weight: 50, reps: 8 }] },
          { name: "Curl Bíceps Barra", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
          { name: "Press Francés", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Elevaciones Laterales", sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 15 }, { weight: 12, reps: 15 }] },
          { name: "Curl Martillo", sets: [{ weight: 16, reps: 12 }, { weight: 16, reps: 12 }] },
          { name: "Extensión Tríceps Polea", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
        ]
      },
      "Piernas A": {
        exercises: [
          { name: "Sentadilla", sets: [{ weight: 100, reps: 6 }, { weight: 100, reps: 6 }, { weight: 100, reps: 6 }] },
          { name: "Peso Muerto Rumano", sets: [{ weight: 90, reps: 8 }, { weight: 90, reps: 8 }] },
          { name: "Prensa de Piernas", sets: [{ weight: 150, reps: 10 }, { weight: 150, reps: 10 }] },
          { name: "Curl Femoral", sets: [{ weight: 50, reps: 12 }, { weight: 50, reps: 12 }] },
          { name: "Gemelos de Pie", sets: [{ weight: 80, reps: 15 }, { weight: 80, reps: 15 }] },
        ]
      },
      "Pecho/Espalda B": {
        exercises: [
          { name: "Press Inclinado Mancuernas", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Dominadas", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
          { name: "Aperturas Mancuernas", sets: [{ weight: 18, reps: 12 }, { weight: 18, reps: 12 }] },
          { name: "Remo Mancuerna", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
          { name: "Fondos en Paralelas", sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }] },
        ]
      },
      "Hombros/Brazos B": {
        exercises: [
          { name: "Press Arnold", sets: [{ weight: 22, reps: 10 }, { weight: 22, reps: 10 }, { weight: 22, reps: 10 }] },
          { name: "Curl Predicador", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Rompecráneos", sets: [{ weight: 28, reps: 10 }, { weight: 28, reps: 10 }] },
          { name: "Face Pull", sets: [{ weight: 20, reps: 15 }, { weight: 20, reps: 15 }] },
          { name: "Curl Concentrado", sets: [{ weight: 14, reps: 12 }, { weight: 14, reps: 12 }] },
          { name: "Fondos Tríceps Banco", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
        ]
      },
      "Piernas B": {
        exercises: [
          { name: "Peso Muerto", sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 120, reps: 5 }] },
          { name: "Hip Thrust", sets: [{ weight: 80, reps: 12 }, { weight: 80, reps: 12 }, { weight: 80, reps: 12 }] },
          { name: "Sentadilla Búlgara", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Extensión de Cuádriceps", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }] },
          { name: "Curl Femoral Sentado", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }] },
          { name: "Gemelos Sentado", sets: [{ weight: 60, reps: 15 }, { weight: 60, reps: 15 }] },
        ]
      },
    }
  },
  "Full Body": {
    description: "3 días · Principiantes",
    days: {
      "Full Body A": {
        exercises: [
          { name: "Sentadilla", sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }] },
          { name: "Press de Banca", sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }] },
          { name: "Remo con Barra", sets: [{ weight: 50, reps: 8 }, { weight: 50, reps: 8 }, { weight: 50, reps: 8 }] },
          { name: "Press Militar", sets: [{ weight: 40, reps: 8 }, { weight: 40, reps: 8 }] },
          { name: "Curl Bíceps", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }] },
          { name: "Extensión Tríceps", sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }] },
        ]
      },
      "Full Body B": {
        exercises: [
          { name: "Peso Muerto", sets: [{ weight: 80, reps: 5 }, { weight: 80, reps: 5 }, { weight: 80, reps: 5 }] },
          { name: "Press Inclinado", sets: [{ weight: 55, reps: 8 }, { weight: 55, reps: 8 }, { weight: 55, reps: 8 }] },
          { name: "Jalón al Pecho", sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }] },
          { name: "Elevaciones Laterales", sets: [{ weight: 10, reps: 12 }, { weight: 10, reps: 12 }] },
          { name: "Hip Thrust", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }] },
          { name: "Gemelos", sets: [{ weight: 50, reps: 15 }, { weight: 50, reps: 15 }] },
        ]
      },
      "Full Body C": {
        exercises: [
          { name: "Sentadilla Frontal", sets: [{ weight: 50, reps: 8 }, { weight: 50, reps: 8 }, { weight: 50, reps: 8 }] },
          { name: "Press de Banca Agarre Cerrado", sets: [{ weight: 55, reps: 8 }, { weight: 55, reps: 8 }] },
          { name: "Dominadas", sets: [{ weight: 0, reps: 6 }, { weight: 0, reps: 6 }, { weight: 0, reps: 6 }] },
          { name: "Press Arnold", sets: [{ weight: 18, reps: 10 }, { weight: 18, reps: 10 }] },
          { name: "Curl Martillo", sets: [{ weight: 14, reps: 12 }, { weight: 14, reps: 12 }] },
          { name: "Prensa de Piernas", sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }] },
        ]
      },
    }
  },
  "Bro Split": {
    description: "5 días · Un músculo por día",
    days: {
      "Pecho": {
        exercises: [
          { name: "Press de Banca", sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }, { weight: 80, reps: 6 }] },
          { name: "Press Inclinado Mancuernas", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Press Declinado", sets: [{ weight: 70, reps: 10 }, { weight: 70, reps: 10 }] },
          { name: "Aperturas con Cable", sets: [{ weight: 15, reps: 12 }, { weight: 15, reps: 12 }, { weight: 15, reps: 12 }] },
          { name: "Fondos en Paralelas", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
        ]
      },
      "Espalda": {
        exercises: [
          { name: "Peso Muerto", sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 120, reps: 5 }] },
          { name: "Dominadas", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 8 }] },
          { name: "Remo con Barra", sets: [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }] },
          { name: "Jalón al Pecho", sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }] },
          { name: "Remo en Polea", sets: [{ weight: 55, reps: 12 }, { weight: 55, reps: 12 }] },
        ]
      },
      "Hombros": {
        exercises: [
          { name: "Press Militar", sets: [{ weight: 55, reps: 8 }, { weight: 55, reps: 8 }, { weight: 55, reps: 8 }] },
          { name: "Elevaciones Laterales", sets: [{ weight: 14, reps: 12 }, { weight: 14, reps: 12 }, { weight: 14, reps: 12 }] },
          { name: "Elevaciones Frontales", sets: [{ weight: 10, reps: 12 }, { weight: 10, reps: 12 }] },
          { name: "Face Pull", sets: [{ weight: 22, reps: 15 }, { weight: 22, reps: 15 }] },
          { name: "Press Arnold", sets: [{ weight: 22, reps: 10 }, { weight: 22, reps: 10 }] },
        ]
      },
      "Bíceps/Tríceps": {
        exercises: [
          { name: "Curl Bíceps Barra", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
          { name: "Press Francés", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
          { name: "Curl Martillo", sets: [{ weight: 16, reps: 12 }, { weight: 16, reps: 12 }] },
          { name: "Extensión Tríceps Polea", sets: [{ weight: 28, reps: 12 }, { weight: 28, reps: 12 }] },
          { name: "Curl Predicador", sets: [{ weight: 28, reps: 12 }, { weight: 28, reps: 12 }] },
          { name: "Fondos Tríceps Banco", sets: [{ weight: 0, reps: 15 }, { weight: 0, reps: 15 }] },
        ]
      },
      "Piernas": {
        exercises: [
          { name: "Sentadilla", sets: [{ weight: 100, reps: 6 }, { weight: 100, reps: 6 }, { weight: 100, reps: 6 }] },
          { name: "Peso Muerto Rumano", sets: [{ weight: 90, reps: 8 }, { weight: 90, reps: 8 }] },
          { name: "Prensa de Piernas", sets: [{ weight: 150, reps: 10 }, { weight: 150, reps: 10 }] },
          { name: "Extensión de Cuádriceps", sets: [{ weight: 60, reps: 12 }, { weight: 60, reps: 12 }] },
          { name: "Curl Femoral Sentado", sets: [{ weight: 50, reps: 12 }, { weight: 50, reps: 12 }] },
          { name: "Hip Thrust", sets: [{ weight: 80, reps: 12 }, { weight: 80, reps: 12 }] },
          { name: "Gemelos de Pie", sets: [{ weight: 80, reps: 15 }, { weight: 80, reps: 15 }] },
        ]
      },
    }
  },
};

const ACCENT = "#60a5fa";

export default function OnboardingView({ user, onRoutineReady }) {
  const [step, setStep]       = useState("choose"); // choose | preview | custom
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]   = useState(false);

  const firstName = (user?.displayName || user?.email || "").split(" ")[0];

  async function handleUsePreset() {
    if (!selected) return;
    setSaving(true);
    await onRoutineReady(PRESET_ROUTINES[selected].days);
  }

  // ── STEP: CHOOSE ───────────────────────────────────────────────────────────
  if (step === "choose") return (
    <div style={{
      maxWidth: 460, margin: "0 auto", padding: "32px 18px",
      fontFamily: "DM Mono, monospace", minHeight: "100vh",
      background: "var(--bg)", animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "var(--text3)", marginBottom: 8 }}>BIENVENIDO</div>
        <h1 style={{ fontSize: 26, fontWeight: 300, color: "var(--text)", margin: 0, letterSpacing: -1 }}>
          Hola, {firstName} 👋
        </h1>
        <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 8, lineHeight: 1.6 }}>
          Elige un split de entrenamiento. Ya viene con ejercicios para todos los músculos — puedes editarlos después.
        </p>
      </div>

      {/* Splits predeterminados */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3, marginBottom: 12 }}>SPLITS PREDETERMINADOS</div>
        {Object.entries(PRESET_ROUTINES).map(([name, data], i) => {
          const isSelected = selected === name;
          return (
            <button key={name} onClick={() => setSelected(name)} style={{
              width: "100%", background: isSelected ? ACCENT + "15" : "var(--bg2)",
              border: `1px solid ${isSelected ? ACCENT + "66" : "var(--border)"}`,
              borderLeft: `3px solid ${isSelected ? ACCENT : "var(--border)"}`,
              borderRadius: 14, padding: "14px 16px", cursor: "pointer",
              textAlign: "left", marginBottom: 8, fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "all 0.15s",
              boxShadow: isSelected ? `0 4px 16px ${ACCENT}18` : "none",
              animation: `slideDown 0.2s ease ${i * 0.05}s both`,
            }}>
              <div>
                <div style={{ fontSize: 14, color: isSelected ? ACCENT : "var(--text)", marginBottom: 3, fontWeight: 400 }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{data.description}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                  {Object.keys(data.days).join(" · ")}
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${isSelected ? ACCENT : "var(--border)"}`,
                background: isSelected ? ACCENT : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {isSelected && <span style={{ fontSize: 12, color: "#000" }}>✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Botones acción */}
      {selected && (
        <div style={{ animation: "slideDown 0.2s ease" }}>
          <button onClick={() => setStep("preview")} style={{
            width: "100%", padding: "14px",
            background: "var(--bg2)", border: `1px solid ${ACCENT}44`,
            color: ACCENT, borderRadius: 14, cursor: "pointer",
            fontSize: 11, letterSpacing: 2, fontFamily: "inherit",
            marginBottom: 10, minHeight: 50,
          }}>
            👁 VER EJERCICIOS
          </button>
          <button onClick={handleUsePreset} disabled={saving} style={{
            width: "100%", padding: "14px",
            background: saving ? "var(--bg2)" : ACCENT,
            border: "none", color: saving ? "var(--text3)" : "#000",
            borderRadius: 14, cursor: saving ? "default" : "pointer",
            fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
            minHeight: 50, boxShadow: saving ? "none" : `0 4px 20px ${ACCENT}44`,
            transition: "all 0.2s",
          }}>
            {saving ? "GUARDANDO..." : `✓ USAR ${selected.toUpperCase()}`}
          </button>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 8 }}>
          Puedes editar los ejercicios y pesos después desde la app.
        </div>
      </div>
    </div>
  );

  // ── STEP: PREVIEW ──────────────────────────────────────────────────────────
  if (step === "preview" && selected) {
    const routine = PRESET_ROUTINES[selected];
    return (
      <div style={{
        maxWidth: 460, margin: "0 auto", padding: "20px 18px",
        fontFamily: "DM Mono, monospace", animation: "fadeIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setStep("choose")} className="nbtn" style={{ color: "var(--text3)", fontSize: 20, padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 3 }}>VISTA PREVIA</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "var(--text)" }}>{selected}</h2>
          </div>
        </div>

        {Object.entries(routine.days).map(([day, data], di) => (
          <div key={day} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderLeft: `3px solid ${ACCENT}`, borderRadius: 14,
            marginBottom: 10, overflow: "hidden",
            animation: `slideDown 0.2s ease ${di * 0.05}s both`,
          }}>
            <div style={{
              padding: "11px 14px", background: "var(--bg3)",
              borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 400 }}>{day}</span>
              <span style={{ fontSize: 10, color: ACCENT }}>{data.exercises.length} ejercicios</span>
            </div>
            <div style={{ padding: "10px 14px" }}>
              {data.exercises.map((ex, ei) => (
                <div key={ei} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 8, paddingBottom: 8,
                  borderBottom: ei < data.exercises.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>{ex.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>
                    {ex.sets.length}×{ex.sets[0].reps} · {ex.sets[0].weight > 0 ? `${ex.sets[0].weight}kg` : "peso corp."}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={handleUsePreset} disabled={saving} style={{
          width: "100%", padding: "14px",
          background: saving ? "var(--bg2)" : ACCENT,
          border: "none", color: saving ? "var(--text3)" : "#000",
          borderRadius: 14, cursor: saving ? "default" : "pointer",
          fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "inherit",
          minHeight: 52, boxShadow: saving ? "none" : `0 4px 20px ${ACCENT}44`,
          marginTop: 4,
        }}>{saving ? "GUARDANDO..." : "✓ USAR ESTA RUTINA"}</button>
      </div>
    );
  }

  return null;
}
