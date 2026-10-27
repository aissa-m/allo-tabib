"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { fetcher } from "./utils";
import type { SpecialtyDTO, ZoneDTO } from "./types";

export function useZones() {
  const { data, error, isLoading } = useSWR<ZoneDTO[]>("/api/zones", fetcher, { revalidateOnFocus: false });
  return { zones: data ?? [], error, isLoading };
}

export function useSpecialties() {
  const { data, error, isLoading } = useSWR<SpecialtyDTO[]>("/api/specialties", fetcher, { revalidateOnFocus: false });
  return { specialties: data ?? [], error, isLoading };
}

/** "Ahora" que se actualiza periódicamente, para textos tipo "il y a 12 s". */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Devuelve una función que formatea "hace X" según el idioma. */
export function useTimeAgo() {
  const t = useTranslations("time");
  return useCallback(
    (iso: string | number | Date | null | undefined, now: number = Date.now()) => {
      if (iso == null) return "";
      const diff = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
      if (diff < 5) return t("justNow");
      if (diff < 60) return t("secondsAgo", { count: diff });
      if (diff < 3600) return t("minutesAgo", { count: Math.floor(diff / 60) });
      if (diff < 86400) return t("hoursAgo", { count: Math.floor(diff / 3600) });
      return t("daysAgo", { count: Math.floor(diff / 86400) });
    },
    [t],
  );
}

/** Traduce los mensajes de error de zod (que son claves dentro de "errors"). */
export function useErrorText() {
  const t = useTranslations("errors");
  return useCallback(
    (key?: string) => {
      if (!key) return undefined;
      return t.has(key as never) ? t(key as never) : t("required");
    },
    [t],
  );
}
