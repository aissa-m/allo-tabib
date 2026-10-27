"use client";

import { useTranslations } from "next-intl";
import { Copy, MessageCircle, Phone } from "lucide-react";
import { IconButton, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { formatPhone, whatsappLink } from "@/lib/phone";

type Props = { phone: string; whatsapp: string | null; size?: "md" | "lg"; className?: string; disabled?: boolean };

/** Teléfono muy visible + Appeler (tel:) + WhatsApp (wa.me) + copiar. */
export function ContactActions({ phone, whatsapp, size = "md", className, disabled }: Props) {
  const t = useTranslations("common");
  const wa = whatsapp || phone;

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      toast.success(t("copied"));
    } catch {
      /* portapapeles no disponible */
    }
  };

  const linkCls = cn(
    "inline-flex flex-1 items-center justify-center font-medium transition duration-200 hover:-translate-y-px active:scale-[0.98]",
    buttonSizes[size],
    disabled && "pointer-events-none opacity-60",
  );

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <a href={`tel:${phone}`} dir="ltr" className={cn("font-semibold tracking-wide text-ink", size === "lg" ? "text-2xl" : "text-lg")}>
          {formatPhone(phone)}
        </a>
        <IconButton icon={Copy} label={t("copy")} variant="ghost" size="sm" onClick={copy} />
      </div>
      <div className="flex gap-2">
        <a href={`tel:${phone}`} className={cn(linkCls, buttonVariants.primary)} tabIndex={disabled ? -1 : undefined}>
          <Phone size={18} strokeWidth={1.5} aria-hidden />
          {t("call")}
        </a>
        <a
          href={whatsappLink(wa)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(linkCls, buttonVariants.secondary)}
          tabIndex={disabled ? -1 : undefined}
        >
          <MessageCircle size={18} strokeWidth={1.5} aria-hidden className="text-sage" />
          {t("whatsapp")}
        </a>
      </div>
    </div>
  );
}
