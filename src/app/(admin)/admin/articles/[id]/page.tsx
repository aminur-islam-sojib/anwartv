import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Edit,
  Eye,
  FileText,
  Heart,
  MessageSquareText,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import Article from "@/Model/Article";
import Category from "@/Model/Category";
import User from "@/Model/User";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/constant/roles";
import { getDashboardPath } from "@/lib/dashboardRoutes";

type ArticleDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type NamedEntity = {
  _id?: string;
  name?: string;
  title?: string;
  slug?: string;
  email?: string;
};

type ArticleDetails = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: {
    url?: string;
    alt?: string;
    caption?: string;
  };
  category?: NamedEntity | string;
  author?: NamedEntity | string;
  coAuthors?: Array<NamedEntity | string>;
  tags?: string[];
  status: string;
  publishedAt?: string;
  scheduledAt?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  views?: number;
  likes?: number;
  shares?: number;
  readTime?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    keywords?: string[];
  };
  relatedArticles?: Array<NamedEntity | string>;
  editHistory?: Array<{
    editedBy?: NamedEntity | string;
    editedAt?: string;
    note?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  in_review: "bg-amber-50 text-amber-700 border-amber-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  published: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(value?: string) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getName(value?: NamedEntity | string) {
  if (!value) return "Not set";
  if (typeof value === "string") return value;
  return value.name || value.title || value.email || value._id || "Not set";
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            {label}
          </p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-800">
        {value || "Not set"}
      </dd>
    </div>
  );
}

export default async function ArticleDetailsPage({
  params,
}: ArticleDetailsPageProps) {
  const { id } = await params;
  const session = await auth();

  await connectDB();

  // Register referenced models before populate runs.
  void Category;
  void User;

  const articleDocument = await Article.findOne({
    $or: [{ _id: id }, { slug: id }],
  })
    .populate("category", "name slug")
    .populate("author", "name email")
    .populate("coAuthors", "name email")
    .populate("editHistory.editedBy", "name email")
    .populate("relatedArticles", "title slug")
    .lean();

  if (!articleDocument) {
    notFound();
  }

  const role = (session?.user as any)?.role as string | undefined;
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  const articleAuthorId =
    (articleDocument as any).author?._id?.toString?.() ||
    (articleDocument as any).author?.toString?.();

  if (
    (articleDocument as any).status !== "published" &&
    role !== ROLES.ADMIN &&
    role !== ROLES.EDITOR &&
    !(
      role === ROLES.WRITER &&
      sessionUserId &&
      articleAuthorId === sessionUserId
    )
  ) {
    notFound();
  }

  const article = JSON.parse(JSON.stringify(articleDocument)) as ArticleDetails;

  const statusClass = statusStyles[article.status] || statusStyles.draft;
  const coAuthors = article.coAuthors?.map(getName).join(", ");
  const relatedArticles = article.relatedArticles?.map(getName).join(", ");
  const keywords = article.seo?.keywords?.join(", ");

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href={getDashboardPath((session?.user as any)?.role)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#cc0000]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </Link>
          <div className="space-y-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass}`}
            >
              {article.status.replace("_", " ")}
            </span>
            <h1 className="max-w-5xl text-3xl font-bold leading-tight text-slate-950">
              {article.title}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              /news/{article.slug}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/edit/${article._id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#cc0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a30000]"
          >
            <Edit className="h-4 w-4" />
            Edit article
          </Link>
          <Link
            href={`/news/${article.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Public view
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Eye} label="Views" value={article.views || 0} />
        <StatCard icon={Heart} label="Likes" value={article.likes || 0} />
        <StatCard icon={Share2} label="Shares" value={article.shares || 0} />
        <StatCard
          icon={FileText}
          label="Read time"
          value={`${article.readTime || 0} min`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {article.coverImage?.url && (
              <div className="relative h-55 border-b border-slate-200 bg-slate-100 sm:h-80 lg:h-105">
                <Image
                  src={article.coverImage.url}
                  alt={article.coverImage.alt || article.title}
                  fill
                  unoptimized
                  sizes="(min-width: 1280px) calc(100vw - 680px), 100vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-4 p-5">
              {article.coverImage?.caption && (
                <p className="text-sm font-medium text-slate-500">
                  {article.coverImage.caption}
                </p>
              )}
              {article.excerpt && (
                <p className="rounded-lg bg-slate-50 p-4 text-base font-medium leading-7 text-slate-700">
                  {article.excerpt}
                </p>
              )}
              <div
                className="prose prose-slate max-w-none prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-[#cc0000]" />
              <h2 className="text-lg font-bold text-slate-900">Edit history</h2>
            </div>

            {article.editHistory?.length ? (
              <div className="space-y-4">
                {[...article.editHistory].reverse().map((entry, index) => (
                  <div
                    key={`${entry.editedAt}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-900">
                        {getName(entry.editedBy)}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {formatDate(entry.editedAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {entry.note || "No edit note added."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                No edit history is available for this article.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#cc0000]" />
              <h2 className="text-lg font-bold text-slate-900">Publishing</h2>
            </div>
            <dl>
              <DetailRow label="Category" value={getName(article.category)} />
              <DetailRow label="Author" value={getName(article.author)} />
              <DetailRow label="Co-authors" value={coAuthors} />
              <DetailRow
                label="Created"
                value={formatDate(article.createdAt)}
              />
              <DetailRow
                label="Updated"
                value={formatDate(article.updatedAt)}
              />
              <DetailRow
                label="Published"
                value={formatDate(article.publishedAt)}
              />
              <DetailRow
                label="Scheduled"
                value={formatDate(article.scheduledAt)}
              />
              <DetailRow label="Article ID" value={article._id} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#cc0000]" />
              <h2 className="text-lg font-bold text-slate-900">Flags</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4" />
                  Breaking
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {article.isBreaking ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Star className="h-4 w-4" />
                  Featured
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {article.isFeatured ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-slate-900">SEO</h2>
            <dl>
              <DetailRow label="Meta title" value={article.seo?.metaTitle} />
              <DetailRow
                label="Meta description"
                value={article.seo?.metaDescription}
              />
              <DetailRow label="OG image" value={article.seo?.ogImage} />
              <DetailRow label="Keywords" value={keywords} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              More details
            </h2>
            <dl>
              <DetailRow label="Tags" value={article.tags?.join(", ")} />
              <DetailRow label="Related articles" value={relatedArticles} />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
