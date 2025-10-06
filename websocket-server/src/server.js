import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());

// WebSocket server
const wss = new WebSocketServer({
  server,
  path: "/ws",
});

// Store client connections and project rooms
const clients = new Map(); // clientId -> { ws, userId, projectRooms }
const projectRooms = new Map(); // projectId -> Set of clientIds

// Generate unique client ID
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Join a project room
function joinProject(clientId, projectId) {
  if (!clients.has(clientId)) {
    console.log(`❌ Cannot join project: client ${clientId} not found`);
    return;
  }

  const client = clients.get(clientId);
  client.projectRooms.add(projectId);

  if (!projectRooms.has(projectId)) {
    projectRooms.set(projectId, new Set());
    console.log(`🆕 Created new project room: ${projectId}`);
  }
  projectRooms.get(projectId).add(clientId);

  console.log(
    `✅ Client ${clientId} (user: ${
      client.userId || "unknown"
    }) joined project ${projectId}`
  );
  console.log(
    `📊 Project ${projectId} now has ${
      projectRooms.get(projectId).size
    } clients`
  );

  // Broadcast user presence to all clients in the project
  broadcastUserPresence(projectId);
}

// Leave a project room
function leaveProject(clientId, projectId) {
  if (!clients.has(clientId)) {
    console.log(`❌ Cannot leave project: client ${clientId} not found`);
    return;
  }

  const client = clients.get(clientId);
  client.projectRooms.delete(projectId);

  if (projectRooms.has(projectId)) {
    projectRooms.get(projectId).delete(clientId);

    // Clean up empty project rooms
    if (projectRooms.get(projectId).size === 0) {
      projectRooms.delete(projectId);
      console.log(`🗑️  Deleted empty project room: ${projectId}`);
    }
  }

  console.log(
    `👋 Client ${clientId} (user: ${
      client.userId || "unknown"
    }) left project ${projectId}`
  );

  // Broadcast user presence to all remaining clients in the project
  broadcastUserPresence(projectId);
}

// Broadcast user presence to all clients in a project
function broadcastUserPresence(projectId) {
  if (!projectRooms.has(projectId)) {
    return;
  }

  const roomClients = projectRooms.get(projectId);
  const activeUsers = [];

  roomClients.forEach((clientId) => {
    const client = clients.get(clientId);
    if (client && client.userId && client.ws.readyState === 1) {
      // Generate initials from userId as fallback
      // For now, we'll use the last 2 characters of the userId
      // In a real app, you'd fetch user info from database
      const initials = client.userId.slice(-2).toUpperCase();

      activeUsers.push({
        userId: client.userId,
        clientId: clientId,
        joinedAt: client.lastPing || Date.now(),
        initials: initials, // Add initials to the payload
      });
    }
  });

  const presenceMessage = {
    type: "USER_PRESENCE",
    payload: {
      projectId,
      activeUsers,
      userCount: activeUsers.length,
    },
    operationId: `presence-${Date.now()}`,
    timestamp: Date.now(),
  };

  console.log(`👥 Broadcasting user presence for project ${projectId}:`, {
    activeUsers: activeUsers.map((u) => ({
      userId: u.userId,
      clientId: u.clientId,
      initials: u.initials,
    })),
    userCount: activeUsers.length,
  });

  broadcastToProject(projectId, presenceMessage);
}

// Broadcast message to all clients in a project
function broadcastToProject(projectId, message, excludeClientId = null) {
  if (!projectRooms.has(projectId)) {
    console.log(`❌ No clients in project room ${projectId}`);
    return;
  }

  const roomClients = projectRooms.get(projectId);
  let sentCount = 0;

  console.log(`📤 BROADCASTING to project ${projectId}:`, {
    type: message.type,
    payload: message.payload
      ? JSON.stringify(message.payload).substring(0, 100) + "..."
      : "none",
    userId: message.userId,
    targetClients: Array.from(roomClients),
    excludeClientId,
  });

  roomClients.forEach((clientId) => {
    if (excludeClientId && clientId === excludeClientId) {
      console.log(`⏭️  Skipping excluded client ${clientId}`);
      return;
    }

    const client = clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      // WebSocket.OPEN
      try {
        client.ws.send(JSON.stringify(message));
        console.log(
          `✅ SENT to client ${clientId} (user: ${client.userId || "unknown"})`
        );
        sentCount++;
      } catch (error) {
        console.error(`❌ Error sending message to client ${clientId}:`, error);
      }
    } else {
      console.log(
        `❌ Client ${clientId} not ready (state: ${client?.ws?.readyState})`
      );
    }
  });

  console.log(
    `📊 Broadcast complete: ${sentCount}/${roomClients.size} clients in project ${projectId}`
  );
}

// Handle WebSocket connections
wss.on("connection", (ws, request) => {
  const clientId = generateClientId();
  const client = {
    ws,
    userId: null,
    projectRooms: new Set(),
    lastPing: Date.now(),
  };

  clients.set(clientId, client);

  console.log(`New WebSocket connection: ${clientId}`);
  console.log(`Total clients: ${clients.size}`);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "CONNECTION_ESTABLISHED",
      clientId,
      timestamp: Date.now(),
    })
  );

  // Handle incoming messages
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 RECEIVED from client ${clientId}:`, {
        type: message.type,
        projectId: message.projectId,
        userId: message.userId || client.userId,
        payload: message.payload
          ? JSON.stringify(message.payload).substring(0, 100) + "..."
          : "none",
        timestamp: new Date().toISOString(),
      });
      handleMessage(clientId, message);
    } catch (error) {
      console.error(`Error parsing message from ${clientId}:`, error);
      ws.send(
        JSON.stringify({
          type: "ERROR",
          error: "Invalid message format",
          timestamp: Date.now(),
        })
      );
    }
  });

  // Handle connection close
  ws.on("close", () => {
    console.log(`Client ${clientId} disconnected`);

    // Leave all project rooms
    client.projectRooms.forEach((projectId) => {
      leaveProject(clientId, projectId);
    });

    clients.delete(clientId);
    console.log(`Total clients: ${clients.size}`);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });

  // Ping/pong for connection health
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  ws.on("pong", () => {
    client.lastPing = Date.now();
  });
});

// Handle different message types
function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  console.log(`🔄 PROCESSING message from ${clientId}:`, message.type);

  switch (message.type) {
    case "SET_USER":
      client.userId = message.payload?.userId || message.userId;
      console.log(`Client ${clientId} set user: ${client.userId}`);

      // Broadcast user presence for all projects this client is in
      client.projectRooms.forEach((projectId) => {
        broadcastUserPresence(projectId);
      });
      break;

    case "JOIN_PROJECT":
      // Set user ID if provided in the message
      if (message.userId) {
        client.userId = message.userId;
        console.log(`Client ${clientId} set user: ${message.userId}`);
      }
      joinProject(clientId, message.projectId);
      break;

    case "LEAVE_PROJECT":
      leaveProject(clientId, message.projectId);
      break;

    case "TASK_UPDATE":
      if (message.projectId) {
        broadcastToProject(
          message.projectId,
          {
            type: "TASK_UPDATE",
            payload: message.payload,
            operationId: message.operationId,
            timestamp: Date.now(),
          },
          clientId
        ); // Exclude sender
      }
      break;

    case "TASK_CREATE":
      if (message.projectId) {
        broadcastToProject(
          message.projectId,
          {
            type: "TASK_CREATE",
            payload: message.payload,
            operationId: message.operationId,
            timestamp: Date.now(),
          },
          clientId
        );
      }
      break;

    case "TASK_DELETE":
      if (message.projectId) {
        broadcastToProject(
          message.projectId,
          {
            type: "TASK_DELETE",
            payload: message.payload,
            operationId: message.operationId,
            timestamp: Date.now(),
          },
          clientId
        );
      }
      break;

    case "COMMENT_CREATE":
      if (message.projectId) {
        broadcastToProject(
          message.projectId,
          {
            type: "COMMENT_CREATE",
            payload: message.payload,
            operationId: message.operationId,
            timestamp: Date.now(),
          },
          clientId
        );
      }
      break;

    case "COMMENT_UPDATE":
      if (message.projectId) {
        broadcastToProject(
          message.projectId,
          {
            type: "COMMENT_UPDATE",
            payload: message.payload,
            operationId: message.operationId,
            timestamp: Date.now(),
          },
          clientId
        );
      }
      break;

    case "COMMENT_DELETE":
      if (message.projectId) {
        broadcastToProject(
          message.projectId,
          {
            type: "COMMENT_DELETE",
            payload: message.payload,
            operationId: message.operationId,
            timestamp: Date.now(),
          },
          clientId
        );
      }
      break;

    case "PROJECT_UPDATE":
      if (message.projectId) {
        broadcastToProject(
          message.projectId,
          {
            type: "PROJECT_UPDATE",
            payload: message.payload,
            operationId: message.operationId,
            timestamp: Date.now(),
          },
          clientId
        );
      }
      break;

    default:
      console.log(`Unknown message type: ${message.type}`);
  }
}

// Broadcast endpoint for API routes to send messages
app.post("/broadcast", (req, res) => {
  try {
    const { type, payload, projectId, operationId, timestamp, userId } =
      req.body;

    console.log(`🌐 HTTP BROADCAST received:`, {
      type,
      projectId,
      userId,
      payload: payload
        ? JSON.stringify(payload).substring(0, 100) + "..."
        : "none",
      operationId,
      timestamp: new Date().toISOString(),
    });

    if (!type || !projectId) {
      console.log(
        `❌ Missing required fields: type=${type}, projectId=${projectId}`
      );
      return res
        .status(400)
        .json({ error: "Missing required fields: type, projectId" });
    }

    // Create message object
    const message = {
      type,
      payload,
      operationId: operationId || `broadcast-${Date.now()}`,
      timestamp: timestamp || Date.now(),
      userId: userId || null, // Include userId in the message
    };

    // Broadcast to all clients in the project
    broadcastToProject(projectId, message);

    res.json({
      success: true,
      message: "Broadcast sent",
      projectId,
      clientCount: projectRooms.get(projectId)?.size || 0,
    });
  } catch (error) {
    console.error("Error in broadcast endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: Date.now(),
    clients: clients.size,
    projects: projectRooms.size,
    uptime: process.uptime(),
  });
});

// Get server stats
app.get("/stats", (req, res) => {
  const stats = {
    totalClients: clients.size,
    totalProjects: projectRooms.size,
    projectStats: {},
  };

  projectRooms.forEach((clientIds, projectId) => {
    stats.projectStats[projectId] = {
      clientCount: clientIds.size,
      clients: Array.from(clientIds),
    };
  });

  res.json(stats);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/stats`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down WebSocket server...");

  // Close all client connections
  clients.forEach((client) => {
    if (client.ws.readyState === 1) {
      client.ws.close(1000, "Server shutdown");
    }
  });

  // Close WebSocket server
  wss.close(() => {
    console.log("✅ WebSocket server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});
