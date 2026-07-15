import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { ROLES } from "./constant/roles";
import {
  getDashboardPath,
  hasAnyRole,
  normalizeRole,
} from "@/lib/dashboardRoutes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const role = normalizeRole((user as any)?.role);

  if (!user) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/editor") ||
      pathname.startsWith("/writer")
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  if (
    (pathname.startsWith("/editor") ||
      pathname.startsWith("/editor/dashboard")) &&
    role !== ROLES.EDITOR
  ) {
    return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
  }

  if (
    (pathname.startsWith("/write") || pathname.startsWith("/writer")) &&
    role !== ROLES.WRITER
  ) {
    return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
  }

  if (
    pathname.startsWith("/admin/dashboard") ||
    pathname.startsWith("/admin/users")
  ) {
    if (role !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    const allowedRoles = [ROLES.ADMIN, ROLES.EDITOR, ROLES.WRITER];
    if (!hasAnyRole(role, allowedRoles)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/editor/:path*",
    "/write/:path*",
    "/writer/:path*",
  ],
};
