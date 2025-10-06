import { useEffect, useRef, useCallback, useState } from "react";
import { useAppStore } from "./store";
import {
  WebSocketMessage,
  TaskUpdate,
  CommentUpdate,
  ParsedTask,
  Comment,
} from "./types";

interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    url = isClient && typeof window !== "undefined" && window.location
      ? window.location.hostname === "localhost"
        ? "ws://localhost:3001/ws" // Local development
        : process.env.NEXT_PUBLIC_WS_URL ||
          `wss://${window.location.hostname}/ws` // Production
      : "ws://localhost:3001/ws", // Default fallback for SSR
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);

  const {
    wsConnected,
    setWsConnected,
    addWsMessage,
    handleTaskUpdate,
    handleTaskCreate,
    handleTaskDelete,
    handleCommentUpdate,
    handleCommentCreate,
    handleCommentDelete,
  } = useAppStore();

  const connect = useCallback(() => {
    if (
      !isClient || // Don't connect during SSR
      isConnectingRef.current ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    isConnectingRef.current = true;
    console.log("Connecting to WebSocket...", {
      url,
      timestamp: new Date().toISOString(),
      env: {
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
    });

    try {
      wsRef.current = new WebSocket(url);
      console.log("WebSocket instance created:", {
        readyState: wsRef.current.readyState,
      });

      wsRef.current.onopen = () => {
        console.log("WebSocket connected successfully", {
          readyState: wsRef.current?.readyState,
          url: wsRef.current?.url,
          timestamp: new Date().toISOString(),
        });
        setWsConnected(true);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          addWsMessage(message);

          // Handle different message types
          switch (message.type) {
            case "TASK_UPDATE":
              handleTaskUpdate(message.payload as TaskUpdate);
              break;
            case "TASK_CREATE":
              handleTaskCreate(message.payload as ParsedTask);
              break;
            case "TASK_DELETE":
              const deletePayload = message.payload as { taskId: string };
              handleTaskDelete(deletePayload.taskId);
              break;
            case "COMMENT_UPDATE":
              console.log("Received COMMENT_UPDATE:", message.payload);
              handleCommentUpdate(message.payload as CommentUpdate);
              break;
            case "COMMENT_CREATE":
              console.log("Received COMMENT_CREATE:", message.payload);
              handleCommentCreate(message.payload as Comment);
              break;
            case "COMMENT_DELETE":
              console.log("Received COMMENT_DELETE:", message.payload);
              const commentDeletePayload = message.payload as {
                taskId: string;
                id: string;
              };
              handleCommentDelete(
                commentDeletePayload.taskId,
                commentDeletePayload.id
              );
              break;
            case "ERROR":
              const errorPayload = message.payload as { error: string };
              console.error("WebSocket error:", errorPayload.error);
              break;
            default:
              console.log("Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          readyState: wsRef.current?.readyState,
          timestamp: new Date().toISOString(),
        });
        setWsConnected(false);
        isConnectingRef.current = false;

        // Attempt to reconnect if not a manual close
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", {
          error,
          errorType: typeof error,
          errorKeys: error ? Object.keys(error) : "no keys",
          readyState: wsRef.current?.readyState,
          url: wsRef.current?.url,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
        isConnectingRef.current = false;
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      isConnectingRef.current = false;
    }
  }, [
    url,
    reconnectInterval,
    maxReconnectAttempts,
    setWsConnected,
    addWsMessage,
    handleTaskUpdate,
    handleTaskCreate,
    handleTaskDelete,
    handleCommentUpdate,
    handleCommentCreate,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setWsConnected(false);
    isConnectingRef.current = false;
  }, [setWsConnected]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log("sendMessage called:", {
        message,
        readyState: wsRef.current?.readyState,
        isOpen: wsRef.current?.readyState === WebSocket.OPEN,
        connected: wsConnected,
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        console.log("Message sent successfully:", message);
      } else {
        console.warn("WebSocket is not connected. Cannot send message:", {
          message,
          readyState: wsRef.current?.readyState,
          wsConnected,
        });
      }
    },
    [wsConnected]
  );

  const joinProject = useCallback(
    (projectId: string) => {
      console.log("joinProject called with:", projectId);
      sendMessage({
        type: "JOIN_PROJECT",
        projectId: projectId,
        operationId: `join-${Date.now()}`,
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  const leaveProject = useCallback(
    (projectId: string) => {
      sendMessage({
        type: "LEAVE_PROJECT",
        projectId: projectId,
        operationId: `leave-${Date.now()}`,
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  const setUser = useCallback(
    (userId: string) => {
      sendMessage({
        type: "SET_USER",
        payload: { userId },
        operationId: `set-user-${Date.now()}`,
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  // Connect on mount with a small delay to ensure page is ready
  useEffect(() => {
    if (!isClient) return; // Don't connect during SSR

    const connectWithDelay = () => {
      setTimeout(() => {
        console.log("Attempting WebSocket connection after delay...");
        connect();
      }, 1000); // 1 second delay
    };

    connectWithDelay();

    return () => {
      disconnect();
    };
  }, [isClient, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    wsConnected,
    connect,
    disconnect,
    sendMessage,
    joinProject,
    leaveProject,
    setUser,
  };
}
