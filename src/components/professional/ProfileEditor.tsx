"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ArrowLeft, Eye, KeyRound, Lock, MapPin, Phone, Save, Stethoscope, UserRound, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { PhotoPicker } from "./PhotoPicker";
import { PasswordStrength } from "./PasswordStrength";
import { ProfessionalCard } from "./ProfessionalCard";
import { ContactFields, PersonalFields, ProfessionalFields, ZoneFields, type ProfileForm } from "./ProfileFields";
import { useErrorText, useSpecialties, useZones } from "@/lib/hooks";
import {
  passwordChangeSchema,
  profileUpdateSchema,
  type PasswordChangeInput,
  type ProfileUpdateInput,
} from "@/lib/validation";
import { fetcher } from "@/lib/utils";
import type { MeDTO } from "@/lib/types";

const localPart = (phone: string | null) => (phone ? phone.replace(/^\+222/, "") : "");

function toFormValues(me: MeDTO): ProfileUpdateInput {
  return {
    firstName: me.firstName,
    lastName: me.lastName,
    birthDate: me.birthDate,
    sex: me.sex,
    nni: me.nni,
    phone: localPart(me.phone),
    whatsappSame: !me.whatsapp || me.whatsapp === me.phone,
    whatsapp: me.whatsapp && me.whatsapp !== me.phone ? localPart(me.whatsapp) : "",
    email: me.email ?? "",
    specialtyId: me.specialtyId,
    yearsExperience: me.yearsExperience,
    workplace: me.workplace,
    languages: me.languages as ProfileUpdateInput["languages"],
    bio: me.bio,
    homeZoneId: me.homeZoneId,
    hasVehicle: me.hasVehicle,
  };
}

function SectionCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base">
        <Icon size={18} strokeWidth={1.5} className="text-slate" aria-hidden />
        {title}
      </h2>
      {children}
    </GlassCard>
  );
}

export function ProfileEditor() {
  const t = useTranslations();
  const err = useErrorText();
  const { data: me, mutate } = useSWR<MeDTO>("/api/me", fetcher);
  const { zones } = useZones();
  const { specialties } = useSpecialties();
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileUpdateInput>({ resolver: zodResolver(profileUpdateSchema), mode: "onTouched" });
  const { reset, handleSubmit, setError, formState: { isSubmitting, isDirty } } = form;

  useEffect(() => {
    if (me) reset(toFormValues(me));
    // Solo al cargar el perfil por primera vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const onSave = handleSubmit(async () => {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.getValues()),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { details?: Record<string, string[]> };
      for (const [f, msgs] of Object.entries(body.details ?? {})) setError(f as FieldPath<ProfileUpdateInput>, { message: msgs[0] });
      toast.error(t("common.unknownError"));
      return;
    }
    const updated = (await res.json()) as MeDTO;
    await mutate(updated, { revalidate: false });
    reset(toFormValues(updated));
    toast.success(t("profile.saved"));
  });

  const onPhoto = async (blob: Blob) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", blob, "photo.jpg");
      const res = await fetch("/api/me/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { photoUrl } = (await res.json()) as { photoUrl: string };
      if (me) await mutate({ ...me, photoUrl }, { revalidate: false });
      toast.success(t("profile.photoUpdated"));
    } catch {
      toast.error(t("errors.photo"));
    } finally {
      setUploading(false);
    }
  };

  if (!me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const fieldsForm = form as ProfileForm;

  return (
    <div className="space-y-4">
      <Link href="/pro" className="inline-flex items-center gap-2 rounded-xl text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden className="rtl:-scale-x-100" />
        {t("profile.back")}
      </Link>
      <h1 className="text-2xl">{t("profile.title")}</h1>

      <GlassCard className="p-5">
        <PhotoPicker value={me.photoUrl} busy={uploading} onChange={(blob) => void onPhoto(blob)} />
      </GlassCard>

      <form onSubmit={onSave} noValidate className="space-y-4">
        <SectionCard icon={UserRound} title={t("profile.sectionPersonal")}>
          <PersonalFields form={fieldsForm} />
        </SectionCard>
        <SectionCard icon={Phone} title={t("profile.sectionContact")}>
          <ContactFields form={fieldsForm} />
        </SectionCard>
        <SectionCard icon={Stethoscope} title={t("profile.sectionProfessional")}>
          <ProfessionalFields form={fieldsForm} type={me.type} specialties={specialties} />
        </SectionCard>
        <SectionCard icon={MapPin} title={t("profile.sectionZone")}>
          <ZoneFields form={fieldsForm} zones={zones} />
        </SectionCard>
        <div className="sticky bottom-3 z-20">
          <Button type="submit" block size="lg" icon={Save} loading={isSubmitting} disabled={!isDirty} className="shadow-lift">
            {t("common.save")}
          </Button>
        </div>
      </form>

      <SectionCard icon={Eye} title={t("profile.preview")}>
        <p className="-mt-2 mb-3 text-sm text-muted">{t("profile.previewHint")}</p>
        <ProfessionalCard pro={me} preview />
      </SectionCard>

      <PasswordForm onError={err} />
    </div>
  );
}

function PasswordForm({ onError }: { onError: (k?: string) => string | undefined }) {
  const t = useTranslations();
  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = form;

  const onSubmit = handleSubmit(async (data) => {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { details?: Record<string, string[]> };
      for (const [f, msgs] of Object.entries(body.details ?? {})) setError(f as FieldPath<PasswordChangeInput>, { message: msgs[0] });
      return;
    }
    reset();
    toast.success(t("profile.passwordChanged"));
  });

  return (
    <SectionCard icon={KeyRound} title={t("profile.passwordTitle")}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <Input label={t("profile.currentPassword")} icon={Lock} type="password" autoComplete="current-password" error={onError(errors.currentPassword?.message)} {...register("currentPassword")} />
        <div>
          <Input label={t("profile.newPassword")} icon={Lock} type="password" autoComplete="new-password" hint={t("fields.passwordHint")} error={onError(errors.newPassword?.message)} {...register("newPassword")} />
          <PasswordStrength password={watch("newPassword") ?? ""} />
        </div>
        <Input label={t("profile.confirmPassword")} icon={Lock} type="password" autoComplete="new-password" error={onError(errors.confirmPassword?.message)} {...register("confirmPassword")} />
        <Button type="submit" variant="slate" icon={KeyRound} loading={isSubmitting}>
          {t("profile.changePasswordBtn")}
        </Button>
      </form>
    </SectionCard>
  );
}
