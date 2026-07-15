import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/constant/roles";
import Category from "@/Model/Category";
import Article from "@/Model/Article";
import { Types } from "mongoose";

export const runtime = "nodejs";

type AuthUser = {
  id?: string;
  role?: string;
};

/**
 * PATCH /api/categories/[id]
 * ক্যাটাগরি আপডেট (নাম, স্ল্যাগ, বিবরণ, প্যারেন্ট, স্ট্যাটাস)
 * শুধুমাত্র admin/editor
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const sessionUser = session?.user as AuthUser | undefined;
    const role = sessionUser?.role;

    if (!session || !role || ![ROLES.ADMIN, ROLES.EDITOR].includes(role as any)) {
      return NextResponse.json(
        { success: false, message: "এই অ্যাকশনটি নেওয়ার অনুমতি আপনার নেই।" },
        { status: 403 },
      );
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "অবৈধ ক্যাটাগরি আইডি।" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, slug, description, parentCategory, isActive } = body;

    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 },
      );
    }

    // Slug uniqueness check (if changing)
    if (slug && slug.toLowerCase() !== category.slug) {
      const slugExists = await Category.findOne({
        slug: slug.toLowerCase(),
        _id: { $ne: id },
      });
      if (slugExists) {
        return NextResponse.json(
          { success: false, message: "এই স্ল্যাগটি ইতিমধ্যে ব্যবহার করা হয়েছে।" },
          { status: 400 },
        );
      }
      category.slug = slug.toLowerCase();
    }

    // parentCategory validation — same rules as create
    if (parentCategory !== undefined) {
      if (parentCategory === null) {
        // Explicitly making this a top-level category.
        // But if it currently HAS subcategories, that's fine — a top-level
        // category can freely have children. No extra check needed here.
        category.parentCategory = null;
      } else {
        if (!Types.ObjectId.isValid(parentCategory)) {
          return NextResponse.json(
            { success: false, message: "অবৈধ প্যারেন্ট ক্যাটাগরি আইডি।" },
            { status: 400 },
          );
        }

        if (parentCategory === id) {
          return NextResponse.json(
            { success: false, message: "একটি ক্যাটাগরি নিজের প্যারেন্ট হতে পারে না।" },
            { status: 400 },
          );
        }

        const parentDoc = await Category.findById(parentCategory);
        if (!parentDoc) {
          return NextResponse.json(
            { success: false, message: "নির্বাচিত প্যারেন্ট ক্যাটাগরিটির অস্তিত্ব নেই।" },
            { status: 400 },
          );
        }

        if (parentDoc.parentCategory) {
          return NextResponse.json(
            {
              success: false,
              message:
                "একটি সাব-ক্যাটাগরির অধীনে আরেকটি সাব-ক্যাটাগরি তৈরি করা যাবে না।",
            },
            { status: 400 },
          );
        }

        // Prevent making a category a child of one of ITS OWN subcategories
        // (would only matter if this category currently has children, but
        // guarding here keeps the invariant airtight regardless of order of ops).
        const hasChildren = await Category.exists({ parentCategory: id });
        if (hasChildren) {
          return NextResponse.json(
            {
              success: false,
              message:
                "যে ক্যাটাগরির অধীনে সাব-ক্যাটাগরি আছে, সেটিকে অন্য কোনো ক্যাটাগরির সাব-ক্যাটাগরি বানানো যাবে না।",
            },
            { status: 400 },
          );
        }

        category.parentCategory = parentDoc._id;
      }
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return NextResponse.json(
      { success: true, data: category },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * ক্যাটাগরি ডিলিট — যদি আর্টিকেল/সাব-ক্যাটাগরি থাকে, তাহলে reassignTo আবশ্যক
 * শুধুমাত্র admin
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const sessionUser = session?.user as AuthUser | undefined;
    const role = sessionUser?.role;

    if (!session || role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "শুধুমাত্র অ্যাডমিন ক্যাটাগরি ডিলিট করতে পারবেন।" },
        { status: 403 },
      );
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "অবৈধ ক্যাটাগরি আইডি।" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const reassignTo = searchParams.get("reassignTo");

    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 },
      );
    }

    const [articleCount, subCategoryCount] = await Promise.all([
      Article.countDocuments({ category: id }),
      Category.countDocuments({ parentCategory: id }),
    ]);

    const isInUse = articleCount > 0 || subCategoryCount > 0;

    if (isInUse && !reassignTo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "এই ক্যাটাগরিতে আর্টিকেল বা সাব-ক্যাটাগরি রয়েছে। ডিলিট করতে হলে reassignTo প্যারামিটারে নতুন ক্যাটাগরি আইডি দিন।",
          meta: { articleCount, subCategoryCount },
        },
        { status: 409 },
      );
    }

    if (isInUse && reassignTo) {
      if (!Types.ObjectId.isValid(reassignTo)) {
        return NextResponse.json(
          { success: false, message: "অবৈধ reassignTo ক্যাটাগরি আইডি।" },
          { status: 400 },
        );
      }

      if (reassignTo === id) {
        return NextResponse.json(
          { success: false, message: "একই ক্যাটাগরিতে রিঅ্যাসাইন করা যাবে না।" },
          { status: 400 },
        );
      }

      const targetCategory = await Category.findById(reassignTo);
      if (!targetCategory) {
        return NextResponse.json(
          { success: false, message: "রিঅ্যাসাইন করার জন্য নির্বাচিত ক্যাটাগরিটির অস্তিত্ব নেই।" },
          { status: 400 },
        );
      }

      // Move all articles currently under the deleted category to the target.
      if (articleCount > 0) {
        await Article.updateMany({ category: id }, { category: reassignTo });
      }

      // Move subcategories too — but only if the target is itself top-level
      // (a subcategory can't become the parent of another subcategory).
      if (subCategoryCount > 0) {
        if (targetCategory.parentCategory) {
          return NextResponse.json(
            {
              success: false,
              message:
                "এই ক্যাটাগরির সাব-ক্যাটাগরি আছে, তাই রিঅ্যাসাইন করার জন্য একটি মূল (top-level) ক্যাটাগরি নির্বাচন করুন।",
            },
            { status: 400 },
          );
        }
        await Category.updateMany(
          { parentCategory: id },
          { parentCategory: reassignTo },
        );
      }
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: isInUse
          ? "ক্যাটাগরিটি ডিলিট করা হয়েছে এবং সংশ্লিষ্ট আর্টিকেল/সাব-ক্যাটাগরি রিঅ্যাসাইন করা হয়েছে।"
          : "ক্যাটাগরিটি সফলভাবে ডিলিট করা হয়েছে।",
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