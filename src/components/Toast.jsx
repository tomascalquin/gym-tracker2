/**
 * Notificación temporal tipo toast.
 * Se muestra centrada arriba de la pantalla y desaparece sola.
 */
export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        background: "#14532d",
        border: "1px solid #22c55e",
        padding: "8px 18px",
        borderRadius: 8,
        fontSize: 11,
        letterSpacing: 1,
        animation: "slideDown 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}
