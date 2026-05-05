import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

// POST /api/projects/[id]/members — Add member to project
export async function POST(request, { params }) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await dbConnect();

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if already a member
    if (project.teamMembers.includes(userId)) {
      return NextResponse.json({ error: "User is already a team member" }, { status: 409 });
    }

    project.teamMembers.push(userId);
    await project.save();

    const populated = await Project.findById(id)
      .populate("owner", "name email")
      .populate("teamMembers", "name email");

    return NextResponse.json({ project: populated });
  } catch (err) {
    console.error("Add member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members — Remove member from project
export async function DELETE(request, { params }) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await dbConnect();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Can't remove the owner
    if (project.owner.toString() === userId) {
      return NextResponse.json({ error: "Cannot remove the project owner" }, { status: 400 });
    }

    project.teamMembers = project.teamMembers.filter(
      (m) => m.toString() !== userId
    );
    await project.save();

    const populated = await Project.findById(id)
      .populate("owner", "name email")
      .populate("teamMembers", "name email");

    return NextResponse.json({ project: populated });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
