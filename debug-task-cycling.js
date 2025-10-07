#!/usr/bin/env node

/**
 * Debug Task Cycling Issue
 *
 * This script helps debug the task cycling issue by monitoring
 * WebSocket messages and checking if users receive their own updates.
 */

const WebSocket = require("ws");

class TaskCyclingDebugger {
  constructor() {
    this.productionUrl = "wss://happy-robot-fs-challenge.onrender.com/ws";
    this.connections = [];
    this.messages = [];
    this.startTime = Date.now();
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  createWebSocketConnection(id) {
    this.log(`🔌 Creating WebSocket connection ${id}...`);

    const ws = new WebSocket(this.productionUrl);
    const connectionInfo = {
      id,
      ws,
      connectTime: null,
      isConnected: false,
      userId: `test-user-${id}`,
      messagesReceived: 0,
      ownMessagesReceived: 0,
    };

    ws.on("open", () => {
      this.log(`✅ WebSocket ${id} connected successfully`);
      connectionInfo.isConnected = true;
      connectionInfo.connectTime = Date.now();

      // Send SET_USER message
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const setUserMessage = {
            type: "SET_USER",
            payload: {
              userId: connectionInfo.userId,
              userInfo: { name: `Test User ${id}` },
            },
            operationId: `test-set-user-${Date.now()}`,
            timestamp: Date.now(),
          };

          this.log(
            `📤 Sending SET_USER message from ${id} (userId: ${connectionInfo.userId})`
          );
          ws.send(JSON.stringify(setUserMessage));
        }
      }, 1000);

      // Send JOIN_PROJECT message
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const joinProjectMessage = {
            type: "JOIN_PROJECT",
            projectId: `test-project-${id}`,
            userId: connectionInfo.userId,
            operationId: `test-join-project-${Date.now()}`,
            timestamp: Date.now(),
          };

          this.log(`📤 Sending JOIN_PROJECT message from ${id}`);
          ws.send(JSON.stringify(joinProjectMessage));
        }
      }, 2000);

      // Send a TASK_UPDATE message to test if user receives their own update
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const taskUpdateMessage = {
            type: "TASK_UPDATE",
            payload: {
              id: "test-task-123",
              projectId: `test-project-${id}`,
              changes: {
                status: "IN_PROGRESS",
              },
              operationId: `test-task-update-${Date.now()}`,
              timestamp: Date.now(),
            },
            userId: connectionInfo.userId,
          };

          this.log(
            `📤 Sending TASK_UPDATE message from ${id} (userId: ${connectionInfo.userId})`
          );
          ws.send(JSON.stringify(taskUpdateMessage));
        }
      }, 5000);
    });

    ws.on("message", (data) => {
      connectionInfo.messagesReceived++;

      try {
        const message = JSON.parse(data.toString());
        const messageInfo = {
          connectionId: id,
          userId: connectionInfo.userId,
          messageType: message.type,
          messageUserId: message.userId,
          timestamp: Date.now(),
          timeSinceStart: Date.now() - this.startTime,
        };

        this.messages.push(messageInfo);

        // Check if this user received their own message
        if (message.userId === connectionInfo.userId) {
          connectionInfo.ownMessagesReceived++;
          this.log(
            `⚠️ ${id} received their own ${message.type} message! (userId: ${message.userId})`
          );
        } else {
          this.log(
            `📨 ${id} received ${message.type} from user ${message.userId}`
          );
        }

        if (message.type === "CONNECTION_ESTABLISHED") {
          this.log(`   └─ Client ID: ${message.clientId}`);
        }
      } catch (error) {
        this.log(`⚠️ WebSocket ${id} received invalid message`);
      }
    });

    ws.on("close", (code, reason) => {
      this.log(`❌ WebSocket ${id} disconnected (${code}: ${reason})`);
      connectionInfo.isConnected = false;
    });

    ws.on("error", (error) => {
      this.log(`💥 WebSocket ${id} error: ${error.message}`);
    });

    this.connections.push(connectionInfo);
    return connectionInfo;
  }

  async runDebug() {
    this.log("🧪 Starting Task Cycling Debug Session");
    this.log(`Testing against: ${this.productionUrl}`);
    this.log("Debug duration: 10 seconds\n");

    // Create two connections to simulate different users
    const user1 = this.createWebSocketConnection("user-1");
    const user2 = this.createWebSocketConnection("user-2");

    // Wait for debug duration
    await new Promise((resolve) => setTimeout(resolve, 10000));

    this.generateReport();

    // Cleanup
    this.connections.forEach((c) => {
      if (c.ws.readyState === WebSocket.OPEN) {
        c.ws.close();
      }
    });
  }

  generateReport() {
    this.log("\n📊 Task Cycling Debug Report");
    this.log("=".repeat(60));

    this.log("Connection Summary:");
    this.connections.forEach((c) => {
      this.log(
        `  ${c.id}: ${c.messagesReceived} messages, ${c.ownMessagesReceived} own messages`
      );
    });

    const totalOwnMessages = this.connections.reduce(
      (sum, c) => sum + c.ownMessagesReceived,
      0
    );

    this.log(`\nTotal messages received: ${this.messages.length}`);
    this.log(`Total own messages received: ${totalOwnMessages}`);

    if (totalOwnMessages > 0) {
      this.log(
        "\n⚠️ ISSUE CONFIRMED: Users are receiving their own WebSocket messages!"
      );
      this.log(
        "This means the production WebSocket server does not exclude users from their own updates."
      );
      this.log("The fix needs to be deployed to production.");
    } else {
      this.log(
        "\n✅ GOOD: Users are not receiving their own WebSocket messages."
      );
      this.log("The cycling issue is likely in the React component logic.");
    }

    this.log("\nMessage Details:");
    this.messages.forEach((msg) => {
      const isOwnMessage = msg.messageUserId === msg.userId;
      this.log(
        `  ${msg.connectionId} received ${msg.messageType} from ${
          msg.messageUserId
        } ${isOwnMessage ? "(OWN MESSAGE!)" : ""}`
      );
    });
  }
}

// Run the debug session
if (require.main === module) {
  const debugSession = new TaskCyclingDebugger();
  debugSession.runDebug();
}

module.exports = TaskCyclingDebugger;
