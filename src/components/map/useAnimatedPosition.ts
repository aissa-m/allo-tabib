"use client";

import { useEffect, useRef, useState } from "react";

type Pos = { lat: number; lng: number };

/** Interpola suavemente entre posiciones para que los marcadores "se deslicen" al actualizarse. */
export function useAnimatedPosition(target: Pos, duration = 1200): Pos {
  const [pos, setPos] = useState(target);
  const fromRef = useRef(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const from = currentRef.current;
    if (from.lat === target.lat && from.lng === target.lng) return;
    fromRef.current = from;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const next = {
        lat: fromRef.current.lat + (target.lat - fromRef.current.lat) * e,
        lng: fromRef.current.lng + (target.lng - fromRef.current.lng) * e,
      };
      currentRef.current = next;
      setPos(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target.lat, target.lng, duration]);

  return pos;
}
