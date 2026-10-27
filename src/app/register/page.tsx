import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { RegisterWizard } from "@/components/professional/RegisterWizard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("register");
  return { title: t("title") };
}

export default async function RegisterPage() {
  const t = await getTranslations("register");
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1 px-4 pb-16 pt-2">
        <h1 className="mx-auto mb-5 max-w-xl text-2xl sm:text-3xl">{t("title")}</h1>
        <RegisterWizard />
      </main>
    </div>
  );
}
