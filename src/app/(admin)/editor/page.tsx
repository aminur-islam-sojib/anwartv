import { auth } from "@/lib/auth";
import { ROLES } from "@/constant/roles";
import { getDashboardPath, normalizeRole } from "@/lib/dashboardRoutes";
import { redirect } from "next/navigation";
import RoleDashboardHome from "@/components/admin/RoleDashboardHome";

export default async function EditorHomePage() {
  const session = await auth();

  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any).role);

  if (role !== ROLES.EDITOR) {
    redirect(getDashboardPath(role));
  }

  return <RoleDashboardHome role="editor" />;
}
