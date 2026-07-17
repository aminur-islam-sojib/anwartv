// app/page.tsx
import redis from "@/lib/redis";
import { connectDB } from "@/lib/db";
import HomepageLayout from "@/Model/HomepageLayout";
import MaintenanceState from "./MaintenanceState";
import HeroGrid from "./HeroGrid";
import CategoryBuckets from "./CategoryBuckets";
import { unstable_cache } from "next/cache"; // ক্যাশিং এর জন্য এটি যোগ করুন
import Article from "@/Model/Article"; // আর্টিকেল মডেল
import RecentNewsSidebar from "../Shared/RecentNewsSidebar";
interface Article {
  _id: string;
  title: string;
  category: string | { _id?: string; name?: string; slug?: string };
  slug: string;
  excerpt?: string;
  coverImage?: { url: string; blurHash?: string };
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

type ObjectLike = Record<string, unknown>;
const SLOT_KEYS = ["hero_main", "hero_sidebar_1", "hero_sidebar_2", "politics_featured", "sports_featured"] as const;

function isObjectLike(value: unknown): value is ObjectLike {
  return typeof value === "object" && value !== null;
}

function toSafeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value) return fallback;
  if (isObjectLike(value)) {
    const stringable = value as { toString?: () => string };
    const stringValue = stringable.toString?.();
    if (stringValue && stringValue !== "[object Object]") return stringValue;
  }
  return fallback;
}

function getCategoryLabel(category?: Article["category"]) {
  const fallback = "অনির্ধারিত";
  if (!category) return fallback;
  if (typeof category === "string") return category;
  return toSafeString(category.name) || toSafeString(category.slug) || toSafeString(category._id) || fallback;
}

function normalizeArticle(value: unknown): Article | null {
  if (!isObjectLike(value)) return null;
  const article = value as ObjectLike;
  const category = isObjectLike(article.category)
    ? "name" in article.category || "slug" in article.category || "_id" in article.category
      ? { _id: toSafeString(article.category._id), name: toSafeString(article.category.name) || undefined, slug: toSafeString(article.category.slug) || undefined }
      : toSafeString(article.category)
    : toSafeString(article.category);
  const coverImage = isObjectLike(article.coverImage) ? { url: toSafeString(article.coverImage.url), blurHash: toSafeString(article.coverImage.blurHash) || undefined } : undefined;

  return {
    _id: toSafeString(article._id),
    title: toSafeString(article.title),
    category,
    slug: toSafeString(article.slug),
    excerpt: toSafeString(article.excerpt) || undefined,
    coverImage: coverImage?.url ? coverImage : undefined,
    author: toSafeString(article.author) || undefined,
    createdAt: toSafeString(article.createdAt),
  };
}

function normalizeSlots(value: unknown): LayoutSlots | null {
  if (!isObjectLike(value)) return null;
  return SLOT_KEYS.reduce((slots, key) => {
    slots[key] = normalizeArticle(value[key]);
    return slots;
  }, {} as LayoutSlots);
}

async function getCachedHomepageSlots(): Promise<LayoutSlots | null> {
  try {
    const cachedData = await redis.get("cached_homepage_layout");
    if (cachedData) return normalizeSlots(cachedData);
  } catch (error) {
    console.error("Redis Edge Cache failure, falling back safely to DB:", error);
  }

  try {
    await connectDB();
    const dbData = await HomepageLayout.findOne()
      .populate("slots.hero_main")
      .populate("slots.hero_sidebar_1")
      .populate("slots.hero_sidebar_2")
      .populate("slots.politics_featured")
      .populate("slots.sports_featured")
      .lean();
    return normalizeSlots(dbData?.slots);
  } catch (dbError) {
    console.error("Critical System Defect: Database fallback crashed:", dbError);
    return null;
  }
}
const getCachedRecentArticles = unstable_cache(
  async () => {
    await connectDB();
    return Article.find({ status: "published" })
      .sort({ publishedAt: -1 })
      .limit(6) // আমরা সেরা ৬টি সাম্প্রতিক নিউজ দেখাবো
      .select("title slug publishedAt") // শুধুমাত্র প্রয়োজনীয় ৩টি ফিল্ড আনবে (মেমোরি বাঁচাবে)
      .lean();
  },
  ["homepage-recent-articles-cache"],
  { revalidate: 60, tags: ["articles"] } // ৬০ সেকেন্ড পর পর ক্যাশ রিলিজ হবে
);
export default async function PublicHomepage() {
  const slots = await getCachedHomepageSlots();
  // রিসেন্ট নিউজ ডাটা কল করুন
  const recentArticles = await getCachedRecentArticles();

  if (!slots) {
    return <MaintenanceState />;
  }

  // মঙ্গোডিবি অবজেক্টকে সেফ স্ট্রিং বা প্লেইন অবজেক্টে রূপান্তর
  const safeRecentArticles = JSON.parse(JSON.stringify(recentArticles));

  return (
    <main className="mx-auto p-4 sm:p-6 lg:p-8 font-sans space-y-12 selection:bg-red-600 selection:text-white">
      {/* ZONE 1: THE TOP FOLD HERO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-9">
          <HeroGrid
            main={slots.hero_main}
            sidebar1={slots.hero_sidebar_1}
            sidebar2={slots.hero_sidebar_2}
            getCategoryLabel={getCategoryLabel}
          />
        </div>
        <div className="lg:col-span-3">
          <RecentNewsSidebar articles={safeRecentArticles} />
        </div>
      </div>

      <hr className="border-slate-100" />
      <CategoryBuckets
        politics={slots.politics_featured}
        sports={slots.sports_featured}
      />

    </main>
  );
}