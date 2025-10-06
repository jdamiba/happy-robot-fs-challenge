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
  }

  /**
   * Send a message to the WebSocket server
   * The server will broadcast it to all connected clients in the project
   */
  private async sendMessage(message: WebSocketMessage): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error("Failed to send WebSocket message:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
    }
  }

  /**
   * Broadcast task creation to all clients in the project
   */
  async broadcastTaskCreate(projectId: string, task: unknown): Promise<void> {
    await this.sendMessage({
      type: "TASK_CREATE",
      payload: task,
      projectId,
      operationId: `task-create-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast task update to all clients in the project
   */
  async broadcastTaskUpdate(projectId: string, update: unknown): Promise<void> {
    await this.sendMessage({
      type: "TASK_UPDATE",
      payload: update,
      projectId,
      operationId: `task-update-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast task deletion to all clients in the project
   */
  async broadcastTaskDelete(projectId: string, taskId: string): Promise<void> {
    await this.sendMessage({
      type: "TASK_DELETE",
      payload: { taskId },
      projectId,
      operationId: `task-delete-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast comment creation to all clients in the project
   */
  async broadcastCommentCreate(
    projectId: string,
    comment: unknown
  ): Promise<void> {
    await this.sendMessage({
      type: "COMMENT_CREATE",
      payload: comment,
      projectId,
      operationId: `comment-create-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast comment update to all clients in the project
   */
  async broadcastCommentUpdate(
    projectId: string,
    update: unknown
  ): Promise<void> {
    await this.sendMessage({
      type: "COMMENT_UPDATE",
      payload: update,
      projectId,
      operationId: `comment-update-${Date.now()}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast comment deletion to all clients in the project
   */
  async broadcastCommentDelete(
    projectId: string,
    commentId: string
  ): Promise<void> {
    await this.sendMessage({
      type: "COMMENT_DELETE",
      payload: { id: commentId },
      projectId,
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
