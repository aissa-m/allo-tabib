"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function passwordScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, Math.max(1, s - (pw.length < 8 ? 1 : 0)));
}

/** Indicador de fortaleza de la contraseña. */
export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations("fields.strength");
  const score = passwordScore(password);
  const labels = ["", t("weak"), t("medium"), t("strong"), t("veryStrong")];
  const colors = ["bg-line/10", "bg-terra", "bg-terra/70", "bg-sage/80", "bg-sage"];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/10">
            <motion.div
              className={cn("h-full rounded-full", colors[score])}
              initial={false}
              animate={{ width: score >= i ? "100%" : "0%" }}
              transition={{ duration: 0.25 }}
            />
          </div>
        ))}
      </div>
      {password && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted">
          <ShieldCheck size={14} strokeWidth={1.5} aria-hidden />
          <span>{t("label")}</span>
          <span className="font-medium text-ink/80">{labels[score]}</span>
        </p>
      )}
    </div>
  );
}
