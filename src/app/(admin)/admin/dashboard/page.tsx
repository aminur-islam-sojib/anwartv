import ArticleForm from "@/components/admin/ArticleForm";
import ArticleListTable from "@/components/admin/ArticleListTable";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLES } from "@/constant/roles";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  if ((session.user as any).role !== ROLES.ADMIN) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Admin overview
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          System control panel
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Manage users, review the newsroom pipeline, and keep the publishing
          workflow locked to the right permissions.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/articles"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#cc0000]/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Content
          </p>
          <p className="mt-2 text-xl font-bold text-slate-950">Articles</p>
          <p className="mt-2 text-sm text-slate-600">
            Review and manage all newsroom posts.
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#cc0000]/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Access
          </p>
          <p className="mt-2 text-xl font-bold text-slate-950">Users</p>
          <p className="mt-2 text-sm text-slate-600">
            Control roles, accounts, and staff permissions.
          </p>
        </Link>
        <Link
          href="/editor"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#cc0000]/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Workflow
          </p>
          <p className="mt-2 text-xl font-bold text-slate-950">Editor view</p>
          <p className="mt-2 text-sm text-slate-600">
            Open the editor workspace for review tasks.
          </p>
        </Link>
      </div>
    </div>
  );
}
