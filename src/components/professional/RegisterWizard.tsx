"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseMedical,
  Check,
  HeartPulse,
  KeyRound,
  Lock,
  MapPin,
  Phone,
  Stethoscope,
  Syringe,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { PhotoPicker } from "./PhotoPicker";
import { PasswordStrength } from "./PasswordStrength";
import { ContactFields, PersonalFields, ProfessionalFields, ZoneFields, type ProfileForm } from "./ProfileFields";
import { useErrorText, useSpecialties, useZones } from "@/lib/hooks";
import { registerSchema, type RegisterData, type RegisterInput } from "@/lib/validation";
import { normalizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

type StepKey = "type" | "personal" | "contact" | "professional" | "zone" | "access";

const STEPS: { key: StepKey; icon: LucideIcon; fields: FieldPath<RegisterInput>[] }[] = [
  { key: "type", icon: BriefcaseMedical, fields: ["type"] },
  { key: "personal", icon: UserRound, fields: ["firstName", "lastName", "birthDate", "sex", "nni"] },
  { key: "contact", icon: Phone, fields: ["phone", "whatsappSame", "whatsapp", "email"] },
  { key: "professional", icon: Stethoscope, fields: ["specialtyId", "yearsExperience", "workplace", "languages", "bio"] },
  { key: "zone", icon: MapPin, fields: ["homeZoneId", "hasVehicle"] },
  { key: "access", icon: KeyRound, fields: ["password", "confirmPassword"] },
];

export function RegisterWizard() {
  const t = useTranslations();
  const err = useErrorText();
  const router = useRouter();
  const isRtl = useLocale() === "ar";
  const { zones } = useZones();
  const { specialties } = useSpecialties();

  const [step, setStep] = useState(0);
  const [dirStep, setDirStep] = useState(1);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegisterInput, unknown, RegisterData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      nni: "",
      phone: "",
      whatsappSame: true,
      whatsapp: "",
      email: "",
      workplace: "",
      languages: [],
      bio: "",
      hasVehicle: false,
      password: "",
      confirmPassword: "",
    },
  });
  const { watch, setValue, trigger, register, formState: { errors } } = form;
  const type = watch("type");
  const password = watch("password") ?? "";
  const current = STEPS[step];

  const go = (next: number) => {
    setDirStep(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep = async () => {
    const ok = await trigger(current.fields, { shouldFocus: true });
    if (current.key === "personal" && !photo) {
      setPhotoError(t("errors.photo"));
      return false;
    }
    return ok;
  };

  const onNext = async () => {
    if (await validateStep()) go(step + 1);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!photo) return go(1);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(form.getValues()));
      fd.append("photo", photo.blob, "photo.jpg");
      const res = await fetch("/api/register", { method: "POST", body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { details?: Record<string, string[]> };
        const details = body.details ?? {};
        let firstStep = -1;
        for (const [field, msgs] of Object.entries(details)) {
          if (field === "photo") {
            setPhotoError(err(msgs[0]));
            firstStep = firstStep === -1 ? 1 : Math.min(firstStep, 1);
            continue;
          }
          form.setError(field as FieldPath<RegisterInput>, { message: msgs[0] });
          const idx = STEPS.findIndex((s) => s.fields.includes(field as FieldPath<RegisterInput>));
          if (idx >= 0) firstStep = firstStep === -1 ? idx : Math.min(firstStep, idx);
        }
        if (firstStep >= 0) go(firstStep);
        toast.error(Object.keys(details).length ? err(Object.values(details)[0][0]) : t("errors.server"));
        return;
      }
      const login = await signIn("credentials", {
        identifier: normalizePhone(data.phone),
        password: data.password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
        return;
      }
      toast.success(t("register.success"));
      router.replace("/pro");
      router.refresh();
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setSubmitting(false);
    }
  });

  const fieldsForm = form as unknown as ProfileForm;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progreso */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between text-sm text-muted">
          <span>{t("register.stepOf", { step: step + 1, total: STEPS.length })}</span>
          <span className="font-medium text-ink">{t(`register.steps.${current.key}`)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line/10" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          <motion.div className="h-full rounded-full bg-gradient-to-r from-sage to-slate" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
        <ol className="mt-4 hidden justify-between sm:flex">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition duration-200",
                  i < step && "border-sage bg-sage text-white",
                  i === step && "border-sage bg-sage/15 text-sage",
                  i > step && "border-line/15 text-muted",
                )}
              >
                {i < step ? <Check size={16} strokeWidth={2} aria-hidden /> : <s.icon size={16} strokeWidth={1.5} aria-hidden />}
              </span>
              <span className={cn("text-xs", i === step ? "text-ink" : "text-muted")}>{t(`register.steps.${s.key}`)}</span>
            </li>
          ))}
        </ol>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) void onNext();
          else void onSubmit(e);
        }}
        noValidate
      >
        <GlassCard className="overflow-hidden p-5 sm:p-7">
          <AnimatePresence mode="wait" initial={false} custom={dirStep}>
            <motion.div
              key={current.key}
              custom={dirStep}
              initial={{ opacity: 0, x: (isRtl ? -1 : 1) * dirStep * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: (isRtl ? 1 : -1) * dirStep * 24 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-5 text-xl">{t(`register.${current.key}Title`)}</h2>

              {current.key === "type" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    { v: "DOCTOR", icon: Stethoscope, hint: t("register.typeDoctorHint"), tone: "sage" },
                    { v: "NURSE", icon: Syringe, hint: t("register.typeNurseHint"), tone: "slate" },
                  ] as const).map((o) => {
                    const on = type === o.v;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          if (type !== o.v) setValue("specialtyId", undefined as unknown as number);
                          setValue("type", o.v, { shouldValidate: true });
                        }}
                        className={cn(
                          "group flex flex-col items-start gap-3 rounded-2xl border p-5 text-start transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
                          on
                            ? o.tone === "sage" ? "border-sage bg-sage/15" : "border-slate bg-slate/15"
                            : "border-white/40 bg-white/40 dark:border-white/10 dark:bg-white/5",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-14 w-14 items-center justify-center rounded-2xl text-white transition",
                            o.tone === "sage" ? "bg-sage" : "bg-slate",
                          )}
                        >
                          <o.icon size={28} strokeWidth={1.5} aria-hidden />
                        </span>
                        <span className="text-lg font-semibold">{t(`types.${o.v}`)}</span>
                        <span className="text-sm text-muted">{o.hint}</span>
                        {on && (
                          <span className="ms-auto -mt-1 inline-flex items-center gap-1 text-sm text-sage">
                            <Check size={16} strokeWidth={2} aria-hidden />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {errors.type && <p className="text-[13px] text-terra sm:col-span-2">{err(errors.type.message)}</p>}
                </div>
              )}

              {current.key === "personal" && (
                <div className="space-y-5">
                  <PhotoPicker
                    value={photo?.url ?? null}
                    error={photoError}
                    onChange={(blob, url) => {
                      setPhoto({ blob, url });
                      setPhotoError(undefined);
                    }}
                  />
                  <PersonalFields form={fieldsForm} />
                </div>
              )}

              {current.key === "contact" && <ContactFields form={fieldsForm} />}

              {current.key === "professional" && type && (
                <ProfessionalFields form={fieldsForm} type={type} specialties={specialties} />
              )}

              {current.key === "zone" && <ZoneFields form={fieldsForm} zones={zones} />}

              {current.key === "access" && (
                <div className="grid gap-4">
                  <div>
                    <Input
                      label={t("fields.password")}
                      icon={Lock}
                      type="password"
                      autoComplete="new-password"
                      hint={t("fields.passwordHint")}
                      error={err(errors.password?.message)}
                      {...register("password")}
                    />
                    <PasswordStrength password={password} />
                  </div>
                  <Input
                    label={t("fields.confirmPassword")}
                    icon={Lock}
                    type="password"
                    autoComplete="new-password"
                    error={err(errors.confirmPassword?.message)}
                    {...register("confirmPassword")}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="ghost" icon={isRtl ? ArrowRight : ArrowLeft} onClick={() => go(step - 1)}>
                {t("common.back")}
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button type="submit" iconEnd={ArrowRight} disabled={current.key === "type" && !type}>
                {t("common.next")}
              </Button>
            ) : (
              <Button type="submit" icon={HeartPulse} loading={submitting}>
                {t("common.finish")}
              </Button>
            )}
          </div>
        </GlassCard>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-slate underline-offset-4 hover:underline">
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}
