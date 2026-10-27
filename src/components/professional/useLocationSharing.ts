"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { distanceMeters } from "@/lib/geo";
import {
  LOCATION_MAX_SILENCE_MS,
  LOCATION_MIN_DISTANCE_M,
  LOCATION_MIN_INTERVAL_MS,
} from "@/lib/constants";

export type SharingStatus =
  | "idle"
  | "waiting"
  | "sharing"
  | "denied"
  | "unsupported"
  | "outside"
  | "inaccurate"
  | "manualUnset"
  | "error";

/** "auto": GPS del dispositivo. "manual": punto elegido por el profesional en el mapa. */
export type LocationMode = "auto" | "manual";

type Fix = { lat: number; lng: number; accuracy: number };

/**
 * Comparte la posición mientras `enabled` sea true.
 * - Automático: envía como máximo cada 20 s, y solo si se ha movido > 20 m o han pasado 60 s.
 * - Manual: envía al instante cuando el profesional mueve el punto y lo reenvía cada 60 s
 *   para que no se marque como obsoleto mientras sigue disponible.
 */
export function useLocationSharing(
  enabled: boolean,
  mode: LocationMode,
  manualPos: { lat: number; lng: number } | null,
  onNotAvailable?: () => void,
) {
  const [status, setStatus] = useState<SharingStatus>("idle");
  const [fix, setFix] = useState<Fix | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [serverZoneId, setServerZoneId] = useState<number | null>(null);

  const latest = useRef<Fix | null>(null);
  const lastSent = useRef<{ at: number; pos: Fix } | null>(null);
  const sending = useRef(false);
  // Cambio manual llegado mientras había un envío en curso: se envía en cuanto termine.
  const pendingForce = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onNotAvailableRef = useRef(onNotAvailable);
  onNotAvailableRef.current = onNotAvailable;

  /** `force`: envío inmediato por una acción explícita del profesional (mover el punto). */
  const maybeSend = useCallback(async (force = false) => {
    const pos = latest.current;
    if (!pos) return;
    if (sending.current) {
      if (force) pendingForce.current = true;
      return;
    }
    const now = Date.now();
    const prev = lastSent.current;
    if (prev && !force) {
      const elapsed = now - prev.at;
      if (elapsed < LOCATION_MIN_INTERVAL_MS) return;
      const moved = distanceMeters(prev.pos, pos);
      if (moved < LOCATION_MIN_DISTANCE_M && elapsed < LOCATION_MAX_SILENCE_MS) return;
    }
    sending.current = true;
    try {
      const res = await fetch("/api/me/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pos, manual: modeRef.current === "manual" }),
      });
      // Se registra el intento para respetar el ritmo aunque falle.
      lastSent.current = { at: now, pos };
      if (res.ok) {
        const body = (await res.json()) as { currentZoneId: number | null; locationUpdatedAt: string };
        setServerZoneId(body.currentZoneId);
        setLastSentAt(new Date(body.locationUpdatedAt).getTime());
        setStatus("sharing");
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (body.error === "outside") setStatus("outside");
        else if (body.error === "inaccurate") setStatus("inaccurate");
        else if (body.error === "notAvailable") onNotAvailableRef.current?.();
        else setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      sending.current = false;
      if (pendingForce.current) {
        pendingForce.current = false;
        void maybeSend(true);
      }
    }
  }, []);

  // Reinicio al cambiar de disponibilidad o de modo
  useEffect(() => {
    latest.current = null;
    lastSent.current = null;
    setFix(null);
    setLastSentAt(null);
    if (!enabled) setStatus("idle");
  }, [enabled, mode]);

  // --- Modo automático (GPS) ---
  useEffect(() => {
    if (!enabled || mode !== "auto") return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("waiting");
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        latest.current = next;
        setFix(next);
        void maybeSend();
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) setStatus("denied");
        else setStatus((s) => (s === "sharing" ? s : "error"));
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    // Latido: si el dispositivo no se mueve, watchPosition no dispara; reenvía cada 60 s.
    const timer = setInterval(() => void maybeSend(), 5_000);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(timer);
    };
  }, [enabled, mode, maybeSend]);

  // --- Modo manual: envío inmediato al mover el punto ---
  useEffect(() => {
    if (!enabled || mode !== "manual") return;
    if (!manualPos) {
      setStatus("manualUnset");
      return;
    }
    const next = { lat: manualPos.lat, lng: manualPos.lng, accuracy: 0 };
    latest.current = next;
    setFix(next);
    void maybeSend(true);
  }, [enabled, mode, manualPos, maybeSend]);

  // --- Modo manual: latido cada 60 s ---
  useEffect(() => {
    if (!enabled || mode !== "manual") return;
    const timer = setInterval(() => void maybeSend(), 5_000);
    return () => clearInterval(timer);
  }, [enabled, mode, maybeSend]);

  return { status, fix, lastSentAt, serverZoneId };
}
