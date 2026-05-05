import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional().default(""),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(1000).optional().default(""),
  status: z.enum(["pending", "in-progress", "completed"]).optional().default("pending"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  assignedTo: z.string().optional().nullable(),
  project: z.string().min(1, "Project is required"),
  deadline: z.string().optional().nullable(),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
});

/**
 * Validate request body against a Zod schema
 * Returns { data } on success, { error, status } on failure
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(", ");
    return { error: errors, status: 400 };
  }
  return { data: result.data };
}
