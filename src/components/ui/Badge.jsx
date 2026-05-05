import React from "react";

export function Badge({ children, variant = "default", className = "" }) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    default:
      "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
    primary:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    // Task specific statuses
    pending:
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
    "in-progress":
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    // Priorities
    low: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
    medium:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };

  const combinedStyles = `${baseStyles} ${variants[variant] || variants.default} ${className}`;

  return <div className={combinedStyles}>{children}</div>;
}
