"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project") || "";
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId);
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState("");

  // Only admins can create tasks
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard/tasks");
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/users")
        ]);
        
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects || []);
        }
        
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch form data:", err);
      } finally {
        setIsFetchingData(false);
      }
    }
    
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!projectId) {
      setError("Please select a project");
      setIsLoading(false);
      return;
    }

    try {
      const taskData = {
        title,
        description,
        project: projectId,
        priority,
        status: "pending"
      };

      if (assignedTo) taskData.assignedTo = assignedTo;
      if (deadline) taskData.deadline = deadline;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      router.push(`/dashboard/tasks/${data.task._id}`);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex py-12 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const projectOptions = [
    { label: "Select a project...", value: "" },
    ...projects.map(p => ({ label: p.name, value: p._id }))
  ];

  const userOptions = [
    { label: "Unassigned", value: "" },
    ...users.map(u => ({ label: u.name, value: u._id }))
  ];

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Task Details</CardTitle>
        <CardDescription>Create a new task and assign it to a team member.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}
        
        <Input
          label="Task Title"
          id="title"
          placeholder="e.g. Update homepage hero section"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="flex w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-zinc-700 dark:text-zinc-50 dark:focus:ring-indigo-500"
            placeholder="Provide task details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Project"
            id="project"
            required
            options={projectOptions}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
          
          <Select
            label="Assign To"
            id="assignedTo"
            options={userOptions}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Priority"
            id="priority"
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ]}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          
          <Input
            label="Due Date"
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create Task
        </Button>
      </CardFooter>
    </form>
  );
}

export default function NewTaskPage() {
  const router = useRouter();
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="px-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Task</h1>
      </div>

      <Card>
        <Suspense fallback={<div className="p-12 flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div></div>}>
          <NewTaskForm />
        </Suspense>
      </Card>
    </div>
  );
}
