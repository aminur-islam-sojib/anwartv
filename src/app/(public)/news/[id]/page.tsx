// app/news/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCachedArticle } from "@/lib/newsService";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Next.js-কে বলা যে অজানা স্ল্যাগ আসলেও পেজটি অন-ডিমান্ড সার্ভার সাইডে তৈরি করে ক্যাশ করে নাও
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

  // সুপার-ফাস্ট এজ ক্যাশ থেকে নিউজ ডেটা তুলে আনা
  const article = await getCachedArticle(id);

  // যদি নিউজটি ডাটাবেজে না থাকে, তবে সাথে সাথে ৪MD (Not Found) রেসপন্স পাঠানো
  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 font-sans selection:bg-red-600 selection:text-white">
      {/* ক্যাটাগরি এবং ব্রেডক্রাম্ব */}
      <div className="mb-4">
        <span className="text-xs font-black text-[#cc0000] uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded">
          {getCategoryLabel(article.category)}
        </span>
      </div>

      {/* সংবাদের মূল শিরোনাম */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
        {article.title}
      </h1>

      {/* পাবলিশ টাইম ও মেটা ডাটা */}
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

      {/* অপ্টিমাইজড কাভার ইমেজ (ImgBB CDN ফ্রেন্ডলি) */}
      {article.coverImage?.url && (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 mb-8 border border-slate-200/50">
          <Image
            src={article.coverImage.url}
            alt={article.title}
            fill
            priority // লিড ইমেজের জন্য ব্রাউজার প্রিওরিটি দেওয়া (LCP optimization)
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      {/* সংবাদের বিস্তারিত মূল বডি (Rich Text Content) */}
      <div
        className="prose prose-slate max-w-none text-slate-800 text-base leading-relaxed md:leading-loose space-y-6 font-normal"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
