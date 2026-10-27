"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  Building2,
  CalendarDays,
  Car,
  Check,
  FileText,
  Footprints,
  IdCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { ZonePickerMap } from "@/components/map";
import { useErrorText } from "@/lib/hooks";
import { LANGUAGES } from "@/lib/constants";
import { cn, specialtyName, zoneName } from "@/lib/utils";
import type { ProfileUpdateInput } from "@/lib/validation";
import type { ProType, SpecialtyDTO, ZoneDTO } from "@/lib/types";

/**
 * Los formularios de registro y de perfil comparten estos campos.
 * El formulario de registro (superconjunto) se pasa con un cast a este tipo.
 */
export type ProfileForm = UseFormReturn<ProfileUpdateInput>;

export function PersonalFields({ form }: { form: ProfileForm }) {
  const t = useTranslations();
  const err = useErrorText();
  const { register, formState: { errors }, control } = form;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input label={t("fields.firstName")} icon={UserRound} autoComplete="given-name" error={err(errors.firstName?.message)} {...register("firstName")} />
      <Input label={t("fields.lastName")} icon={UserRound} autoComplete="family-name" error={err(errors.lastName?.message)} {...register("lastName")} />
      <Input label={t("fields.birthDate")} icon={CalendarDays} type="date" autoComplete="bday" error={err(errors.birthDate?.message)} {...register("birthDate")} />
      <div>
        <span className="label">{t("fields.sex")}</span>
        <Controller
          control={control}
          name="sex"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("fields.sex")}>
              {(["MALE", "FEMALE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={field.value === s}
                  onClick={() => field.onChange(s)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-xl border text-[15px] transition duration-200",
                    field.value === s ? "border-sage/60 bg-sage/15" : "border-line/10 bg-white/60 hover:bg-white/80 dark:bg-white/5",
                  )}
                >
                  <UserRound size={18} strokeWidth={1.5} aria-hidden />
                  {t(`sex.${s}`)}
                </button>
              ))}
            </div>
          )}
        />
        {errors.sex && <p className="mt-1.5 text-[13px] text-terra">{err(errors.sex.message)}</p>}
      </div>
      <Input
        label={t("fields.nni")}
        icon={IdCard}
        inputMode="numeric"
        maxLength={10}
        dir="ltr"
        hint={t("fields.nniHint")}
        error={err(errors.nni?.message)}
        wrapperClassName="sm:col-span-2"
        {...register("nni")}
      />
    </div>
  );
}

export function ContactFields({ form }: { form: ProfileForm }) {
  const t = useTranslations("fields");
  const err = useErrorText();
  const { register, watch, formState: { errors } } = form;
  const same = watch("whatsappSame");
  return (
    <div className="grid gap-4">
      <Input
        label={t("phone")}
        icon={Phone}
        prefix="+222"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        dir="ltr"
        placeholder="22 33 44 55"
        hint={t("phoneHint")}
        error={err(errors.phone?.message)}
        {...register("phone")}
      />
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line/10 bg-white/40 px-4 py-3 text-[15px] dark:bg-white/5">
        <input type="checkbox" className="h-5 w-5 rounded accent-[rgb(var(--sage))]" {...register("whatsappSame")} />
        <MessageCircle size={18} strokeWidth={1.5} className="text-sage" aria-hidden />
        {t("whatsappSame")}
      </label>
      {!same && (
        <Input
          label={<>{t("whatsapp")} <OptionalTag /></>}
          icon={MessageCircle}
          prefix="+222"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          placeholder="22 33 44 55"
          error={err(errors.whatsapp?.message)}
          {...register("whatsapp")}
        />
      )}
      <Input
        label={<>{t("email")} <OptionalTag /></>}
        icon={Mail}
        type="email"
        autoComplete="email"
        dir="ltr"
        placeholder="nom@exemple.mr"
        error={err(errors.email?.message)}
        {...register("email")}
      />
    </div>
  );
}

function OptionalTag() {
  const t = useTranslations("common");
  return <span className="text-xs font-normal text-muted">({t("optional")})</span>;
}

export function ProfessionalFields({ form, type, specialties }: { form: ProfileForm; type: ProType; specialties: SpecialtyDTO[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const err = useErrorText();
  const { register, control, watch, formState: { errors } } = form;
  const bio = watch("bio") ?? "";
  const list = specialties.filter((s) => s.type === type);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Select
        label={t("fields.specialty")}
        icon={Stethoscope}
        error={err(errors.specialtyId?.message)}
        wrapperClassName="sm:col-span-2"
        {...register("specialtyId", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
      >
        <option value="">{t("fields.specialtyPlaceholder")}</option>
        {list.map((s) => (
          <option key={s.id} value={s.id}>
            {specialtyName(s, locale)}
          </option>
        ))}
      </Select>
      <Input
        label={t("fields.yearsExperience")}
        icon={Award}
        type="number"
        inputMode="numeric"
        min={0}
        max={60}
        error={err(errors.yearsExperience?.message)}
        {...register("yearsExperience", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
      />
      <Input
        label={<>{t("fields.workplace")} <OptionalTag /></>}
        icon={Building2}
        placeholder={t("fields.workplacePlaceholder")}
        error={err(errors.workplace?.message)}
        {...register("workplace")}
      />
      <div className="sm:col-span-2">
        <span className="label">{t("fields.languages")}</span>
        <Controller
          control={control}
          name="languages"
          render={({ field }) => {
            const value = (field.value ?? []) as string[];
            return (
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const on = value.includes(l);
                  return (
                    <Chip
                      key={l}
                      active={on}
                      icon={on ? Check : undefined}
                      onClick={() => field.onChange(on ? value.filter((v) => v !== l) : [...value, l])}
                    >
                      {t(`languages.${l}`)}
                    </Chip>
                  );
                })}
              </div>
            );
          }}
        />
        {errors.languages && <p className="mt-1.5 text-[13px] text-terra">{err(errors.languages.message)}</p>}
      </div>
      <Textarea
        label={<>{t("fields.bio")} <OptionalTag /></>}
        icon={FileText}
        maxLength={300}
        placeholder={t("fields.bioPlaceholder")}
        hint={t("fields.bioCounter", { count: bio.length })}
        error={err(errors.bio?.message)}
        wrapperClassName="sm:col-span-2"
        {...register("bio")}
      />
    </div>
  );
}

export function ZoneFields({ form, zones }: { form: ProfileForm; zones: ZoneDTO[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const err = useErrorText();
  const { register, control, watch, setValue, formState: { errors } } = form;
  const zoneId = watch("homeZoneId");
  const sorted = [...zones].sort((a, b) => zoneName(a, locale).localeCompare(zoneName(b, locale), locale));
  return (
    <div className="grid gap-4">
      <Select
        label={t("fields.homeZone")}
        icon={MapPin}
        error={err(errors.homeZoneId?.message)}
        {...register("homeZoneId", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
      >
        <option value="">{t("fields.homeZonePlaceholder")}</option>
        {sorted.map((z) => (
          <option key={z.id} value={z.id}>
            {zoneName(z, locale)}
          </option>
        ))}
      </Select>
      <div className="h-56 overflow-hidden rounded-2xl border border-white/40 dark:border-white/10">
        <ZonePickerMap
          zones={zones}
          selectedId={typeof zoneId === "number" ? zoneId : null}
          onSelect={(id) => setValue("homeZoneId", id, { shouldValidate: true, shouldDirty: true })}
          label={t("fields.homeZone")}
        />
      </div>
      <div>
        <span className="label">{t("fields.hasVehicle")}</span>
        <Controller
          control={control}
          name="hasVehicle"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("fields.hasVehicle")}>
              {[
                { v: true, icon: Car, label: t("fields.vehicleYes") },
                { v: false, icon: Footprints, label: t("fields.vehicleNo") },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={field.value === o.v}
                  onClick={() => field.onChange(o.v)}
                  className={cn(
                    "flex min-h-[3.5rem] items-center gap-2.5 rounded-xl border px-3 text-start text-sm transition duration-200",
                    field.value === o.v ? "border-sage/60 bg-sage/15" : "border-line/10 bg-white/60 hover:bg-white/80 dark:bg-white/5",
                  )}
                >
                  <o.icon size={20} strokeWidth={1.5} aria-hidden className="shrink-0" />
                  {o.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>
    </div>
  );
}
