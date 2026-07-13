// app/news/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCachedArticle } from "@/lib/newsService";

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

  // 1. URL-encoded স্ল্যাগটিকে ডিকোড করে বাংলা ইউনিকোডে রূপান্তর
  const decodedSlug = decodeURIComponent(id);

  // 2. ডিকোডেড স্ল্যাগটি পাস করুন ক্যাশ সার্ভিসে
  const article = await getCachedArticle(decodedSlug);

  if (!article) {
    notFound();
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
    </article>
  );
}