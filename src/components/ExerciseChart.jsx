import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { calc1RM, bestSet } from "../utils/fitness";

/**
 * Gráfico de progreso de un ejercicio a lo largo de sesiones.
 * Recibe `routine` como prop para no depender del módulo estático.
 */
export default function ExerciseChart({ exName, dayName, logs, accent, routine }) {
  const data = Object.values(logs)
    .filter((s) => s.day === dayName)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const exercises = routine?.[dayName]?.exercises || [];
      const ei = exercises.findIndex((e) => e.name === exName);
      if (ei === -1) return null;
      const sets = s.sets[ei];
      if (!sets?.length) return null;
      const best = bestSet(sets);
      return {
        date: s.date.slice(5),
        "1RM": calc1RM(best.weight, best.reps),
        Peso: best.weight,
      };
    })
    .filter(Boolean);

  if (data.length < 2) {
    return (
      <div style={{ color: "#475569", fontSize: 14, padding: "14px 0", textAlign: "center" }}>
        Necesitas al menos 2 sesiones para ver el gráfico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={148}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" />
        <XAxis dataKey="date" tick={{ fill: "#334155", fontSize: 12 }} />
        <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: "#0d0d14", border: `1px solid ${accent}44`, borderRadius: 6, fontSize: 14 }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Line type="monotone" dataKey="1RM" stroke={accent} strokeWidth={2} dot={{ fill: accent, r: 3 }} />
        <Line type="monotone" dataKey="Peso" stroke={`${accent}66`} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
