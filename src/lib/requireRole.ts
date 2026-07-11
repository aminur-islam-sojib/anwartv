import { Role } from "@/constant/roles";
import { auth } from "@/lib/auth";
import { Session } from "next-auth";

interface RequireRoleResult {
  session: Session | null;
  error: Response | null;
}

export async function requireRole(
  allowedRoles: Role[],
): Promise<RequireRoleResult> {
  const session = await auth();

  if (!session) {
    return {
      session: null,
      error: Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const sessionRole = session.user?.role as Role | undefined;

  if (!sessionRole || !allowedRoles.includes(sessionRole)) {
    return {
      session,
      error: Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { session, error: null };
}
