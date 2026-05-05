"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let url = "/api/tasks?";
      if (statusFilter) url += `status=${statusFilter}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Small debounce for search
      const timeoutId = setTimeout(() => {
        fetchTasks();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [user, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-zinc-500 mt-1">
            {user?.role === "admin" ? "Manage all tasks across all projects." : "Manage your assigned tasks."}
          </p>
        </div>
        {user?.role === "admin" && (
          <Link href="/dashboard/tasks/new">
            <Button>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Task
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { label: "All Statuses", value: "" },
                  { label: "Pending", value: "pending" },
                  { label: "In Progress", value: "in-progress" },
                  { label: "Completed", value: "completed" },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex py-12 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-zinc-300 mb-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No tasks found</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {searchQuery || statusFilter ? "Try adjusting your filters." : "You have no assigned tasks yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Task</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Project</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Assigned To</th>
                      <th className="px-4 py-3 font-medium">Due Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{task.title}</p>
                          <div className="flex gap-2 mt-1 md:hidden text-xs text-zinc-500">
                            <span className="line-clamp-1">{task.project?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Link href={`/dashboard/projects/${task.project?._id}`} className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                            {task.project?.name || "Unknown"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {task.assignedTo ? (
                            <span className="text-zinc-600 dark:text-zinc-400">{task.assignedTo.name}</span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {task.deadline ? (
                            <span className={`text-sm ${task.isOverdue ? "text-red-600 font-medium dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 italic">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={task.status}>{task.status.replace("-", " ")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/dashboard/tasks/${task._id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
