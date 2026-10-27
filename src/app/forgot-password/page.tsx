import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("password");
  return { title: t("forgotTitle") };
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <ForgotPasswordForm />
      </main>
    </div>
  );
}
