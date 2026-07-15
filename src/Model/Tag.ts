import mongoose, { Schema, Model, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
  },
  { timestamps: true },
);

const Tag: Model<ITag> =
  mongoose.models.Tag || mongoose.model<ITag>("Tag", tagSchema);

export default Tag;
