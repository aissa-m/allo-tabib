import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProfessionalsDirectory } from "@/components/admin/ProfessionalsDirectory";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("list");
  return { title: t("title") };
}

export default function ProfessionalsPage() {
  // useSearchParams (pestaña de estado) necesita un Suspense para que la página pueda prerenderizarse.
  return (
    <Suspense>
      <ProfessionalsDirectory />
    </Suspense>
  );
}
