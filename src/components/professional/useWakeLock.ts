"use client";

import { useEffect, useRef, useState } from "react";

const PREF_KEY = "allotabib.wakeLock";

/** Mantiene la pantalla encendida (Wake Lock API) mientras `active` y la preferencia estén activos. */
export function useWakeLock(active: boolean) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(true);
  const [locked, setLocked] = useState(false);
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
    try {
      setEnabledState(localStorage.getItem(PREF_KEY) !== "off");
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    try {
      localStorage.setItem(PREF_KEY, v ? "on" : "off");
    } catch {
      /* sin almacenamiento */
    }
  };

  useEffect(() => {
    if (!supported || !active || !enabled) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await s.release();
          return;
        }
        sentinel.current = s;
        setLocked(true);
        s.addEventListener("release", () => setLocked(false));
      } catch {
        setLocked(false);
      }
    };
    // El bloqueo se pierde al ocultar la pestaña: se vuelve a pedir al volver.
    const onVisible = () => document.visibilityState === "visible" && void acquire();

    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel.current?.release().catch(() => undefined);
      sentinel.current = null;
      setLocked(false);
    };
  }, [supported, active, enabled]);

  return { supported, enabled, setEnabled, locked };
}
