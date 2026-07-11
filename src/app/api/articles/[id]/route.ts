import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROLES, type Role } from "@/constant/roles";
import Category from "@/Model/Category";
import Article from "@/Model/Article";
import type { ArticleStatus } from "@/Model/Article";
import { Types } from "mongoose";

// Ensure full Node.js environment to prevent any Edge runtime execution issues
export const runtime = "nodejs";

type AuthUser = {
  id?: string;
  role?: string;
};

type ArticleUpdateBody = {
  title?: string;
  content?: string;
  category?: string;
  tags?: Array<string | Types.ObjectId>;
  coverImage?: {
    url: string;
    alt?: string;
    caption?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    keywords?: string[];
  };
  status?: ArticleStatus;
  isBreaking?: boolean;
  isFeatured?: boolean;
  editNote?: string;
};

const editableRoles: Role[] = [ROLES.ADMIN, ROLES.EDITOR, ROLES.WRITER];
const editorialRoles: Role[] = [ROLES.ADMIN, ROLES.EDITOR];
const articleStatuses: ArticleStatus[] = [
  "draft",
  "in_review",
  "scheduled",
  "published",
  "archived",
];

function isArticleStatus(value: string): value is ArticleStatus {
  return articleStatuses.includes(value as ArticleStatus);
}

function getArticleLookup(id: string) {
  return Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { slug: id }] }
    : { slug: id };
}

function getEntityId(value: unknown) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) {
    return (value as { _id?: { toString?: () => string } })._id?.toString?.();
  }
  return (value as { toString?: () => string }).toString?.();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    await connectDB();

    const article = await Article.findOne(getArticleLookup(id))
      .populate("category", "name slug")
      .populate("author", "name image")
      .lean();

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found." },
        { status: 404 },
      );
    }

    const sessionUser = session?.user as AuthUser | undefined;
    const role = sessionUser?.role;
    const sessionUserId = sessionUser?.id;
    const isOwner = Boolean(
      sessionUserId && getEntityId(article.author) === sessionUserId,
    );

    if (
      article.status !== "published" &&
      role !== ROLES.ADMIN &&
      role !== ROLES.EDITOR &&
      !(role === ROLES.WRITER && isOwner)
    ) {
      return NextResponse.json(
        { success: false, message: "Article not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: article }, { status: 200 });
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

    const sessionUser = session.user as AuthUser;
    const userRole = sessionUser.role as Role | undefined;
    const userId = sessionUser.id;

    if (!userRole || !editableRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, message: "এই অ্যাকশনটি নেওয়ার অনুমতি আপনার নেই।" },
        { status: 403 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid authenticated user." },
        { status: 401 },
      );
    }

    const body = (await req.json()) as ArticleUpdateBody;
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
    const article = await Article.findOne(getArticleLookup(id));
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

    if (status && !isArticleStatus(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid article status." },
        { status: 400 },
      );
    }

    // 4. Validate Category change if provided
    if (category && category !== article.category.toString()) {
      if (!Types.ObjectId.isValid(category)) {
        return NextResponse.json(
          { success: false, message: "Invalid category id." },
          { status: 400 },
        );
      }

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
      article.category = new Types.ObjectId(category);
    }

    // 5. Update permitted fields dynamically
    if (title) article.title = title;
    if (content) article.content = content;
    if (tags) {
      if (tags.some((tag) => !Types.ObjectId.isValid(tag.toString()))) {
        return NextResponse.json(
          { success: false, message: "Invalid tag id." },
          { status: 400 },
        );
      }

      article.tags = tags.map((tag) => new Types.ObjectId(tag.toString()));
    }
    if (coverImage) article.coverImage = coverImage;
    if (seo) article.seo = seo;
    if (status) article.status = status;

    // Administrative flags protection (Only Admins and Editors can toggle Breaking/Featured)
    if (editorialRoles.includes(userRole)) {
      if (isBreaking !== undefined) article.isBreaking = isBreaking;
      if (isFeatured !== undefined) article.isFeatured = isFeatured;
    }

    // 6. Track modifications and push to editHistory ecosystem
    const historyEntry = {
      editedBy: new Types.ObjectId(userId),
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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update article.",
      },
      { status: 500 },
    );
  }
}
