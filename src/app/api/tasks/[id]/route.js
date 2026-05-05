import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { taskUpdateSchema, validate } from "@/lib/validations";

// GET /api/tasks/[id] — Get task detail
export async function GET(request, { params }) {
  try {
    const result = await requireAuth(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    await dbConnect();

    const task = await Task.findById(id)
      .populate("assignedTo", "name email")
      .populate("project", "name");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const t = task.toObject();
    t.isOverdue =
      task.deadline &&
      task.status !== "completed" &&
      new Date(task.deadline) < new Date();

    return NextResponse.json({ task: t });
  } catch (err) {
    console.error("Get task error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tasks/[id] — Update task
export async function PUT(request, { params }) {
  try {
    const result = await requireAuth(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const body = await request.json();

    await dbConnect();

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Members can only update status of their assigned tasks
    if (result.user.role !== "admin") {
      if (existingTask.assignedTo?.toString() !== result.user.userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      // Members can only change status
      const allowedUpdate = { status: body.status };
      const { data, error, status } = validate(taskUpdateSchema, allowedUpdate);
      if (error) {
        return NextResponse.json({ error }, { status });
      }
      const task = await Task.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .populate("assignedTo", "name email")
        .populate("project", "name");

      return NextResponse.json({ task });
    }

    // Admin can update everything
    const { data, error, status } = validate(taskUpdateSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    if (data.deadline) {
      data.deadline = new Date(data.deadline);
    }

    const task = await Task.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", "name email")
      .populate("project", "name");

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Update task error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — Delete task (admin only)
export async function DELETE(request, { params }) {
  try {
    const result = await requireAdmin(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    await dbConnect();

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete task error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
