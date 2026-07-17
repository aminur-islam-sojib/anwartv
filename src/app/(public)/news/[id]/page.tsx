// app/news/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCachedArticle } from "@/lib/newsService";
import ShareButtons from "@/components/Shared/ShareButtons";
import Article from "@/Model/Article";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;

function getCategoryLabel(category: unknown) {
  if (!category) return "অনির্ধারিত";
  if (typeof category === "string") return category;

  if (typeof category === "object") {
    const typedCategory = category as {
      name?: string;
      slug?: string;
      title?: string;
      _id?: { toString?: () => string } | string;
    };

    return (
      typedCategory.name ||
      typedCategory.title ||
      typedCategory.slug ||
      (typeof typedCategory._id === "string"
        ? typedCategory._id
        : typedCategory._id?.toString?.() || "অনির্ধারিত")
    );
  }
  return "অনির্ধারিত";
}

export default async function NewsDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const decodedSlug = decodeURIComponent(id);

  const article = await getCachedArticle(decodedSlug);

  if (!article) {
    notFound();
  }

  const categoryId =
    (article.category as unknown as { _id?: string })._id || article.category;
  const relatedArticles = await Article.find({
    category: categoryId,
    _id: { $ne: article._id },
    status: "published",
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(3)
    .select("title slug coverImage createdAt")
    .lean();

  interface RelatedArticle {
    _id: { toString(): string };
    title: string;
    slug: string;
    coverImage?: { url: string };
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 font-sans selection:bg-red-600 selection:text-white">
      <div className="mb-4">
        <span className="text-xs font-black text-[#cc0000] uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded">
          {getCategoryLabel(article.category)}
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
        {article.title}
      </h1>

      <div className="flex items-center gap-4 border-y border-slate-100 py-3 mb-8 text-xs text-slate-500">
        {article.author && (
          <div>
            প্রতিবেদক:{" "}
            <span className="font-bold text-slate-700">
              {(article.author as unknown as { name?: string }).name ||
                "অনলাইন ডেস্ক"}
            </span>
          </div>
        )}
        {article.author && <div className="text-slate-300">|</div>}
        <div>
          প্রকাশিত:{" "}
          <time className="font-bold text-slate-700">
            {new Date(article.createdAt).toLocaleDateString("bn-BD", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </div>

      {article.coverImage?.url && (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 mb-8 border border-slate-200/50">
          <Image
            src={article.coverImage.url}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      <div
        className="prose prose-slate max-w-none text-slate-800 text-base leading-relaxed md:leading-loose space-y-6 font-normal"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <ShareButtons />

      {relatedArticles && relatedArticles.length > 0 && (
        <div className="mt-16 pt-8 border-t border-slate-100">
          <h3 className="text-lg font-black text-slate-950 mb-6">
            সংশ্লিষ্ট খবর
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {(relatedArticles as unknown as RelatedArticle[]).map(
              (relArticle) => (
                <Link
                  key={relArticle._id.toString()}
                  href={`/news/${relArticle.slug}`}
                  className="group block space-y-3"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50">
                    <Image
                      src={
                        relArticle.coverImage?.url ||
                        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={relArticle.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#cc0000] leading-snug line-clamp-2 transition-colors">
                    {relArticle.title}
                  </h4>
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </article>
  );
}
