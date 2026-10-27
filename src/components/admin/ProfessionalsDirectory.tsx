"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  MapPin,
  Phone,
  Power,
  Rows3,
  Search,
  Stethoscope,
  Users,
  UserRoundSearch,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProfessionalDetailPanel } from "@/components/professional/ProfessionalDetail";
import { TypeIcon } from "@/components/professional/ProfessionalCard";
import { useSpecialties, useZones } from "@/lib/hooks";
import { formatPhone } from "@/lib/phone";
import { cn, fetcher, fullName, localized, specialtyName, zoneName } from "@/lib/utils";
import type { ProfessionalDetailDTO, ProfessionalsPage } from "@/lib/types";

type View = "grid" | "table";
const VIEW_KEY = "allotabib.directoryView";

function StatusBadge({ available, className }: { available: boolean; className?: string }) {
  const t = useTranslations("status");
  return available ? (
    <Badge tone="sage" icon={Power} className={className}>{t("available")}</Badge>
  ) : (
    <Badge icon={Power} className={className}>{t("unavailable")}</Badge>
  );
}

/** Lista de todos los profesionales (solo consulta). */
export function ProfessionalsDirectory() {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();
  const { zones } = useZones();
  const { specialties } = useSpecialties();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [type, setType] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [zone, setZone] = useState("");
  const [available, setAvailable] = useState("");
  const [sort, setSort] = useState("availability");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("grid");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "grid" || v === "table") setView(v);
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* sin almacenamiento */
    }
  };

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => setPage(1), [debouncedQ, type, specialty, zone, available, sort]);

  const params = new URLSearchParams({ page: String(page), sort });
  if (debouncedQ) params.set("q", debouncedQ);
  if (type) params.set("type", type);
  if (specialty) params.set("specialty", specialty);
  if (zone) params.set("zone", zone);
  if (available) params.set("available", available);

  const { data, isLoading, error } = useSWR<ProfessionalsPage>(`/api/admin/professionals?${params.toString()}`, fetcher, {
    keepPreviousData: true,
  });

  const zoneLabel = (p: ProfessionalDetailDTO) => (p.isAvailable ? (locale === "ar" ? p.zone.ar : p.zone.fr) : locale === "ar" ? p.homeZone.ar : p.homeZone.fr);
  const filteredSpecialties = specialties.filter((s) => !type || s.type === type);

  return (
    <div className="mx-auto max-w-7xl px-3 pb-24 pt-4 sm:px-6 md:pb-8 md:pt-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">{t("list.title")}</h1>
          <p className="text-sm text-muted">{t("list.subtitle")}</p>
        </div>
        <div className="glass flex gap-1 p-1" role="group">
          <IconButton icon={LayoutGrid} label={t("list.viewGrid")} variant={view === "grid" ? "secondary" : "ghost"} size="sm" aria-pressed={view === "grid"} onClick={() => changeView("grid")} />
          <IconButton icon={Rows3} label={t("list.viewTable")} variant={view === "table" ? "secondary" : "ghost"} size="sm" aria-pressed={view === "table"} onClick={() => changeView("table")} />
        </div>
      </header>

      <GlassCard className="mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          icon={Search}
          type="search"
          aria-label={t("list.searchPlaceholder")}
          placeholder={t("list.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          wrapperClassName="sm:col-span-2"
        />
        <Select icon={Users} aria-label={t("admin.filters.type")} value={type} onChange={(e) => { setType(e.target.value); setSpecialty(""); }}>
          <option value="">{t("admin.filters.all")}</option>
          <option value="DOCTOR">{t("types.DOCTOR_plural")}</option>
          <option value="NURSE">{t("types.NURSE_plural")}</option>
        </Select>
        <Select icon={Stethoscope} aria-label={t("admin.filters.specialty")} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          <option value="">{t("list.allSpecialties")}</option>
          {filteredSpecialties.map((s) => (
            <option key={s.id} value={s.id}>
              {specialtyName(s, locale)}{!type ? ` (${t(`types.${s.type}`)})` : ""}
            </option>
          ))}
        </Select>
        <Select icon={MapPin} aria-label={t("list.zone")} value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="">{t("list.allZones")}</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {zoneName(z, locale)}
            </option>
          ))}
        </Select>
        <Select icon={Power} aria-label={t("list.availability")} value={available} onChange={(e) => setAvailable(e.target.value)}>
          <option value="">{t("list.availability")}: {t("common.all")}</option>
          <option value="true">{t("list.availableOnly")}</option>
          <option value="false">{t("list.unavailableOnly")}</option>
        </Select>
        <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-6">
          <p className="shrink-0 text-sm text-muted" aria-live="polite">
            {data ? t("list.total", { count: data.total }) : " "}
          </p>
          <Select icon={ArrowDownUp} aria-label={t("list.sort")} value={sort} onChange={(e) => setSort(e.target.value)} wrapperClassName="min-w-0 flex-1 sm:w-56 sm:flex-none">
            <option value="availability">{t("list.sort")}: {t("list.sortAvailability")}</option>
            <option value="name">{t("list.sort")}: {t("list.sortName")}</option>
            <option value="recent">{t("list.sort")}: {t("list.sortRecent")}</option>
          </Select>
        </div>
      </GlassCard>

      {isLoading && !data ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : error && !data ? (
        <EmptyState icon={UserRoundSearch} title={t("admin.loadError")} />
      ) : !data || data.items.length === 0 ? (
        <GlassCard>
          <EmptyState icon={UserRoundSearch} title={t("list.emptyTitle")} body={t("list.emptyBody")} />
        </GlassCard>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.25) }}
              onClick={() => setDetailId(p.id)}
              className="text-start"
            >
              <GlassCard hoverable className="h-full p-4">
                <div className="flex gap-3">
                  <Avatar src={p.photoUrl} alt={fullName(p)} size={52} ring={p.type === "DOCTOR" ? "sage" : "slate"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-[15px]">{fullName(p)}</h3>
                      <StatusBadge available={p.isAvailable} className="shrink-0" />
                    </div>
                    <p className={cn("mt-0.5 flex items-center gap-1.5 text-sm", p.type === "DOCTOR" ? "text-sage" : "text-slate")}>
                      <TypeIcon type={p.type} />
                      <span className="truncate">{localized(p.specialty, locale)}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-sm text-muted">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <MapPin size={14} strokeWidth={1.5} aria-hidden className="shrink-0" />
                    <span className="truncate">{zoneLabel(p)}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium text-ink" dir="ltr">
                    <Phone size={14} strokeWidth={1.5} aria-hidden />
                    {formatPhone(p.phone)}
                  </span>
                </div>
              </GlassCard>
            </motion.button>
          ))}
        </div>
      ) : (
        <GlassCard padded={false} className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line/[0.08] text-start text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 text-start font-medium">{t("list.colName")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("list.colType")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("list.colSpecialty")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("list.colZone")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("list.colPhone")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("list.colStatus")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("list.colRegistered")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr
                  key={p.id}
                  tabIndex={0}
                  onClick={() => setDetailId(p.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDetailId(p.id)}
                  className="cursor-pointer border-b border-line/[0.05] transition last:border-0 hover:bg-white/40 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar src={p.photoUrl} alt="" size={36} />
                      <span className="font-medium">{fullName(p)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex items-center gap-1.5", p.type === "DOCTOR" ? "text-sage" : "text-slate")}>
                      <TypeIcon type={p.type} />
                      {t(`types.${p.type}`)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{localized(p.specialty, locale)}</td>
                  <td className="px-4 py-2.5">{zoneLabel(p)}</td>
                  <td className="px-4 py-2.5" dir="ltr">{formatPhone(p.phone)}</td>
                  <td className="px-4 py-2.5"><StatusBadge available={p.isAvailable} /></td>
                  <td className="px-4 py-2.5 text-muted">{format.dateTime(new Date(p.createdAt), { dateStyle: "medium" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {data && data.pages > 1 && (
        <nav className="mt-5 flex items-center justify-center gap-3" aria-label={t("list.pageOf", { page: data.page, pages: data.pages })}>
          <IconButton icon={ChevronLeft} label={t("list.prev")} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rtl:-scale-x-100" />
          <span className="text-sm text-muted">{t("list.pageOf", { page: data.page, pages: data.pages })}</span>
          <IconButton icon={ChevronRight} label={t("list.next")} disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rtl:-scale-x-100" />
        </nav>
      )}

      <ProfessionalDetailPanel id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
