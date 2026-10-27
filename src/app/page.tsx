import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Check,
  Home,
  LogIn,
  MapPinned,
  MessageCircle,
  Phone,
  PhoneCall,
  PhoneIncoming,
  Power,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { buttonSizes, buttonVariants } from "@/components/ui/Button";
import { CONTACT_PHONE } from "@/lib/constants";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

/** Texto oscuro fijo sobre coral: el blanco no llega al contraste mínimo sobre ese naranja. */
const ON_CORAL = "text-[#121A22]";
const linkBtn = "inline-flex items-center font-medium transition duration-200 hover:-translate-y-px";

function Kicker({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className={cn("mb-3 inline-flex items-center gap-2 rounded-full bg-coral px-3 py-1 text-sm font-medium", ON_CORAL)}>
      <Icon size={16} strokeWidth={1.75} aria-hidden />
      {children}
    </p>
  );
}

/** Número del centro de llamadas, en grande, con Appeler y WhatsApp. */
function PhoneBlock({ title, subtitle, call, whatsapp, className }: { title: string; subtitle: string; call: string; whatsapp: string; className?: string }) {
  return (
    <div className={cn("rounded-3xl bg-coral p-6 shadow-lift sm:p-8", ON_CORAL, className)}>
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider opacity-80">
        <PhoneCall size={16} strokeWidth={2} aria-hidden />
        {title}
      </p>
      <a href={`tel:${CONTACT_PHONE}`} dir="ltr" className="mt-2 block whitespace-nowrap text-[clamp(1.75rem,4.2vw,2.75rem)] font-bold leading-tight tracking-tight rtl:text-right">
        {formatPhone(CONTACT_PHONE)}
      </a>
      <p className="mt-1 text-sm opacity-80">{subtitle}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={`tel:${CONTACT_PHONE}`} className={cn(linkBtn, buttonSizes.lg, "bg-[#121A22] text-white shadow-sm hover:bg-[#121A22]/90")}>
          <Phone size={20} strokeWidth={1.75} aria-hidden />
          {call}
        </a>
        <a
          href={whatsappLink(CONTACT_PHONE)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(linkBtn, buttonSizes.lg, "bg-white/85 text-[#121A22] shadow-sm hover:bg-white")}
        >
          <MessageCircle size={20} strokeWidth={1.75} aria-hidden />
          {whatsapp}
        </a>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect(session.user.role === "ADMIN" ? "/admin" : "/pro");
  const t = await getTranslations();

  const phoneProps = { title: t("home.callUs"), subtitle: t("home.callOrWhatsapp"), call: t("home.call"), whatsapp: t("home.whatsapp") };

  const trust = [
    { icon: BadgeCheck, text: t("home.trust1") },
    { icon: Home, text: t("home.trust2") },
    { icon: MapPinned, text: t("home.trust3") },
  ];

  const patientSteps = [
    { icon: PhoneCall, title: t("home.pStep1Title"), body: t("home.pStep1Body") },
    { icon: Search, title: t("home.pStep2Title"), body: t("home.pStep2Body") },
    { icon: Home, title: t("home.pStep3Title"), body: t("home.pStep3Body") },
  ];

  const proSteps = [
    { icon: UserPlus, title: t("home.s1Title"), body: t("home.s1Body") },
    { icon: ShieldCheck, title: t("home.s2Title"), body: t("home.s2Body") },
    { icon: Power, title: t("home.s3Title"), body: t("home.s3Body") },
    { icon: PhoneIncoming, title: t("home.s4Title"), body: t("home.s4Body"), demo: true },
    { icon: TrendingUp, title: t("home.s5Title"), body: t("home.s5Body") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-20 px-4 pb-16 pt-6 sm:space-y-28 sm:px-6">
        {/* --- Portada --- */}
        <section className="grid items-center gap-8 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage/15 px-3 py-1 text-sm text-sage">
              <Stethoscope size={16} strokeWidth={1.5} aria-hidden />
              {t("common.tagline")}
            </p>
            <h1 className="text-3xl leading-tight sm:text-5xl">{t("home.title")}</h1>
            <p className="mt-4 text-lg text-muted">{t("home.subtitle")}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {trust.map((f) => (
                <li key={f.text} className="glass inline-flex items-center gap-2 px-3.5 py-2 text-sm">
                  <f.icon size={16} strokeWidth={1.5} className="text-sage" aria-hidden />
                  {f.text}
                </li>
              ))}
            </ul>
            <a href="#soignants" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-sage underline-offset-4 hover:underline">
              {t("home.proLink")}
              <ArrowDown size={16} strokeWidth={1.75} aria-hidden />
            </a>
          </div>
          <PhoneBlock {...phoneProps} />
        </section>

        {/* --- Pacientes --- */}
        <section id="patients" className="scroll-mt-6">
          <div className="max-w-2xl">
            <Kicker icon={Home}>{t("home.patientsKicker")}</Kicker>
            <h2 className="text-2xl sm:text-4xl">{t("home.patientsTitle")}</h2>
            <p className="mt-3 text-lg text-muted">{t("home.patientsBody")}</p>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {patientSteps.map((s, i) => (
              <li key={s.title}>
                <GlassCard className="relative h-full p-6">
                  <span className={cn("absolute end-5 top-5 text-5xl font-bold leading-none text-coral/40")} aria-hidden>
                    {i + 1}
                  </span>
                  <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-coral", ON_CORAL)}>
                    <s.icon size={24} strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="text-lg">{s.title}</h3>
                  <p className="mt-1.5 text-muted">{s.body}</p>
                </GlassCard>
              </li>
            ))}
          </ol>
          <div className="mt-6 grid items-center gap-6 rounded-3xl bg-sage p-6 text-white dark:text-[#0E1A26] sm:p-8 md:grid-cols-[1fr_auto]">
            <div>
              <h3 className="text-2xl">{t("home.phoneTitle")}</h3>
              <p className="mt-1 opacity-85">{t("home.callOrWhatsapp")}</p>
            </div>
            <a href={`tel:${CONTACT_PHONE}`} dir="ltr" className="whitespace-nowrap text-[clamp(1.75rem,6vw,3.75rem)] font-bold tracking-tight underline decoration-coral decoration-4 underline-offset-8">
              {formatPhone(CONTACT_PHONE)}
            </a>
          </div>
        </section>

        {/* --- Sanitarios --- */}
        <section id="soignants" className="scroll-mt-6">
          <div className="max-w-2xl">
            <Kicker icon={Stethoscope}>{t("home.prosKicker")}</Kicker>
            <h2 className="text-2xl sm:text-4xl">{t("home.prosTitle")}</h2>
            <p className="mt-3 text-lg text-muted">{t("home.prosBody")}</p>
          </div>
          <ol className="relative mt-10 space-y-8">
            {/* Línea vertical que une los pasos */}
            <span className="absolute bottom-6 start-6 top-6 w-0.5 bg-coral/40" aria-hidden />
            {proSteps.map((s, i) => (
              <li key={s.title} className="relative flex gap-5">
                <span
                  className={cn("relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral text-lg font-bold shadow-glass ring-4 ring-bg", ON_CORAL)}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <h3 className="flex items-center gap-2 text-lg sm:text-xl">
                    <s.icon size={20} strokeWidth={1.5} className="shrink-0 text-sage" aria-hidden />
                    {s.title}
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-muted">{s.body}</p>
                  {s.demo && (
                    // Ejemplo de llamada: cómo se propone una visita
                    <GlassCard strong className="mt-4 max-w-md p-4" aria-hidden>
                      <p className="flex items-center gap-2 text-xs font-medium text-muted">
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full bg-coral", ON_CORAL)}>
                          <PhoneIncoming size={13} strokeWidth={2} />
                        </span>
                        {t("home.demoFrom")}
                      </p>
                      <p className="mt-2.5 rounded-2xl rounded-ss-sm bg-sage/10 px-3.5 py-2.5 text-[15px]">{t("home.demoText")}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-online px-3 py-1.5 text-sm font-medium text-white dark:text-[#0E1A26]">
                          <Check size={15} strokeWidth={2} />
                          {t("home.demoYes")}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-line/[0.08] px-3 py-1.5 text-sm text-ink/80">
                          <X size={15} strokeWidth={2} />
                          {t("home.demoNo")}
                        </span>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <GlassCard className="mt-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <h3 className="text-xl">{t("home.prosCtaTitle")}</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={cn(linkBtn, buttonSizes.md, `bg-coral ${ON_CORAL} shadow-sm hover:bg-coral/90`)}>
                <UserPlus size={18} strokeWidth={1.75} aria-hidden />
                {t("common.register")}
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden className="rtl:-scale-x-100" />
              </Link>
              <Link href="/login" className={cn(linkBtn, buttonVariants.secondary, buttonSizes.md)}>
                <LogIn size={18} strokeWidth={1.5} aria-hidden />
                {t("common.login")}
              </Link>
            </div>
          </GlassCard>
        </section>
      </main>

      {/* --- Pie --- */}
      <footer className="border-t border-line/10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t("home.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={`tel:${CONTACT_PHONE}`} dir="ltr" className="font-medium text-ink hover:underline">
              {formatPhone(CONTACT_PHONE)}
            </a>
            <Link href="/login" className="inline-flex items-center gap-1.5 hover:text-ink hover:underline">
              <ShieldCheck size={15} strokeWidth={1.5} aria-hidden />
              {t("home.adminLink")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
