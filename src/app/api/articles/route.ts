import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { NextRequest } from "next/server";
import { ROLES } from "@/constant/roles";
import Article from "@/Model/Article";

export async function POST(request: NextRequest) {
  const { session, error } = await requireRole([
    ROLES.ADMIN,
    ROLES.EDITOR,
    ROLES.WRITER,
  ]);
  if (error) return error;

  await connectDB();
  const body = await request.json();

  const article = await Article.create({
    ...body,
    author: session!.user.id,
  });

  return Response.json({ success: true, data: article }, { status: 201 });
}

export async function GET() {
  await connectDB();
  const articles = await Article.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(20);

  return Response.json({ success: true, data: articles });
}
