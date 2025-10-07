#!/usr/bin/env node

/**
 * WebSocket Fix Verification Test
 *
 * This script tests that our WebSocket cycling fix works correctly
 * by monitoring connection behavior over time.
 */

const WebSocket = require("ws");

class WebSocketFixTest {
  constructor() {
    this.productionUrl = "wss://happy-robot-fs-challenge.onrender.com/ws";
    this.connections = [];
    this.connectionLogs = [];
    this.startTime = Date.now();
    this.testDuration = 20000; // 20 seconds
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
      disconnectTime: null,
      reconnectCount: 0,
      messagesReceived: 0,
      isConnected: false,
      connectionAttempts: 0,
    };

    ws.on("open", () => {
      this.log(`✅ WebSocket ${id} connected successfully`);
      connectionInfo.isConnected = true;
      connectionInfo.connectTime = Date.now();

      this.connectionLogs.push({
        type: "connect",
        connectionId: id,
        timestamp: Date.now(),
        timeSinceStart: Date.now() - this.startTime,
      });

      // Send a SET_USER message to simulate real app behavior
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const setUserMessage = {
            type: "SET_USER",
            payload: {
              userId: `test-user-${id}`,
              userInfo: { name: `Test User ${id}` },
            },
            operationId: `test-set-user-${Date.now()}`,
            timestamp: Date.now(),
          };

          this.log(`📤 Sending SET_USER message from ${id}`);
          ws.send(JSON.stringify(setUserMessage));
        }
      }, 1000);

      // Send a JOIN_PROJECT message to simulate project joining
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const joinProjectMessage = {
            type: "JOIN_PROJECT",
            projectId: `test-project-${id}`,
            userId: `test-user-${id}`,
            operationId: `test-join-project-${Date.now()}`,
            timestamp: Date.now(),
          };

          this.log(`📤 Sending JOIN_PROJECT message from ${id}`);
          ws.send(JSON.stringify(joinProjectMessage));
        }
      }, 2000);
    });

    ws.on("message", (data) => {
      connectionInfo.messagesReceived++;

      try {
        const message = JSON.parse(data.toString());
        this.log(`📨 WebSocket ${id} received: ${message.type}`);

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
      connectionInfo.disconnectTime = Date.now();

      this.connectionLogs.push({
        type: "disconnect",
        connectionId: id,
        timestamp: Date.now(),
        timeSinceStart: Date.now() - this.startTime,
        code,
        reason: reason.toString(),
      });

      // Check for unexpected disconnects (less than 5 seconds)
      if (connectionInfo.connectTime) {
        const connectionDuration =
          connectionInfo.disconnectTime - connectionInfo.connectTime;
        if (connectionDuration < 5000 && code !== 1000) {
          connectionInfo.reconnectCount++;
          this.log(
            `🔄 WebSocket ${id} unexpected disconnect (${connectionDuration}ms)`
          );
        }
      }
    });

    ws.on("error", (error) => {
      this.log(`💥 WebSocket ${id} error: ${error.message}`);
    });

    this.connections.push(connectionInfo);
    return connectionInfo;
  }

  async runTest() {
    this.log("🧪 Starting WebSocket Fix Verification Test");
    this.log(`Testing against: ${this.productionUrl}`);
    this.log("Test duration: 20 seconds\n");

    // Create initial connection
    this.createWebSocketConnection("client-1");

    // Wait 5 seconds, then create another connection
    setTimeout(() => {
      this.createWebSocketConnection("client-2");
    }, 5000);

    // Wait 10 seconds, then create a third connection
    setTimeout(() => {
      this.createWebSocketConnection("client-3");
    }, 10000);

    // Wait for test duration
    await new Promise((resolve) => setTimeout(resolve, this.testDuration));

    this.generateReport();

    // Cleanup
    this.connections.forEach((c) => {
      if (c.ws.readyState === WebSocket.OPEN) {
        c.ws.close();
      }
    });
  }

  generateReport() {
    this.log("\n📊 WebSocket Fix Verification Report");
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
    const cyclingDetected = this.connections.some((c) => c.reconnectCount > 1);
    if (cyclingDetected) {
      this.log("⚠️ CONNECTION CYCLING DETECTED!");
      this.connections.forEach((c) => {
        if (c.reconnectCount > 1) {
          this.log(
            `   Connection ${c.id}: ${c.reconnectCount} unexpected disconnects`
          );
        }
      });
    } else {
      this.log("✅ No connection cycling detected");
    }

    // Connection duration analysis
    this.log("\n📈 Connection Details:");
    this.connections.forEach((c) => {
      if (c.disconnectTime && c.connectTime) {
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

    // Check for rapid connection/disconnection patterns
    const rapidDisconnects = this.connectionLogs.filter((log) => {
      if (log.type === "disconnect") {
        // Find the corresponding connect log
        const connectLog = this.connectionLogs.find(
          (cl) =>
            cl.type === "connect" &&
            cl.connectionId === log.connectionId &&
            cl.timestamp < log.timestamp
        );

        if (connectLog) {
          const duration = log.timestamp - connectLog.timestamp;
          return duration < 3000; // Less than 3 seconds
        }
      }
      return false;
    });

    this.log(`Rapid disconnects (< 3s): ${rapidDisconnects.length}`);

    this.log("\n🎯 Test Result:");
    if (cyclingDetected || rapidDisconnects.length > 2) {
      this.log("❌ FAILED - Connection cycling or rapid disconnects detected");
      process.exit(1);
    } else {
      this.log("✅ PASSED - WebSocket fix is working correctly");
      process.exit(0);
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new WebSocketFixTest();
  test.runTest();
}

module.exports = WebSocketFixTest;
