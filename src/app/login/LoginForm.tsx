"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AlertCircle, Eye, EyeOff, KeyRound, LogIn, UserRound } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useErrorText } from "@/lib/hooks";
import { loginSchema, type LoginInput } from "@/lib/validation";

const PHONE_PREFIX = "+222";

export function LoginForm() {
  const t = useTranslations();
  const err = useErrorText();
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = useState(false);
  const [failed, setFailed] = useState<false | "invalid" | "locked">(false);
  // Hasta que React hidrata el formulario, el botón queda desactivado: así un envío temprano
  // (conexión lenta) nunca hace un envío nativo con la contraseña en la URL.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // El prefijo de Mauritania ya viene escrito: solo hay que teclear los 8 dígitos.
    defaultValues: { identifier: `${PHONE_PREFIX} `, password: "" },
  });
  const identifierField = register("identifier", {
    // Si se escribe un email (letra o @) detrás del prefijo, el prefijo se quita solo.
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v.startsWith(PHONE_PREFIX) && /[a-z@]/i.test(v.slice(PHONE_PREFIX.length))) {
        setValue("identifier", v.slice(PHONE_PREFIX.length).trimStart());
      }
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setFailed(false);
    const res = await signIn("credentials", { ...data, redirect: false });
    if (!res || res.error) {
      setFailed(res?.code === "locked" ? "locked" : "invalid");
      return;
    }
    const session = await getSession();
    const home = session?.user.role === "ADMIN" ? "/admin" : "/pro";
    const cb = params.get("callbackUrl");
    const target = cb && cb.startsWith(home) ? cb : home;
    router.replace(target);
    router.refresh();
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-sm">
      <GlassCard className="p-6 sm:p-7">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate/15 text-slate">
            <LogIn size={24} strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="text-2xl">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("login.subtitle")}</p>
        </div>
        <form onSubmit={onSubmit} method="post" className="space-y-4" noValidate>
          <Input
            label={t("login.identifier")}
            icon={UserRound}
            autoComplete="username"
            dir="ltr"
            placeholder={t("login.identifierPlaceholder")}
            error={err(errors.identifier?.message)}
            {...identifierField}
          />
          <Input
            label={t("login.password")}
            icon={KeyRound}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            error={err(errors.password?.message)}
            endSlot={
              <IconButton
                icon={show ? EyeOff : Eye}
                label={show ? t("login.hidePassword") : t("login.showPassword")}
                variant="ghost"
                size="sm"
                onClick={() => setShow((s) => !s)}
              />
            }
            {...register("password")}
          />
          <div className="-mt-2 flex justify-end">
            <Link href="/forgot-password" className="text-[13px] font-medium text-slate underline-offset-4 hover:underline">
              {t("login.forgot")}
            </Link>
          </div>
          {failed && (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-terra/10 px-3 py-2.5 text-sm text-terra">
              <AlertCircle size={16} strokeWidth={1.5} aria-hidden />
              {failed === "locked" ? t("errors.accountLocked") : t("errors.invalidCredentials")}
            </p>
          )}
          <Button type="submit" block size="lg" icon={LogIn} loading={isSubmitting} disabled={!hydrated}>
            {t("login.submit")}
          </Button>
        </form>
      </GlassCard>
      <p className="mt-5 text-center text-sm text-muted">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-slate underline-offset-4 hover:underline">
          {t("login.registerLink")}
        </Link>
      </p>
    </motion.div>
  );
}
