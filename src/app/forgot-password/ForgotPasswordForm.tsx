"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mail, MailCheck, Send } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { useErrorText } from "@/lib/hooks";
import { CONTACT_PHONE } from "@/lib/constants";
import { formatPhone } from "@/lib/phone";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const err = useErrorText();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setSentTo(data.email.trim().toLowerCase());
    } catch {
      toast.error(t("errors.network"));
    }
  });

  const phone = (chunks: React.ReactNode) => (
    <a href={`tel:${CONTACT_PHONE}`} dir="ltr" className="whitespace-nowrap font-medium text-ink underline-offset-4 hover:underline">
      {chunks}
    </a>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-sm">
      <GlassCard className="p-6 sm:p-7">
        {sentTo ? (
          <div role="status">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-online/15 text-online">
              <MailCheck size={24} strokeWidth={1.5} aria-hidden />
            </div>
            <h1 className="text-2xl">{t("password.sentTitle")}</h1>
            <p className="mt-2 text-sm text-muted">{t("password.sentBody", { email: sentTo })}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate/15 text-slate">
                <Mail size={24} strokeWidth={1.5} aria-hidden />
              </div>
              <h1 className="text-2xl">{t("password.forgotTitle")}</h1>
              <p className="mt-1 text-sm text-muted">{t("password.forgotSubtitle")}</p>
            </div>
            <form onSubmit={onSubmit} method="post" className="space-y-4" noValidate>
              <Input
                label={t("password.email")}
                icon={Mail}
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                error={err(errors.email?.message)}
                {...register("email")}
              />
              <Button type="submit" block size="lg" icon={Send} loading={isSubmitting}>
                {t("password.send")}
              </Button>
            </form>
          </>
        )}
        <p className="mt-5 text-[13px] text-muted">{t.rich("password.noEmail", { phone, number: formatPhone(CONTACT_PHONE) })}</p>
      </GlassCard>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-slate underline-offset-4 hover:underline">
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden className="rtl:-scale-x-100" />
          {t("password.backToLogin")}
        </Link>
      </p>
    </motion.div>
  );
}
