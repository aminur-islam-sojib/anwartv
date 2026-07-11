// models/HomepageLayout.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IHomepageLayout extends Document {
  slots: {
    hero_main: mongoose.Types.ObjectId;
    hero_sidebar_1: mongoose.Types.ObjectId;
    hero_sidebar_2: mongoose.Types.ObjectId;
    politics_featured: mongoose.Types.ObjectId;
    sports_featured: mongoose.Types.ObjectId;
  };
  updatedAt: Date;
  updatedBy: string;
}

const HomepageLayoutSchema = new Schema<IHomepageLayout>(
  {
    slots: {
      hero_main: {
        type: Schema.Types.ObjectId,
        ref: "Article",
        required: true,
      },
      hero_sidebar_1: {
        type: Schema.Types.ObjectId,
        ref: "Article",
        required: true,
      },
      hero_sidebar_2: {
        type: Schema.Types.ObjectId,
        ref: "Article",
        required: true,
      },
      politics_featured: {
        type: Schema.Types.ObjectId,
        ref: "Article",
        required: true,
      },
      sports_featured: {
        type: Schema.Types.ObjectId,
        ref: "Article",
        required: true,
      },
    },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.HomepageLayout ||
  mongoose.model<IHomepageLayout>("HomepageLayout", HomepageLayoutSchema);
