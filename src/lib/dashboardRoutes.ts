import { ROLES, type Role } from "@/constant/roles";

export const DASHBOARD_PATHS: Record<Role, string> = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.EDITOR]: "/editor",
  [ROLES.WRITER]: "/write",
  [ROLES.READER]: "/",
};

export function normalizeRole(role?: string | null) {
  return role?.toLowerCase();
}

export function getDashboardPath(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLES.ADMIN) return DASHBOARD_PATHS[ROLES.ADMIN];
  if (normalizedRole === ROLES.EDITOR) return DASHBOARD_PATHS[ROLES.EDITOR];
  if (normalizedRole === ROLES.WRITER) return DASHBOARD_PATHS[ROLES.WRITER];
  return DASHBOARD_PATHS[ROLES.READER];
}

export function hasAnyRole(role: string | undefined, allowedRoles: Role[]) {
  const normalizedRole = normalizeRole(role);
  return Boolean(
    normalizedRole && allowedRoles.includes(normalizedRole as Role),
  );
}
