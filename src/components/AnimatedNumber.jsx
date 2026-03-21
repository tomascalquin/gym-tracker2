import { useEffect, useRef, useState } from "react";

export default function AnimatedNumber({ value, duration = 800, style }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef();

  useEffect(() => {
    const from = prevRef.current;
    const to   = value;
    if (from === to) return;

    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <span style={style}>{display.toLocaleString()}</span>;
}
