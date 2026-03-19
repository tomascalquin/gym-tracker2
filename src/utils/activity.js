import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { getPublicProfile } from "./friends";

const LAST_VISIT_KEY = "gym_last_visit";

/**
 * Guarda el timestamp de la última visita.
 */
export function saveLastVisit() {
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
}

/**
 * Obtiene el timestamp de la última visita.
 */
export function getLastVisit() {
  const stored = localStorage.getItem(LAST_VISIT_KEY);
  if (!stored) return null;
  return new Date(stored);
}

/**
 * Carga la actividad reciente de amigos desde la última visita.
 * @param {string[]} friendUids
 * @returns {Array} [{ uid, displayName, sessions: [{ day, date }] }]
 */
export async function loadFriendActivity(friendUids) {
  if (!friendUids?.length) return [];

  const lastVisit = getLastVisit();
  const activity  = [];

  await Promise.all(friendUids.map(async (uid) => {
    try {
      const snap = await getDocs(collection(db, "users", uid, "gym_logs"));
      const recentSessions = [];

      snap.forEach(d => {
        const session = d.data();
        const sessionDate = new Date(session.date);
        sessionDate.setHours(23, 59, 59);

        // Solo sesiones desde la última visita
        if (!lastVisit || sessionDate > lastVisit) {
          recentSessions.push({ day: session.day, date: session.date });
        }
      });

      if (recentSessions.length > 0) {
        const profile = await getPublicProfile(uid);
        if (profile) {
          activity.push({
            uid,
            displayName: profile.displayName,
            sessions: recentSessions.sort((a, b) => b.date.localeCompare(a.date)),
          });
        }
      }
    } catch (err) {
      console.warn("loadFriendActivity error for", uid, err.message);
    }
  }));

  return activity;
}
