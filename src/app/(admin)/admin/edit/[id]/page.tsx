import ArticleForm from "@/components/admin/ArticleForm";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Article from "@/Model/Article";
import Category from "@/Model/Category";
import { ROLES } from "@/constant/roles";
import { notFound } from "next/navigation";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;
  const session = await auth();

  await connectDB();

  // Keep Category registered so populated article data is stable in Mongoose.
  void Category;

  const article = await Article.findById(id)
    .populate("category", "name slug")
    .lean();

  if (!article) {
    notFound();
  }

  const role = (session?.user as any)?.role as string | undefined;
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  const articleAuthorId =
    (article as any).author?._id?.toString?.() ||
    (article as any).author?.toString?.();

  if (
    role === ROLES.WRITER &&
    sessionUserId &&
    articleAuthorId !== sessionUserId
  ) {
    notFound();
  }

  const initialData = JSON.parse(JSON.stringify(article));

  return <ArticleForm initialData={initialData} />;
}
