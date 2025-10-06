import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Task,
  Project,
  Comment,
  ParsedTask,
  ParsedProject,
  TaskConfiguration,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// With PostgreSQL, JSON fields are handled natively, so no parsing needed
export function parseTask(task: any): ParsedTask {
  return {
    ...task,
    configuration: task.configuration ?? undefined,
  };
}

export function parseProject(project: any): ParsedProject {
  return {
    ...project,
    description: project.description ?? undefined,
    metadata: project.metadata ?? undefined,
  };
}

// Type conversion functions for Prisma operations
export function stringifyTaskData(data: Partial<ParsedTask>): any {
  const { project, assignees, comments, ...taskData } = data;
  return taskData;
}

export function stringifyProjectData(data: Partial<ParsedProject>): any {
  const { owner, tasks, ...projectData } = data;
  return projectData;
}

// Generate unique operation IDs for tracking updates
export function generateOperationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique IDs for database records
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Deep merge utility for updating objects
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(
          (result[key] as Record<string, unknown>) || {},
          source[key] as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

// Calculate task dependencies status
export function getTaskDependencyStatus(
  task: ParsedTask,
  allTasks: ParsedTask[]
): "blocked" | "ready" | "partial" {
  if (task.dependencies.length === 0) return "ready";

  const dependencyTasks = allTasks.filter((t) =>
    task.dependencies.includes(t.id)
  );
  const completedDependencies = dependencyTasks.filter(
    (t) => t.status === "DONE"
  );

  if (completedDependencies.length === task.dependencies.length) return "ready";
  if (completedDependencies.length === 0) return "blocked";
  return "partial";
}

// Format timestamps for display
export function formatTimestamp(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  const diff = now.getTime() - dateObj.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// Priority color mapping
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "text-red-600 bg-red-50";
    case "HIGH":
      return "text-orange-600 bg-orange-50";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-50";
    case "LOW":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

// Status color mapping
export function getStatusColor(status: string): string {
  switch (status) {
    case "TODO":
      return "text-gray-600 bg-gray-50";
    case "IN_PROGRESS":
      return "text-blue-600 bg-blue-50";
    case "IN_REVIEW":
      return "text-purple-600 bg-purple-50";
    case "DONE":
      return "text-green-600 bg-green-50";
    case "BLOCKED":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

// Debounce utility for real-time updates
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for rate limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
