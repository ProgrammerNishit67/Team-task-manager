import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { projectSchema, validate } from "@/lib/validations";

// GET /api/projects/[id] — Get project detail
export async function GET(request, { params }) {
  try {
    const result = await requireAuth(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    await dbConnect();

    const project = await Project.findById(id)
      .populate("owner", "name email")
      .populate("teamMembers", "name email");

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access for members
    if (result.user.role !== "admin") {
      const isMember = project.teamMembers.some(
        (m) => m._id.toString() === result.user.userId
      );
      const isOwner = project.owner._id.toString() === result.user.userId;
      if (!isMember && !isOwner) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: id })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ project, tasks });
  } catch (err) {
    console.error("Get project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/projects/[id] — Update project (admin only)
export async function PUT(request, { params }) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { data, error, status } = validate(projectSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    await dbConnect();

    const project = await Project.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "name email")
      .populate("teamMembers", "name email");

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (err) {
    console.error("Update project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id] — Delete project (admin only)
export async function DELETE(request, { params }) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    await dbConnect();

    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Also delete all tasks in this project
    await Task.deleteMany({ project: id });

    return NextResponse.json({ message: "Project and associated tasks deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
