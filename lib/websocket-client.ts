/**
 * WebSocket Client Service
 * Handles sending messages to the external WebSocket server via HTTP API
 */

interface WebSocketMessage {
  type: string;
  payload: unknown;
  operationId?: string;
  timestamp?: number;
  userId?: string;
  projectId?: string;
}

class WebSocketClientService {
  private serverUrl: string;

  constructor() {
    // Use environment variable for external WebSocket server URL
    this.serverUrl =
      process.env.WEBSOCKET_SERVER_URL || "http://localhost:3001";

    console.log(
      "WebSocketClientService initialized with serverUrl:",
      this.serverUrl
    );
  }

  /**
   * Send a message to the WebSocket server
   * The server will broadcast it to all connected clients in the project
   */
  private async sendMessage(message: WebSocketMessage): Promise<void> {
    const url = `${this.serverUrl}/broadcast`;
    console.log("Sending WebSocket message:", {
      url,
      message,
      serverUrl: this.serverUrl,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      console.log("WebSocket message response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        console.error("Failed to send WebSocket message:", response.statusText);
      } else {
        console.log("WebSocket message sent successfully");
      }
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
    }
  }

  /**
   * Broadcast task creation to all clients in the project
   */
  async broadcastTaskCreate(
    projectId: string,
    task: unknown,
    userId?: string
  ): Promise<void> {
    await this.sendMessage({
      type: "TASK_CREATE",
      payload: task,
      projectId,
      userId,
      operationId: `task-create-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast task update to all clients in the project
   */
  async broadcastTaskUpdate(
    projectId: string,
    update: unknown,
    userId?: string
  ): Promise<void> {
    await this.sendMessage({
      type: "TASK_UPDATE",
      payload: update,
      projectId,
      userId,
      operationId: `task-update-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast task deletion to all clients in the project
   */
  async broadcastTaskDelete(
    projectId: string,
    taskId: string,
    userId?: string
  ): Promise<void> {
    await this.sendMessage({
      type: "TASK_DELETE",
      payload: { taskId },
      projectId,
      userId,
      operationId: `task-delete-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast comment creation to all clients in the project
   */
  async broadcastCommentCreate(
    projectId: string,
    comment: unknown,
    userId?: string
  ): Promise<void> {
    await this.sendMessage({
      type: "COMMENT_CREATE",
      payload: comment,
      projectId,
      userId,
      operationId: `comment-create-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast comment update to all clients in the project
   */
  async broadcastCommentUpdate(
    projectId: string,
    update: unknown,
    userId?: string
  ): Promise<void> {
    await this.sendMessage({
      type: "COMMENT_UPDATE",
      payload: update,
      projectId,
      userId,
      operationId: `comment-update-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast comment deletion to all clients in the project
   */
  async broadcastCommentDelete(
    projectId: string,
    commentId: string,
    userId?: string
  ): Promise<void> {
    await this.sendMessage({
      type: "COMMENT_DELETE",
      payload: { id: commentId },
      projectId,
      userId,
      operationId: `comment-delete-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast project update to all clients in the project
   */
  async broadcastProjectUpdate(
    projectId: string,
    update: unknown
  ): Promise<void> {
    await this.sendMessage({
      type: "PROJECT_UPDATE",
      payload: update,
      projectId,
      operationId: `project-update-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast project deletion to all clients
   */
  async broadcastProjectDelete(projectId: string): Promise<void> {
    await this.sendMessage({
      type: "PROJECT_DELETE",
      payload: { projectId },
      projectId,
      operationId: `project-delete-${Date.now()}`,
      timestamp: Date.now(),
    });
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClientService();
