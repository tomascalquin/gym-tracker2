import { useState, useEffect, useRef } from "react";

/**
 * Jerarquía de vistas — determina si se desliza a derecha o izquierda.
 * Mayor índice = más "profundo" en la app → entra desde la derecha.
 */
const VIEW_HIERARCHY = [
  "home",
  "history", "progress", "progression", "friends", "leaderboard",
  "session", "profile", "editRoutine", "challenges",
  "groups", "chat",
];

function getDirection(from, to) {
  const fi = VIEW_HIERARCHY.indexOf(from);
  const ti = VIEW_HIERARCHY.indexOf(to);
  if (fi === -1 || ti === -1) return "right";
  return ti > fi ? "right" : "left";
}

export default function PageTransition({ view, children }) {
  const [displayView, setDisplayView]   = useState(view);
  const [animClass, setAnimClass]       = useState("");
  const prevViewRef = useRef(view);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (view === displayView) return;

    const direction  = getDirection(prevViewRef.current, view);
    const enterClass = direction === "right" ? "slide-enter-right" : "slide-enter-left";
    const exitClass  = direction === "right" ? "slide-exit-left"  : "slide-exit-right";

    // Aplicar exit al contenedor actual
    setAnimClass(exitClass);

    setTimeout(() => {
      prevViewRef.current = view;
      setDisplayView(view);
      setAnimClass(enterClass);
      setTimeout(() => setAnimClass(""), 280);
    }, 180);
  }, [view]);

  return (
    <>
      <style>{`
        .slide-enter-right {
          animation: slideInRight 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .slide-enter-left {
          animation: slideInLeft 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .slide-exit-left {
          animation: slideOutLeft 0.18s cubic-bezier(0.55, 0, 1, 0.45) both;
          pointer-events: none;
        }
        .slide-exit-right {
          animation: slideOutRight 0.18s cubic-bezier(0.55, 0, 1, 0.45) both;
          pointer-events: none;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.8; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0.8; }
          to   { transform: translateX(0);     opacity: 1;   }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0);    opacity: 1;   }
          to   { transform: translateX(-30%); opacity: 0;   }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0);   opacity: 1; }
          to   { transform: translateX(30%); opacity: 0; }
        }
      `}</style>

      <div
        key={displayView}
        className={animClass}
        style={{ height: "100%", willChange: "transform, opacity" }}
      >
        {children(displayView)}
      </div>
    </>
  );
}
