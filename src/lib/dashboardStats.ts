import { connectDB } from "@/lib/db";
import Article from "@/Model/Article";
import Category from "@/Model/Category";
import User from "@/Model/User";

export type PipelineStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";

const STATUS_LABELS: Record<PipelineStatus, string> = {
  draft: "ড্রাফট",
  in_review: "পর্যালোচনায়",
  scheduled: "শিডিউলড",
  published: "প্রকাশিত",
  archived: "আর্কাইভড",
};

export interface DashboardStats {
  totalArticles: number;
  totalUsers: number;
  pipeline: { status: PipelineStatus; label: string; count: number }[];
  categoryDistribution: { name: string; count: number }[];
  recentActivity: {
    articleId: string; // <-- Added here
    articleTitle: string;
    articleSlug: string;
    editorName: string;
    editedAt: string;
    note: string;
  }[];
  breakingNews: { _id: string; title: string; slug: string }[];
  featuredNews: { _id: string; title: string; slug: string }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();

  // Force-register referenced models for aggregate $lookup stability
  void Category;
  void User;

  const [
    totalArticles,
    totalUsers,
    statusCountsRaw,
    categoryDistributionRaw,
    recentActivityRaw,
    breakingNews,
    featuredNews,
  ] = await Promise.all([
    Article.countDocuments(),
    User.countDocuments(),
    Article.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      { $project: { name: "$categoryInfo.name", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Article.aggregate([
      { $unwind: "$editHistory" },
      { $sort: { "editHistory.editedAt": -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "users",
          localField: "editHistory.editedBy",
          foreignField: "_id",
          as: "editorInfo",
        },
      },
      { $unwind: { path: "$editorInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          articleId: { $toString: "$_id" }, // <-- Converts ObjectId to String for safer client serialization
          articleTitle: "$title",
          articleSlug: "$slug",
          editedAt: "$editHistory.editedAt",
          note: "$editHistory.note",
          editorName: { $ifNull: ["$editorInfo.name", "অজানা"] },
        },
      },
    ]),
    Article.find({ isBreaking: true, status: "published" })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select("title slug")
      .lean(),
    Article.find({ isFeatured: true, status: "published" })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select("title slug")
      .lean(),
  ]);

  // Normalize status counts so every status shows even if count is 0
  const statusMap = new Map<string, number>(
    statusCountsRaw.map((s: any) => [s._id, s.count]),
  );
  const pipeline = (
    ["draft", "in_review", "scheduled", "published", "archived"] as PipelineStatus[]
  ).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: statusMap.get(status) || 0,
  }));

  return {
    totalArticles,
    totalUsers,
    pipeline,
    categoryDistribution: categoryDistributionRaw,
    recentActivity: JSON.parse(JSON.stringify(recentActivityRaw)),
    breakingNews: JSON.parse(JSON.stringify(breakingNews)),
    featuredNews: JSON.parse(JSON.stringify(featuredNews)),
  };
}