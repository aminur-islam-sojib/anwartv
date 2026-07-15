import { Role, ROLES } from "@/constant/roles";
import mongoose, { Schema, Model, Document } from "mongoose";

export type AccountStatus = "active" | "inactive" | "suspended";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  accountStatus: AccountStatus;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.READER,
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },
    avatar: String,
    bio: String,
    isVerified: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

userSchema.index({ name: "text", email: "text" });
userSchema.index({ role: 1, accountStatus: 1, createdAt: -1 });
userSchema.index({ email: 1, role: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
