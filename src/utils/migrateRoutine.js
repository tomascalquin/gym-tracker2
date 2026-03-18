// src/utils/migrateRoutine.js
// Correr UNA SOLA VEZ para subir la rutina base a Firestore.
// Después de correrlo, este archivo se puede borrar.

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { ROUTINE } from "../data/routine";

/**
 * Sube la rutina base a Firestore si no existe todavía.
 * Si ya existe, no sobreescribe nada.
 */
export async function migrateRoutineToFirestore() {
  let migrated = 0;
  let skipped  = 0;

  for (const day of Object.keys(ROUTINE)) {
    const ref      = doc(db, "gym_routine", day);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      console.log(`[migrate] "${day}" ya existe, skipping.`);
      skipped++;
      continue;
    }

    await setDoc(ref, { exercises: ROUTINE[day].exercises });
    console.log(`[migrate] "${day}" subido OK.`);
    migrated++;
  }

  console.log(`[migrate] Done — ${migrated} subidos, ${skipped} ya existían.`);
  return { migrated, skipped };
}
