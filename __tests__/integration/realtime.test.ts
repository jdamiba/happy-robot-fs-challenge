import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "@/lib/use-websocket";
import { useAppStore } from "@/lib/store";

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

describe("Real-time Integration Tests", () => {
  let mockStore: any;
  let mockWebSocket: any;

  beforeEach(() => {
    mockStore = {
      wsConnected: false,
      setWsConnected: jest.fn(),
      addWsMessage: jest.fn(),
      handleTaskUpdate: jest.fn(),
      handleTaskCreate: jest.fn(),
      handleTaskDelete: jest.fn(),
      handleCommentUpdate: jest.fn(),
      handleCommentCreate: jest.fn(),
      handleCommentDelete: jest.fn(),
      handleUserPresence: jest.fn(),
      handleProjectUpdate: jest.fn(),
      handleProjectDelete: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("WebSocket Connection Flow", () => {
    it("should establish connection and set user ID", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      // Simulate WebSocket connection
      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onopen();
      });

      expect(mockStore.setWsConnected).toHaveBeenCalledWith(true);
    });

    it("should join project room and receive user presence", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      // Simulate joining a project
      act(() => {
        result.current.joinProject("project_123", "user_123");
      });

      // Simulate receiving user presence
      const presenceMessage = {
        type: "USER_PRESENCE",
        payload: {
          projectId: "project_123",
          activeUsers: [
            {
              userId: "user_123",
              clientId: "client_123",
              joinedAt: Date.now(),
              initials: "TU",
            },
          ],
          userCount: 1,
        },
        operationId: "presence_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(presenceMessage) } as any);
      });

      expect(mockStore.handleUserPresence).toHaveBeenCalledWith(
        presenceMessage.payload
      );
    });
  });

  describe("Task Real-time Updates", () => {
    it("should handle task creation broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const taskCreateMessage = {
        type: "TASK_CREATE",
        payload: {
          id: "task_new",
          title: "New Task",
          description: "New Description",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project_123",
          authorId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          dependencies: [],
          tags: [],
          configuration: {},
        },
        operationId: "create_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(taskCreateMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(taskCreateMessage);
      expect(mockStore.handleTaskCreate).toHaveBeenCalledWith(
        taskCreateMessage.payload
      );
    });

    it("should handle task update broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const taskUpdateMessage = {
        type: "TASK_UPDATE",
        payload: {
          id: "task_123",
          projectId: "project_123",
          changes: {
            title: "Updated Task",
            status: "IN_PROGRESS",
          },
          operationId: "update_123",
          timestamp: Date.now(),
        },
        operationId: "update_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(taskUpdateMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(taskUpdateMessage);
      expect(mockStore.handleTaskUpdate).toHaveBeenCalledWith(
        taskUpdateMessage.payload
      );
    });

    it("should handle task deletion broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const taskDeleteMessage = {
        type: "TASK_DELETE",
        payload: {
          id: "task_123",
          projectId: "project_123",
        },
        operationId: "delete_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(taskDeleteMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(taskDeleteMessage);
      expect(mockStore.handleTaskDelete).toHaveBeenCalledWith("task_123");
    });
  });

  describe("Comment Real-time Updates", () => {
    it("should handle comment creation broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const commentCreateMessage = {
        type: "COMMENT_CREATE",
        payload: {
          id: "comment_new",
          taskId: "task_123",
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
        },
        operationId: "comment_create_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(commentCreateMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(commentCreateMessage);
      expect(mockStore.handleCommentCreate).toHaveBeenCalledWith(
        commentCreateMessage.payload
      );
    });

    it("should handle comment update broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const commentUpdateMessage = {
        type: "COMMENT_UPDATE",
        payload: {
          id: "comment_123",
          taskId: "task_123",
          content: "Updated comment",
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
        },
        operationId: "comment_update_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(commentUpdateMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(commentUpdateMessage);
      expect(mockStore.handleCommentUpdate).toHaveBeenCalledWith(
        commentUpdateMessage.payload
      );
    });

    it("should handle comment deletion broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const commentDeleteMessage = {
        type: "COMMENT_DELETE",
        payload: {
          id: "comment_123",
          taskId: "task_123",
        },
        operationId: "comment_delete_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(commentDeleteMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(commentDeleteMessage);
      expect(mockStore.handleCommentDelete).toHaveBeenCalledWith(
        "task_123",
        "comment_123"
      );
    });
  });

  describe("Project Real-time Updates", () => {
    it("should handle project update broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const projectUpdateMessage = {
        type: "PROJECT_UPDATE",
        payload: {
          id: "project_123",
          name: "Updated Project",
          description: "Updated Description",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
        operationId: "project_update_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(projectUpdateMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(projectUpdateMessage);
      expect(mockStore.handleProjectUpdate).toHaveBeenCalledWith(
        projectUpdateMessage.payload
      );
    });

    it("should handle project deletion broadcast", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const projectDeleteMessage = {
        type: "PROJECT_DELETE",
        payload: {
          id: "project_123",
        },
        operationId: "project_delete_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(projectDeleteMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(projectDeleteMessage);
      expect(mockStore.handleProjectDelete).toHaveBeenCalledWith("project_123");
    });
  });

  describe("Error Handling", () => {
    it("should handle WebSocket errors gracefully", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onerror(new Error("Connection failed") as any);
      });

      expect(mockStore.setWsConnected).toHaveBeenCalledWith(false);
    });

    it("should handle malformed messages gracefully", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: "invalid json" } as any);
      });

      // Should not crash and should not call store methods
      expect(mockStore.addWsMessage).not.toHaveBeenCalled();
    });

    it("should handle unknown message types gracefully", async () => {
      const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

      const unknownMessage = {
        type: "UNKNOWN_TYPE",
        payload: {},
        operationId: "unknown_123",
        timestamp: Date.now(),
      };

      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onmessage({ data: JSON.stringify(unknownMessage) } as any);
      });

      expect(mockStore.addWsMessage).toHaveBeenCalledWith(unknownMessage);
      // Should not call any specific handlers for unknown types
      expect(mockStore.handleTaskUpdate).not.toHaveBeenCalled();
      expect(mockStore.handleCommentUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Connection Recovery", () => {
    it("should reconnect after connection loss", async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          userId: "user_123",
          reconnectInterval: 1000,
          maxReconnectAttempts: 3,
        })
      );

      // Simulate connection loss
      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onclose({ code: 1000, reason: "Normal closure" } as any);
      });

      expect(mockStore.setWsConnected).toHaveBeenCalledWith(false);

      // Simulate reconnection
      act(() => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onopen();
      });

      expect(mockStore.setWsConnected).toHaveBeenCalledWith(true);
    });
  });
});
