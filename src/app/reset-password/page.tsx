import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { ResetPasswordForm } from "./ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("password");
  // El token va en la URL: que no se filtre a otras webs por el Referer.
  return { title: t("resetTitle"), referrer: "no-referrer", robots: { index: false, follow: false } };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <ResetPasswordForm token={typeof token === "string" ? token : ""} />
      </main>
    </div>
  );
}
