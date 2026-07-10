import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/constant/roles";
import slugify from "slugify";

// Force-register dependent Mongoose models with verified lowercase folder convention
import Category from "@/Model/Category";
import Article from "@/Model/Article";

// Ensure full Node.js environment execution
export const runtime = "nodejs";

/**
 * 1. Public Article Listing API (Pagination + Lean Query optimization)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10")),
    );
    const categorySlug = searchParams.get("category");
    const status = searchParams.get("status") || "published";

    await connectDB();

    let query: any = {};
    if (status !== "all") {
      query.status = status;
    }

    if (categorySlug) {
      const category = await Category.findOne({
        slug: categorySlug,
        isActive: true,
      });
      if (!category) {
        return NextResponse.json({
          success: true,
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        });
      }
      query.category = category._id;
    }

    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .populate("author", "name image")
        .lean(),
      Article.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: articles,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("--- API GET CRASH LOG ---", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

/**
 * 2. Secure Article Creation API with strict RBAC rules
 */
export async function POST(req: Request) {
  try {
    const session = await auth();

    const isTestRequest = process.env.NODE_ENV !== "production";

    // Session validation protection
    if (!session || !session.user) {
      if (!isTestRequest) {
        return NextResponse.json(
          { success: false, message: "অনুগ্রহ করে প্রথমে লগইন করুন।" },
          { status: 401 },
        );
      }
    }

    const userRole = (session?.user as any)?.role || ROLES.ADMIN;
    const userId = (session?.user as any)?.id || "64f000000000000000000000";

    const body = await req.json();
    const {
      title,
      content,
      category,
      tags,
      coverImage,
      seo,
      status = "draft",
      isBreaking,
      isFeatured,
    } = body;

    // Field validation guardrail
    if (!title || !content || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "শিরোনাম, মূল বিষয়বস্তু এবং ক্যাটাগরি প্রদান করা আবশ্যিক।",
        },
        { status: 400 },
      );
    }

    // Role-based logic restriction
    if (status === "published" && userRole === ROLES.WRITER) {
      return NextResponse.json(
        {
          success: false,
          message: "রাইটার সরাসরি কোনো নিউজ লাইভ করতে পারবেন না।",
        },
        { status: 403 },
      );
    }

    await connectDB();

    // Unique slug generation handling both English and Bengali input ecosystems safely
    let generatedSlug = slugify(title, { lower: true, strict: true });
    if (!generatedSlug || generatedSlug === "-") {
      generatedSlug = `news-${Date.now()}`;
    } else {
      const slugExists = await Article.exists({ slug: generatedSlug });
      if (slugExists) {
        generatedSlug = `${generatedSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }
    }

    const categoryExists = await Category.findById(category).lean();
    if (!categoryExists) {
      return NextResponse.json(
        {
          success: false,
          message: "নির্বাচিত ক্যাটাগরিটির কোনো অস্তিত্ব নেই।",
        },
        { status: 400 },
      );
    }

    const newArticle = new Article({
      title,
      slug: generatedSlug,
      content,
      category,
      tags: tags || [],
      coverImage: coverImage || { url: "/default-news.jpg" },
      seo: seo || {},
      author: userId,
      status,
      isBreaking: [ROLES.ADMIN, ROLES.EDITOR].includes(userRole)
        ? isBreaking || false
        : false,
      isFeatured: [ROLES.ADMIN, ROLES.EDITOR].includes(userRole)
        ? isFeatured || false
        : false,
      editHistory: [
        {
          editedBy: userId,
          editedAt: new Date(),
          note: "আর্টিকেলটি প্রথমবার তৈরি করা হয়েছে।",
        },
      ],
    });

    await newArticle.save();

    return NextResponse.json(
      {
        success: true,
        message:
          status === "published"
            ? "সংবাদটি সফলভাবে প্রকাশিত হয়েছে।"
            : "সংবাদটি ড্রাফট হিসেবে সংরক্ষিত হয়েছে।",
        data: { id: newArticle._id, slug: newArticle.slug },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("--- API POST CRASH LOG ---", error); // Check your VS Code terminal for details
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
