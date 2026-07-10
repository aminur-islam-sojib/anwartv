import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type ArticleStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";

export interface ICoverImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface ISeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string[];
}

export interface IEditHistoryEntry {
  editedBy: Types.ObjectId;
  editedAt: Date;
  note?: string;
}

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: ICoverImage;

  category: Types.ObjectId;
  tags: Types.ObjectId[];
  author: Types.ObjectId;
  coAuthors: Types.ObjectId[];

  status: ArticleStatus;
  publishedAt?: Date;
  scheduledAt?: Date;

  isBreaking: boolean;
  isFeatured: boolean;

  views: number;
  likes: number;
  shares: number;
  readTime?: number;

  seo?: ISeo;
  relatedArticles: Types.ObjectId[];
  editHistory: IEditHistoryEntry[];

  createdAt: Date;
  updatedAt: Date;
}

const coverImageSchema = new Schema<ICoverImage>(
  {
    url: { type: String, required: true },
    alt: String,
    caption: String,
  },
  { _id: false },
);

const seoSchema = new Schema<ISeo>(
  {
    metaTitle: String,
    metaDescription: String,
    ogImage: String,
    keywords: [String],
  },
  { _id: false },
);

const editHistorySchema = new Schema<IEditHistoryEntry>(
  {
    editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    editedAt: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);

const articleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    excerpt: { type: String, maxlength: 300 },
    content: { type: String, required: true },
    coverImage: coverImageSchema,

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coAuthors: [{ type: Schema.Types.ObjectId, ref: "User" }],

    status: {
      type: String,
      enum: ["draft", "in_review", "scheduled", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, index: true },
    scheduledAt: Date,

    isBreaking: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    readTime: Number,

    seo: seoSchema,
    relatedArticles: [{ type: Schema.Types.ObjectId, ref: "Article" }],
    editHistory: [editHistorySchema],
  },
  { timestamps: true },
);

// Text search index
articleSchema.index({ title: "text", content: "text" });

// Common query pattern: category + latest published first
articleSchema.index({ category: 1, publishedAt: -1 });

// Auto-calculate read time before saving (approx. 200 words/min)
articleSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const plainText = this.content.replace(/<[^>]*>/g, " "); // strip HTML tags
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  // Auto-set publishedAt when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", articleSchema);

export default Article;
