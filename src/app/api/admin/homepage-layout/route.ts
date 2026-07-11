// app/api/admin/homepage-layout/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import HomepageLayout from "@/Model/HomepageLayout";
import { connectDB } from "@/lib/db";
import redis from "@/lib/redis";

const EMPTY_LAYOUT = {
  hero_main: null,
  hero_sidebar_1: null,
  hero_sidebar_2: null,
  politics_featured: null,
  sports_featured: null,
};

export async function GET() {
  try {
    await connectDB();

    const cachedLayout = await redis.get("cached_homepage_layout");
    if (cachedLayout) {
      const parsedLayout =
        typeof cachedLayout === "string"
          ? JSON.parse(cachedLayout)
          : cachedLayout;

      return NextResponse.json({
        success: true,
        data: parsedLayout,
      });
    }

    const layout = await HomepageLayout.findOne()
      .populate("slots.hero_main")
      .populate("slots.hero_sidebar_1")
      .populate("slots.hero_sidebar_2")
      .populate("slots.politics_featured")
      .populate("slots.sports_featured")
      .lean();

    if (!layout?.slots) {
      return NextResponse.json({ success: true, data: EMPTY_LAYOUT });
    }

    await redis.set("cached_homepage_layout", JSON.stringify(layout.slots), {
      ex: 3600,
    });

    return NextResponse.json({ success: true, data: layout.slots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { slots, userId } = body;

    // 1. Upsert (Update or Insert) the layout document configuration
    const updatedLayout = await HomepageLayout.findOneAndUpdate(
      {}, // Empty query targets the single existing config document
      { slots, updatedBy: userId },
      { new: true, upsert: true },
    );

    // 2. Fetch fully populated article data to store in cache
    const populatedLayout = await HomepageLayout.findOne()
      .populate("slots.hero_main")
      .populate("slots.hero_sidebar_1")
      .populate("slots.hero_sidebar_2")
      .populate("slots.politics_featured")
      .populate("slots.sports_featured")
      .lean();

    // 3. Heavy Traffic Shield: Cache the entire dynamic engine directly inside Redis
    await redis.set(
      "cached_homepage_layout",
      JSON.stringify(populatedLayout.slots),
      { ex: 3600 },
    ); // 1 hour TTL backup

    // 4. On-Demand Revalidation: Force Next.js to purge the static homepage asset cache instantly
    revalidatePath("/");

    return NextResponse.json({ success: true, data: updatedLayout.slots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
