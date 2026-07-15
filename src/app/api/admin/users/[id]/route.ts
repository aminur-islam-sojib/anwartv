import { NextResponse } from "next/server";
import { ROLES, type Role } from "@/constant/roles";
import User, { type AccountStatus } from "@/Model/User";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

const VALID_ROLES = Object.values(ROLES);
const VALID_STATUSES: AccountStatus[] = ["active", "inactive", "suspended"];

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

  if (session.user.role !== ROLES.ADMIN) {
    return {
      error: NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { session };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const sessionUserId = authResult.session.user.id;

    if (id === sessionUserId) {
      return NextResponse.json(
        { success: false, message: "You cannot modify your own account." },
        { status: 400 },
      );
    }

    const body = (await req.json()) as {
      role?: Role;
      status?: AccountStatus;
    };

    const updates: {
      role?: Role;
      accountStatus?: AccountStatus;
      isActive?: boolean;
    } = {};

    if (body.role) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json(
          { success: false, message: "Invalid role." },
          { status: 400 },
        );
      }
      updates.role = body.role;
    }

    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { success: false, message: "Invalid account status." },
          { status: 400 },
        );
      }
      updates.accountStatus = body.status;
      updates.isActive = body.status === "active";
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { success: false, message: "No valid updates were provided." },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .select("name email role accountStatus isActive isVerified avatar createdAt updatedAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.accountStatus || (user.isActive ? "active" : "inactive"),
        isVerified: Boolean(user.isVerified),
        avatar: user.avatar || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update user.",
      },
      { status: 500 },
    );
  }
}
