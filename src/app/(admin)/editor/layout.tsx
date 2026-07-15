import DashboardShell from "@/components/admin/DashboardShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLES } from "@/constant/roles";
import { normalizeRole } from "@/lib/dashboardRoutes";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  if (normalizeRole((session.user as any).role) !== ROLES.EDITOR) {
    redirect("/");
  }

  return (
    <div className="admin-shell">
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
