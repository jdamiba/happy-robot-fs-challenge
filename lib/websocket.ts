import { WebSocketServer, WebSocket } from "ws";
import {
  WebSocketMessage,
  TaskUpdate,
  CommentUpdate,
  ParsedTask,
  Comment,
} from "./types";
import { generateOperationId } from "./utils";

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  projectId?: string;
  lastPing: number;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private projectRooms: Map<string, Set<string>> = new Map();

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket) => {
      const clientId = generateOperationId();
      const client: ClientConnection = {
        ws,
        userId: "anonymous", // In a real app, extract from auth token
        lastPing: Date.now(),
      };

      this.clients.set(clientId, client);

      ws.on("message", (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch {
          this.sendError(clientId, "Invalid message format");
        }
      });

      ws.on("close", () => {
        this.removeClient(clientId);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.removeClient(clientId);
      });

      ws.on("pong", () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
        }
      });

      // Send welcome message
      this.sendMessage(clientId, {
        type: "PROJECT_UPDATE",
        payload: { message: "Connected to real-time updates" },
        operationId: generateOperationId(),
        timestamp: Date.now(),
      });
    });

    // Ping clients every 30 seconds to keep connection alive
    setInterval(() => {
      this.pingClients();
    }, 30000);
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "JOIN_PROJECT":
        const joinPayload = message.payload as { projectId: string };
        this.joinProject(clientId, joinPayload.projectId);
        break;
      case "LEAVE_PROJECT":
        const leavePayload = message.payload as { projectId: string };
        this.leaveProject(clientId, leavePayload.projectId);
        break;
      case "SET_USER":
        const userPayload = message.payload as { userId: string };
        client.userId = userPayload.userId;
        break;
      default:
        // Forward message to other clients in the same project
        this.broadcastToProject(client.projectId, message, clientId);
    }
  }

  private joinProject(clientId: string, projectId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave previous project if any
    if (client.projectId) {
      this.leaveProject(clientId, client.projectId);
    }

    client.projectId = projectId;

    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId)!.add(clientId);

    this.sendMessage(clientId, {
      type: "PROJECT_UPDATE",
      payload: { message: `Joined project ${projectId}` },
      operationId: generateOperationId(),
      timestamp: Date.now(),
    });
  }

  private leaveProject(clientId: string, projectId: string) {
    const room = this.projectRooms.get(projectId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.projectRooms.delete(projectId);
      }
    }

    const client = this.clients.get(clientId);
    if (client && client.projectId === projectId) {
      client.projectId = undefined;
    }
  }

  private removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client && client.projectId) {
      this.leaveProject(clientId, client.projectId);
    }
    this.clients.delete(clientId);
  }

  private pingClients() {
    const now = Date.now();
    const timeout = 60000; // 60 seconds

    for (const [clientId, client] of this.clients) {
      if (now - client.lastPing > timeout) {
        client.ws.terminate();
        this.removeClient(clientId);
      } else {
        client.ws.ping();
      }
    }
  }

  private sendMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private sendError(clientId: string, error: string) {
    this.sendMessage(clientId, {
      type: "ERROR",
      payload: { error },
      operationId: generateOperationId(),
      timestamp: Date.now(),
    });
  }

  private broadcastToProject(
    projectId: string | undefined,
    message: WebSocketMessage,
    excludeClientId?: string
  ) {
    if (!projectId) return;

    const room = this.projectRooms.get(projectId);
    if (!room) return;

    for (const clientId of room) {
      if (clientId !== excludeClientId) {
        this.sendMessage(clientId, message);
      }
    }
  }

  // Public methods for broadcasting updates
  public broadcastTaskUpdate(projectId: string, update: TaskUpdate) {
    const message: WebSocketMessage = {
      type: "TASK_UPDATE",
      payload: update,
      operationId: update.operationId,
      timestamp: update.timestamp,
    };
    this.broadcastToProject(projectId, message);
  }

  public broadcastTaskCreate(projectId: string, task: ParsedTask) {
    const message: WebSocketMessage = {
      type: "TASK_CREATE",
      payload: task,
      operationId: generateOperationId(),
      timestamp: Date.now(),
    };
    this.broadcastToProject(projectId, message);
  }

  public broadcastTaskDelete(projectId: string, taskId: string) {
    const message: WebSocketMessage = {
      type: "TASK_DELETE",
      payload: { taskId },
      operationId: generateOperationId(),
      timestamp: Date.now(),
    };
    this.broadcastToProject(projectId, message);
  }

  public broadcastCommentUpdate(projectId: string, update: CommentUpdate) {
    const message: WebSocketMessage = {
      type: "COMMENT_UPDATE",
      payload: update,
      operationId: update.operationId,
      timestamp: update.timestamp,
    };
    this.broadcastToProject(projectId, message);
  }

  public broadcastCommentCreate(projectId: string, comment: Comment) {
    const message: WebSocketMessage = {
      type: "COMMENT_CREATE",
      payload: comment,
      operationId: generateOperationId(),
      timestamp: Date.now(),
    };
    this.broadcastToProject(projectId, message);
  }

  public broadcastCommentDelete(projectId: string, commentId: string) {
    const message: WebSocketMessage = {
      type: "COMMENT_DELETE",
      payload: { id: commentId },
      operationId: generateOperationId(),
      timestamp: Date.now(),
    };
    this.broadcastToProject(projectId, message);
  }

  public getConnectedClients(projectId?: string): number {
    if (projectId) {
      return this.projectRooms.get(projectId)?.size || 0;
    }
    return this.clients.size;
  }

  public close() {
    this.wss.close();
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(port?: number): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(port);
  }
  return wsManager;
}

export { WebSocketManager };
