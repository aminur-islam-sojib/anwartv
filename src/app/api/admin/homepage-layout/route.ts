import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import HomepageLayout from "@/Model/HomepageLayout";
import { connectDB } from "@/lib/db";
import redis from "@/lib/redis";
import { ROLES } from "@/constant/roles";

const EMPTY_LAYOUT = {
  hero_main: null,
  hero_sidebar_1: null,
  hero_sidebar_2: null,
  politics_featured: null,
  sports_featured: null,
};

// GET remains public for standard frontend users loading the landing page layout
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

// PUT is securely wrapped using NextAuth auth()
export const PUT = auth(async function PUT(req) {
  // 1. Check if user is authenticated
  if (!req.auth || !req.auth.user) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  // 2. Enforce Role Validation (Only Admin and Editor can curate layout)
  const userRole = req.auth.user.role;
  if (userRole !== ROLES.ADMIN && userRole !== ROLES.EDITOR) {
    return NextResponse.json(
      { success: false, message: "Forbidden: Insufficient permissions." },
      { status: 403 },
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const { slots } = body;

    // Securely pull the authenticated user's ID from session token instead of body payload
    const userId = req.auth.user.id;

    // 3. Upsert (Update or Insert) the layout document configuration
    const updatedLayout = await HomepageLayout.findOneAndUpdate(
      {}, // Single document tracking active configuration
      { slots, updatedBy: userId },
      { new: true, upsert: true },
    );

    // 4. Fetch fully populated article data to store in cache
    const populatedLayout = await HomepageLayout.findOne()
      .populate("slots.hero_main")
      .populate("slots.hero_sidebar_1")
      .populate("slots.hero_sidebar_2")
      .populate("slots.politics_featured")
      .populate("slots.sports_featured")
      .lean();

    // 5. Heavy Traffic Shield: Cache configuration inside Redis
    await redis.set(
      "cached_homepage_layout",
      JSON.stringify(populatedLayout.slots),
      { ex: 3600 },
    );

    // 6. On-Demand Revalidation: Force Next.js to clear static asset caches instantly
    revalidatePath("/");

    return NextResponse.json({ success: true, data: updatedLayout.slots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
});
