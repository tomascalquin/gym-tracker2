/**
 * progressPhotos.js — Fotos de progreso
 * Almacenadas en localStorage como base64 comprimido (~50KB por foto).
 * No usa Firebase Storage para mantener costos en cero.
 * Máximo 52 fotos (1 año semanal) por usuario.
 */

const KEY = (uid) => `gymtracker_photos_${uid}`;
const MAX_PHOTOS = 52;
const MAX_SIZE   = 800; // px — suficiente para comparar físico
const QUALITY    = 0.75;

// ── Compresión ───────────────────────────────────────────────────────────────

export function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        // Mantener aspect ratio
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * MAX_SIZE / width);
            width  = MAX_SIZE;
          } else {
            width  = Math.round(width * MAX_SIZE / height);
            height = MAX_SIZE;
          }
        }
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function loadPhotos(uid) {
  try {
    const raw = localStorage.getItem(KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function savePhoto(uid, file, { date, note, weight }) {
  const base64 = await compressPhoto(file);
  const entry = {
    id:     `${date}_${Date.now()}`,
    date,
    note:   note || "",
    weight: weight || null,
    base64,
    savedAt: Date.now(),
  };
  let photos = loadPhotos(uid);
  photos.unshift(entry);
  // Limitar a MAX_PHOTOS
  if (photos.length > MAX_PHOTOS) photos = photos.slice(0, MAX_PHOTOS);
  localStorage.setItem(KEY(uid), JSON.stringify(photos));
  return entry;
}

export function deletePhoto(uid, id) {
  const photos = loadPhotos(uid).filter(p => p.id !== id);
  localStorage.setItem(KEY(uid), JSON.stringify(photos));
}

export function getStorageUsedKB(uid) {
  try {
    const raw = localStorage.getItem(KEY(uid)) || "";
    return Math.round(raw.length * 0.75 / 1024); // base64 → bytes → KB
  } catch { return 0; }
}
