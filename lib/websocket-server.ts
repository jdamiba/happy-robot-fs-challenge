import { getWebSocketManager } from "./websocket";

// Start WebSocket server
const wsManager = getWebSocketManager(3001);

console.log("WebSocket server started on port 3001");

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down WebSocket server...");
  wsManager.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down WebSocket server...");
  wsManager.close();
  process.exit(0);
});
