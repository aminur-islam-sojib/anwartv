import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Article from "@/Model/Article";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const breakingNews = await Article.findOne({
      status: "published",
      isBreaking: true,
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .select("title slug")
      .lean();

    return NextResponse.json({
      success: true,
      data: breakingNews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
