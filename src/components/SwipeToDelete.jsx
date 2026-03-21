import { useState, useRef } from "react";
import { haptics } from "../utils/haptics";

const THRESHOLD = 80; // px para activar delete

export default function SwipeToDelete({ onDelete, children }) {
  const [dragX, setDragX]       = useState(0);
  const [deleting, setDeleting] = useState(false);
  const startX  = useRef(0);
  const isDrag  = useRef(false);

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    isDrag.current = false;
  }

  function onTouchMove(e) {
    const dx = e.touches[0].clientX - startX.current;
    if (dx > 0) return; // solo hacia la izquierda
    isDrag.current = true;
    const clamped = Math.max(dx, -160);
    setDragX(clamped);

    // Haptic al llegar al threshold
    if (Math.abs(clamped) >= THRESHOLD && Math.abs(dragX) < THRESHOLD) {
      haptics.warning();
    }
  }

  function onTouchEnd() {
    if (!isDrag.current) return;
    if (Math.abs(dragX) >= THRESHOLD) {
      // Confirmar delete con animación
      setDragX(-window.innerWidth);
      setDeleting(true);
      haptics.error();
      setTimeout(() => onDelete(), 280);
    } else {
      setDragX(0);
    }
  }

  const showDelete = dragX < -20;
  const deleteOpacity = Math.min(1, Math.abs(dragX) / THRESHOLD);
  const activated = Math.abs(dragX) >= THRESHOLD;

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 8 }}>
      {/* Fondo rojo de delete */}
      {showDelete && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          background: activated ? "#dc2626" : "#7f1d1d",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "0 20px",
          transition: "background 0.15s",
          opacity: deleteOpacity,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>🗑️</div>
            <div style={{ fontSize: 9, color: "#fff", letterSpacing: 1, marginTop: 2 }}>
              {activated ? "¡SUELTA!" : "ELIMINAR"}
            </div>
          </div>
        </div>
      )}

      {/* Contenido deslizable */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: deleting ? "transform 0.28s ease" : dragX === 0 ? "transform 0.25s ease" : "none",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
