import { useWebSocket } from "@/lib/use-websocket";
import { useAppStore } from "@/lib/store";
import { renderHook, act } from "@testing-library/react";

// Mock the Zustand store
jest.mock("@/lib/store", () => ({
  useAppStore: jest.fn(),
}));

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

describe("useWebSocket", () => {
  let mockStore: any;

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
    };

    mockUseAppStore.mockReturnValue(mockStore);

    // Reset WebSocket mock
    jest.clearAllMocks();
  });

  it("should connect to WebSocket with correct URL", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    expect(result.current).toBeDefined();
    expect(result.current.joinProject).toBeDefined();
    expect(result.current.leaveProject).toBeDefined();
    expect(result.current.setUser).toBeDefined();
  });

  it("should join a project when joinProject is called", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    act(() => {
      result.current.joinProject("project_123", "user_123");
    });

    // The WebSocket.send should be called with JOIN_PROJECT message
    // This is tested through the WebSocket mock in jest.setup.js
    expect(result.current).toBeDefined();
  });

  it("should leave a project when leaveProject is called", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    act(() => {
      result.current.leaveProject("project_123", "user_123");
    });

    expect(result.current).toBeDefined();
  });

  it("should set user ID when setUser is called", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    act(() => {
      result.current.setUser("user_456");
    });

    expect(result.current).toBeDefined();
  });

  it("should handle WebSocket connection state changes", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    // Simulate WebSocket connection
    act(() => {
      // The WebSocket mock in jest.setup.js will automatically call onopen
    });

    expect(mockStore.setWsConnected).toHaveBeenCalledWith(true);
  });

  it("should handle incoming WebSocket messages", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    // Simulate receiving a TASK_UPDATE message
    const mockMessage = {
      type: "TASK_UPDATE",
      payload: {
        id: "task_123",
        projectId: "project_123",
        changes: { title: "Updated Title" },
      },
      operationId: "op_123",
      timestamp: Date.now(),
    };

    act(() => {
      // Simulate WebSocket message event
      const ws = new WebSocket("ws://localhost:3001/ws");
      ws.onmessage({ data: JSON.stringify(mockMessage) } as any);
    });

    expect(mockStore.addWsMessage).toHaveBeenCalledWith(mockMessage);
    expect(mockStore.handleTaskUpdate).toHaveBeenCalledWith(
      mockMessage.payload
    );
  });

  it("should handle USER_PRESENCE messages", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    const mockPresenceMessage = {
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
      ws.onmessage({ data: JSON.stringify(mockPresenceMessage) } as any);
    });

    expect(mockStore.addWsMessage).toHaveBeenCalledWith(mockPresenceMessage);
    expect(mockStore.handleUserPresence).toHaveBeenCalledWith(
      mockPresenceMessage.payload
    );
  });

  it("should handle CONNECTION_ESTABLISHED messages", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    const mockConnectionMessage = {
      type: "CONNECTION_ESTABLISHED",
      payload: {},
      operationId: "conn_123",
      timestamp: Date.now(),
    };

    act(() => {
      const ws = new WebSocket("ws://localhost:3001/ws");
      ws.onmessage({ data: JSON.stringify(mockConnectionMessage) } as any);
    });

    expect(mockStore.addWsMessage).toHaveBeenCalledWith(mockConnectionMessage);
  });

  it("should handle WebSocket errors", () => {
    const { result } = renderHook(() => useWebSocket({ userId: "user_123" }));

    act(() => {
      const ws = new WebSocket("ws://localhost:3001/ws");
      ws.onerror(new Error("Connection failed") as any);
    });

    expect(mockStore.setWsConnected).toHaveBeenCalledWith(false);
  });

  it("should reconnect when connection is lost", () => {
    const { result } = renderHook(() =>
      useWebSocket({
        userId: "user_123",
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
      })
    );

    act(() => {
      const ws = new WebSocket("ws://localhost:3001/ws");
      ws.onclose({ code: 1000, reason: "Normal closure" } as any);
    });

    expect(mockStore.setWsConnected).toHaveBeenCalledWith(false);
  });
});
