// lib/newsService.ts
import { unstable_cache } from "next/cache";
import { connectDB } from "./db";
import Article, { IArticle } from "@/Model/Article";
import Category from "@/Model/Category";
import User from "@/Model/User";
import redis from "./redis";

function articleCacheKey(slug: string) {
  return `cached_article_${slug}`;
}

// ১. মূল ডাটাবেজ কুয়েরি ফাংশন
async function getArticleFromDb(slug: string): Promise<IArticle | null> {
  try {
    const cachedArticle = await redis.get(articleCacheKey(slug));
    if (cachedArticle) {
      return (
        typeof cachedArticle === "string"
          ? JSON.parse(cachedArticle)
          : cachedArticle
      ) as IArticle;
    }
  } catch (error) {
    console.error("Redis article read failed, falling back to MongoDB:", error);
  }

  await connectDB();

  // Ensure referenced models are registered before populate runs.
  void Category;
  void User;

  // .populate() ব্যবহার করে ক্যাটাগরি বা অথরের ডাটা রিলেশনালি তুলে আনা হয়েছে (প্রয়োজন অনুযায়ী)
  const article = await Article.findOne({ slug, status: "published" })
    .populate("category")
    .populate("author")
    .lean();

  if (!article) return null;

  // Next.js Server Component-এ প্লেইন অবজেক্ট পাস করার জন্য MongoDB Object ID গুলো স্ট্রিং-এ কনভার্ট করা
  const serializedArticle = JSON.parse(JSON.stringify(article)) as IArticle;

  try {
    await redis.set(articleCacheKey(slug), JSON.stringify(serializedArticle), {
      ex: 300,
    });
  } catch (error) {
    console.error("Redis article write failed:", error);
  }

  return serializedArticle;
}

// ২. হাই-ট্রাফিক অপ্টিমাইজড ক্যাশড ফাংশন
export const getCachedArticle = unstable_cache(
  async (slug: string) => {
    return await getArticleFromDb(slug);
  },
  ["article-details"], // গ্লোবাল ক্যাশ কি (Cache Key)
  {
    revalidate: 60, // ৬০ সেকেন্ড পর পর ব্যাকগ্রাউন্ডে ক্যাশ আপডেট হবে (ISR)
    tags: ["articles"], // এই ট্যাগ ব্যবহার করে এডিটর প্যানেল থেকে ক্যাশ ক্লিয়ার করা যাবে
  },
);
