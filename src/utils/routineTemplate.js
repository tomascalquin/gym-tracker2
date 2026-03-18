import * as XLSX from "xlsx";

/**
 * Genera y descarga la plantilla Excel para importar rutina.
 * Formato:
 *   Columna A: Día
 *   Columna B: Ejercicio
 *   Columna C: Serie
 *   Columna D: Peso (kg)
 *   Columna E: Reps
 *   Columna F: Nota (opcional)
 */
export function downloadRoutineTemplate() {
  const wb = XLSX.utils.book_new();

  const rows = [
    // Header
    ["Día", "Ejercicio", "Serie", "Peso (kg)", "Reps", "Nota (opcional)"],
    // Ejemplos Upper/Lower
    ["Upper A", "Press de Banca", 1, 80, 8, ""],
    ["Upper A", "Press de Banca", 2, 80, 7, ""],
    ["Upper A", "Remo con Barra", 1, 70, 8, "x lado"],
    ["Upper A", "Remo con Barra", 2, 70, 7, ""],
    ["Lower A", "Sentadilla", 1, 100, 6, ""],
    ["Lower A", "Sentadilla", 2, 100, 5, ""],
    ["Lower A", "Peso Muerto Rumano", 1, 90, 8, "RIR 1"],
    ["Lower A", "Peso Muerto Rumano", 2, 90, 7, ""],
    ["Upper B", "Press Militar", 1, 60, 8, ""],
    ["Upper B", "Dominadas", 1, 0, 8, "peso corporal"],
    ["Lower B", "Prensa", 1, 120, 10, ""],
    ["Lower B", "Curl Femoral", 1, 60, 10, ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Anchos de columna
  ws["!cols"] = [
    { wch: 12 }, // Día
    { wch: 25 }, // Ejercicio
    { wch: 8  }, // Serie
    { wch: 10 }, // Peso
    { wch: 8  }, // Reps
    { wch: 20 }, // Nota
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Rutina");

  // Hoja de instrucciones
  const instrRows = [
    ["INSTRUCCIONES"],
    [""],
    ["1. Rellena la hoja 'Rutina' con tus ejercicios."],
    ["2. La columna 'Día' puede ser cualquier nombre: Upper A, Push, Pecho, etc."],
    ["3. Repite el nombre del ejercicio en tantas filas como series tenga."],
    ["4. 'Serie' es el número de serie (1, 2, 3...)."],
    ["5. Si un ejercicio es solo con peso corporal, pon 0 en Peso."],
    ["6. La columna 'Nota' es opcional (RIR, x lado, etc.)."],
    ["7. Guarda el archivo y súbelo en la app."],
    [""],
    ["IMPORTANTE: No cambies los nombres de las columnas del header."],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instrRows), "Instrucciones");

  XLSX.writeFile(wb, "plantilla_rutina_gym.xlsx");
}

/**
 * Parsea un archivo Excel de rutina y retorna el objeto de rutina.
 * @param {File} file
 * @returns {Promise<Object>} { "Upper A": { exercises: [...] }, ... }
 */
export async function parseRoutineExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets["Rutina"];
        if (!ws) { reject(new Error("No se encontró la hoja 'Rutina'.")); return; }

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (rows.length < 2) { reject(new Error("La plantilla está vacía.")); return; }

        // Saltar header (fila 0)
        const dataRows = rows.slice(1).filter(r => r[0] && r[1]); // día y ejercicio requeridos

        // Agrupar por día y ejercicio
        const routineMap = {}; // { day: { exName: { name, sets: [] } } }

        dataRows.forEach((row) => {
          const day      = String(row[0]).trim();
          const exName   = String(row[1]).trim();
          const serie    = parseInt(row[2]) || 1;
          const weight   = parseFloat(row[3]) || 0;
          const reps     = parseInt(row[4]) || 0;
          const note     = String(row[5] || "").trim();

          if (!routineMap[day]) routineMap[day] = {};
          if (!routineMap[day][exName]) routineMap[day][exName] = { name: exName, sets: [] };

          routineMap[day][exName].sets.push({ weight, reps, ...(note ? { note } : {}) });
        });

        // Convertir a formato de la app
        const routine = {};
        Object.entries(routineMap).forEach(([day, exercises]) => {
          routine[day] = { exercises: Object.values(exercises) };
        });

        if (!Object.keys(routine).length) {
          reject(new Error("No se encontraron ejercicios válidos."));
          return;
        }

        resolve(routine);
      } catch (err) {
        reject(new Error("Error al leer el archivo: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsArrayBuffer(file);
  });
}
