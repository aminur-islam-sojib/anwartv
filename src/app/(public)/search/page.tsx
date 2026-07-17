import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import Article from "@/Model/Article";
import Category from "@/Model/Category";
import { Search } from "lucide-react";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

type SearchResultArticle = {
  _id: { toString(): string };
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

function getCategoryLabel(category?: SearchResultArticle["category"]) {
  if (!category) return "অনির্ধারিত";
  if (typeof category === "string") return category;
  return category.name || category.slug || "অনির্ধারিত";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const queryParams = await searchParams;
  const query = queryParams.q?.trim() || "";

  await connectDB();
  void Category; // Ensure Category schema is compiled for population

  let articles: SearchResultArticle[] = [];

  if (query) {
    const rawArticles = await Article.find({
      status: "published",
      $or: [
        { title: { $regex: query, $options: "i" } },
        { excerpt: { $regex: query, $options: "i" } },
      ],
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("category", "name slug")
      .select("title slug excerpt coverImage category createdAt")
      .limit(24)
      .lean();

    articles = JSON.parse(JSON.stringify(rawArticles)) as SearchResultArticle[];
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mb-8 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#cc0000]">
            Search
          </p>
          <h1 className="text-3xl font-black text-slate-950">খবর অনুসন্ধান</h1>
        </div>

        {/* Search Input Form for page refinement */}
        <form action="/search" method="GET" className="max-w-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="খবরের কিউওয়ার্ড দিয়ে খুঁজুন..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#cc0000] focus:ring-1 focus:ring-[#cc0000] transition"
              required
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#4A0404] hover:bg-[#cc0000] text-white rounded-xl text-sm font-bold transition duration-200 shadow-sm"
          >
            খুঁজুন
          </button>
        </form>
      </div>

      {query ? (
        <div>
          <p className="text-sm text-slate-600 mb-6">
            <strong>&ldquo;{query}&rdquo;</strong> এর জন্য অনুসন্ধান ফলাফল (মোট {articles.length} টি সংবাদ পাওয়া গেছে):
          </p>

          {articles.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-slate-500 font-medium">কোনো সংবাদ পাওয়া যায়নি। অনুগ্রহ করে অন্য কিউওয়ার্ড ব্যবহার করুন।</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article._id.toString()}
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
                    <h2 className="text-lg font-black leading-snug text-slate-950 group-hover:text-[#cc0000] transition-colors">
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
          )}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-slate-500 font-medium">অনুসন্ধান করতে ওপরে টেক্সট বক্সে কিছু লিখুন।</p>
        </div>
      )}
    </main>
  );
}
