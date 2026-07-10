import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { ROLES } from "./constant/roles";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // 1. Protect Admin Panel Routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const allowedRoles: string[] = [ROLES.ADMIN, ROLES.EDITOR, ROLES.WRITER];
    if (!allowedRoles.includes((user as any).role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 2. Restrict User Management to Admins Only
  if (
    pathname.startsWith("/admin/users") &&
    (user as any)?.role !== ROLES.ADMIN
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
