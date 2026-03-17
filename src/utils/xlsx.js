import * as XLSX from "xlsx";
import { DAY_ORDER, ROUTINE } from "../data/routine";
import { calc1RM, sessionVolume } from "./fitness";
import { todayStr } from "./storage";

/**
 * Exporta todo el historial de sesiones a un archivo .xlsx.
 * Genera una hoja "Resumen" + una hoja por día de entrenamiento.
 *
 * @param {Object} logs - Estado completo de logs desde localStorage
 */
export function exportToExcel(logs) {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Resumen global ──────────────────────────────────────────────────
  const summaryRows = [
    ["Fecha", "Día", "Volumen (kg·reps)", "Sets Completados", "Nota Sesión"],
  ];

  Object.values(logs)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => {
      summaryRows.push([
        s.date,
        s.day,
        sessionVolume(s.sets),
        Object.values(s.completed || {}).filter(Boolean).length,
        s.note || "",
      ]);
    });

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summaryRows),
    "Resumen"
  );

  // ── Hoja por día ────────────────────────────────────────────────────────────
  DAY_ORDER.forEach((day) => {
    const sessions = Object.values(logs)
      .filter((s) => s.day === day)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!sessions.length) return;

    const rows = [
      [
        "Fecha",
        "Ejercicio",
        "Serie",
        "Peso (kg)",
        "Reps",
        "1RM Estimado",
        "Nota Set",
        "Nota Sesión",
      ],
    ];

    sessions.forEach((s) => {
      ROUTINE[day].exercises.forEach((ex, ei) => {
        (s.sets[ei] || []).forEach((set, si) => {
          rows.push([
            s.date,
            ex.name,
            si + 1,
            set.weight,
            set.reps,
            calc1RM(set.weight, set.reps),
            set.note || "",
            si === 0 ? s.note || "" : "",
          ]);
        });
      });
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), day);
  });

  XLSX.writeFile(wb, `gym_tomas_${todayStr()}.xlsx`);
}
