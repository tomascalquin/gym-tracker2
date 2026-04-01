import { DAY_META } from "../data/routine";

/**
 * Feed de actividad reciente de amigos.
 * Aparece en el home cuando algún amigo entrenó desde la última visita.
 */
export default function ActivityFeed({ activity, onDismiss }) {
  if (!activity?.length) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.12)",
      borderLeft: "3px solid #60a5fa", borderRadius: 10,
      padding: "12px 14px", marginBottom: 16,
      animation: "slideDown 0.3s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#60a5fa", letterSpacing: 2 }}>
          🏃 ACTIVIDAD RECIENTE
        </div>
        <button onClick={onDismiss} className="nbtn" style={{ color: "#475569", fontSize: 13 }}>✕</button>
      </div>

      {activity.map((friend, i) => (
        <div key={friend.uid} style={{
          paddingBottom: i < activity.length - 1 ? 8 : 0,
          marginBottom: i < activity.length - 1 ? 8 : 0,
          borderBottom: i < activity.length - 1 ? "1px solid #1a1a2a" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(96,165,250,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "#60a5fa", flexShrink: 0,
            }}>
              {(friend.displayName || "?")[0].toUpperCase()}
            </div>
            <div>
              <span style={{ fontSize: 13, color: "#f1f5f9" }}>{friend.displayName}</span>
              <span style={{ fontSize: 12, color: "#475569" }}> entrenó</span>
            </div>
          </div>

          {/* Sesiones */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6, paddingLeft: 36 }}>
            {friend.sessions.slice(0, 3).map((s, si) => {
              const c = DAY_META[s.day] || { accent: "#60a5fa" };
              return (
                <span key={si} style={{
                  fontSize: 10, background: c.accent + "22",
                  color: c.accent, padding: "2px 8px", borderRadius: 10,
                }}>
                  {s.day} · {s.date.slice(5)}
                </span>
              );
            })}
            {friend.sessions.length > 3 && (
              <span style={{ fontSize: 10, color: "#475569" }}>
                +{friend.sessions.length - 3} más
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
