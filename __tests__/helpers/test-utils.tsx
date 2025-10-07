import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";
import userEvent from "@testing-library/user-event";

// Mock store for testing
import { create } from "zustand";
import { ParsedTask, ParsedProject, Comment } from "@/lib/types";

interface TestStore {
  tasks: ParsedTask[];
  projects: ParsedProject[];
  currentProject: ParsedProject | null;
  currentUser: { id: string; email: string } | null;
  loading: boolean;
  error: string | null;
  wsConnected: boolean;
  activeUsers: Array<{ userId: string; initials?: string }>;
  setTasks: (tasks: ParsedTask[]) => void;
  setProjects: (projects: ParsedProject[]) => void;
  setCurrentProject: (project: ParsedProject | null) => void;
  setCurrentUser: (user: { id: string; email: string } | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  setActiveUsers: (users: Array<{ userId: string; initials?: string }>) => void;
  handleTaskCreate: (task: ParsedTask) => void;
  handleTaskUpdate: (update: {
    id: string;
    changes: Partial<ParsedTask>;
  }) => void;
  handleTaskDelete: (taskId: string) => void;
  handleCommentCreate: (comment: Comment) => void;
  handleCommentUpdate: (update: {
    id: string;
    changes: Partial<Comment>;
  }) => void;
  handleCommentDelete: (commentId: string) => void;
  handleUserPresence: (data: {
    activeUsers: Array<{ userId: string; initials?: string }>;
  }) => void;
}

export const createTestStore = () =>
  create<TestStore>((set) => ({
    tasks: [],
    projects: [],
    currentProject: null,
    currentUser: null,
    loading: false,
    error: null,
    wsConnected: false,
    activeUsers: [],
    setTasks: (tasks) => set({ tasks }),
    setProjects: (projects) => set({ projects }),
    setCurrentProject: (currentProject) => set({ currentProject }),
    setCurrentUser: (currentUser) => set({ currentUser }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setWsConnected: (wsConnected) => set({ wsConnected }),
    setActiveUsers: (activeUsers) => set({ activeUsers }),
    handleTaskCreate: (task) =>
      set((state) => ({ tasks: [...state.tasks, task] })),
    handleTaskUpdate: (update) =>
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === update.id ? { ...task, ...update.changes } : task
        ),
      })),
    handleTaskDelete: (taskId) =>
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
      })),
    handleCommentCreate: (comment) =>
      set((state) => {
        // Update task with new comment
        const updatedTasks = state.tasks.map((task) => {
          if (task.id === comment.taskId) {
            return {
              ...task,
              comments: [...(task.comments || []), comment],
            };
          }
          return task;
        });
        return { tasks: updatedTasks };
      }),
    handleCommentUpdate: (update) =>
      set((state) => {
        const updatedTasks = state.tasks.map((task) => ({
          ...task,
          comments:
            task.comments?.map((comment) =>
              comment.id === update.id
                ? { ...comment, ...update.changes }
                : comment
            ) || [],
        }));
        return { tasks: updatedTasks };
      }),
    handleCommentDelete: (commentId) =>
      set((state) => {
        const updatedTasks = state.tasks.map((task) => ({
          ...task,
          comments:
            task.comments?.filter((comment) => comment.id !== commentId) || [],
        }));
        return { tasks: updatedTasks };
      }),
    handleUserPresence: (data) => set({ activeUsers: data.activeUsers }),
  }));

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  store?: TestStore;
  user?: UserEvent;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { store, user, ...renderOptions }: CustomRenderOptions = {}
) => {
  const testStore = store || createTestStore();
  const testUser = user || userEvent.setup();

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Mock the store provider here if needed
    return <>{children}</>;
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store: testStore,
    user: testUser,
  };
};

// Mock API client for testing
export const createMockApiClient = () => ({
  getProjects: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getComments: jest.fn(),
  createComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
  getCurrentUser: jest.fn(),
});

// Mock WebSocket for testing
export class MockWebSocket {
  public url: string;
  public readyState: number;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    // Mock send implementation
  }

  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent("close", { code, reason }));
    }
  }

  // Helper methods for testing
  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }

  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(
        new MessageEvent("message", { data: JSON.stringify(data) })
      );
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }

  simulateClose(): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent("close"));
    }
  }
}

// Test data factories
export const createMockTask = (
  overrides: Partial<ParsedTask> = {}
): ParsedTask => ({
  id: "test-task-id",
  title: "Test Task",
  description: "A test task",
  status: "TODO",
  priority: "MEDIUM",
  projectId: "test-project-id",
  assignedTo: [],
  dependencies: [],
  configuration: {},
  comments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProject = (
  overrides: Partial<ParsedProject> = {}
): ParsedProject => ({
  id: "test-project-id",
  title: "Test Project",
  description: "A test project",
  ownerId: "test-user-id",
  tasks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockComment = (
  overrides: Partial<Comment> = {}
): Comment => ({
  id: "test-comment-id",
  content: "Test comment",
  taskId: "test-task-id",
  authorId: "test-user-id",
  author: {
    id: "test-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
  },
  timestamp: new Date(),
  ...overrides,
});

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: "test-user-id",
  clerkId: "clerk-user-id",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
