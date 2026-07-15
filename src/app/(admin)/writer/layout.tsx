import DashboardShell from "@/components/admin/DashboardShell";
import { ROLES } from "@/constant/roles";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { normalizeRole } from "@/lib/dashboardRoutes";

export default async function WriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  if (normalizeRole((session.user as any).role) !== ROLES.WRITER) {
    redirect("/");
  }

  return (
    <div className="admin-shell">
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
