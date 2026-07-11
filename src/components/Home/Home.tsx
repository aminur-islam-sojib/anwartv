// app/page.tsx
import { connectDB } from "@/lib/db";
import redis from "@/lib/redis";
import HomepageLayout from "@/Model/HomepageLayout";

async function getHomepageData() {
  try {
    // 1. Fetch straight from Upstash over highly optimized HTTP
    const cachedData = await redis.get("cached_homepage_layout");

    if (cachedData) {
      // Upstash automatically parses JSON strings back into objects!
      return cachedData;
    }
  } catch (error) {
    console.error("Redis read failed, pulling fallback from MongoDB:", error);
  }

  // 2. Fallback to MongoDB if cache misses or fails
  await connectDB();
  const dbData = await HomepageLayout.findOne()
    .populate("slots.hero_main")
    .populate("slots.hero_sidebar_1")
    .populate("slots.hero_sidebar_2")
    .populate("slots.politics_featured")
    .populate("slots.sports_featured")
    .lean();

  return dbData?.slots || null;
}

export default async function HomePage() {
  const slots = await getHomepageData();

  if (!slots) return <div>No articles featured yet.</div>;

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-black mb-4">Top News</h1>
      {/* Your homepage layout mapping here */}
      <p className="text-lg font-bold">{slots.hero_main?.title}</p>
    </main>
  );
}
