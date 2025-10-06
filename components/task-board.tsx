"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useAppStore } from "@/lib/store";
import { useWebSocket } from "@/lib/use-websocket";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import {
  ParsedTask,
  TaskStatus,
  Comment,
  TaskConfiguration,
} from "@/lib/types";

// Helper function to safely access task configuration
const getTaskConfiguration = (task: ParsedTask): TaskConfiguration | null => {
  if (!task.configuration) return null;

  // If it's already a TaskConfiguration, return it
  if (
    typeof task.configuration === "object" &&
    task.configuration !== null &&
    "priority" in task.configuration
  ) {
    return task.configuration as TaskConfiguration;
  }

  // If it's a generic object, try to convert it
  if (typeof task.configuration === "object" && task.configuration !== null) {
    const config = task.configuration as Record<string, unknown>;
    return {
      priority: (config.priority as TaskConfiguration["priority"]) || "MEDIUM",
      description: (config.description as string) || undefined,
      tags: Array.isArray(config.tags) ? (config.tags as string[]) : [],
      customFields: (config.customFields as Record<string, unknown>) || {},
    };
  }

  return null;
};
import { getPriorityColor, getStatusColor, formatTimestamp } from "@/lib/utils";

const statusColumns: {
  status: TaskStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  { status: "TODO", label: "To Do", icon: <Circle className="h-4 w-4" /> },
  {
    status: "IN_PROGRESS",
    label: "In Progress",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    status: "IN_REVIEW",
    label: "In Review",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  { status: "DONE", label: "Done", icon: <CheckCircle className="h-4 w-4" /> },
  {
    status: "BLOCKED",
    label: "Blocked",
    icon: <AlertCircle className="h-4 w-4" />,
  },
];

export function TaskBoard() {
  const { user } = useUser();
  const {
    currentProject,
    tasks,
    setTasks,
    setCurrentProject,
    setLoading,
    setError,
    wsConnected,
  } = useAppStore();

  const { joinProject, leaveProject } = useWebSocket();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as const,
    tags: [] as string[],
    dependencies: [] as string[],
  });
  const [selectedTask, setSelectedTask] = useState<ParsedTask | null>(null);

  // Sync selectedTask with tasks array updates (for real-time updates)
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find((t) => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask]);

  useEffect(() => {
    if (currentProject) {
      // Load tasks using API client directly
      const loadTasks = async () => {
        try {
          const response = await apiClient.getTasks(currentProject.id);
          if (response.success) {
            setTasks(response.data || []);
          }
        } catch (error) {
          console.error("Failed to load tasks:", error);
        }
      };

      loadTasks();
      joinProject(currentProject.id);

      return () => {
        leaveProject(currentProject.id);
      };
    }
  }, [currentProject?.id, setTasks, joinProject, leaveProject]); // Only depend on stable values

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !currentProject || !user) return;

    setLoading(true);
    try {
      const response = await apiClient.createTask({
        projectId: currentProject.id,
        title: newTask.title,
        status: "TODO",
        assignedTo: [user.id], // Assign to current user by default
        configuration: {
          priority: newTask.priority,
          description: newTask.description,
          tags: newTask.tags,
          customFields: {},
        },
        dependencies: newTask.dependencies,
      });

      if (response.success && response.data) {
        setTasks([response.data, ...tasks]);
        setNewTask({
          title: "",
          description: "",
          priority: "MEDIUM",
          tags: [],
          dependencies: [],
        });
        setShowCreateForm(false);
      } else {
        setError(response.error || "Failed to create task");
      }
    } catch (error) {
      setError("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    try {
      const response = await apiClient.updateTask(taskId, {
        status: newStatus,
      });
      if (response.success && response.data) {
        setTasks(
          tasks.map((task) => (task.id === taskId ? response.data! : task))
        );
      }
    } catch (error) {
      setError("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Remove task from local state and clean up dependencies in one operation
      const filteredTasks = tasks.filter(
        (task: ParsedTask) => task.id !== taskId
      );

      // Update any remaining tasks that had this task as a dependency
      const updatedTasks = filteredTasks.map((task: ParsedTask) => ({
        ...task,
        dependencies: task.dependencies.filter(
          (depId: string) => depId !== taskId
        ),
      }));

      setTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to update local state after task deletion:", error);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  // Check if a task is blocked by incomplete dependencies
  const isTaskBlocked = (task: ParsedTask) => {
    if (task.dependencies.length === 0) return false;

    const incompleteDeps = task.dependencies.filter((depId) => {
      const depTask = tasks.find((t) => t.id === depId);
      return depTask && depTask.status !== "DONE";
    });

    return incompleteDeps.length > 0;
  };

  // Get dependency status for a task
  const getTaskDependencyStatus = (task: ParsedTask) => {
    if (task.dependencies.length === 0) return "ready";

    const depTasks = task.dependencies
      .map((depId) => tasks.find((t) => t.id === depId))
      .filter(Boolean);

    const completedDeps = depTasks.filter((dep) => dep?.status === "DONE");

    if (completedDeps.length === depTasks.length) return "ready";
    if (completedDeps.length === 0) return "blocked";
    return "partial";
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a project to view tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {currentProject.name}
            </h1>
            <p className="text-muted-foreground">
              {currentProject.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              wsConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {wsConnected ? "Connected" : "Disconnected"}
          </span>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>
              Add a new task to {currentProject.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-2"
                >
                  Task Title
                </label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium mb-2"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value as any })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Dependencies Section */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Dependencies
                </label>
                {newTask.dependencies.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {newTask.dependencies.map((depId: string) => {
                      const depTask = tasks.find((t) => t.id === depId);
                      return (
                        <div
                          key={depId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                        >
                          <span className="text-sm">
                            {depTask
                              ? depTask.title
                              : `Unknown Task (${depId})`}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setNewTask({
                                ...newTask,
                                dependencies: newTask.dependencies.filter(
                                  (id: string) => id !== depId
                                ),
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (
                      selectedId &&
                      !newTask.dependencies.includes(selectedId)
                    ) {
                      setNewTask({
                        ...newTask,
                        dependencies: [...newTask.dependencies, selectedId],
                      });
                    }
                    e.target.value = ""; // Reset selection
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value=""
                >
                  <option value="">Add dependency...</option>
                  {tasks.map((t: ParsedTask) => (
                    <option key={t.id} value={t.id}>
                      {t.title} (
                      {statusColumns.find((c) => c.status === t.status)?.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Task</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);

          return (
            <div key={column.status} className="space-y-4">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="font-semibold">{column.label}</h3>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>

              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const isBlocked = isTaskBlocked(task);
                  const depStatus = getTaskDependencyStatus(task);

                  return (
                    <Card
                      key={task.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        isBlocked
                          ? "opacity-75 border-l-4 border-l-orange-500"
                          : ""
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">
                              {task.title}
                            </h4>
                            {task.dependencies.length > 0 && (
                              <div className="flex items-center gap-1">
                                {depStatus === "blocked" && (
                                  <div
                                    className="w-2 h-2 bg-orange-500 rounded-full"
                                    title="Blocked by dependencies"
                                  />
                                )}
                                {depStatus === "partial" && (
                                  <div
                                    className="w-2 h-2 bg-yellow-500 rounded-full"
                                    title="Partially blocked"
                                  />
                                )}
                                {depStatus === "ready" && (
                                  <div
                                    className="w-2 h-2 bg-green-500 rounded-full"
                                    title="All dependencies completed"
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {getTaskConfiguration(task)?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {getTaskConfiguration(task)?.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getPriorityColor(
                                getTaskConfiguration(task)?.priority || "MEDIUM"
                              )}
                            >
                              {getTaskConfiguration(task)?.priority || "MEDIUM"}
                            </Badge>

                            {(getTaskConfiguration(task)?.tags?.length || 0) >
                              0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">
                                  {getTaskConfiguration(task)?.tags?.length ||
                                    0}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.assignedTo.length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{task.comments?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          tasks={tasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            setTasks(
              tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );
            // Update the selected task to reflect changes immediately
            setSelectedTask(updatedTask);
          }}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}

function TaskDetailModal({
  task,
  tasks,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: ParsedTask;
  tasks: ParsedTask[];
  onClose: () => void;
  onUpdate: (task: ParsedTask) => void;
  onDelete: (taskId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update editedTask when task prop changes
  useEffect(() => {
    setEditedTask(task);
    setIsEditing(false); // Reset editing state when task changes
  }, [task]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      if (isEditing) {
        // If editing, ask for confirmation before closing
        const hasChanges = JSON.stringify(task) !== JSON.stringify(editedTask);
        if (hasChanges) {
          const confirmed = window.confirm(
            "You have unsaved changes. Are you sure you want to close?"
          );
          if (!confirmed) return;
        }
        // Reset changes if confirmed
        setEditedTask(task);
        setIsEditing(false);
      }
      onClose();
    }
  };

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          // If editing, ask for confirmation before closing
          const hasChanges =
            JSON.stringify(task) !== JSON.stringify(editedTask);
          if (hasChanges) {
            const confirmed = window.confirm(
              "You have unsaved changes. Are you sure you want to close?"
            );
            if (!confirmed) return;
          }
          // Reset changes if confirmed
          setEditedTask(task);
          setIsEditing(false);
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose, isEditing, task, editedTask]);

  // Check if task can transition to a given status based on dependencies
  const canTransitionToStatus = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return true;

    // If moving to IN_PROGRESS or beyond, check dependencies
    if (["IN_PROGRESS", "IN_REVIEW", "DONE"].includes(newStatus)) {
      const incompleteDeps = task.dependencies.filter((depId) => {
        const depTask = tasks.find((t) => t.id === depId);
        return depTask && depTask.status !== "DONE";
      });

      if (incompleteDeps.length > 0) {
        return false;
      }
    }

    return true;
  };

  // Get dependency status for display
  const getDependencyStatus = (task: ParsedTask) => {
    if (task.dependencies.length === 0) return "ready";

    const depTasks = task.dependencies
      .map((depId) => tasks.find((t) => t.id === depId))
      .filter(Boolean);

    const completedDeps = depTasks.filter((dep) => dep?.status === "DONE");

    if (completedDeps.length === depTasks.length) return "ready";
    if (completedDeps.length === 0) return "blocked";
    return "partial";
  };

  const handleSave = async () => {
    try {
      // Validate status transition
      if (!canTransitionToStatus(task.id, editedTask.status)) {
        const incompleteDeps = editedTask.dependencies.filter((depId) => {
          const depTask = tasks.find((t) => t.id === depId);
          return depTask && depTask.status !== "DONE";
        });

        const depTitles = incompleteDeps.map((depId) => {
          const depTask = tasks.find((t) => t.id === depId);
          return depTask?.title || `Unknown Task (${depId})`;
        });

        alert(
          `Cannot move task to "${
            editedTask.status
          }" because the following dependencies are not completed:\n\n${depTitles.join(
            "\n"
          )}`
        );
        return;
      }

      // Update the task with all edited fields
      const updateData = {
        title: editedTask.title,
        status: editedTask.status,
        configuration: getTaskConfiguration(editedTask) || undefined,
        dependencies: editedTask.dependencies,
      };

      const response = await apiClient.updateTask(task.id, updateData);

      if (response.success && response.data) {
        // Update the parent component with the new task data
        onUpdate(response.data);
        setIsEditing(false);
      } else {
        console.error("Failed to update task:", response.error);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async () => {
    // Check if this task has dependencies from other tasks
    const dependentTasks = tasks.filter((t) =>
      t.dependencies.includes(task.id)
    );

    if (dependentTasks.length > 0) {
      const dependentTitles = dependentTasks.map((t) => t.title).join(", ");
      const confirmed = window.confirm(
        `This task has dependencies from other tasks: ${dependentTitles}\n\nDeleting this task will remove it from their dependencies. Are you sure you want to delete "${task.title}"?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    try {
      const response = await apiClient.deleteTask(task.id);

      if (response.success) {
        onDelete(task.id);
        onClose();
      } else {
        console.error("Failed to delete task:", response.error);
        alert("Failed to delete task. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 backdrop-blur-sm"></div>
      <Card
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 animate-in zoom-in-95 duration-200"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={isEditing ? "text-blue-600" : ""}>
              Task Details {isEditing && "(Editing)"}
            </CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditedTask(task); // Reset to original data
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
              {!isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="hover:bg-gray-100"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
                autoFocus
              />
            ) : (
              <p className="text-sm">{editedTask.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            {isEditing ? (
              <select
                value={editedTask.status}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    status: e.target.value as TaskStatus,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {statusColumns.map((column) => {
                  const isDisabled = !canTransitionToStatus(
                    task.id,
                    column.status as TaskStatus
                  );
                  return (
                    <option
                      key={column.status}
                      value={column.status}
                      disabled={isDisabled}
                    >
                      {column.label} {isDisabled && "(Blocked by dependencies)"}
                    </option>
                  );
                })}
              </select>
            ) : (
              <Badge className={getStatusColor(editedTask.status)}>
                {
                  statusColumns.find((c) => c.status === editedTask.status)
                    ?.label
                }
              </Badge>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <Badge
              className={getPriorityColor(
                getTaskConfiguration(editedTask)?.priority || "MEDIUM"
              )}
            >
              {getTaskConfiguration(editedTask)?.priority || "MEDIUM"}
            </Badge>
          </div>

          {getTaskConfiguration(editedTask)?.description && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <p className="text-sm text-muted-foreground">
                {getTaskConfiguration(editedTask)?.description}
              </p>
            </div>
          )}

          {(getTaskConfiguration(editedTask)?.tags?.length || 0) > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-1">
                {getTaskConfiguration(editedTask)?.tags?.map(
                  (tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}

          {/* Dependencies Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Dependencies
            </label>
            {editedTask.dependencies.length > 0 ? (
              <div className="space-y-2">
                {editedTask.dependencies.map((depId: string) => {
                  const depTask = tasks.find((t) => t.id === depId);
                  return (
                    <div
                      key={depId}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            depTask?.status === "DONE"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm">
                          {depTask ? depTask.title : `Unknown Task (${depId})`}
                        </span>
                        {depTask && (
                          <Badge
                            variant="outline"
                            className={getStatusColor(depTask.status)}
                          >
                            {
                              statusColumns.find(
                                (c) => c.status === depTask.status
                              )?.label
                            }
                          </Badge>
                        )}
                      </div>
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditedTask({
                              ...editedTask,
                              dependencies: editedTask.dependencies.filter(
                                (id: string) => id !== depId
                              ),
                            });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  );
                })}
                {isEditing && (
                  <div className="mt-2">
                    <select
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (
                          selectedId &&
                          !editedTask.dependencies.includes(selectedId)
                        ) {
                          setEditedTask({
                            ...editedTask,
                            dependencies: [
                              ...editedTask.dependencies,
                              selectedId,
                            ],
                          });
                        }
                        e.target.value = ""; // Reset selection
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value=""
                    >
                      <option value="">Add dependency...</option>
                      {tasks
                        .filter(
                          (t: ParsedTask) =>
                            t.id !== task.id &&
                            !editedTask.dependencies.includes(t.id)
                        )
                        .map((t: ParsedTask) => (
                          <option key={t.id} value={t.id}>
                            {t.title} (
                            {
                              statusColumns.find((c) => c.status === t.status)
                                ?.label
                            }
                            )
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No dependencies
                {isEditing && (
                  <div className="mt-2">
                    <select
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId) {
                          setEditedTask({
                            ...editedTask,
                            dependencies: [
                              ...editedTask.dependencies,
                              selectedId,
                            ],
                          });
                        }
                        e.target.value = ""; // Reset selection
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value=""
                    >
                      <option value="">Add dependency...</option>
                      {tasks
                        .filter((t: ParsedTask) => t.id !== task.id)
                        .map((t: ParsedTask) => (
                          <option key={t.id} value={t.id}>
                            {t.title} (
                            {
                              statusColumns.find((c) => c.status === t.status)
                                ?.label
                            }
                            )
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <CommentsSection
            task={task}
            comments={task.comments || []}
            onCommentAdd={onUpdate}
            onCommentUpdate={onUpdate}
            onCommentDelete={onUpdate}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Created</label>
            <p className="text-sm text-muted-foreground">
              {formatTimestamp(task.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Comments Section Component
function CommentsSection({
  task,
  comments,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
}: {
  task: ParsedTask;
  comments: Comment[];
  onCommentAdd: (updatedTask: ParsedTask) => void;
  onCommentUpdate: (updatedTask: ParsedTask) => void;
  onCommentDelete: (updatedTask: ParsedTask) => void;
}) {
  const { user } = useUser();
  const {
    wsConnected,
    handleCommentCreate,
    handleCommentUpdate,
    handleCommentDelete,
  } = useAppStore();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user's internal ID when component mounts
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  // Load comments when component mounts
  useEffect(() => {
    if (task.id) {
      loadComments();
    }
  }, [task.id]);

  // This effect handles real-time updates from other users via WebSocket
  // The modal will automatically update when the task prop changes

  const loadComments = async () => {
    try {
      const response = await apiClient.getComments(task.id);
      if (response.success && response.data) {
        // Update the task with loaded comments
        const updatedTask = { ...task, comments: response.data };
        onCommentAdd(updatedTask);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.createComment({
        taskId: task.id,
        content: newComment.trim(),
        // authorId will be set by the API route using getCurrentUser()
      });

      if (response.success && response.data) {
        const updatedTask = {
          ...task,
          comments: [response.data, ...(task.comments || [])],
        };
        onCommentAdd(updatedTask);
        setNewComment("");
      } else {
        console.error("Failed to create comment:", response.error);
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingText.trim()) return;

    try {
      const response = await apiClient.updateComment(commentId, {
        content: editingText.trim(),
      });

      if (response.success && response.data) {
        const updatedComments = (task.comments || []).map((comment) =>
          comment.id === commentId ? response.data! : comment
        );
        const updatedTask = { ...task, comments: updatedComments };
        onCommentUpdate(updatedTask);
        setEditingComment(null);
        setEditingText("");
      } else {
        console.error("Failed to update comment:", response.error);
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );
    if (!confirmed) return;

    try {
      const response = await apiClient.deleteComment(commentId);

      if (response.success) {
        const updatedComments = (task.comments || []).filter(
          (comment) => comment.id !== commentId
        );
        const updatedTask = { ...task, comments: updatedComments };
        onCommentDelete(updatedTask);
      } else {
        console.error("Failed to delete comment:", response.error);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditingText(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditingText("");
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Comments ({comments.length})
      </label>

      {/* Add Comment Form */}
      {currentUser && (
        <form onSubmit={handleAddComment} className="mb-4">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.author?.firstName ||
                        comment.author?.email?.split("@")[0] ||
                        "Unknown User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                    {!wsConnected && (
                      <span className="text-xs text-orange-600" title="Offline">
                        ⚠️
                      </span>
                    )}
                  </div>

                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editingText.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>

                {currentUser && currentUser.id === comment.authorId && (
                  <div className="flex gap-1 ml-2">
                    {editingComment !== comment.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(comment)}
                          className="h-6 w-6 p-0"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          🗑️
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
