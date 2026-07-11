import ArticleForm from "@/components/admin/ArticleForm";
import { connectDB } from "@/lib/db";
import Article from "@/Model/Article";
import Category from "@/Model/Category";
import { notFound } from "next/navigation";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;
  console.log("id is ", id);

  await connectDB();

  // Keep Category registered so populated article data is stable in Mongoose.
  void Category;

  const article = await Article.findById(id)
    .populate("category", "name slug")
    .lean();

  if (!article) {
    notFound();
  }

  const initialData = JSON.parse(JSON.stringify(article));

  return <ArticleForm initialData={initialData} />;
}
