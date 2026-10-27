"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function LogoutButton({ withLabel, className }: { withLabel?: boolean; className?: string }) {
  const t = useTranslations("common");
  return (
    <button
      type="button"
      aria-label={t("logout")}
      title={t("logout")}
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink/80 transition duration-200 hover:bg-terra/10 hover:text-terra",
        className,
      )}
    >
      <LogOut size={18} strokeWidth={1.5} aria-hidden className="rtl:-scale-x-100" />
      {withLabel && <span>{t("logout")}</span>}
    </button>
  );
}
