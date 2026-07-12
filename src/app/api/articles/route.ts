import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/constant/roles";
import slugify from "slugify";
import { resolveTags } from "@/lib/resolveTags";

// Force-register dependent Mongoose models with verified lowercase folder convention
import Category from "@/Model/Category";
import Article from "@/Model/Article";
import Tag from "@/Model/Tag";

// Ensure full Node.js environment execution
export const runtime = "nodejs";

/**
 * 1. Public Article Listing API (Pagination + Lean Query optimization)
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10")),
    );
    const categorySlug = searchParams.get("category");
    const status = searchParams.get("status") || "published";
    const role = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;

    await connectDB();

    let query: any = {};
    if (status === "all") {
      if (role === ROLES.ADMIN || role === ROLES.EDITOR) {
        query.status = {
          $in: ["draft", "in_review", "scheduled", "published", "archived"],
        };
      } else if (role === ROLES.WRITER) {
        query.author = userId;
      } else {
        query.status = "published";
      }
    } else if (status === "published") {
      query.status = "published";
    } else {
      if (role === ROLES.ADMIN || role === ROLES.EDITOR) {
        query.status = status;
      } else if (role === ROLES.WRITER) {
        query.status = status;
        query.author = userId;
      } else {
        query.status = "published";
      }
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
        .populate("tags", "name slug")
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
    const userRole = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;

    if (!session?.user || !userRole || !userId) {
      return NextResponse.json(
        { success: false, message: "অনুগ্রহ করে প্রথমে লগইন করুন।" },
        { status: 401 },
      );
    }

    if (![ROLES.ADMIN, ROLES.EDITOR, ROLES.WRITER].includes(userRole as any)) {
      return NextResponse.json(
        { success: false, message: "এই অ্যাকশনটি নেওয়ার অনুমতি আপনার নেই।" },
        { status: 403 },
      );
    }

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
          message: "শিরোনাম, মূল বিষয়বস্তু এবং ক্যাটাগরি প্রদান করা আবশ্যিক।",
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

    // Resolve raw tag name strings (e.g. ["cricket", "dhaka"]) into real Tag ObjectIds,
    // creating any tags that don't exist yet.
    const tagIds = await resolveTags(tags || []);

    const newArticle = new Article({
      title,
      slug: generatedSlug,
      content,
      category,
      tags: tagIds,
      coverImage: coverImage || { url: "/default-news.jpg" },
      seo: seo || {},
      author: userId,
      status,
      isBreaking: [ROLES.ADMIN, ROLES.EDITOR].includes(userRole as any)
        ? isBreaking || false
        : false,
      isFeatured: [ROLES.ADMIN, ROLES.EDITOR].includes(userRole as any)
        ? isFeatured || false
        : false,
      editHistory: [
        {
          editedBy: userId,
          editedAt: new Date(),
          note: "আর্টিকেলটি প্রথমবার তৈরি করা হয়েছে।",
        },
      ],
    });

    await newArticle.save();

    return NextResponse.json(
      {
        success: true,
        message:
          status === "published"
            ? "সংবাদটি সফলভাবে প্রকাশিত হয়েছে।"
            : "সংবাদটি ড্রাফট হিসেবে সংরক্ষিত হয়েছে।",
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
