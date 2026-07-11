// app/page.tsx
import Image from "next/image";
import Link from "next/link";
import redis from "@/lib/redis";
import { connectDB } from "@/lib/db";
import HomepageLayout from "@/Model/HomepageLayout";

// Define strict data contracts for safety
interface Article {
  _id: string;
  title: string;
  category:
    | string
    | {
        _id?: string;
        name?: string;
        slug?: string;
      };
  slug: string;
  excerpt?: string;
  coverImage?: {
    url: string;
    blurHash?: string;
  };
  author?: string;
  createdAt: string;
}

interface LayoutSlots {
  hero_main: Article | null;
  hero_sidebar_1: Article | null;
  hero_sidebar_2: Article | null;
  politics_featured: Article | null;
  sports_featured: Article | null;
}

function getCategoryLabel(category?: Article["category"]) {
  if (!category) return "অনির্ধারিত";
  if (typeof category === "string") return category;
  return category.name || category.slug || category._id || "অনির্ধারিত";
}

// Highly optimized caching data fetch engine
async function getCachedHomepageSlots(): Promise<LayoutSlots | null> {
  try {
    // Read directly out of Upstash RAM via stateless HTTP REST
    const cachedData = await redis.get("cached_homepage_layout");
    if (cachedData) {
      return cachedData as LayoutSlots;
    }
  } catch (error) {
    console.error(
      "Redis Edge Cache failure, falling back safely to DB:",
      error,
    );
  }

  // Backup Emergency Pipeline: Query MongoDB only if Redis fails or is empty
  try {
    await connectDB();
    const dbData = await HomepageLayout.findOne()
      .populate("slots.hero_main")
      .populate("slots.hero_sidebar_1")
      .populate("slots.hero_sidebar_2")
      .populate("slots.politics_featured")
      .populate("slots.sports_featured")
      .lean();

    return (dbData?.slots as unknown as LayoutSlots) || null;
  } catch (dbError) {
    console.error(
      "Critical System Defect: Database fallback crashed:",
      dbError,
    );
    return null;
  }
}

export default async function PublicHomepage() {
  const slots = await getCachedHomepageSlots();

  // Guard against unconfigured layout states
  if (!slots) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans">
        <p className="text-sm font-bold text-slate-500">
          পোর্টালটি রক্ষণাবেক্ষণাধীন রয়েছে। কিছুক্ষণের মধ্যে ফিরে আসছি!
        </p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans space-y-12 selection:bg-red-600 selection:text-white">
      {/* ── ZONE 1: THE TOP FOLD HERO GRID ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Lead Story Block (Takes up 8 columns on large displays) */}
        {slots.hero_main && (
          <article className="lg:col-span-8 group relative flex flex-col space-y-3">
            <Link
              href={`/news/${slots.hero_main.slug}`}
              className="block overflow-hidden rounded-2xl relative aspect-video w-full bg-slate-100"
            >
              <Image
                src={
                  slots.hero_main.coverImage?.url ||
                  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80"
                }
                alt={slots.hero_main.title}
                fill
                priority // Tells Next.js to preload this immediately to avoid LCP layout shifts
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute top-4 left-4 bg-[#cc0000] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                প্রধান সংবাদ
              </div>
            </Link>

            <div className="space-y-2">
              <span className="text-xs font-black text-[#cc0000] uppercase tracking-wider">
                {getCategoryLabel(slots.hero_main.category)}
              </span>
              <Link href={`/news/${slots.hero_main.slug}`}>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight hover:text-[#cc0000] transition-colors">
                  {slots.hero_main.title}
                </h1>
              </Link>
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {slots.hero_main.excerpt ||
                  "সংবাদের বিস্তারিত বিবরণ পড়তে লিংকে ক্লিক করুন..."}
              </p>
            </div>
          </article>
        )}

        {/* Right Stack Sidebar Slots (Takes up 4 columns) */}
        <aside className="lg:col-span-4 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-6">
          {/* Sidebar Item 1 */}
          {slots.hero_sidebar_1 && (
            <article className="group flex flex-col space-y-2 border-b lg:border-b border-slate-100 pb-4 lg:pb-4 last:border-0 last:pb-0">
              <Link
                href={`/news/${slots.hero_sidebar_1.slug}`}
                className="block overflow-hidden rounded-xl relative aspect-16/10 w-full bg-slate-100"
              >
                <Image
                  src={
                    slots.hero_sidebar_1.coverImage?.url ||
                    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={slots.hero_sidebar_1.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </Link>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase">
                  {getCategoryLabel(slots.hero_sidebar_1.category)}
                </span>
                <Link href={`/news/${slots.hero_sidebar_1.slug}`}>
                  <h2 className="text-sm font-extrabold text-slate-800 leading-snug hover:text-[#cc0000] transition-colors line-clamp-2">
                    {slots.hero_sidebar_1.title}
                  </h2>
                </Link>
              </div>
            </article>
          )}

          {/* Sidebar Item 2 */}
          {slots.hero_sidebar_2 && (
            <article className="group flex flex-col space-y-2 border-b sm:border-0 lg:border-b border-slate-100 pb-4 sm:pb-0 lg:pb-4 last:border-0 last:pb-0">
              <Link
                href={`/news/${slots.hero_sidebar_2.slug}`}
                className="block overflow-hidden rounded-xl relative aspect-16/10 w-full bg-slate-100"
              >
                <Image
                  src={
                    slots.hero_sidebar_2.coverImage?.url ||
                    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={slots.hero_sidebar_2.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </Link>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-amber-600 uppercase">
                  {getCategoryLabel(slots.hero_sidebar_2.category)}
                </span>
                <Link href={`/news/${slots.hero_sidebar_2.slug}`}>
                  <h2 className="text-sm font-extrabold text-slate-800 leading-snug hover:text-[#cc0000] transition-colors line-clamp-2">
                    {slots.hero_sidebar_2.title}
                  </h2>
                </Link>
              </div>
            </article>
          )}
        </aside>
      </section>

      <hr className="border-slate-100" />

      {/* ── ZONE 2: CATEGORY BUCKETS SECTION ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Politics Container Block */}
        {slots.politics_featured && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                জাতীয় ও রাজনীতি
              </h3>
            </div>
            <article className="group space-y-2">
              <Link
                href={`/news/${slots.politics_featured.slug}`}
                className="block overflow-hidden rounded-xl relative aspect-video w-full bg-slate-100"
              >
                <Image
                  src={
                    slots.politics_featured.coverImage?.url ||
                    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={slots.politics_featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </Link>
              <Link href={`/news/${slots.politics_featured.slug}`}>
                <h4 className="text-base font-black text-slate-800 hover:text-[#cc0000] transition-colors leading-snug">
                  {slots.politics_featured.title}
                </h4>
              </Link>
            </article>
          </div>
        )}

        {/* Sports Container Block */}
        {slots.sports_featured && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                খেলাধুলা
              </h3>
            </div>
            <article className="group space-y-2">
              <Link
                href={`/news/${slots.sports_featured.slug}`}
                className="block overflow-hidden rounded-xl relative aspect-video w-full bg-slate-100"
              >
                <Image
                  src={
                    slots.sports_featured.coverImage?.url ||
                    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={slots.sports_featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </Link>
              <Link href={`/news/${slots.sports_featured.slug}`}>
                <h4 className="text-base font-black text-slate-800 hover:text-[#cc0000] transition-colors leading-snug">
                  {slots.sports_featured.title}
                </h4>
              </Link>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
