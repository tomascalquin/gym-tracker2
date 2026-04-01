/**
 * Componentes skeleton con la forma exacta de cada card.
 */

function SkeletonBase({ style }) {
  return (
    <div className="skeleton" style={{ borderRadius: 14, ...style }} />
  );
}

// Skeleton de card de día en el home
export function DayCardSkeleton() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
      borderLeft: "3px solid var(--border)", borderRadius: 14,
      padding: "14px 16px", marginBottom: 7,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <SkeletonBase style={{ width: 30, height: 9 }} />
          <SkeletonBase style={{ width: 80, height: 14 }} />
        </div>
        <SkeletonBase style={{ width: 120, height: 11 }} />
      </div>
      <SkeletonBase style={{ width: 12, height: 20 }} />
    </div>
  );
}

// Skeleton de stat (los cuadritos de sesiones por día)
export function StatSkeleton({ count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 6, marginBottom: 14 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
          borderRadius: 10, padding: "10px 6px", textAlign: "center",
        }}>
          <SkeletonBase style={{ width: 24, height: 20, margin: "0 auto 6px" }} />
          <SkeletonBase style={{ width: "80%", height: 8, margin: "0 auto" }} />
        </div>
      ))}
    </div>
  );
}

// Skeleton de XP bar
export function XPBarSkeleton() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
      borderRadius: 14, padding: "12px 16px", marginBottom: 14,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <SkeletonBase style={{ width: 36, height: 36, borderRadius: "50%" }} />
      <div style={{ flex: 1 }}>
        <SkeletonBase style={{ width: 80, height: 11, marginBottom: 6 }} />
        <SkeletonBase style={{ width: 130, height: 13, marginBottom: 8 }} />
        <SkeletonBase style={{ width: "100%", height: 5 }} />
      </div>
    </div>
  );
}

// Skeleton de ranking card
export function RankCardSkeleton({ count = 5 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
          borderRadius: 14, marginBottom: 6, padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <SkeletonBase style={{ width: 28, height: 14 }} />
          <SkeletonBase style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBase style={{ width: 100, height: 13, marginBottom: 5 }} />
            <SkeletonBase style={{ width: 60, height: 10 }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <SkeletonBase style={{ width: 50, height: 15, marginBottom: 4 }} />
            <SkeletonBase style={{ width: 24, height: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}

// Skeleton de historial
export function HistoryCardSkeleton({ count = 4 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
          borderLeft: "3px solid var(--border)", borderRadius: 14,
          padding: "13px 14px", marginBottom: 8,
          display: "flex", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <SkeletonBase style={{ width: 70, height: 14 }} />
              <SkeletonBase style={{ width: 50, height: 11 }} />
            </div>
            <SkeletonBase style={{ width: 110, height: 11 }} />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <SkeletonBase style={{ width: 32, height: 32, borderRadius: 8 }} />
            <SkeletonBase style={{ width: 44, height: 32, borderRadius: 8 }} />
            <SkeletonBase style={{ width: 32, height: 32, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}

// Skeleton de amigo
export function FriendCardSkeleton({ count = 3 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid var(--glass-border)",
          borderRadius: 14, padding: "12px 14px", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <SkeletonBase style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBase style={{ width: 100, height: 14, marginBottom: 5 }} />
            <SkeletonBase style={{ width: 140, height: 11 }} />
          </div>
          <SkeletonBase style={{ width: 16, height: 20 }} />
        </div>
      ))}
    </>
  );
}
