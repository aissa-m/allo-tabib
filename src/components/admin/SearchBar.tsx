"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Car, Languages, MapPin, Power, RotateCcw, Search, SlidersHorizontal, Stethoscope, Syringe, Users, X } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { FilterPopover, PopoverOption } from "./Popover";
import { LANGUAGES } from "@/lib/constants";
import { cn, specialtyName, zoneName } from "@/lib/utils";
import type { SpecialtyDTO, ZoneDTO } from "@/lib/types";

export type MapFilters = {
  type: "" | "DOCTOR" | "NURSE";
  specialties: number[];
  lang: string;
  vehicle: boolean;
  name: string;
  /** Ocultar a los no disponibles (por defecto se ve a todo el mundo). */
  onlyAvailable: boolean;
};

export const EMPTY_FILTERS: MapFilters = { type: "", specialties: [], lang: "", vehicle: false, name: "", onlyAvailable: false };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Props = {
  zones: ZoneDTO[];
  specialties: SpecialtyDTO[];
  zoneId: number | null;
  onZone: (id: number | null) => void;
  filters: MapFilters;
  onFilters: (f: MapFilters) => void;
  /** Móvil: una sola fila (zona + botón «Filtres»); el nombre y los chips van en un panel desplegable. */
  compact?: boolean;
  /** Contenido extra al final del panel de filtros (solo en modo compacto). */
  panelExtra?: React.ReactNode;
};

/** Barra flotante de cristal: búsqueda por zona (autocompletado), por nombre y filtros en chips. */
export function SearchBar({ zones, specialties, zoneId, onZone, filters, onFilters, compact, panelExtra }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  const selectedZone = zones.find((z) => z.id === zoneId) ?? null;

  const matches = useMemo(() => {
    const q = fold(query.trim());
    return zones
      .filter((z) => !q || fold(z.nameFr).includes(q) || z.nameAr.includes(query.trim()))
      .sort((a, b) => zoneName(a, locale).localeCompare(zoneName(b, locale), locale));
  }, [zones, query, locale]);

  const choose = (z: ZoneDTO) => {
    onZone(z.id);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && matches[active]) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const typeSpecialties = specialties.filter((s) => !filters.type || s.type === filters.type);
  const set = (patch: Partial<MapFilters>) => onFilters({ ...filters, ...patch });
  const hasFilters = !!(filters.type || filters.specialties.length || filters.lang || filters.vehicle || filters.name || filters.onlyAvailable);
  const filterCount = [filters.type, filters.specialties.length, filters.lang, filters.vehicle, filters.name.trim(), filters.onlyAvailable].filter(Boolean).length;

  // Zona (moughataa) con autocompletado
  const zoneField = (
    <div className={cn("relative", compact ? "min-w-0 flex-1" : "flex-[1.4]")}>
      <MapPin size={18} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate" />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={t("admin.searchZone")}
        placeholder={selectedZone ? zoneName(selectedZone, locale) : t("admin.searchZone")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className={cn(
          "h-11 w-full rounded-xl bg-transparent pe-10 ps-10 text-[15px] outline-none transition placeholder:text-muted/80 focus:bg-white/50 dark:focus:bg-white/5",
          selectedZone && !query && "placeholder:font-medium placeholder:text-ink",
        )}
      />
      {(selectedZone || query) && (
        <button
          type="button"
          aria-label={t("common.clear")}
          onClick={() => {
            setQuery("");
            onZone(null);
          }}
          className="absolute end-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-line/5 hover:text-ink"
        >
          <X size={16} strokeWidth={1.5} aria-hidden />
        </button>
      )}
      {open && (
        <ul id={listId} role="listbox" aria-label={t("admin.zoneSuggestions")} className="glass-strong scroll-thin absolute inset-x-0 top-full z-50 mt-2 max-h-72 overflow-y-auto p-1.5">
          {matches.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">{t("admin.noZoneMatch")}</li>}
          {matches.map((z, i) => (
            <li key={z.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(z)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm",
                  i === active && "bg-line/5",
                  z.id === zoneId && "font-medium text-slate",
                )}
              >
                <MapPin size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
                <span className="flex-1">{zoneName(z, locale)}</span>
                <span className="text-xs text-muted">{locale === "ar" ? z.nameFr : z.nameAr}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Nombre
  const nameField = (
    <div className="relative flex-1">
      <Search size={18} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        aria-label={t("admin.searchName")}
        placeholder={t("admin.searchName")}
        value={filters.name}
        onChange={(e) => set({ name: e.target.value })}
        className="h-11 w-full rounded-xl bg-transparent pe-3 ps-10 text-[15px] outline-none transition placeholder:text-muted/80 focus:bg-white/50 dark:focus:bg-white/5"
      />
    </div>
  );

  // Filtros en chips
  const chips = (
    <div
      className={cn(
        "flex gap-2",
        compact ? "flex-wrap" : "scroll-thin -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible",
      )}
      role="group"
      aria-label={t("admin.filters.title")}
    >
      {([
        { v: "", icon: Users, label: t("admin.filters.all") },
        { v: "DOCTOR", icon: Stethoscope, label: t("admin.filters.doctors") },
        { v: "NURSE", icon: Syringe, label: t("admin.filters.nurses") },
      ] as const).map((o) => (
        <Chip
          floating
          key={o.v || "all"}
          icon={o.icon}
          active={filters.type === o.v}
          tone={o.v === "NURSE" ? "slate" : "sage"}
          onClick={() =>
            set({
              type: o.v,
              specialties: o.v ? filters.specialties.filter((id) => specialties.find((s) => s.id === id)?.type === o.v) : filters.specialties,
            })
          }
        >
          {o.label}
        </Chip>
      ))}
      <FilterPopover
        icon={Stethoscope}
        active={filters.specialties.length > 0}
        label={filters.specialties.length ? t("admin.filters.specialtyCount", { count: filters.specialties.length }) : t("admin.filters.specialty")}
      >
        {typeSpecialties.map((s) => {
          const on = filters.specialties.includes(s.id);
          return (
            <PopoverOption
              key={s.id}
              multi
              checked={on}
              onClick={() => set({ specialties: on ? filters.specialties.filter((x) => x !== s.id) : [...filters.specialties, s.id] })}
            >
              <span className="flex-1">{specialtyName(s, locale)}</span>
              {!filters.type && (s.type === "DOCTOR" ? <Stethoscope size={14} strokeWidth={1.5} className="text-sage" aria-hidden /> : <Syringe size={14} strokeWidth={1.5} className="text-slate" aria-hidden />)}
            </PopoverOption>
          );
        })}
      </FilterPopover>
      <FilterPopover
        icon={Languages}
        active={!!filters.lang}
        label={filters.lang ? t(`languages.${filters.lang as (typeof LANGUAGES)[number]}`) : t("admin.filters.language")}
      >
        <PopoverOption checked={!filters.lang} onClick={() => set({ lang: "" })}>
          {t("admin.filters.anyLanguage")}
        </PopoverOption>
        {LANGUAGES.map((l) => (
          <PopoverOption key={l} checked={filters.lang === l} onClick={() => set({ lang: l })}>
            {t(`languages.${l}`)}
          </PopoverOption>
        ))}
      </FilterPopover>
      <Chip floating icon={Car} active={filters.vehicle} onClick={() => set({ vehicle: !filters.vehicle })}>
        {t("admin.filters.vehicle")}
      </Chip>
      <Chip floating icon={Power} active={filters.onlyAvailable} onClick={() => set({ onlyAvailable: !filters.onlyAvailable })}>
        {t("admin.filters.onlyAvailable")}
      </Chip>
      {hasFilters && (
        <Chip floating icon={RotateCcw} tone="terra" onClick={() => onFilters(EMPTY_FILTERS)}>
          {t("admin.filters.reset")}
        </Chip>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="pointer-events-auto space-y-2">
        <div className="glass-strong relative z-20 flex items-center gap-1 p-1.5">
          {zoneField}
          <button
            type="button"
            aria-expanded={panelOpen}
            aria-label={t("admin.filters.title")}
            onClick={() => setPanelOpen((o) => !o)}
            className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
              panelOpen ? "bg-sage text-white" : "text-ink/80 hover:bg-line/5",
            )}
          >
            <SlidersHorizontal size={20} strokeWidth={1.5} aria-hidden />
            {filterCount > 0 && !panelOpen && (
              <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sage px-1 text-[10px] font-semibold leading-none text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="glass-strong space-y-3 p-3"
            >
              <div className="rounded-xl border border-line/10">{nameField}</div>
              {chips}
              {panelExtra}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto space-y-2">
      <div className="glass-strong relative z-20 flex flex-col gap-1 p-1.5 sm:flex-row">
        {zoneField}
        <div className="hidden w-px self-stretch bg-line/10 sm:block" aria-hidden />
        {nameField}
      </div>
      {chips}
    </div>
  );
}
