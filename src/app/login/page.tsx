import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("title") };
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
