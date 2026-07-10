import { connectDB } from "@/lib/db";
import User from "@/Model/User";
import { ROLES } from "@/constant/roles";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  await connectDB();
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return Response.json(
      { success: false, message: "Missing required fields" },
      { status: 400 },
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return Response.json(
      { success: false, message: "User already exists" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const isFirstUser = (await User.countDocuments({})) === 0;

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: isFirstUser ? ROLES.ADMIN : ROLES.READER,
  });

  return Response.json(
    {
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    { status: 201 },
  );
}
