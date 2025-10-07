import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "./store";
import { WebSocketMessage } from "./types";

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
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws",
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    userId = "test-user",
    userInfo,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userSetRef = useRef(false);
  const currentProjectRef = useRef<string | null>(null);
  const hasJoinedProjectRef = useRef(false);

  // Get Zustand store functions
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

  // Check if we're on the client side
  const isClient = typeof window !== "undefined";

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
    (projectId: string) => {
      console.log("🔧 joinProject called:", {
        projectId,
        currentProject: currentProjectRef.current,
        hasJoined: hasJoinedProjectRef.current,
        wsConnected,
        timestamp: new Date().toISOString(),
      });

      // Leave current project if different
      if (
        currentProjectRef.current &&
        currentProjectRef.current !== projectId
      ) {
        sendMessage({
          type: "LEAVE_PROJECT",
          projectId: currentProjectRef.current,
          operationId: `leave-project-${Date.now()}`,
          timestamp: Date.now(),
        });
        hasJoinedProjectRef.current = false;
      }

      // Join new project
      if (
        projectId &&
        (!hasJoinedProjectRef.current ||
          currentProjectRef.current !== projectId)
      ) {
        currentProjectRef.current = projectId;
        hasJoinedProjectRef.current = true;

        sendMessage({
          type: "JOIN_PROJECT",
          projectId,
          userId,
          operationId: `join-project-${Date.now()}`,
          timestamp: Date.now(),
        });
      }
    },
    [sendMessage, userId, wsConnected]
  );

  const leaveProject = useCallback(
    (projectId: string) => {
      console.log("🔧 leaveProject called:", {
        projectId,
        currentProject: currentProjectRef.current,
        hasJoined: hasJoinedProjectRef.current,
        timestamp: new Date().toISOString(),
      });

      sendMessage({
        type: "LEAVE_PROJECT",
        projectId,
        operationId: `leave-project-${Date.now()}`,
        timestamp: Date.now(),
      });

      if (currentProjectRef.current === projectId) {
        currentProjectRef.current = null;
        hasJoinedProjectRef.current = false;
      }
    },
    [sendMessage]
  );

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

      // Add a small delay to ensure WebSocket is fully ready
      setTimeout(() => {
        setUser(userId, userInfo);
      }, 200);
    }
  }, [userId, userInfo, wsConnected, setUser]);

  // Connect on mount with a small delay to ensure page is ready
  useEffect(() => {
    if (!isClient) return; // Don't connect during SSR

    // Use refs to avoid dependency issues
    const connectWithDelay = () => {
      setTimeout(() => {
        console.log("Attempting WebSocket connection after delay...");
        // Call connect directly without depending on the function reference
        if (
          !isConnectingRef.current &&
          wsRef.current?.readyState !== WebSocket.OPEN
        ) {
          isConnectingRef.current = true;
          console.log("Connecting to WebSocket...", {
            url,
            timestamp: new Date().toISOString(),
          });

          try {
            wsRef.current = new WebSocket(url);

            wsRef.current.onopen = () => {
              console.log("WebSocket connected successfully");
              setWsConnected(true);
              isConnectingRef.current = false;
              reconnectAttemptsRef.current = 0;

              // Set user ID if provided
              if (userId) {
                setTimeout(() => {
                  console.log(
                    "Setting user ID on WebSocket connection:",
                    userId
                  );
                  setUser(userId, userInfo);
                }, 100);
              }
            };

            wsRef.current.onclose = (event) => {
              console.log("WebSocket connection closed", {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
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
                setTimeout(() => {
                  connectWithDelay();
                }, reconnectInterval);
              }
            };

            wsRef.current.onerror = (error) => {
              console.error("WebSocket error:", error);
              isConnectingRef.current = false;
            };

            wsRef.current.onmessage = (event) => {
              try {
                const message = JSON.parse(event.data);

                // Skip messages from the current user to prevent processing our own updates
                if (message.userId === userId) {
                  console.log("Ignoring message from self:", {
                    type: message.type,
                    userId: message.userId,
                    currentUserId: userId,
                    timestamp: new Date().toISOString(),
                  });
                  return;
                }

                // Use the current values from the store
                addWsMessage(message);

                switch (message.type) {
                  case "TASK_UPDATE":
                    handleTaskUpdate(message.payload);
                    break;
                  case "TASK_CREATE":
                    handleTaskCreate(message.payload);
                    break;
                  case "TASK_DELETE":
                    handleTaskDelete(message.payload.taskId);
                    break;
                  case "COMMENT_UPDATE":
                    handleCommentUpdate(message.payload);
                    break;
                  case "COMMENT_CREATE":
                    handleCommentCreate(message.payload);
                    break;
                  case "COMMENT_DELETE":
                    handleCommentDelete(
                      message.payload.taskId,
                      message.payload.commentId
                    );
                    break;
                  case "USER_PRESENCE":
                    handleUserPresence(message.payload);
                    break;
                }
              } catch (error) {
                console.error("Error parsing WebSocket message:", error);
              }
            };
          } catch (error) {
            console.error("Error creating WebSocket connection:", error);
            isConnectingRef.current = false;
          }
        }
      }, 1000); // 1 second delay
    };

    connectWithDelay();

    return () => {
      // Cleanup function
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
      setWsConnected(false);
      isConnectingRef.current = false;
    };
  }, [isClient]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  return {
    wsConnected,
    sendMessage,
    joinProject,
    leaveProject,
    disconnect,
  };
}
