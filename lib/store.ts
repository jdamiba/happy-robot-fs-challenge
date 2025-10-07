import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  ParsedProject,
  ParsedTask,
  Comment,
  WebSocketMessage,
  TaskUpdate,
  CommentUpdate,
} from "./types";
import { generateOperationId } from "./utils";

interface AppState {
  // Data
  projects: ParsedProject[];
  currentProject: ParsedProject | null;
  tasks: ParsedTask[];
  comments: Record<string, Comment[]>; // taskId -> comments
  activeUsers: Array<{
    userId: string;
    clientId: string;
    joinedAt: number;
    initials?: string;
  }>;
  loading: boolean;
  error: string | null;

  // WebSocket
  wsConnected: boolean;
  wsMessages: WebSocketMessage[];

  // Optimistic updates
  pendingOperations: Map<string, unknown>;

  // Actions
  setProjects: (projects: ParsedProject[]) => void;
  setCurrentProject: (project: ParsedProject | null) => void;
  setTasks: (tasks: ParsedTask[]) => void;
  setComments: (taskId: string, comments: Comment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Fetch functions
  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;

  // WebSocket actions
  setWsConnected: (connected: boolean) => void;
  addWsMessage: (message: WebSocketMessage) => void;

  // Optimistic CRUD operations
  createProjectOptimistic: (
    project: Omit<ParsedProject, "id" | "createdAt" | "updatedAt">
  ) => string;
  updateProjectOptimistic: (
    id: string,
    updates: Partial<ParsedProject>
  ) => void;
  deleteProjectOptimistic: (id: string) => void;

  createTaskOptimistic: (
    task: Omit<ParsedTask, "id" | "createdAt" | "updatedAt">
  ) => string;
  updateTaskOptimistic: (id: string, updates: Partial<ParsedTask>) => void;
  deleteTaskOptimistic: (id: string) => void;

  createCommentOptimistic: (
    comment: Omit<Comment, "id" | "timestamp">
  ) => string;
  updateCommentOptimistic: (id: string, updates: Partial<Comment>) => void;
  deleteCommentOptimistic: (id: string) => void;

  // Rollback operations
  rollbackOperation: (operationId: string) => void;

  // Real-time updates
  handleTaskUpdate: (update: TaskUpdate) => void;
  handleTaskCreate: (task: ParsedTask) => void;
  handleTaskDelete: (taskId: string) => void;
  handleCommentUpdate: (update: CommentUpdate) => void;
  handleCommentCreate: (comment: Comment) => void;
  handleCommentDelete: (taskId: string, commentId: string) => void;
  handleUserPresence: (presence: {
    projectId: string;
    activeUsers: Array<{
      userId: string;
      clientId: string;
      joinedAt: number;
      initials?: string;
    }>;
    userCount: number;
  }) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial state
      projects: [],
      currentProject: null,
      tasks: [],
      comments: {},
      activeUsers: [], // Array of active users in current project
      loading: false,
      error: null,
      wsConnected: false,
      wsMessages: [],
      pendingOperations: new Map(),

      // Basic setters
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      setTasks: (tasks) => set({ tasks }),
      setComments: (taskId, comments) =>
        set((state) => ({
          comments: { ...state.comments, [taskId]: comments },
        })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Fetch functions
      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/projects");
          const data = await response.json();
          if (data.success) {
            set({ projects: data.data, loading: false });
          } else {
            set({
              error: data.error || "Failed to fetch projects",
              loading: false,
            });
          }
        } catch {
          set({ error: "Failed to fetch projects", loading: false });
        }
      },

      fetchTasks: async (projectId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/projects/${projectId}/tasks`);
          const data = await response.json();
          if (data.success) {
            set({ tasks: data.data, loading: false });
          } else {
            set({
              error: data.error || "Failed to fetch tasks",
              loading: false,
            });
          }
        } catch {
          set({ error: "Failed to fetch tasks", loading: false });
        }
      },

      // WebSocket actions
      setWsConnected: (connected) => set({ wsConnected: connected }),
      addWsMessage: (message) =>
        set((state) => ({
          wsMessages: [...state.wsMessages, message],
        })),

      // Optimistic project operations
      createProjectOptimistic: (projectData) => {
        const operationId = generateOperationId();
        const tempId = `temp-${operationId}`;
        const now = new Date();

        const optimisticProject: ParsedProject = {
          ...projectData,
          id: tempId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          projects: [optimisticProject, ...state.projects],
          pendingOperations: new Map(state.pendingOperations).set(operationId, {
            type: "CREATE_PROJECT",
            tempId,
            data: optimisticProject,
          }),
        }));

        return operationId;
      },

      updateProjectOptimistic: (id, updates) => {
        const operationId = generateOperationId();

        set((state) => {
          const projectIndex = state.projects.findIndex((p) => p.id === id);
          if (projectIndex === -1) return state;

          const originalProject = state.projects[projectIndex];
          const updatedProject = {
            ...originalProject,
            ...updates,
            updatedAt: new Date(),
          };

          const newProjects = [...state.projects];
          newProjects[projectIndex] = updatedProject;

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === id
                ? updatedProject
                : state.currentProject,
            pendingOperations: new Map(state.pendingOperations).set(
              operationId,
              {
                type: "UPDATE_PROJECT",
                id,
                originalData: originalProject,
                data: updatedProject,
              }
            ),
          };
        });
      },

      deleteProjectOptimistic: (id) => {
        const operationId = generateOperationId();

        set((state) => {
          const project = state.projects.find((p) => p.id === id);
          if (!project) return state;

          return {
            projects: state.projects.filter((p) => p.id !== id),
            currentProject:
              state.currentProject?.id === id ? null : state.currentProject,
            pendingOperations: new Map(state.pendingOperations).set(
              operationId,
              {
                type: "DELETE_PROJECT",
                id,
                data: project,
              }
            ),
          };
        });
      },

      // Optimistic task operations
      createTaskOptimistic: (taskData) => {
        const operationId = generateOperationId();
        const tempId = `temp-${operationId}`;
        const now = new Date();

        const optimisticTask: ParsedTask = {
          ...taskData,
          id: tempId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          tasks: [optimisticTask, ...state.tasks],
          pendingOperations: new Map(state.pendingOperations).set(operationId, {
            type: "CREATE_TASK",
            tempId,
            data: optimisticTask,
          }),
        }));

        return operationId;
      },

      updateTaskOptimistic: (id, updates) => {
        const operationId = generateOperationId();

        set((state) => {
          const taskIndex = state.tasks.findIndex((t) => t.id === id);
          if (taskIndex === -1) return state;

          const originalTask = state.tasks[taskIndex];
          const updatedTask = {
            ...originalTask,
            ...updates,
            updatedAt: new Date(),
          };

          const newTasks = [...state.tasks];
          newTasks[taskIndex] = updatedTask;

          return {
            tasks: newTasks,
            pendingOperations: new Map(state.pendingOperations).set(
              operationId,
              {
                type: "UPDATE_TASK",
                id,
                originalData: originalTask,
                data: updatedTask,
              }
            ),
          };
        });
      },

      deleteTaskOptimistic: (id) => {
        const operationId = generateOperationId();

        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return state;

          return {
            tasks: state.tasks.filter((t) => t.id !== id),
            pendingOperations: new Map(state.pendingOperations).set(
              operationId,
              {
                type: "DELETE_TASK",
                id,
                data: task,
              }
            ),
          };
        });
      },

      // Optimistic comment operations
      createCommentOptimistic: (commentData) => {
        const operationId = generateOperationId();
        const tempId = `temp-${operationId}`;
        const now = new Date();

        const optimisticComment: Comment = {
          ...commentData,
          id: tempId,
          timestamp: now,
        };

        set((state) => {
          const existingComments = state.comments[commentData.taskId] || [];
          return {
            comments: {
              ...state.comments,
              [commentData.taskId]: [optimisticComment, ...existingComments],
            },
            pendingOperations: new Map(state.pendingOperations).set(
              operationId,
              {
                type: "CREATE_COMMENT",
                tempId,
                data: optimisticComment,
              }
            ),
          };
        });

        return operationId;
      },

      updateCommentOptimistic: (id, updates) => {
        const operationId = generateOperationId();

        set((state) => {
          const taskId = Object.keys(state.comments).find((tid) =>
            state.comments[tid].some((c) => c.id === id)
          );

          if (!taskId) return state;

          const commentIndex = state.comments[taskId].findIndex(
            (c) => c.id === id
          );
          if (commentIndex === -1) return state;

          const originalComment = state.comments[taskId][commentIndex];
          const updatedComment = { ...originalComment, ...updates };

          const newComments = [...state.comments[taskId]];
          newComments[commentIndex] = updatedComment;

          return {
            comments: {
              ...state.comments,
              [taskId]: newComments,
            },
            pendingOperations: new Map(state.pendingOperations).set(
              operationId,
              {
                type: "UPDATE_COMMENT",
                id,
                originalData: originalComment,
                data: updatedComment,
              }
            ),
          };
        });
      },

      deleteCommentOptimistic: (id) => {
        const operationId = generateOperationId();

        set((state) => {
          const taskId = Object.keys(state.comments).find((tid) =>
            state.comments[tid].some((c) => c.id === id)
          );

          if (!taskId) return state;

          const comment = state.comments[taskId].find((c) => c.id === id);
          if (!comment) return state;

          return {
            comments: {
              ...state.comments,
              [taskId]: state.comments[taskId].filter((c) => c.id !== id),
            },
            pendingOperations: new Map(state.pendingOperations).set(
              operationId,
              {
                type: "DELETE_COMMENT",
                id,
                data: comment,
              }
            ),
          };
        });
      },

      // Rollback operations
      rollbackOperation: (operationId) => {
        set((state) => {
          const operation = state.pendingOperations.get(operationId);
          if (!operation) return state;

          const newPendingOperations = new Map(state.pendingOperations);
          newPendingOperations.delete(operationId);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          switch ((operation as any).type) {
            case "CREATE_PROJECT":
              return {
                projects: state.projects.filter(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (p) => p.id !== (operation as any).tempId
                ),
                pendingOperations: newPendingOperations,
              };

            case "UPDATE_PROJECT":
              const projectIndex = state.projects.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (p) => p.id === (operation as any).id
              );
              if (projectIndex === -1)
                return { ...state, pendingOperations: newPendingOperations };

              const newProjects = [...state.projects];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              newProjects[projectIndex] = (operation as any).originalData;

              return {
                projects: newProjects,
                currentProject:
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  state.currentProject?.id === (operation as any).id
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (operation as any).originalData
                    : state.currentProject,
                pendingOperations: newPendingOperations,
              };

            case "DELETE_PROJECT":
              return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                projects: [...state.projects, (operation as any).data],
                pendingOperations: newPendingOperations,
              };

            case "CREATE_TASK":
              return {
                tasks: state.tasks.filter(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (t) => t.id !== (operation as any).tempId
                ),
                pendingOperations: newPendingOperations,
              };

            case "UPDATE_TASK":
              const taskIndex = state.tasks.findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (t) => t.id === (operation as any).id
              );
              if (taskIndex === -1)
                return { ...state, pendingOperations: newPendingOperations };

              const newTasks = [...state.tasks];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              newTasks[taskIndex] = (operation as any).originalData;

              return {
                tasks: newTasks,
                pendingOperations: newPendingOperations,
              };

            case "DELETE_TASK":
              return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tasks: [...state.tasks, (operation as any).data],
                pendingOperations: newPendingOperations,
              };

            case "CREATE_COMMENT":
              const taskId = Object.keys(state.comments).find((tid) =>
                state.comments[tid].some(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (c) => c.id === (operation as any).tempId
                )
              );

              if (!taskId)
                return { ...state, pendingOperations: newPendingOperations };

              return {
                comments: {
                  ...state.comments,
                  [taskId]: state.comments[taskId].filter(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (c) => c.id !== (operation as any).tempId
                  ),
                },
                pendingOperations: newPendingOperations,
              };

            case "UPDATE_COMMENT":
              const commentTaskId = Object.keys(state.comments).find((tid) =>
                state.comments[tid].some(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (c) => c.id === (operation as any).id
                )
              );

              if (!commentTaskId)
                return { ...state, pendingOperations: newPendingOperations };

              const commentIndex = state.comments[commentTaskId].findIndex(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (c) => c.id === (operation as any).id
              );
              if (commentIndex === -1)
                return { ...state, pendingOperations: newPendingOperations };

              const newComments = [...state.comments[commentTaskId]];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              newComments[commentIndex] = (operation as any).originalData;

              return {
                comments: {
                  ...state.comments,
                  [commentTaskId]: newComments,
                },
                pendingOperations: newPendingOperations,
              };

            case "DELETE_COMMENT":
              const deleteTaskId = Object.keys(state.comments).find((tid) =>
                state.comments[tid].some(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (c) => c.id === (operation as any).id
                )
              );

              if (!deleteTaskId)
                return { ...state, pendingOperations: newPendingOperations };

              return {
                comments: {
                  ...state.comments,
                  [deleteTaskId]: [
                    ...state.comments[deleteTaskId],
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (operation as any).data,
                  ],
                },
                pendingOperations: newPendingOperations,
              };

            default:
              return { ...state, pendingOperations: newPendingOperations };
          }
        });
      },

      // Real-time update handlers
      handleTaskUpdate: (update) => {
        console.log("Zustand handleTaskUpdate called:", update);
        set((state) => {
          const taskIndex = state.tasks.findIndex((t) => t.id === update.id);
          if (taskIndex === -1) {
            console.log("Task not found for update:", update.id);
            return state;
          }

          const updatedTask = { ...state.tasks[taskIndex], ...update.changes };
          const newTasks = [...state.tasks];
          newTasks[taskIndex] = updatedTask;

          console.log("Task updated in store:", {
            taskId: update.id,
            oldStatus: state.tasks[taskIndex].status,
            newStatus: updatedTask.status,
            changes: update.changes,
          });

          return { tasks: newTasks };
        });
      },

      handleTaskCreate: (task) => {
        set((state) => ({
          tasks: [task, ...state.tasks],
        }));
      },

      handleTaskDelete: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          comments: Object.fromEntries(
            Object.entries(state.comments).filter(([tid]) => tid !== taskId)
          ),
        }));
      },

      handleCommentUpdate: (update) => {
        console.log("Zustand handleCommentUpdate called:", update);
        set((state) => {
          const taskId = update.taskId;
          const comments = state.comments[taskId] || [];
          const commentIndex = comments.findIndex((c) => c.id === update.id);

          if (commentIndex === -1) {
            console.log("Comment not found for update:", update.id);
            return state;
          }

          const updatedComment = {
            ...comments[commentIndex],
            ...update.changes,
          };
          const newComments = [...comments];
          newComments[commentIndex] = updatedComment;

          return {
            comments: {
              ...state.comments,
              [taskId]: newComments,
            },
          };
        });
      },

      handleCommentCreate: (comment) => {
        console.log("Zustand handleCommentCreate called:", comment);
        set((state) => {
          const existingComments = state.comments[comment.taskId] || [];
          return {
            comments: {
              ...state.comments,
              [comment.taskId]: [comment, ...existingComments],
            },
          };
        });
      },

      handleCommentDelete: (taskId, commentId) => {
        console.log("Zustand handleCommentDelete called:", {
          taskId,
          commentId,
        });
        set((state) => {
          const comments = state.comments[taskId] || [];
          return {
            comments: {
              ...state.comments,
              [taskId]: comments.filter((comment) => comment.id !== commentId),
            },
          };
        });
      },

      handleUserPresence: (presence) => {
        console.log("Zustand handleUserPresence called:", presence);
        set((state) => {
          // Only update if this is for the current project
          if (
            state.currentProject &&
            presence.projectId === state.currentProject.id
          ) {
            return {
              activeUsers: presence.activeUsers,
            };
          }
          return state;
        });
      },
    }),
    {
      name: "app-store",
    }
  )
);
