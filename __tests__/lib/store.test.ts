import { renderHook, act } from "@testing-library/react";
import { useAppStore } from "@/lib/store";
import { ParsedProject, ParsedTask, Comment } from "@/lib/types";

// Mock WebSocket client
jest.mock("@/lib/websocket-client", () => ({
  websocketClient: {
    broadcastTaskCreate: jest.fn(),
    broadcastTaskUpdate: jest.fn(),
    broadcastTaskDelete: jest.fn(),
    broadcastCommentCreate: jest.fn(),
    broadcastCommentUpdate: jest.fn(),
    broadcastCommentDelete: jest.fn(),
    broadcastProjectUpdate: jest.fn(),
    broadcastProjectDelete: jest.fn(),
  },
}));

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAppStore.getState().setProjects([]);
      useAppStore.getState().setTasks([]);
      useAppStore.getState().setCurrentProject(null);
      useAppStore.getState().setComments({});
      useAppStore.getState().setActiveUsers([]);
    });
  });

  describe("Project operations", () => {
    it("should set and get projects", () => {
      const { result } = renderHook(() => useAppStore());

      const mockProjects: ParsedProject[] = [
        {
          id: "project_1",
          name: "Test Project",
          description: "Test Description",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
      ];

      act(() => {
        result.current.setProjects(mockProjects);
      });

      expect(result.current.projects).toEqual(mockProjects);
    });

    it("should set and get current project", () => {
      const { result } = renderHook(() => useAppStore());

      const mockProject: ParsedProject = {
        id: "project_1",
        name: "Current Project",
        description: "Current Description",
        ownerId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
      };

      act(() => {
        result.current.setCurrentProject(mockProject);
      });

      expect(result.current.currentProject).toEqual(mockProject);
    });

    it("should handle project updates", () => {
      const { result } = renderHook(() => useAppStore());

      const mockProject: ParsedProject = {
        id: "project_1",
        name: "Original Project",
        description: "Original Description",
        ownerId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
      };

      act(() => {
        result.current.setProjects([mockProject]);
      });

      const updatedProject = { ...mockProject, name: "Updated Project" };

      act(() => {
        result.current.handleProjectUpdate(updatedProject);
      });

      expect(result.current.projects[0].name).toBe("Updated Project");
    });

    it("should handle project deletion", () => {
      const { result } = renderHook(() => useAppStore());

      const mockProjects: ParsedProject[] = [
        {
          id: "project_1",
          name: "Project 1",
          description: "Description 1",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
        {
          id: "project_2",
          name: "Project 2",
          description: "Description 2",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
      ];

      act(() => {
        result.current.setProjects(mockProjects);
      });

      act(() => {
        result.current.handleProjectDelete("project_1");
      });

      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0].id).toBe("project_2");
    });
  });

  describe("Task operations", () => {
    it("should set and get tasks", () => {
      const { result } = renderHook(() => useAppStore());

      const mockTasks: ParsedTask[] = [
        {
          id: "task_1",
          title: "Test Task",
          description: "Test Description",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project_1",
          authorId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          dependencies: [],
          tags: [],
          configuration: {},
        },
      ];

      act(() => {
        result.current.setTasks(mockTasks);
      });

      expect(result.current.tasks).toEqual(mockTasks);
    });

    it("should handle task updates", () => {
      const { result } = renderHook(() => useAppStore());

      const mockTask: ParsedTask = {
        id: "task_1",
        title: "Original Task",
        description: "Original Description",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
      };

      act(() => {
        result.current.setTasks([mockTask]);
      });

      const updatedTask = {
        ...mockTask,
        title: "Updated Task",
        status: "IN_PROGRESS",
      };

      act(() => {
        result.current.handleTaskUpdate(updatedTask);
      });

      expect(result.current.tasks[0].title).toBe("Updated Task");
      expect(result.current.tasks[0].status).toBe("IN_PROGRESS");
    });

    it("should handle task creation", () => {
      const { result } = renderHook(() => useAppStore());

      const mockTask: ParsedTask = {
        id: "task_new",
        title: "New Task",
        description: "New Description",
        status: "TODO",
        priority: "HIGH",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
      };

      act(() => {
        result.current.handleTaskCreate(mockTask);
      });

      expect(result.current.tasks).toContain(mockTask);
    });

    it("should handle task deletion", () => {
      const { result } = renderHook(() => useAppStore());

      const mockTasks: ParsedTask[] = [
        {
          id: "task_1",
          title: "Task 1",
          description: "Description 1",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project_1",
          authorId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          dependencies: [],
          tags: [],
          configuration: {},
        },
        {
          id: "task_2",
          title: "Task 2",
          description: "Description 2",
          status: "TODO",
          priority: "HIGH",
          projectId: "project_1",
          authorId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          dependencies: [],
          tags: [],
          configuration: {},
        },
      ];

      act(() => {
        result.current.setTasks(mockTasks);
      });

      act(() => {
        result.current.handleTaskDelete("task_1");
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe("task_2");
    });
  });

  describe("Comment operations", () => {
    it("should set and get comments", () => {
      const { result } = renderHook(() => useAppStore());

      const mockComments: Comment[] = [
        {
          id: "comment_1",
          taskId: "task_1",
          content: "Test comment",
          authorId: "user_123",
          timestamp: new Date(),
          author: {
            id: "user_123",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          task: {} as ParsedTask,
        },
      ];

      act(() => {
        result.current.setComments("task_1", mockComments);
      });

      expect(result.current.comments["task_1"]).toEqual(mockComments);
    });

    it("should handle comment updates", () => {
      const { result } = renderHook(() => useAppStore());

      const mockComment: Comment = {
        id: "comment_1",
        taskId: "task_1",
        content: "Original comment",
        authorId: "user_123",
        timestamp: new Date(),
        author: {
          id: "user_123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        task: {} as ParsedTask,
      };

      act(() => {
        result.current.setComments("task_1", [mockComment]);
      });

      const updatedComment = { ...mockComment, content: "Updated comment" };

      act(() => {
        result.current.handleCommentUpdate(updatedComment);
      });

      expect(result.current.comments["task_1"][0].content).toBe(
        "Updated comment"
      );
    });

    it("should handle comment creation", () => {
      const { result } = renderHook(() => useAppStore());

      const mockComment: Comment = {
        id: "comment_new",
        taskId: "task_1",
        content: "New comment",
        authorId: "user_123",
        timestamp: new Date(),
        author: {
          id: "user_123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        task: {} as ParsedTask,
      };

      act(() => {
        result.current.handleCommentCreate(mockComment);
      });

      expect(result.current.comments["task_1"]).toContain(mockComment);
    });

    it("should handle comment deletion", () => {
      const { result } = renderHook(() => useAppStore());

      const mockComments: Comment[] = [
        {
          id: "comment_1",
          taskId: "task_1",
          content: "Comment 1",
          authorId: "user_123",
          timestamp: new Date(),
          author: {
            id: "user_123",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          task: {} as ParsedTask,
        },
        {
          id: "comment_2",
          taskId: "task_1",
          content: "Comment 2",
          authorId: "user_123",
          timestamp: new Date(),
          author: {
            id: "user_123",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          task: {} as ParsedTask,
        },
      ];

      act(() => {
        result.current.setComments("task_1", mockComments);
      });

      act(() => {
        result.current.handleCommentDelete("task_1", "comment_1");
      });

      expect(result.current.comments["task_1"]).toHaveLength(1);
      expect(result.current.comments["task_1"][0].id).toBe("comment_2");
    });
  });

  describe("User presence operations", () => {
    it("should handle user presence updates", () => {
      const { result } = renderHook(() => useAppStore());

      const mockPresence = {
        projectId: "project_1",
        activeUsers: [
          {
            userId: "user_123",
            clientId: "client_123",
            joinedAt: Date.now(),
            initials: "TU",
          },
        ],
        userCount: 1,
      };

      act(() => {
        result.current.setCurrentProject({
          id: "project_1",
          name: "Test Project",
          description: "Test Description",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        });
      });

      act(() => {
        result.current.handleUserPresence(mockPresence);
      });

      expect(result.current.activeUsers).toEqual(mockPresence.activeUsers);
    });

    it("should not update active users for different project", () => {
      const { result } = renderHook(() => useAppStore());

      const mockPresence = {
        projectId: "project_2",
        activeUsers: [
          {
            userId: "user_123",
            clientId: "client_123",
            joinedAt: Date.now(),
            initials: "TU",
          },
        ],
        userCount: 1,
      };

      act(() => {
        result.current.setCurrentProject({
          id: "project_1",
          name: "Test Project",
          description: "Test Description",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        });
      });

      act(() => {
        result.current.handleUserPresence(mockPresence);
      });

      expect(result.current.activeUsers).toEqual([]);
    });
  });
});
