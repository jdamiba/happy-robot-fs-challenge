#!/usr/bin/env node

/**
 * Production WebSocket Connection Test
 *
 * This script tests WebSocket connections to the production server
 * to diagnose connection cycling issues.
 */

const WebSocket = require("ws");

class ProductionWebSocketTest {
  constructor() {
    this.connections = [];
    this.connectionLogs = [];
    this.startTime = Date.now();
    this.productionUrl = "wss://happy-robot-fs-challenge.onrender.com/ws";
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  createWebSocketConnection(id) {
    this.log(`🔌 Creating WebSocket connection ${id} to production server...`);

    const ws = new WebSocket(this.productionUrl);
    const connectionInfo = {
      id,
      ws,
      connectTime: null,
      disconnectTime: null,
      reconnectCount: 0,
      messagesReceived: 0,
      isConnected: false,
      lastMessageTime: null,
    };

    ws.on("open", () => {
      this.log(`✅ WebSocket ${id} connected to production server`);
      connectionInfo.isConnected = true;
      connectionInfo.connectTime = Date.now();

      this.connectionLogs.push({
        type: "connect",
        connectionId: id,
        timestamp: Date.now(),
        timeSinceStart: Date.now() - this.startTime,
      });

      // Send a test message to simulate user behavior
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const testMessage = {
            type: "SET_USER",
            payload: {
              userId: `test-user-${id}`,
              userInfo: { name: `Test User ${id}` },
            },
            operationId: `test-set-user-${Date.now()}`,
            timestamp: Date.now(),
          };

          this.log(`📤 Sending SET_USER message from ${id}`);
          ws.send(JSON.stringify(testMessage));
        }
      }, 1000);
    });

    ws.on("message", (data) => {
      connectionInfo.messagesReceived++;
      connectionInfo.lastMessageTime = Date.now();

      try {
        const message = JSON.parse(data.toString());
        this.log(`📨 WebSocket ${id} received: ${message.type}`);

        // Log specific message types
        if (message.type === "CONNECTION_ESTABLISHED") {
          this.log(
            `   └─ Connection established with clientId: ${message.clientId}`
          );
        } else if (message.type === "USER_PRESENCE") {
          this.log(
            `   └─ User presence update: ${JSON.stringify(message.payload)}`
          );
        }
      } catch (error) {
        this.log(
          `⚠️ WebSocket ${id} received invalid message: ${data
            .toString()
            .substring(0, 100)}`
        );
      }
    });

    ws.on("close", (code, reason) => {
      this.log(`❌ WebSocket ${id} disconnected (${code}: ${reason})`);
      connectionInfo.isConnected = false;
      connectionInfo.disconnectTime = Date.now();

      this.connectionLogs.push({
        type: "disconnect",
        connectionId: id,
        timestamp: Date.now(),
        timeSinceStart: Date.now() - this.startTime,
        code,
        reason: reason.toString(),
      });

      // Check if this was an unexpected disconnect (less than 10 seconds)
      const connectionDuration =
        connectionInfo.disconnectTime - connectionInfo.connectTime;
      if (connectionDuration < 10000 && code !== 1000) {
        connectionInfo.reconnectCount++;
        this.log(
          `🔄 WebSocket ${id} unexpected disconnect detected (${connectionDuration}ms)`
        );
      }
    });

    ws.on("error", (error) => {
      this.log(`💥 WebSocket ${id} error: ${error.message}`);
    });

    this.connections.push(connectionInfo);
    return connectionInfo;
  }

  async simulateMultipleConnections() {
    this.log("👤 Simulating multiple WebSocket connections...");

    // Create 3 connections with delays
    this.createWebSocketConnection("user-1");

    setTimeout(() => {
      this.createWebSocketConnection("user-2");
    }, 2000);

    setTimeout(() => {
      this.createWebSocketConnection("user-3");
    }, 4000);

    // Wait 15 seconds, then close one connection
    setTimeout(() => {
      const connectionToClose = this.connections.find(
        (c) => c.id === "user-1" && c.isConnected
      );
      if (connectionToClose) {
        this.log("🔌 Manually closing user-1 connection...");
        connectionToClose.ws.close(1000, "Manual close for testing");
      }
    }, 15000);
  }

  generateReport() {
    this.log("\n📊 Production WebSocket Test Report");
    this.log("=".repeat(60));

    const totalConnections = this.connections.length;
    const totalDisconnects = this.connectionLogs.filter(
      (log) => log.type === "disconnect"
    ).length;
    const unexpectedDisconnects = this.connections.filter(
      (c) => c.reconnectCount > 0
    ).length;

    this.log(`Total connections created: ${totalConnections}`);
    this.log(`Total disconnects: ${totalDisconnects}`);
    this.log(`Unexpected disconnects: ${unexpectedDisconnects}`);

    if (totalConnections > 0) {
      this.log(
        `Connection stability: ${(
          ((totalConnections - unexpectedDisconnects) / totalConnections) *
          100
        ).toFixed(1)}%`
      );
    }

    // Connection cycling analysis
    const cyclingDetected = this.connections.some((c) => c.reconnectCount > 2);
    if (cyclingDetected) {
      this.log("⚠️ CONNECTION CYCLING DETECTED!");
      this.connections.forEach((c) => {
        if (c.reconnectCount > 2) {
          this.log(
            `   Connection ${c.id}: ${c.reconnectCount} unexpected disconnects`
          );
        }
      });
    } else {
      this.log("✅ No significant connection cycling detected");
    }

    // Connection duration analysis
    this.log("\n📈 Connection Details:");
    this.connections.forEach((c) => {
      if (c.disconnectTime) {
        const duration = c.disconnectTime - c.connectTime;
        this.log(
          `Connection ${c.id}: ${duration}ms duration, ${c.messagesReceived} messages`
        );
      } else if (c.connectTime) {
        const duration = Date.now() - c.connectTime;
        this.log(
          `Connection ${c.id}: ${duration}ms duration (still connected), ${c.messagesReceived} messages`
        );
      }
    });

    // Message frequency analysis
    const totalMessages = this.connections.reduce(
      (sum, c) => sum + c.messagesReceived,
      0
    );
    this.log(`\nTotal messages received: ${totalMessages}`);

    this.log("\n🎯 Test Result:");
    if (cyclingDetected) {
      this.log("❌ FAILED - Connection cycling detected");
      process.exit(1);
    } else {
      this.log("✅ PASSED - No connection cycling detected");
      process.exit(0);
    }
  }

  async run() {
    try {
      this.log("🧪 Starting Production WebSocket Test");
      this.log(`Testing against: ${this.productionUrl}`);
      this.log("Test duration: 30 seconds\n");

      // Start simulating connections
      await this.simulateMultipleConnections();

      // Wait for test duration
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Generate report
      this.generateReport();

      // Cleanup
      this.connections.forEach((c) => {
        if (c.ws.readyState === WebSocket.OPEN) {
          c.ws.close();
        }
      });
    } catch (error) {
      this.log(`💥 Test failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new ProductionWebSocketTest();
  test.run();
}

module.exports = ProductionWebSocketTest;
