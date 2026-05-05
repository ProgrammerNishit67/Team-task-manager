import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { taskSchema, validate } from "@/lib/validations";

// GET /api/tasks — List tasks (with filters)
export async function GET(request) {
  try {
    const result = await requireAuth(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const project = searchParams.get("project");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");

    let query = {};

    // Members only see their own tasks
    if (result.user.role !== "admin") {
      query.assignedTo = result.user.userId;
    }

    // Apply filters
    if (status) query.status = status;
    if (project) query.project = project;
    if (assignedTo && result.user.role === "admin") query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("project", "name")
      .sort({ deadline: 1, createdAt: -1 });

    // Add isOverdue to response
    const tasksWithOverdue = tasks.map((task) => {
      const t = task.toObject();
      t.isOverdue =
        task.deadline &&
        task.status !== "completed" &&
        new Date(task.deadline) < new Date();
      return t;
    });

    return NextResponse.json({ tasks: tasksWithOverdue });
  } catch (err) {
    console.error("Get tasks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks — Create task (admin only)
export async function POST(request) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { data, error, status } = validate(taskSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    await dbConnect();

    // Verify project exists
    const project = await Project.findById(data.project);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const task = await Task.create({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : null,
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("project", "name");

    return NextResponse.json({ task: populated }, { status: 201 });
  } catch (err) {
    console.error("Create task error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
