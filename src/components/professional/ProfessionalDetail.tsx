"use client";

import useSWR from "swr";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  Award,
  Building2,
  CalendarDays,
  Car,
  Clock,
  FileText,
  IdCard,
  Languages,
  Mail,
  MapPin,
  Navigation,
  Power,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContactActions } from "./ContactActions";
import { TypeIcon } from "./ProfessionalCard";
import { useTimeAgo } from "@/lib/hooks";
import { fetcher, fullName, localized } from "@/lib/utils";
import type { ProfessionalDetailDTO } from "@/lib/types";

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <Icon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <div className="text-[15px]">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="divide-y divide-line/[0.06] rounded-2xl bg-white/40 px-4 dark:bg-white/[0.03]">{children}</div>
    </section>
  );
}

export function ProfessionalDetailBody({ pro }: { pro: ProfessionalDetailDTO }) {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();
  const ago = useTimeAgo();
  const age = Math.floor((Date.now() - new Date(pro.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  const tone = pro.type === "DOCTOR" ? "sage" : "slate";

  return (
    <div>
      <div className="flex flex-col items-center pt-1 text-center">
        <Avatar src={pro.photoUrl} alt={fullName(pro)} size={104} ring={tone} />
        <h2 className="mt-3 text-xl">{fullName(pro)}</h2>
        <p className={`mt-1 flex items-center gap-1.5 text-sm ${tone === "sage" ? "text-sage" : "text-slate"}`}>
          <TypeIcon type={pro.type} />
          {t(`types.${pro.type}`)} · {localized(pro.specialty, locale)}
        </p>
        <div className="mt-3">
          {pro.isAvailable ? (
            <Badge tone="online" icon={Power}>{t("status.available")}</Badge>
          ) : (
            <Badge tone="offline" icon={Power}>{t("status.unavailable")}</Badge>
          )}
        </div>
      </div>

      <section className="mt-5 rounded-2xl bg-sage/10 p-4">
        <ContactActions phone={pro.phone} whatsapp={pro.whatsapp} size="lg" />
      </section>

      {pro.isAvailable && (
        <Section title={t("detail.availability")}>
          <Row icon={MapPin} label={t("detail.currentZone")}>
            {locale === "ar" ? pro.zone.ar : pro.zone.fr}
          </Row>
          <Row icon={Navigation} label={t("detail.lastPosition")}>
            {pro.locationStatus === "none" ? t("admin.fallbackPosition") : (
              <span className={pro.locationStatus === "stale" ? "text-terra" : undefined}>
                {pro.locationStatus === "stale" ? `${t("location.stale")} · ` : ""}
                {ago(pro.locationUpdatedAt)}
                {pro.locationManual ? ` · ${t("location.manual")}` : ""}
              </span>
            )}
          </Row>
          {pro.availableSince && (
            <Row icon={Clock} label={t("detail.availability")}>
              {t("detail.availableSince", { time: format.dateTime(new Date(pro.availableSince), { hour: "2-digit", minute: "2-digit" }) })}
            </Row>
          )}
        </Section>
      )}

      <Section title={t("detail.professional")}>
        <Row icon={Award} label={t("detail.experience")}>{t("common.yearsExp", { count: pro.yearsExperience })}</Row>
        {pro.workplace && <Row icon={Building2} label={t("detail.workplace")}>{pro.workplace}</Row>}
        <Row icon={Languages} label={t("detail.languages")}>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pro.languages.map((l) => (
              <Badge key={l}>{t.has(`languages.${l}` as never) ? t(`languages.${l}` as never) : l}</Badge>
            ))}
          </div>
        </Row>
        <Row icon={Car} label={t("detail.vehicle")}>{pro.hasVehicle ? t("fields.vehicleYes") : t("fields.vehicleNo")}</Row>
        <Row icon={MapPin} label={t("detail.homeZone")}>{locale === "ar" ? pro.homeZone.ar : pro.homeZone.fr}</Row>
        <Row icon={FileText} label={t("detail.bio")}>
          {pro.bio ? <p className="whitespace-pre-line">{pro.bio}</p> : <span className="text-muted">{t("detail.noBio")}</span>}
        </Row>
      </Section>

      <Section title={t("detail.identity")}>
        <Row icon={CalendarDays} label={t("detail.birthDate")}>
          {format.dateTime(new Date(pro.birthDate), { dateStyle: "long" })} · {t("detail.age", { count: age })}
        </Row>
        <Row icon={UserRound} label={t("fields.sex")}>{t(`sex.${pro.sex}`)}</Row>
        <Row icon={IdCard} label={t("detail.nni")}><span dir="ltr">{pro.nni}</span></Row>
        {pro.email && (
          <Row icon={Mail} label={t("detail.email")}>
            <a href={`mailto:${pro.email}`} className="text-slate hover:underline" dir="ltr">{pro.email}</a>
          </Row>
        )}
      </Section>

      <p className="mt-5 text-center text-xs text-muted">
        {t("detail.registered", { date: format.dateTime(new Date(pro.createdAt), { dateStyle: "medium" }) })}
      </p>
    </div>
  );
}

/** Ficha completa en panel lateral de cristal (carga los datos por id). */
export function ProfessionalDetailPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const t = useTranslations();
  const { data, error } = useSWR<ProfessionalDetailDTO>(id ? `/api/admin/professionals/${id}` : null, fetcher);
  return (
    <Modal open={!!id} onClose={onClose} title={t("detail.title")} variant="side">
      {data && data.id === id ? (
        <ProfessionalDetailBody pro={data} />
      ) : error ? (
        <p className="py-10 text-center text-sm text-terra">{t("admin.loadError")}</p>
      ) : (
        <div className="flex flex-col items-center gap-3 pt-2">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      )}
    </Modal>
  );
}
