import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProDashboard } from "@/components/professional/ProDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pro");
  return { title: t("myMap") };
}

export default function ProPage() {
  return <ProDashboard />;
}
