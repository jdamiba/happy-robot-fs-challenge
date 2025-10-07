#!/usr/bin/env node

/**
 * WebSocket Stability Test
 *
 * This script tests WebSocket connection stability by:
 * 1. Starting the Next.js development server
 * 2. Opening multiple browser tabs/windows
 * 3. Monitoring WebSocket connections for cycling
 * 4. Reporting connection stability
 */

const { spawn } = require("child_process");
const WebSocket = require("ws");
const { setTimeout } = require("timers/promises");

class WebSocketStabilityTest {
  constructor() {
    this.connections = [];
    this.connectionLogs = [];
    this.startTime = Date.now();
    this.testDuration = 30000; // 30 seconds
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async startNextDevServer() {
    this.log("🚀 Starting Next.js development server...");

    return new Promise((resolve, reject) => {
      const nextProcess = spawn("npm", ["run", "dev"], {
        stdio: "pipe",
        env: { ...process.env, PORT: "3000" },
      });

      let serverReady = false;

      nextProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(output);

        if (output.includes("Ready") && !serverReady) {
          serverReady = true;
          this.log("✅ Next.js server is ready");
          resolve(nextProcess);
        }
      });

      nextProcess.stderr.on("data", (data) => {
        console.error(data.toString());
      });

      nextProcess.on("error", (error) => {
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(30000).then(() => {
        if (!serverReady) {
          reject(new Error("Server failed to start within 30 seconds"));
        }
      });
    });
  }

  createWebSocketConnection(id) {
    this.log(`🔌 Creating WebSocket connection ${id}...`);

    const ws = new WebSocket("ws://localhost:8080/ws");
    const connectionInfo = {
      id,
      ws,
      connectTime: Date.now(),
      disconnectTime: null,
      reconnectCount: 0,
      messagesReceived: 0,
      isConnected: false,
    };

    ws.on("open", () => {
      this.log(`✅ WebSocket ${id} connected`);
      connectionInfo.isConnected = true;
      connectionInfo.connectTime = Date.now();

      this.connectionLogs.push({
        type: "connect",
        connectionId: id,
        timestamp: Date.now(),
        timeSinceStart: Date.now() - this.startTime,
      });
    });

    ws.on("message", (data) => {
      connectionInfo.messagesReceived++;
      try {
        const message = JSON.parse(data.toString());
        this.log(`📨 WebSocket ${id} received: ${message.type}`);
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

      // Check if this was an unexpected disconnect
      const connectionDuration =
        connectionInfo.disconnectTime - connectionInfo.connectTime;
      if (connectionDuration < 5000 && code !== 1000) {
        // Less than 5 seconds and not normal close
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

  async simulateUserBehavior() {
    this.log("👤 Simulating user behavior...");

    // Create initial connection
    this.createWebSocketConnection("user-1");

    // Wait 5 seconds, then create another connection
    await setTimeout(5000);
    this.createWebSocketConnection("user-2");

    // Wait 10 seconds, then create a third connection
    await setTimeout(10000);
    this.createWebSocketConnection("user-3");

    // Wait 15 seconds, then disconnect one connection
    await setTimeout(15000);
    const connectionToClose = this.connections.find((c) => c.id === "user-1");
    if (connectionToClose && connectionToClose.isConnected) {
      this.log("🔌 Manually closing user-1 connection...");
      connectionToClose.ws.close(1000, "Manual close for testing");
    }
  }

  generateReport() {
    this.log("\n📊 WebSocket Stability Test Report");
    this.log("=".repeat(50));

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
    this.log(
      `Connection stability: ${(
        ((totalConnections - unexpectedDisconnects) / totalConnections) *
        100
      ).toFixed(1)}%`
    );

    // Connection cycling analysis
    const cyclingDetected = this.connections.some((c) => c.reconnectCount > 3);
    if (cyclingDetected) {
      this.log("⚠️ CONNECTION CYCLING DETECTED!");
      this.connections.forEach((c) => {
        if (c.reconnectCount > 3) {
          this.log(`   Connection ${c.id}: ${c.reconnectCount} reconnects`);
        }
      });
    } else {
      this.log("✅ No connection cycling detected");
    }

    // Connection duration analysis
    this.connections.forEach((c) => {
      if (c.disconnectTime) {
        const duration = c.disconnectTime - c.connectTime;
        this.log(
          `Connection ${c.id}: ${duration}ms duration, ${c.messagesReceived} messages`
        );
      } else {
        const duration = Date.now() - c.connectTime;
        this.log(
          `Connection ${c.id}: ${duration}ms duration (still connected), ${c.messagesReceived} messages`
        );
      }
    });

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
      this.log("🧪 Starting WebSocket Stability Test");
      this.log(`Test duration: ${this.testDuration / 1000} seconds`);

      // Start Next.js server
      const nextProcess = await this.startNextDevServer();

      // Wait a bit for server to be fully ready
      await setTimeout(3000);

      // Start simulating user behavior
      const behaviorPromise = this.simulateUserBehavior();

      // Wait for test duration
      await setTimeout(this.testDuration);

      // Generate report
      this.generateReport();

      // Cleanup
      this.connections.forEach((c) => {
        if (c.ws.readyState === WebSocket.OPEN) {
          c.ws.close();
        }
      });

      nextProcess.kill();
    } catch (error) {
      this.log(`💥 Test failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the test
if (require.main === module) {
  const test = new WebSocketStabilityTest();
  test.run();
}

module.exports = WebSocketStabilityTest;
