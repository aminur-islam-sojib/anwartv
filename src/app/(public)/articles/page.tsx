import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import Article from "@/Model/Article";
import Category from "@/Model/Category";

type PublicArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: {
    url?: string;
    alt?: string;
  };
  category?: { name?: string; slug?: string } | string;
  createdAt?: string;
};

function getCategoryLabel(category?: PublicArticle["category"]) {
  if (!category) return "অনির্ধারিত";
  if (typeof category === "string") return category;
  return category.name || category.slug || "অনির্ধারিত";
}

export default async function ArticlesPage() {
  await connectDB();

  // Register referenced models before Mongoose populate runs during prerender.
  void Category;

  const articles = JSON.parse(
    JSON.stringify(
      await Article.find({ status: "published" })
        .sort({ publishedAt: -1, createdAt: -1 })
        .populate("category", "name slug")
        .select("title slug excerpt coverImage category createdAt")
        .limit(12)
        .lean(),
    ),
  ) as PublicArticle[];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#cc0000]">
          Articles
        </p>
        <h1 className="text-3xl font-black text-slate-950">সর্বশেষ সংবাদ</h1>
        <p className="text-sm text-slate-600">
          প্রকাশিত খবরগুলো এখানে দেখুন এবং বিস্তারিত পড়তে প্রতিটি কার্ডে ক্লিক
          করুন।
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article._id}
            href={`/news/${article.slug}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative aspect-video bg-slate-100">
              <Image
                src={
                  article.coverImage?.url ||
                  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80"
                }
                alt={article.coverImage?.alt || article.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="space-y-3 p-5">
              <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#cc0000]">
                {getCategoryLabel(article.category)}
              </span>
              <h2 className="text-lg font-black leading-snug text-slate-950 group-hover:text-[#cc0000]">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-sm leading-6 text-slate-600 line-clamp-3">
                  {article.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
