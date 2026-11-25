import { getCurrentAdmin } from "@/features/administration/actions/auth-actions";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // Se não estiver autenticado (ex.: /admin/login), renderiza directamente sem shell
  if (!admin) {
    return <>{children}</>;
  }

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
