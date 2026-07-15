import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLES } from "@/constant/roles";
import { getDashboardStats } from "@/lib/dashboardStats";
import DashboardPipelineChart from "@/components/admin/DashboardPipelineChart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Clock, CheckCircle2 } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  if ((session.user as any).role !== ROLES.ADMIN) {
    redirect("/");
  }

  const stats = await getDashboardStats();

  const publishedCount =
    stats.pipeline.find((p) => p.status === "published")?.count || 0;
  const inReviewCount =
    stats.pipeline.find((p) => p.status === "in_review")?.count || 0;

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

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              মোট আর্টিকেল
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              প্রকাশিত
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              পর্যালোচনায়
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inReviewCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              মোট স্টাফ
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Chart + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>এডিটোরিয়াল পাইপলাইন</CardTitle>
            <CardDescription>
              স্ট্যাটাস অনুযায়ী আর্টিকেলের বণ্টন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardPipelineChart data={stats.pipeline} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>সাম্প্রতিক কার্যকলাপ</CardTitle>
            <CardDescription>
              সর্বশেষ সম্পাদনা ও সংশোধনের তালিকা
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                কোনো সাম্প্রতিক কার্যকলাপ নেই।
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.recentActivity.map((activity, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/edit/${activity.articleId}`}
                        className="text-sm font-semibold text-slate-800 hover:text-[#cc0000] transition-colors line-clamp-1"
                      >
                        {activity.articleTitle}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {activity.editorName} — {activity.note}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(activity.editedAt).toLocaleDateString("bn-BD", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breaking / Featured live lists */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              বর্তমানে ব্রেকিং নিউজ
              <Badge variant="destructive">{stats.breakingNews.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.breakingNews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                বর্তমানে কোনো ব্রেকিং নিউজ নেই।
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.breakingNews.map((a) => (
                  <li key={a._id}>
                    <Link
                      href={`/admin/edit/${a.slug}`}
                      className="text-sm font-medium text-slate-800 hover:text-[#cc0000] transition-colors line-clamp-1"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              বর্তমানে ফিচার্ড নিউজ
              <Badge variant="secondary">{stats.featuredNews.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.featuredNews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                বর্তমানে কোনো ফিচার্ড নিউজ নেই।
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.featuredNews.map((a) => (
                  <li key={a._id}>
                    <Link
                      href={`/admin/edit/${a._id}`}
                      className="text-sm font-medium text-slate-800 hover:text-[#cc0000] transition-colors line-clamp-1"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kept your existing quick-links section */}
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
          href="/admin/categories"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#cc0000]/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Taxonomy
          </p>
          <p className="mt-2 text-xl font-bold text-slate-950">Categories</p>
          <p className="mt-2 text-sm text-slate-600">
            Manage categories and subcategories.
          </p>
        </Link>
      </div>
    </div>
  );
}