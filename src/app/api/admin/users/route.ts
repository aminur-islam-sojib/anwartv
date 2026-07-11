import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { ROLES, type Role } from "@/constant/roles";
import Article from "@/Model/Article";
import User, { type AccountStatus } from "@/Model/User";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

const VALID_ROLES = Object.values(ROLES);
const VALID_STATUSES: AccountStatus[] = ["active", "inactive", "suspended"];

type PublicUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: Role;
  accountStatus?: AccountStatus;
  isActive?: boolean;
  isVerified?: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserListQuery = {
  role?: Role;
  accountStatus?: AccountStatus;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    email?: { $regex: string; $options: string };
  }>;
};

function isAdmin(role?: string) {
  return role === ROLES.ADMIN;
}

function isRole(value: string): value is Role {
  return VALID_ROLES.includes(value as Role);
}

function isAccountStatus(value: string): value is AccountStatus {
  return VALID_STATUSES.includes(value as AccountStatus);
}

function normalizeStatus(user: PublicUser): AccountStatus {
  if (user.accountStatus) return user.accountStatus;
  return user.isActive === false ? "inactive" : "active";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (!isAdmin(session.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { session };
}

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      Math.min(100, Number(searchParams.get("limit") || "20")),
    );
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.toLowerCase();
    const status = searchParams.get("status")?.toLowerCase();

    await connectDB();

    const query: UserListQuery = {};

    if (role && role !== "all" && isRole(role)) {
      query.role = role;
    }

    if (status && status !== "all" && isAccountStatus(status)) {
      query.accountStatus = status;
    }

    if (search) {
      const safeSearch = escapeRegExp(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total, activeWriters, pendingApprovals, suspendedAccounts] =
      await Promise.all([
        User.find(query)
          .select("name email role accountStatus isActive isVerified avatar createdAt updatedAt")
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .lean<PublicUser[]>(),
        User.countDocuments(query),
        User.countDocuments({
          role: ROLES.WRITER,
          accountStatus: "active",
        }),
        User.countDocuments({ accountStatus: "inactive" }),
        User.countDocuments({ accountStatus: "suspended" }),
      ]);

    const userIds = users.map((user) => user._id);
    const articleCounts = userIds.length
      ? await Article.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { author: { $in: userIds } } },
          { $group: { _id: "$author", count: { $sum: 1 } } },
        ])
      : [];

    const articleCountMap = new Map(
      articleCounts.map((item) => [item._id.toString(), item.count]),
    );

    const data = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: normalizeStatus(user),
      isVerified: Boolean(user.isVerified),
      avatar: user.avatar || "",
      articlesCount: articleCountMap.get(user._id.toString()) || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      metrics: {
        totalStaff: await User.countDocuments({
          role: { $in: [ROLES.ADMIN, ROLES.EDITOR, ROLES.WRITER] },
        }),
        activeWriters,
        pendingApprovals,
        suspendedAccounts,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to load users.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const body = (await req.json()) as {
      name?: string;
      email?: string;
      role?: Role;
      password?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const role = body.role || ROLES.WRITER;

    if (!name || !email || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Valid name, email, and role are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.exists({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists." },
        { status: 409 },
      );
    }

    const temporaryPassword =
      body.password && body.password.length >= 8
        ? body.password
        : crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      accountStatus: "active",
      isActive: true,
      isVerified: false,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.accountStatus,
          isVerified: user.isVerified,
          avatar: user.avatar || "",
          articlesCount: 0,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create user.",
      },
      { status: 500 },
    );
  }
}
