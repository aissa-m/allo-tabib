"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { KeyRound, Lock, LinkIcon, Save } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { PasswordStrength } from "@/components/professional/PasswordStrength";
import { useErrorText } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations();
  const err = useErrorText();
  const router = useRouter();
  // Token con formato incorrecto (enlace cortado al copiarlo) o rechazado por el servidor
  const [invalid, setInvalid] = useState(() => !resetPasswordSchema.innerType().shape.token.safeParse(token).success);
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 410) {
        setInvalid(true);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { details?: Record<string, string[]> };
        for (const [f, msgs] of Object.entries(body.details ?? {})) setError(f as FieldPath<ResetPasswordInput>, { message: msgs[0] });
        if (body.details?.token) setInvalid(true);
        return;
      }
      toast.success(t("password.done"));
      router.replace("/login");
    } catch {
      toast.error(t("errors.network"));
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-sm">
      <GlassCard className="p-6 sm:p-7">
        {invalid ? (
          <div role="alert">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-terra/10 text-terra">
              <LinkIcon size={24} strokeWidth={1.5} aria-hidden />
            </div>
            <h1 className="text-2xl">{t("password.invalidTitle")}</h1>
            <p className="mt-2 text-sm text-muted">{t("errors.resetInvalid")}</p>
            <Link href="/forgot-password" className={cn("mt-5 inline-flex w-full items-center justify-center", buttonVariants.primary, buttonSizes.lg)}>
              {t("password.requestNew")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate/15 text-slate">
                <KeyRound size={24} strokeWidth={1.5} aria-hidden />
              </div>
              <h1 className="text-2xl">{t("password.resetTitle")}</h1>
              <p className="mt-1 text-sm text-muted">{t("password.resetSubtitle")}</p>
            </div>
            <form onSubmit={onSubmit} method="post" className="space-y-4" noValidate>
              <div>
                <Input
                  label={t("password.newPassword")}
                  icon={Lock}
                  type="password"
                  autoComplete="new-password"
                  hint={t("fields.passwordHint")}
                  error={err(errors.password?.message)}
                  {...register("password")}
                />
                <PasswordStrength password={watch("password") ?? ""} />
              </div>
              <Input
                label={t("password.confirmPassword")}
                icon={Lock}
                type="password"
                autoComplete="new-password"
                error={err(errors.confirmPassword?.message)}
                {...register("confirmPassword")}
              />
              <Button type="submit" block size="lg" icon={Save} loading={isSubmitting}>
                {t("password.save")}
              </Button>
            </form>
          </>
        )}
      </GlassCard>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-slate underline-offset-4 hover:underline">
          {t("password.backToLogin")}
        </Link>
      </p>
    </motion.div>
  );
}
