import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminMapView } from "@/components/admin/AdminMapView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("map") };
}

export default function AdminMapPage() {
  return <AdminMapView />;
}
