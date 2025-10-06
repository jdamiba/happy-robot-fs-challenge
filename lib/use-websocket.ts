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
  userId?: string;
  userInfo?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
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
    userId,
    userInfo,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const setUserRef = useRef<
    | ((userId: string, userInfo?: UseWebSocketOptions["userInfo"]) => void)
    | null
  >(null);
  const userSetRef = useRef<boolean>(false);

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
    handleUserPresence,
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

        // Set user ID if provided (with a small delay to ensure WebSocket is fully ready)
        if (userId) {
          setTimeout(() => {
            console.log("Setting user ID on WebSocket connection:", userId);
            sendMessage({
              type: "SET_USER",
              payload: { userId, userInfo },
              operationId: `set-user-${Date.now()}`,
              timestamp: Date.now(),
            });
          }, 100);
        } else {
          console.log("No userId provided to WebSocket connection");
        }
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
            case "USER_PRESENCE":
              console.log("Received USER_PRESENCE:", message.payload);
              const presencePayload = message.payload as {
                projectId: string;
                activeUsers: Array<{
                  userId: string;
                  clientId: string;
                  joinedAt: number;
                  initials?: string;
                }>;
                userCount: number;
              };
              handleUserPresence(presencePayload);
              break;

            case "CONNECTION_ESTABLISHED":
              console.log("🔗 WebSocket connection established on server side");
              // Note: SET_USER will be sent by the useEffect when userId/userInfo are available
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

        // Reset user set flag when connection is lost
        userSetRef.current = false;
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

    // Reset user set flag when disconnecting
    userSetRef.current = false;
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

  const setUser = useCallback(
    (userId: string, userInfo?: UseWebSocketOptions["userInfo"]) => {
      // Only send SET_USER once per session
      if (userSetRef.current) {
        console.log("🔧 setUser called but already set, skipping:", {
          userId,
          userInfo,
          hasUserInfo: !!userInfo,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      console.log("🔧 setUser called with:", {
        userId,
        userInfo,
        hasUserInfo: !!userInfo,
        userInfoKeys: userInfo ? Object.keys(userInfo) : [],
        timestamp: new Date().toISOString(),
      });

      userSetRef.current = true;
      sendMessage({
        type: "SET_USER",
        payload: { userId, userInfo },
        operationId: `set-user-${Date.now()}`,
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  const joinProject = useCallback(
    (projectId: string, userId?: string) => {
      console.log("joinProject called with:", projectId, "userId:", userId);

      // Ensure user is set before joining project
      if (userId && !userSetRef.current) {
        console.log("Setting user before joining project:", userId);
        setUser(userId, userInfo);
      }

      sendMessage({
        type: "JOIN_PROJECT",
        projectId: projectId,
        userId: userId,
        operationId: `join-${Date.now()}`,
        timestamp: Date.now(),
      });
    },
    [sendMessage, setUser, userInfo]
  );

  const leaveProject = useCallback(
    (projectId: string, userId?: string) => {
      console.log("leaveProject called with:", projectId, "userId:", userId);
      sendMessage({
        type: "LEAVE_PROJECT",
        projectId: projectId,
        userId: userId,
        operationId: `leave-${Date.now()}`,
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  // Store setUser in ref so it can be accessed in connect function
  setUserRef.current = setUser;

  // Call setUser when userId changes after WebSocket is connected
  // Only send SET_USER once per session to avoid spam
  useEffect(() => {
    if (wsConnected && userId && !userSetRef.current) {
      console.log("🔄 userId/userInfo changed, calling setUser:", {
        wsConnected,
        userId,
        userInfo,
        hasUserInfo: !!userInfo,
        userInfoContent: userInfo
          ? {
              name: userInfo.name,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              email: userInfo.email,
            }
          : null,
        timestamp: new Date().toISOString(),
      });
      setUser(userId, userInfo);
    }
  }, [userId, userInfo, wsConnected, setUser]);

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
