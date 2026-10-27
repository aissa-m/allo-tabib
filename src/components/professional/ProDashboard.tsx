"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ChevronRight,
  Crosshair,
  Hand,
  LocateOff,
  MapPin,
  MonitorSmartphone,
  Navigation,
  UserRoundCog,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { ProMap } from "@/components/map";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { useLocationSharing, type LocationMode } from "./useLocationSharing";
import { useWakeLock } from "./useWakeLock";
import { useNow, useTimeAgo, useZones } from "@/lib/hooks";
import { findZoneId, isInsideNouakchott } from "@/lib/geo";
import { cn, fetcher, fullName, localized, zoneName } from "@/lib/utils";
import type { MeDTO } from "@/lib/types";

const MODE_KEY = "allotabib.locationMode";
type LatLng = { lat: number; lng: number };

export function ProDashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: me, mutate, isLoading } = useSWR<MeDTO>("/api/me", fetcher, { revalidateOnFocus: true });
  const { zones } = useZones();
  const [pending, setPending] = useState(false);
  const available = !!me?.isAvailable;

  // Modo de localización (recordado en el dispositivo) y punto manual
  const [mode, setModeState] = useState<LocationMode>("auto");
  const [manualPos, setManualPos] = useState<LatLng | null>(null);
  useEffect(() => {
    try {
      if (localStorage.getItem(MODE_KEY) === "manual") setModeState("manual");
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  // Recupera el punto manual guardado en el servidor (p. ej. tras recargar la página)
  useEffect(() => {
    if (me?.locationManual && me.realLat != null && me.realLng != null) {
      setManualPos((p) => p ?? { lat: me.realLat!, lng: me.realLng! });
    }
  }, [me?.locationManual, me?.realLat, me?.realLng]);

  const sharing = useLocationSharing(available, mode, manualPos, () => void mutate());
  const wake = useWakeLock(available);
  const now = useNow(1000);
  const ago = useTimeAgo();

  const homeZone = zones.find((z) => z.id === me?.homeZoneId);
  const homeCenter = useMemo(() => (homeZone ? { lat: homeZone.centerLat, lng: homeZone.centerLng } : null), [homeZone]);

  // Modo manual recordado pero sin punto guardado: se coloca en el centro de la zona habitual.
  useEffect(() => {
    if (!me || !me.isAvailable || mode !== "manual" || manualPos || !homeZone) return;
    if (me.locationManual && me.realLat != null) return;
    setManualPos({ lat: homeZone.centerLat, lng: homeZone.centerLng });
  }, [me, mode, manualPos, homeZone]);

  const setMode = (m: LocationMode) => {
    if (m === "manual" && !manualPos) {
      // Punto inicial: la última posición GPS si está en Nuakchott; si no, el centro de la zona habitual.
      const gps = mode === "auto" ? sharing.fix : null;
      setManualPos(gps && isInsideNouakchott(gps) ? { lat: gps.lat, lng: gps.lng } : homeCenter);
    }
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* sin almacenamiento */
    }
  };

  const pick = (pos: LatLng) => {
    if (!isInsideNouakchott(pos)) {
      toast.error(t("pro.locationOutside"));
      return;
    }
    setManualPos(pos);
  };

  const toggle = async () => {
    if (!me) return;
    const next = !available;
    setPending(true);
    try {
      const res = await fetch("/api/me/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: next }),
      });
      if (!res.ok) throw new Error();
      await mutate((await res.json()) as MeDTO, { revalidate: false });
      toast.success(next ? t("pro.nowAvailable") : t("pro.nowUnavailable"));
      if (next && typeof navigator !== "undefined") navigator.vibrate?.(30);
    } catch {
      toast.error(t("common.unknownError"));
    } finally {
      setPending(false);
    }
  };

  const status = sharing.status;
  const manual = available && mode === "manual";
  // Posición válida para mostrar: GPS dentro de Nuakchott o punto manual
  const fix = sharing.fix && status !== "outside" ? sharing.fix : null;
  const fallback = !manual && (status === "denied" || status === "unsupported" || status === "outside");

  // Posición a mostrar: la manual, la del GPS, o el centro de la zona habitual si no hay otra.
  const position = useMemo<LatLng | null>(() => {
    if (manual) return manualPos ?? homeCenter;
    if (fix) return { lat: fix.lat, lng: fix.lng };
    if (homeCenter && (fallback || !available)) return homeCenter;
    return null;
  }, [manual, manualPos, fix, homeCenter, fallback, available]);

  const currentZoneId = useMemo(() => {
    const pos = manual ? manualPos : fix;
    if (pos && zones.length) return findZoneId(pos, zones) ?? sharing.serverZoneId ?? me?.homeZoneId ?? null;
    return me?.homeZoneId ?? null;
  }, [manual, manualPos, fix, zones, sharing.serverZoneId, me?.homeZoneId]);
  const currentZone = zones.find((z) => z.id === currentZoneId);

  if (isLoading || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const locationLine = !available
    ? { icon: LocateOff, text: t("pro.locationOff"), tone: "muted" }
    : status === "sharing" && sharing.lastSentAt
      ? manual
        ? { icon: Hand, text: t("pro.manualShared", { time: ago(sharing.lastSentAt, now) }), tone: "sage" }
        : { icon: Navigation, text: t("pro.locationShared", { time: ago(sharing.lastSentAt, now) }), tone: "sage" }
      : status === "manualUnset"
        ? { icon: Hand, text: t("pro.manualNotSet"), tone: "muted" }
        : status === "waiting"
          ? { icon: Crosshair, text: t("pro.locationWaiting"), tone: "muted" }
          : status === "outside"
            ? { icon: AlertTriangle, text: t("pro.locationOutside"), tone: "terra" }
            : status === "inaccurate"
              ? { icon: AlertTriangle, text: t("pro.locationInaccurate"), tone: "terra" }
              : { icon: LocateOff, text: t("pro.locationUnavailable"), tone: "terra" };

  // En modo automático, si el GPS no sirve se propone pasar a manual.
  const suggestManual = available && mode === "auto" && (status === "outside" || status === "inaccurate" || status === "denied" || status === "unsupported");

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="flex items-center gap-4 p-4">
          <Avatar src={me.photoUrl} alt={fullName(me)} size={60} ring={me.type === "DOCTOR" ? "sage" : "slate"} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{fullName(me)}</p>
            <p className="truncate text-sm text-muted">
              {t(`types.${me.type}`)} · {localized(me.specialty, locale)}
            </p>
          </div>
          <span
            className={cn("h-3 w-3 shrink-0 rounded-full", available ? "bg-online shadow-[0_0_0_4px_rgb(var(--online)/0.2)]" : "bg-line/25")}
            aria-hidden
          />
        </GlassCard>
      </motion.div>

      {/* Disponibilidad */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard className="px-5 py-8">
          <AvailabilityToggle available={available} pending={pending} onToggle={toggle} />
          {available && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-line/[0.04] px-4 py-3">
              <MonitorSmartphone size={20} strokeWidth={1.5} className="shrink-0 text-slate" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t("pro.wakeLock")}</p>
                <p className="text-xs text-muted">{wake.supported ? t("pro.wakeLockHint") : t("pro.wakeLockUnsupported")}</p>
              </div>
              <Switch checked={wake.supported && wake.enabled} onChange={wake.setEnabled} disabled={!wake.supported} label={t("pro.wakeLock")} />
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Aviso si el GPS no está disponible (sin permiso o no compatible) */}
      {available && mode === "auto" && (status === "denied" || status === "unsupported") && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="border-terra/30 bg-terra/10 p-4 dark:bg-terra/10" role="alert">
            <div className="flex gap-3">
              <AlertTriangle size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-terra" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold">{status === "unsupported" ? t("pro.locationUnsupported") : t("pro.locationDeniedTitle")}</p>
                <p className="mt-1 text-ink/80">
                  {t("pro.locationDeniedBody", { zone: homeZone ? zoneName(homeZone, locale) : "—" })}
                </p>
                {status === "denied" && <p className="mt-2 text-muted">{t("pro.locationDeniedHow")}</p>}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Mapa propio */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base">
              <MapPin size={18} strokeWidth={1.5} className="text-slate" aria-hidden />
              {t("pro.myMap")}
            </h2>
            {currentZone && (
              <span className="rounded-full bg-slate/15 px-2.5 py-1 text-xs font-medium text-slate">
                {zoneName(currentZone, locale)}
              </span>
            )}
          </div>

          {/* Selector de modo: GPS automático o posición manual */}
          {available && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-line/[0.05] p-1" role="radiogroup" aria-label={t("pro.locationMode")}>
                {([
                  { v: "auto", icon: Crosshair, label: t("pro.modeAuto") },
                  { v: "manual", icon: Hand, label: t("pro.modeManual") },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={mode === o.v}
                    onClick={() => setMode(o.v)}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-lg text-sm transition duration-200",
                      mode === o.v ? "bg-white font-medium text-ink shadow-sm dark:bg-white/15" : "text-ink/70 hover:text-ink",
                    )}
                  >
                    <o.icon size={16} strokeWidth={1.5} aria-hidden />
                    {o.label}
                  </button>
                ))}
              </div>
              {manual && <p className="mt-2 text-xs text-muted">{t("pro.manualHint")}</p>}
            </div>
          )}

          <div className="h-72 sm:h-80">
            <ProMap
              zones={zones}
              position={position}
              zoneId={currentZoneId}
              live={available && (manual || !!fix)}
              editable={manual}
              onPick={pick}
              label={t("pro.myMap")}
              dotLabel={manual ? t("pro.pinLabel") : t("pro.myMap")}
              recenterLabel={t("pro.recenter")}
            />
          </div>
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm",
              locationLine.tone === "sage" && "text-online",
              locationLine.tone === "terra" && "text-terra",
              locationLine.tone === "muted" && "text-muted",
            )}
            aria-live="polite"
          >
            <locationLine.icon size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
            <span className="flex-1">{locationLine.text}</span>
            {available && !manual && fix && (
              <span className="text-xs text-muted" dir="ltr">
                {t("pro.accuracy", { meters: Math.round(fix.accuracy) })}
              </span>
            )}
          </div>
          {suggestManual && (
            <div className="px-4 pb-4">
              <Button variant="secondary" size="sm" icon={Hand} block onClick={() => setMode("manual")}>
                {t("pro.useManual")}
              </Button>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Mi perfil */}
      <Link href="/pro/profile" className="block rounded-2xl">
        <GlassCard hoverable className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/15 text-sage">
            <UserRoundCog size={20} strokeWidth={1.5} aria-hidden />
          </span>
          <span className="flex-1 font-medium">{t("pro.myProfile")}</span>
          <ChevronRight size={20} strokeWidth={1.5} className="text-muted rtl:-scale-x-100" aria-hidden />
        </GlassCard>
      </Link>
    </div>
  );
}
