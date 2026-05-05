"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

export default function TaskDetailPage({ params }) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Task not found");
        throw new Error("Failed to load task details");
      }
      const data = await res.json();
      setTask(data.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && taskId) {
      fetchTask();
    }
  }, [user, taskId]);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      
      setTask(data.task);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      router.push("/dashboard/tasks");
    } catch (err) {
      alert(err.message);
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!task) return null;

  const canEditTask = user?.role === "admin";
  const canUpdateStatus = canEditTask || task.assignedTo?._id === user?.id;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="px-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span className="sr-only">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
            {task.isOverdue && <Badge variant="danger">Overdue</Badge>}
          </div>
        </div>
        {canEditTask && (
          <Button variant="danger" onClick={handleDeleteTask} disabled={isUpdating}>
            Delete Task
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Status</p>
                {canUpdateStatus ? (
                  <Select
                    options={[
                      { label: "Pending", value: "pending" },
                      { label: "In Progress", value: "in-progress" },
                      { label: "Completed", value: "completed" },
                    ]}
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isUpdating}
                  />
                ) : (
                  <Badge variant={task.status}>{task.status.replace("-", " ")}</Badge>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Project</p>
                <Link href={`/dashboard/projects/${task.project._id}`} className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                  {task.project.name}
                </Link>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Assigned To</p>
                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-zinc-500 italic">Unassigned</span>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Priority</p>
                <Badge variant={task.priority === "high" ? "danger" : task.priority === "medium" ? "warning" : "default"}>
                  {task.priority}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Due Date</p>
                {task.deadline ? (
                  <p className={`font-medium ${task.isOverdue ? "text-red-600 dark:text-red-400" : ""}`}>
                    {new Date(task.deadline).toLocaleDateString()}
                  </p>
                ) : (
                  <span className="text-zinc-500 italic">No deadline</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
