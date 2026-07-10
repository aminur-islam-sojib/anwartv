import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/constant/roles";
import Category from "@/Model/Category";
import Article from "@/Model/Article";

// Ensure full Node.js environment to prevent any Edge runtime execution issues
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await connectDB();

    const article = await Article.findById(id)
      .populate("category", "name slug")
      .populate("author", "name image")
      .lean();

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: article },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to load article.",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/articles/[id]
 * সুরক্ষিত আর্টিকেল আপডেট এপিআই (WRITER, EDITOR, ADMIN)
 * এটি সম্পূর্ণ রেস-কন্ডিশন সেফ এবং অটোমেটেড এডিট হিস্ট্রি লগ জেনারেট করে।
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    // 1. Authentication Check
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "অনুগ্রহ করে প্রথমে লগইন করুন।" },
        { status: 401 },
      );
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const body = await req.json();
    const {
      title,
      content,
      category,
      tags,
      coverImage,
      seo,
      status,
      isBreaking,
      isFeatured,
      editNote,
    } = body;

    await connectDB();

    // 2. Fetch target article cleanly
    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json(
        { success: false, message: "আর্টিকেলটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 },
      );
    }

    // 3. Authorization & RBAC Guardrails
    // Writer can only edit their own articles
    if (userRole === ROLES.WRITER && article.author.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "আপনার নিজের আর্টিকেল ছাড়া অন্য কারো আর্টিকেল সম্পাদনা করার অনুমতি নেই।",
        },
        { status: 403 },
      );
    }

    // Preventing Writers from directly publishing an article during update
    if (status === "published" && userRole === ROLES.WRITER) {
      return NextResponse.json(
        {
          success: false,
          message:
            "রাইটার সরাসরি কোনো নিউজ পাবলিশ করতে পারবেন না। এটি রিভিউর (in_review) জন্য পাঠান।",
        },
        { status: 403 },
      );
    }

    // 4. Validate Category change if provided
    if (category && category !== article.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return NextResponse.json(
          {
            success: false,
            message: "নির্বাচিত ক্যাটাগরিটির কোনো অস্তিত্ব নেই।",
          },
          { status: 400 },
        );
      }
      article.category = category;
    }

    // 5. Update permitted fields dynamically
    if (title) article.title = title;
    if (content) article.content = content;
    if (tags) article.tags = tags;
    if (coverImage) article.coverImage = coverImage;
    if (seo) article.seo = seo;
    if (status) article.status = status;

    // Administrative flags protection (Only Admins and Editors can toggle Breaking/Featured)
    if ([ROLES.ADMIN, ROLES.EDITOR].includes(userRole)) {
      if (isBreaking !== undefined) article.isBreaking = isBreaking;
      if (isFeatured !== undefined) article.isFeatured = isFeatured;
    }

    // 6. Track modifications and push to editHistory ecosystem
    const historyEntry = {
      editedBy: userId,
      editedAt: new Date(),
      note:
        editNote ||
        `${userRole === ROLES.WRITER ? "রাইটার" : "এডিটর"} কর্তৃক আর্টিকেলটি সংশোধন করা হয়েছে।`,
    };

    article.editHistory.push(historyEntry);

    // 7. Atomic Save (Fires Mongoose pre-save hook perfectly for readTime & publishedAt)
    await article.save();

    return NextResponse.json(
      {
        success: true,
        message: "আর্টিকেলটি সফলভাবে আপডেট করা হয়েছে।",
        data: { id: article._id, slug: article.slug, status: article.status },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
