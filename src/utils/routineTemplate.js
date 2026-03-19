import * as XLSX from "xlsx";

/**
 * Genera plantilla Excel intuitiva.
 *
 * Estructura:
 * - Hoja "📋 INSTRUCCIONES" — guía visual paso a paso
 * - Hoja "Día 1 (Ej: Upper A)" — ejemplo completo prellenado
 * - Hojas "Día 2", "Día 3", ... "Día 6" — vacías para rellenar
 *
 * Formato por hoja:
 *   Fila 1: Nombre del día (ej: "Upper A")
 *   Fila 2: vacía (separador)
 *   Fila 3: header → EJERCICIO | SERIE 1 kg | SERIE 1 reps | SERIE 2 kg | ...
 *   Fila 4+: un ejercicio por fila
 */
export function downloadRoutineTemplate() {
  const wb = XLSX.utils.book_new();

  // ── Hoja de instrucciones ────────────────────────────────────────────────
  const instrRows = [
    ["🏋️ PLANTILLA DE RUTINA - GYM TRACKER"],
    [""],
    ["CÓMO RELLENAR:"],
    [""],
    ["1️⃣  Cada hoja = un día de entrenamiento"],
    ["     → Cambia el nombre de la hoja (click derecho) por el nombre de tu día"],
    ["     → Ejemplos: 'Upper A', 'Push', 'Pecho y Tríceps', 'Piernas'"],
    [""],
    ["2️⃣  Fila 1 = nombre del día (debe coincidir con el nombre de la hoja)"],
    [""],
    ["3️⃣  Cada fila = un ejercicio"],
    ["     → Columna A: nombre del ejercicio"],
    ["     → Por cada serie: escribe el PESO y las REPS en las columnas correspondientes"],
    ["     → Si tienes más series, continúa el patrón (Serie 4 kg, Serie 4 reps, etc.)"],
    [""],
    ["4️⃣  Si no usas un día, déjalo vacío o borra la hoja"],
    [""],
    ["5️⃣  Peso corporal = escribe 0 en el peso"],
    [""],
    ["⚠️  IMPORTANTE:"],
    ["     - No borres la fila del header (EJERCICIO, SERIE 1 kg, etc.)"],
    ["     - No borres la fila 1 con el nombre del día"],
    ["     - Usa las hojas 'Día 1' al 'Día 6' (puedes dejar días vacíos)"],
    [""],
    ["✅  Cuando termines, guarda el archivo y súbelo en la app"],
  ];

  const instrWs = XLSX.utils.aoa_to_sheet(instrRows);
  instrWs["!cols"] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, instrWs, "📋 INSTRUCCIONES");

  // ── Función para crear una hoja de día ────────────────────────────────────
  function createDaySheet(dayName, exercises) {
    // Header de columnas: EJERCICIO + hasta 5 series
    const header = ["EJERCICIO"];
    for (let s = 1; s <= 5; s++) {
      header.push(`Serie ${s} - Peso (kg)`);
      header.push(`Serie ${s} - Reps`);
      header.push(`Serie ${s} - Nota`);
    }

    const rows = [
      [dayName],   // fila 1: nombre del día
      [],          // fila 2: vacía
      header,      // fila 3: headers
    ];

    // Ejercicios
    exercises.forEach(ex => {
      const row = [ex.name];
      ex.sets.forEach(set => {
        row.push(set.weight);
        row.push(set.reps);
        row.push(set.note || "");
      });
      rows.push(row);
    });

    // Si no hay ejercicios, agregar filas vacías de ejemplo
    if (!exercises.length) {
      for (let i = 0; i < 8; i++) {
        rows.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Anchos de columna
    ws["!cols"] = [
      { wch: 28 }, // Ejercicio
      { wch: 14 }, { wch: 10 }, { wch: 14 }, // Serie 1
      { wch: 14 }, { wch: 10 }, { wch: 14 }, // Serie 2
      { wch: 14 }, { wch: 10 }, { wch: 14 }, // Serie 3
      { wch: 14 }, { wch: 10 }, { wch: 14 }, // Serie 4
      { wch: 14 }, { wch: 10 }, { wch: 14 }, // Serie 5
    ];

    return ws;
  }

  // ── Hoja de ejemplo (Día 1) ───────────────────────────────────────────────
  const ejemploExs = [
    { name: "Press de Banca",      sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 7 }, { weight: 75, reps: 6 }] },
    { name: "Remo con Barra",      sets: [{ weight: 70, reps: 8, note: "agarre prono" }, { weight: 70, reps: 7 }] },
    { name: "Press Inclinado",     sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 9 }] },
    { name: "Curl de Bíceps",      sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 9 }, { weight: 18, reps: 8 }] },
    { name: "Extensión de Tríceps",sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 10 }] },
    { name: "Dominadas",           sets: [{ weight: 0, reps: 8, note: "peso corporal" }, { weight: 0, reps: 7 }] },
  ];
  XLSX.utils.book_append_sheet(wb, createDaySheet("Upper A", ejemploExs), "Día 1 (EJEMPLO)");

  // ── Hojas vacías Día 2 a Día 6 ────────────────────────────────────────────
  const emptyDays = ["Día 2", "Día 3", "Día 4", "Día 5", "Día 6"];
  emptyDays.forEach(day => {
    XLSX.utils.book_append_sheet(wb, createDaySheet(day, []), day);
  });

  XLSX.writeFile(wb, "mi_rutina_gym.xlsx");
}

/**
 * Parsea el nuevo formato de plantilla (una hoja por día).
 * Compatible también con el formato antiguo (columna Día).
 */
export async function parseRoutineExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const routine = {};

        // Iterar todas las hojas excepto instrucciones
        wb.SheetNames.forEach(sheetName => {
          if (sheetName.includes("INSTRUCCIONES") || sheetName.includes("📋")) return;

          const ws = wb.Sheets[sheetName];
          if (!ws) return;

          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          if (rows.length < 3) return;

          // Fila 1 = nombre del día (puede ser diferente al nombre de la hoja)
          const dayName = String(rows[0][0] || sheetName).trim();
          if (!dayName) return;

          // Fila 3 = headers (índice 2)
          // Fila 4+ = ejercicios (índice 3+)
          const dataRows = rows.slice(3).filter(r => r[0] && String(r[0]).trim());

          if (!dataRows.length) return;

          const exercises = [];

          dataRows.forEach(row => {
            const exName = String(row[0]).trim();
            if (!exName) return;

            const sets = [];
            // Columnas: 0=ejercicio, luego grupos de 3 (peso, reps, nota)
            // Excel puede retornar números como strings o con coma decimal
            function excelNum(val, isFloat) {
              if (val === "" || val === null || val === undefined) return 0;
              const str = String(val).trim().replace(",", ".");
              return isFloat ? (parseFloat(str) || 0) : (parseInt(str) || 0);
            }
            for (let i = 1; i < row.length; i += 3) {
              const weight = excelNum(row[i], true);
              const reps   = excelNum(row[i + 1], false);
              const note   = String(row[i + 2] || "").trim();
              if (reps > 0) {
                sets.push({ weight, reps, ...(note ? { note } : {}) });
              }
            }

            if (sets.length > 0) {
              exercises.push({ name: exName, sets });
            }
          });

          if (exercises.length > 0) {
            routine[dayName] = { exercises };
          }
        });

        // Fallback: intentar formato antiguo (columna Día) si no se encontró nada
        if (!Object.keys(routine).length) {
          const ws = wb.Sheets["Rutina"];
          if (ws) {
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
            const dataRows = rows.slice(1).filter(r => r[0] && r[1]);
            const routineMap = {};
            dataRows.forEach(row => {
              const day    = String(row[0]).trim();
              const exName = String(row[1]).trim();
              const weight = (() => { const v = row[3]; if (!v && v !== 0) return 0; const s = String(v).trim().replace(",","."); return parseFloat(s)||0; })();
              const reps   = (() => { const v = row[4]; if (!v && v !== 0) return 0; const s = String(v).trim().replace(",","."); return parseInt(s)||0; })();
              const note   = String(row[5] || "").trim();
              if (!routineMap[day]) routineMap[day] = {};
              if (!routineMap[day][exName]) routineMap[day][exName] = { name: exName, sets: [] };
              routineMap[day][exName].sets.push({ weight, reps, ...(note ? { note } : {}) });
            });
            Object.entries(routineMap).forEach(([day, exs]) => {
              routine[day] = { exercises: Object.values(exs) };
            });
          }
        }

        if (!Object.keys(routine).length) {
          reject(new Error("No se encontraron ejercicios válidos. Revisa que las hojas tengan datos."));
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
