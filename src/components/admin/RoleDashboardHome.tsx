import Link from "next/link";

type DashboardRole = "editor" | "writer";

const contentByRole: Record<
  DashboardRole,
  {
    eyebrow: string;
    title: string;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
    tertiaryHref: string;
    tertiaryLabel: string;
  }
> = {
  editor: {
    eyebrow: "Editor workspace",
    title: "Review queue and newsroom control",
    description:
      "Approve incoming stories, track the review queue, and keep the publishing pipeline moving.",
    primaryHref: "/admin/articles?status=in_review",
    primaryLabel: "In review",
    secondaryHref: "/admin/articles",
    secondaryLabel: "Article list",
    tertiaryHref: "/admin/articles",
    tertiaryLabel: "New draft",
  },
  writer: {
    eyebrow: "Writer workspace",
    title: "Draft stories and submit them for review",
    description:
      "Create drafts, track your own stories, and hand them off for the next editorial step.",
    primaryHref: "/admin/articles",
    primaryLabel: "New draft",
    secondaryHref: "/admin/articles",
    secondaryLabel: "My work",
    tertiaryHref: "/admin/articles",
    tertiaryLabel: "Overview",
  },
};

export default function RoleDashboardHome({ role }: { role: DashboardRole }) {
  const content = contentByRole[role];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {content.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          {content.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          {content.description}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={content.primaryHref}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#cc0000]/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Queue
          </p>
          <p className="mt-2 text-xl font-bold text-slate-950">
            {content.primaryLabel}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Open the role-specific working set.
          </p>
        </Link>
        <Link
          href={content.secondaryHref}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#cc0000]/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Content
          </p>
          <p className="mt-2 text-xl font-bold text-slate-950">
            {content.secondaryLabel}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Work across the article inventory.
          </p>
        </Link>
        <Link
          href={content.tertiaryHref}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#cc0000]/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Create
          </p>
          <p className="mt-2 text-xl font-bold text-slate-950">
            {content.tertiaryLabel}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Start the next item in the workflow.
          </p>
        </Link>
      </div>
    </div>
  );
}
