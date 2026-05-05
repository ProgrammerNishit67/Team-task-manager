import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { projectSchema, validate } from "@/lib/validations";

// GET /api/projects — List projects (filtered by membership for members)
export async function GET(request) {
  try {
    const result = await requireAuth(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await dbConnect();

    let query = {};
    // Members only see projects they belong to
    if (result.user.role !== "admin") {
      query = {
        $or: [
          { owner: result.user.userId },
          { teamMembers: result.user.userId },
        ],
      };
    }

    const projects = await Project.find(query)
      .populate("owner", "name email")
      .populate("teamMembers", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ projects });
  } catch (err) {
    console.error("Get projects error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects — Create project (admin only)
export async function POST(request) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { data, error, status } = validate(projectSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    await dbConnect();

    const project = await Project.create({
      ...data,
      owner: result.user.userId,
      teamMembers: [result.user.userId], // Owner is auto-added
    });

    const populated = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("teamMembers", "name email");

    return NextResponse.json({ project: populated }, { status: 201 });
  } catch (err) {
    console.error("Create project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
