"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Car, Clock, Hand, Home, Info, MapPin, MapPinOff, Navigation, Power, Stethoscope, Syringe } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { ContactActions } from "./ContactActions";
import { useTimeAgo } from "@/lib/hooks";
import { cn, formatDistance, fullName, localized } from "@/lib/utils";
import type { ProfessionalCardDTO } from "@/lib/types";

type Props = {
  pro: ProfessionalCardDTO;
  distance?: number | null;
  highlighted?: boolean;
  now?: number;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  /** Vista previa en el perfil: sin interacción. */
  preview?: boolean;
  strong?: boolean;
  className?: string;
};

export const TypeIcon = ({ type, size = 14 }: { type: "DOCTOR" | "NURSE"; size?: number }) =>
  type === "DOCTOR" ? <Stethoscope size={size} strokeWidth={1.5} aria-hidden /> : <Syringe size={size} strokeWidth={1.5} aria-hidden />;

/** Tarjeta de profesional (lista del admin, popup del mapa y vista previa). Estado en verde (disponible) o rojo (no disponible). */
export const ProfessionalCard = forwardRef<HTMLDivElement, Props>(function ProfessionalCard(
  { pro, distance, highlighted, now, onHover, onSelect, onOpen, preview, strong, className },
  ref,
) {
  const t = useTranslations();
  const locale = useLocale();
  const ago = useTimeAgo();
  const tone = pro.type === "DOCTOR" ? "sage" : "slate";
  const off = !pro.isAvailable;

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => onHover?.(pro.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <GlassCard
        padded={false}
        strong={strong}
        hoverable={!preview}
        onClick={() => onSelect?.(pro.id)}
        className={cn(
          "relative p-4",
          onSelect && "cursor-pointer",
          highlighted && "!border-slate/50 ring-2 ring-slate/30",
          className,
        )}
      >
        {/* Barra de estado en el borde inicial */}
        <span className={cn("absolute inset-y-3 start-0 w-1 rounded-e-full", off ? "bg-offline" : "bg-online")} aria-hidden />
        <div className="flex gap-3">
          <Avatar src={pro.photoUrl} alt={fullName(pro)} size={56} className={cn("ring-[3px]", off ? "ring-offline" : "ring-online")} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[15px]">{fullName(pro)}</h3>
                <p className={cn("mt-0.5 flex items-center gap-1.5 text-sm", tone === "sage" ? "text-sage" : "text-slate")}>
                  <TypeIcon type={pro.type} />
                  <span className="truncate">
                    {t(`types.${pro.type}`)} · {localized(pro.specialty, locale)}
                  </span>
                </p>
                <Badge icon={Power} tone={off ? "offline" : "online"} className="mt-1.5 px-2 py-0.5">
                  {t(off ? "status.unavailable" : "status.available")}
                </Badge>
              </div>
              {onOpen && (
                <IconButton
                  icon={Info}
                  label={t("admin.openDetail")}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(pro.id);
                  }}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} strokeWidth={1.5} aria-hidden />
                {locale === "ar" ? pro.zone.ar : pro.zone.fr}
              </span>
              {distance != null && (
                <span className="inline-flex items-center gap-1">
                  <Navigation size={13} strokeWidth={1.5} aria-hidden />
                  {t("admin.distance", { distance: formatDistance(distance, locale) })}
                </span>
              )}
              {off ? (
                <span className="inline-flex items-center gap-1">
                  <Home size={13} strokeWidth={1.5} aria-hidden />
                  {t("admin.homeZone")}
                </span>
              ) : pro.locationStatus === "none" ? (
                <span className="inline-flex items-center gap-1 text-terra">
                  <MapPinOff size={13} strokeWidth={1.5} aria-hidden />
                  {t("admin.fallbackPosition")}
                </span>
              ) : (
                <span className={cn("inline-flex items-center gap-1", pro.locationStatus === "stale" && "text-terra")}>
                  <Clock size={13} strokeWidth={1.5} aria-hidden />
                  {pro.locationStatus === "stale" ? `${t("location.stale")} · ` : ""}
                  {t("admin.updated", { time: ago(pro.locationUpdatedAt, now) })}
                </span>
              )}
              {pro.locationManual && (
                <span className="inline-flex items-center gap-1">
                  <Hand size={13} strokeWidth={1.5} aria-hidden />
                  {t("location.manual")}
                </span>
              )}
              {pro.hasVehicle && (
                <span className="inline-flex items-center gap-1">
                  <Car size={13} strokeWidth={1.5} aria-hidden />
                  {t("fields.hasVehicle")}
                </span>
              )}
            </div>
          </div>
        </div>
        <ContactActions phone={pro.phone} whatsapp={pro.whatsapp} className="mt-3" disabled={preview} />
      </GlassCard>
    </motion.div>
  );
});
