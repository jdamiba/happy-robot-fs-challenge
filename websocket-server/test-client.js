#!/usr/bin/env node

import WebSocket from "ws";

// Test WebSocket client to verify server functionality
const ws = new WebSocket("ws://localhost:3001/ws");

ws.on("open", () => {
  console.log("✅ Connected to WebSocket server");

  // Test joining a project
  ws.send(
    JSON.stringify({
      type: "JOIN_PROJECT",
      projectId: "test-project-123",
    })
  );

  // Test setting user
  ws.send(
    JSON.stringify({
      type: "SET_USER",
      userId: "test-user-456",
    })
  );

  // Test sending a task update
  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: "TASK_UPDATE",
        projectId: "test-project-123",
        payload: {
          id: "task-789",
          title: "Test task update",
        },
        operationId: "test-op-001",
      })
    );
  }, 1000);
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  console.log("📨 Received message:", message.type);

  if (message.type === "CONNECTION_ESTABLISHED") {
    console.log("🆔 Client ID:", message.clientId);
  }
});

ws.on("close", () => {
  console.log("❌ WebSocket connection closed");
});

ws.on("error", (error) => {
  console.error("💥 WebSocket error:", error);
});

// Test HTTP broadcast endpoint
setTimeout(async () => {
  try {
    const response = await fetch("http://localhost:3001/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "COMMENT_CREATE",
        projectId: "test-project-123",
        payload: {
          id: "comment-001",
          content: "Test comment from HTTP API",
        },
      }),
    });

    const result = await response.json();
    console.log("📡 HTTP broadcast result:", result);
  } catch (error) {
    console.error("💥 HTTP broadcast error:", error);
  }
}, 2000);

// Test health endpoint
setTimeout(async () => {
  try {
    const response = await fetch("http://localhost:3001/health");
    const health = await response.json();
    console.log("💚 Health check:", health);
  } catch (error) {
    console.error("💥 Health check error:", error);
  }
}, 3000);

// Test stats endpoint
setTimeout(async () => {
  try {
    const response = await fetch("http://localhost:3001/stats");
    const stats = await response.json();
    console.log("📊 Server stats:", stats);
  } catch (error) {
    console.error("💥 Stats error:", error);
  }
}, 4000);

// Close connection after tests
setTimeout(() => {
  console.log("🏁 Tests completed, closing connection...");
  ws.close();
  process.exit(0);
}, 5000);
