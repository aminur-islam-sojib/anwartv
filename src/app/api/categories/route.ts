import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/constant/roles";
import Category from "@/Model/Category";

// ১. পাবলিকলি সব সক্রিয় ক্যাটাগরি দেখানোর জন্য (হোমপেজ ও হেডারের জন্য)
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({
      name: 1,
    });
    return NextResponse.json(
      { success: true, data: categories },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// ২. নতুন ক্যাটাগরি তৈরি করার জন্য (শুধুমাত্র অ্যাডমিন ও এডিটর পারবেন)
export async function POST(req: Request) {
  try {
    const session = await auth();

    // রোল চেকিং লজিক
    if (
      !session ||
      ![ROLES.ADMIN, ROLES.EDITOR].includes((session.user as any).role)
    ) {
      return NextResponse.json(
        { success: false, message: "এই অ্যাকশনটি নেওয়ার অনুমতি আপনার নেই।" },
        { status: 403 },
      );
    }

    const { name, slug, description } = await req.json();

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: "নাম এবং স্ল্যাগ আবশ্যিক।" },
        { status: 400 },
      );
    }

    await connectDB();

    // স্ল্যাগ ডুপ্লিকেট কিনা চেক
    const exists = await Category.findOne({ slug: slug.toLowerCase() });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "এই স্ল্যাগটি ইতিমধ্যে ব্যবহার করা হয়েছে।" },
        { status: 400 },
      );
    }

    const newCategory = await Category.create({
      name,
      slug: slug.toLowerCase(),
      description,
    });

    return NextResponse.json(
      { success: true, data: newCategory },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
