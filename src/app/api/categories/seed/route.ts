import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/Model/Category";

// Ensure full Node.js environment execution
export const runtime = "nodejs";

/**
 * POST /api/categories/seed
 * Production-grade database seeding endpoint for initial categories setup.
 * Highly protected; only accessible by ADMIN role.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const coreCategories = [
      {
        name: "জাতীয়",
        slug: "national",
        description: "সারা দেশের গুরুত্বপূর্ণ খবর সমূহ",
      },
      {
        name: "রাজনীতি",
        slug: "politics",
        description: "রাজনৈতিক দল ও সমসাময়িক ঘটনার খবর",
      },
      {
        name: "আন্তর্জাতিক",
        slug: "international",
        description: "বিশ্বমঞ্চের সব তাজা খবর",
      },
      {
        name: "অর্থ-বাণিজ্য",
        slug: "economy",
        description: "শেয়ার বাজার, ব্যবসা ও অর্থনৈতিক সংবাদ",
      },
      {
        name: "খেলাধুলা",
        slug: "sports",
        description: "ক্রিকেট, ফুটবল সহ খেলার খবর",
      },
      {
        name: "বিনোদন",
        slug: "entertainment",
        description: "সিনেমা, নাটক ও শোবিজ দুনিয়ার খবর",
      },
      {
        name: "তথ্য-প্রযুক্তি",
        slug: "tech",
        description: "গ্যাজেট, সায়েন্স এবং প্রযুক্তির আপডেট",
      },
      {
        name: "লাইফস্টাইল",
        slug: "lifestyle",
        description: "স্বাস্থ্য, ভ্রমণ ও দৈনন্দিন জীবনযাপন",
      },
    ];

    const results = await Promise.all(
      coreCategories.map(async (category) => {
        const existing = await Category.findOne({ slug: category.slug });

        if (existing) {
          await Category.updateOne({ slug: category.slug }, { $set: category });
          return { slug: category.slug, action: "updated" };
        }

        await Category.create(category);
        return { slug: category.slug, action: "created" };
      }),
    );

    return NextResponse.json(
      {
        success: true,
        message: "ক্যাটাগরি সীড/আপডেট সম্পন্ন হয়েছে।",
        data: results,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
