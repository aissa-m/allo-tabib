"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { LocateFixed, RefreshCw, SearchCheck, UserRoundSearch } from "lucide-react";
import { AdminMap } from "@/components/map";
import { MapStyleSwitcher } from "@/components/map/MapStyleSwitcher";
import { ProfessionalCard } from "@/components/professional/ProfessionalCard";
import { ProfessionalDetailPanel } from "@/components/professional/ProfessionalDetail";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button, IconButton } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Switch } from "@/components/ui/Switch";
import { SearchBar, EMPTY_FILTERS, type MapFilters } from "./SearchBar";
import type { MapCommand } from "./AdminMap";
import { useNow, useSpecialties, useZones } from "@/lib/hooks";
import { distanceMeters, inBbox, type Bbox } from "@/lib/geo";
import { ADMIN_REFRESH_MS, NKC_CENTER } from "@/lib/constants";
import { cn, fetcher, fullName, zoneName } from "@/lib/utils";
import type { ProfessionalCardDTO } from "@/lib/types";

type Area = { kind: "city" } | { kind: "zone"; zoneId: number } | { kind: "bbox"; bbox: Bbox };

const statusRank = { live: 0, stale: 1, none: 2 } as const;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function useIsDesktop() {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setV(mq.matches);
    const on = (e: MediaQueryListEvent) => setV(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return v;
}

const MOBILE_NAV = 64;
/** Altura visible de la lista plegada en móvil (asa + contador). */
const MOBILE_PEEK = 84;

export function AdminMapView() {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();
  const isDesktop = useIsDesktop();
  const { zones } = useZones();
  const { specialties } = useSpecialties();
  const now = useNow(5000);

  const [filters, setFilters] = useState<MapFilters>(EMPTY_FILTERS);
  const [area, setArea] = useState<Area>({ kind: "city" });
  const [autoSearch, setAutoSearch] = useState(true);
  const [pendingBbox, setPendingBbox] = useState<Bbox | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [command, setCommand] = useState<MapCommand | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const nonce = useRef(0);
  const send = (c: { type: "zone"; zoneId: number } | { type: "recenter" } | { type: "focus"; id: string }) =>
    setCommand({ ...c, nonce: ++nonce.current });

  // --- Datos (SWR, cada 20 s): todo el mundo; los no disponibles se marcan aparte ---
  const qs = new URLSearchParams({ all: "true" });
  if (filters.type) qs.set("type", filters.type);
  if (filters.specialties.length) qs.set("specialty", filters.specialties.join(","));
  if (filters.lang) qs.set("lang", filters.lang);
  if (filters.vehicle) qs.set("vehicle", "true");
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ items: ProfessionalCardDTO[]; updatedAt: string }>(
    `/api/admin/available?${qs.toString()}`,
    fetcher,
    { refreshInterval: ADMIN_REFRESH_MS, keepPreviousData: true, revalidateOnFocus: true },
  );

  // Filtros por nombre y disponibilidad (cliente) — afectan a mapa y lista
  const items = useMemo(() => {
    let all = data?.items ?? [];
    if (filters.onlyAvailable) all = all.filter((p) => p.isAvailable);
    const q = fold(filters.name.trim());
    if (!q) return all;
    return all.filter((p) => q.split(/\s+/).every((w) => fold(fullName(p)).includes(w)));
  }, [data, filters.name, filters.onlyAvailable]);

  const zone = area.kind === "zone" ? zones.find((z) => z.id === area.zoneId) ?? null : null;

  // Lista: según el área (zona, zona visible del mapa o toda la ciudad), con distancia
  const list = useMemo(() => {
    let ref: { lat: number; lng: number } | null = null;
    let rows = items;
    if (area.kind === "zone" && zone) {
      ref = { lat: zone.centerLat, lng: zone.centerLng };
      rows = rows.filter((p) => p.zoneId === zone.id);
    } else if (area.kind === "bbox") {
      const [a, b, c, d] = area.bbox;
      ref = { lat: (b + d) / 2, lng: (a + c) / 2 };
      rows = rows.filter((p) => inBbox(p, area.bbox));
    }
    const withD = rows.map((p) => ({ pro: p, distance: ref ? distanceMeters(ref, p) : null }));
    // Primero los disponibles; luego por calidad de la posición y distancia
    withD.sort(
      (x, y) =>
        Number(y.pro.isAvailable) - Number(x.pro.isAvailable) ||
        statusRank[x.pro.locationStatus] - statusRank[y.pro.locationStatus] ||
        (ref ? x.distance! - y.distance! : distanceMeters(NKC_CENTER, x.pro) - distanceMeters(NKC_CENTER, y.pro)),
    );
    return withD;
  }, [items, area, zone]);

  // --- Eventos del mapa ---
  const onBoundsChange = useCallback(
    (bbox: Bbox, user: boolean) => {
      if (!user) return;
      if (autoSearch) {
        setArea({ kind: "bbox", bbox });
        setPendingBbox(null);
      } else {
        setPendingBbox(bbox);
      }
    },
    [autoSearch],
  );

  const onZone = (id: number | null) => {
    setPendingBbox(null);
    setSelectedId(null);
    if (id == null) {
      setArea({ kind: "city" });
      send({ type: "recenter" });
    } else {
      setArea({ kind: "zone", zoneId: id });
      send({ type: "zone", zoneId: id });
    }
  };

  const recenter = () => {
    setArea({ kind: "city" });
    setPendingBbox(null);
    send({ type: "recenter" });
  };

  const selectFromMap = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) cardRefs.current.get(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const selectFromList = (id: string) => {
    setSelectedId(id);
    send({ type: "focus", id });
    if (!isDesktop) setSheetOpen(false);
  };

  // Si el seleccionado desaparece (filtros o baja), se cierra su tarjeta flotante
  useEffect(() => {
    if (selectedId && data && !items.some((p) => p.id === selectedId)) setSelectedId(null);
  }, [items, data, selectedId]);

  // --- Textos ---
  const placeText =
    area.kind === "zone" && zone
      ? t("admin.inZone", { zone: zoneName(zone, locale) })
      : area.kind === "bbox"
        ? t("admin.inArea")
        : t("admin.inCity");
  const showAll = !filters.onlyAvailable;
  const availableCount = list.filter((r) => r.pro.isAvailable).length;
  const counter =
    !data && !error
      ? t("common.loading")
      : showAll
        ? `${t("admin.counterAll", { count: list.length, available: availableCount })} ${placeText}`
        : `${t("admin.counter", { count: list.length })} ${placeText}`;
  const lastUpdate = data ? t("admin.lastUpdate", { time: format.dateTime(new Date(data.updatedAt), { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }) : "";

  const padding = isDesktop
    ? { top: 150, bottom: 40, left: 40, right: 40 }
    : { top: 90, bottom: MOBILE_PEEK + 24, left: 24, right: 24 };

  const listBody = (
    <div className="space-y-3 p-1">
      {isLoading && !data ? (
        Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
      ) : error && !data ? (
        <EmptyState icon={RefreshCw} title={t("admin.loadError")} action={<Button variant="secondary" icon={RefreshCw} onClick={() => mutate()}>{t("common.retry")}</Button>} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={UserRoundSearch}
          title={
            (data?.items.length ?? 0) === 0
              ? t("admin.emptyCityTitleAll")
              : showAll
                ? t("admin.emptyTitleAll")
                : t("admin.emptyTitle")
          }
          body={(data?.items.length ?? 0) === 0 ? t("admin.emptyCityBodyAll") : t("admin.emptyBody")}
          action={
            area.kind !== "city" ? (
              <Button variant="secondary" icon={LocateFixed} onClick={recenter}>
                {t("admin.recenter")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <AnimatePresence initial={false}>
          {list.map(({ pro, distance }) => (
            <ProfessionalCard
              key={pro.id}
              ref={(el) => {
                if (el) cardRefs.current.set(pro.id, el);
                else cardRefs.current.delete(pro.id);
              }}
              pro={pro}
              distance={distance}
              now={now}
              highlighted={hoveredId === pro.id || selectedId === pro.id}
              onHover={isDesktop ? setHoveredId : undefined}
              onSelect={selectFromList}
              onOpen={setDetailId}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );

  const autoSearchSwitch = (
    <label className="flex items-center justify-between gap-3 text-sm text-muted">
      <span>{t("admin.autoSearch")}</span>
      <Switch checked={autoSearch} onChange={(v) => { setAutoSearch(v); setPendingBbox(null); }} label={t("admin.autoSearch")} />
    </label>
  );

  const listHeader = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold" aria-live="polite">
          {counter}
        </p>
        {isValidating && <RefreshCw size={14} strokeWidth={1.5} className="animate-spin text-muted" aria-hidden />}
      </div>
      {autoSearchSwitch}
    </div>
  );

  // Móvil: solo el contador (el interruptor va en el panel de filtros) y el botón de actualizar
  const mobileListHeader = (
    <div className="flex items-center justify-between gap-2">
      <p className="min-w-0 truncate text-base font-semibold" aria-live="polite">
        {counter}
      </p>
      <button
        type="button"
        onClick={() => mutate()}
        aria-label={`${t("admin.refreshNow")}${lastUpdate ? ` · ${lastUpdate}` : ""}`}
        title={lastUpdate}
        className="-me-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-line/5 hover:text-ink"
      >
        <RefreshCw size={18} strokeWidth={1.5} className={cn(isValidating && "animate-spin")} aria-hidden />
      </button>
    </div>
  );

  const mapControls = (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      <IconButton icon={LocateFixed} label={t("admin.recenter")} onClick={recenter} className="glass-strong shadow-glass" />
      <button
        type="button"
        onClick={() => mutate()}
        aria-label={t("admin.refreshNow")}
        title={t("admin.refreshNow")}
        className="glass-strong inline-flex h-11 items-center gap-2 rounded-xl px-3 text-xs text-ink/80 transition hover:-translate-y-px"
      >
        <RefreshCw size={16} strokeWidth={1.5} className={cn(isValidating && "animate-spin")} aria-hidden />
        <span className="hidden sm:inline">{lastUpdate}</span>
      </button>
    </div>
  );

  const searchThisArea = (
    <AnimatePresence>
      {pendingBbox && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="pointer-events-auto flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            icon={SearchCheck}
            className="glass-strong shadow-glass"
            onClick={() => {
              setArea({ kind: "bbox", bbox: pendingBbox });
              setPendingBbox(null);
            }}
          >
            {t("admin.searchThisArea")}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const map = (
    <AdminMap
      items={items}
      zones={zones}
      highlightedZoneId={zone?.id ?? null}
      hoveredId={hoveredId}
      selectedId={selectedId}
      command={command}
      now={now}
      padding={padding}
      onBoundsChange={onBoundsChange}
      onSelect={selectFromMap}
      onHover={setHoveredId}
      onOpen={setDetailId}
    />
  );

  const searchProps = { zones, specialties, zoneId: zone?.id ?? null, onZone, filters, onFilters: setFilters };
  const search = <SearchBar {...searchProps} />;

  if (isDesktop === null) return <div className="h-dvh" />;

  return (
    <>
      {isDesktop ? (
        <div className="flex h-dvh gap-3 p-3">
          {/* Panel de lista (a la izquierda; a la derecha en árabe gracias a dir="rtl") */}
          <motion.aside
            initial={{ opacity: 0, x: locale === "ar" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass flex w-[400px] shrink-0 flex-col overflow-hidden lg:w-[430px]"
          >
            <div className="border-b border-line/[0.06] px-5 pb-3 pt-4">
              <p className="mb-1 text-sm text-muted">{showAll ? t("admin.listTitleAll") : t("admin.listTitle")}</p>
              {listHeader}
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto px-3 py-3">{listBody}</div>
          </motion.aside>
          <section className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/30 shadow-glass dark:border-white/10">
            {map}
            {/* Tipo de mapa, abajo a la izquierda como en Google Maps (la atribución queda a la derecha) */}
            <div className="absolute bottom-3 left-3 z-10">
              <MapStyleSwitcher variant="thumb" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-2 p-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 max-w-2xl flex-1">{search}</div>
                {mapControls}
              </div>
              {searchThisArea}
            </div>
          </section>
        </div>
      ) : (
        <div className="relative h-dvh overflow-hidden">
          <div className="absolute inset-0 [&_.maplibregl-ctrl-bottom-right]:mb-[88px]" style={{ bottom: MOBILE_NAV }}>
            {map}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 space-y-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <SearchBar {...searchProps} compact panelExtra={autoSearchSwitch} />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">{searchThisArea}</div>
              <div className="pointer-events-auto flex flex-col gap-2">
                <IconButton icon={LocateFixed} label={t("admin.recenter")} onClick={recenter} className="glass-strong shadow-glass" />
                <MapStyleSwitcher />
              </div>
            </div>
          </div>
          <BottomSheet
            expanded={sheetOpen}
            onExpandedChange={setSheetOpen}
            toggleLabel={t("admin.showList")}
            bottomOffset={MOBILE_NAV}
            peek={MOBILE_PEEK}
            header={mobileListHeader}
          >
            {listBody}
          </BottomSheet>
        </div>
      )}
      <ProfessionalDetailPanel id={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}
