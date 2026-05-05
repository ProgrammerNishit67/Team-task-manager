import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAuth, requireAdmin } from "@/lib/auth";

// GET /api/users — List all users (admin sees all, members see basic list)
export async function GET(request) {
  try {
    const result = await requireAuth(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await dbConnect();
    const users = await User.find({}).select("name email role createdAt").sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Get users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/users — Update user role (admin only)
export async function PUT(request) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { userId, role } = await request.json();

    if (!userId || !role || !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Valid userId and role (admin/member) are required" },
        { status: 400 }
      );
    }

    // Can't change own role
    if (userId === result.user.userId) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("name email role");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
