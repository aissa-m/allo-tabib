import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AdminNav />
      <main className="relative min-w-0 flex-1">{children}</main>
    </div>
  );
}
