import { auth } from "@/lib/auth";
import { ROLES } from "@/constant/roles";
import { getDashboardPath, normalizeRole } from "@/lib/dashboardRoutes";
import { redirect } from "next/navigation";

export default async function WriterDashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any).role);

  if (role !== ROLES.WRITER) {
    redirect(getDashboardPath(role));
  }

  redirect("/write");
}
