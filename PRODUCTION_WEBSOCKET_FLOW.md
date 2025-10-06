# Production WebSocket Server Integration

This document walks through how the Happy Robot app handles interacting with a WebSocket server deployed on a service like Render.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                PRODUCTION SETUP                                │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌─────────────────┐                    ┌─────────────────┐                     │
│  │   Next.js App   │                    │ WebSocket Server│                     │
│  │   (Render.com)  │                    │   (Render.com)  │                     │
│  │                 │                    │                 │                     │
│  │ • Frontend UI   │                    │ • Real-time     │                     │
│  │ • API Routes    │                    │   Broadcasting  │                     │
│  │ • Database      │                    │ • Project Rooms │                     │
│  │ • Authentication│                    │ • Connection    │                     │
│  │                 │                    │   Management    │                     │
│  └─────────────────┘                    └─────────────────┘                     │
│           │                                       │                             │
│           │ HTTPS                                 │ HTTPS                       │
│           │ (Client-side)                         │ (Server-side)               │
│           ▼                                       ▼                             │
│  ┌─────────────────┐                    ┌─────────────────┐                     │
│  │    Users'       │◄──────────────────►│   WebSocket     │                     │
│  │   Browsers      │    WSS (Secure)    │   Connections   │                     │
│  │                 │                    │                 │                     │
│  │ • Multiple tabs │                    │ • Project Rooms │                     │
│  │ • Real-time UI  │                    │ • Message       │                     │
│  │ • Collaboration │                    │   Broadcasting  │                     │
│  │                 │                    │ • Health Checks │                     │
│  └─────────────────┘                    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Step 1: WebSocket Server Deployment on Render

### 1.1 Deploy WebSocket Server

#### Render.com Configuration
```yaml
# render.yaml (in websocket-server directory)
services:
  - type: web
    name: happy-robot-websocket
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: ALLOWED_ORIGINS
        value: https://happy-robot-app.onrender.com
      - key: LOG_LEVEL
        value: info
    healthCheckPath: /health
```

#### Environment Variables on Render
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://happy-robot-app.onrender.com
LOG_LEVEL=info
PORT=3001  # Render sets this automatically
```

### 1.2 Verify WebSocket Server Deployment
```bash
# Check deployment status
curl https://happy-robot-websocket.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": 1703123456789,
  "clients": 0,
  "projects": 0,
  "uptime": 123.45
}
```

## Step 2: Next.js App Configuration

### 2.1 Environment Variables for Production

#### Client-Side Environment Variables (.env.local)
```env
# WebSocket Connection (Client-side)
NEXT_PUBLIC_WS_URL=wss://happy-robot-websocket.onrender.com/ws

# Other production variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
DATABASE_URL=postgresql://...
```

#### Server-Side Environment Variables (Render Dashboard)
```env
# WebSocket Server Communication (Server-side)
WEBSOCKET_SERVER_URL=https://happy-robot-websocket.onrender.com

# Database and Auth
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
```

### 2.2 How the App Determines WebSocket URL

#### Client-Side WebSocket Connection (lib/use-websocket.ts)
```typescript
const {
  url = isClient && typeof window !== "undefined" && window.location
    ? window.location.hostname === "localhost"
      ? "ws://localhost:3001/ws"  // Local development
      : process.env.NEXT_PUBLIC_WS_URL ||  // Production - uses env var
        `wss://${window.location.hostname}/ws`  // Fallback
    : "ws://localhost:3001/ws", // Default fallback for SSR
} = options;
```

**Production Flow:**
1. **Browser checks**: `window.location.hostname !== "localhost"`
2. **Uses**: `process.env.NEXT_PUBLIC_WS_URL` = `"wss://happy-robot-websocket.onrender.com/ws"`
3. **Establishes**: Secure WebSocket connection to Render-deployed server

#### Server-Side HTTP Communication (lib/websocket-client.ts)
```typescript
class WebSocketClientService {
  private serverUrl: string;

  constructor() {
    // Server-side: Uses HTTPS for API communication
    this.serverUrl = process.env.WEBSOCKET_SERVER_URL || "http://localhost:3001";
    // Production: https://happy-robot-websocket.onrender.com
  }
}
```

## Step 3: Real-Time Communication Flow

### 3.1 Client Connection Process

#### Initial Connection
```typescript
// 1. Browser establishes WSS connection
const ws = new WebSocket("wss://happy-robot-websocket.onrender.com/ws");

// 2. Server responds with connection confirmation
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "CONNECTION_ESTABLISHED") {
    console.log("Connected to production WebSocket server");
  }
};
```

#### Project Room Joining
```typescript
// 3. Client joins project room
ws.send(JSON.stringify({
  type: "JOIN_PROJECT",
  projectId: "project-123",
  operationId: `join-${Date.now()}`,
  timestamp: Date.now(),
}));

// 4. Server adds client to project room
// Server logs: "Client client_123 joined project project-123"
```

### 3.2 API Route to WebSocket Server Communication

#### When User Makes Changes
```typescript
// 1. User edits task in browser
// 2. Frontend calls API route
const response = await apiClient.updateTask(taskId, updateData);

// 3. API route processes request (app/api/tasks/[id]/route.ts)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Update database
  const task = await TaskService.update(id, validatedData);
  
  // Broadcast to WebSocket server via HTTPS
  await websocketClient.broadcastTaskUpdate(task.projectId, {
    id: task.id,
    projectId: task.projectId,
    changes: validatedData,
    operationId: generateOperationId(),
    timestamp: Date.now(),
  });
  
  return NextResponse.json({ success: true, data: task });
}
```

#### HTTP Broadcast to WebSocket Server
```typescript
// 4. websocketClient sends HTTPS POST to Render WebSocket server
async broadcastTaskUpdate(projectId: string, update: any): Promise<void> {
  await this.sendMessage({
    type: "TASK_UPDATE",
    payload: update,
    projectId,
    operationId: `task-update-${Date.now()}`,
    timestamp: Date.now(),
  });
}

private async sendMessage(message: WebSocketMessage): Promise<void> {
  // HTTPS POST to production WebSocket server
  const response = await fetch(
    "https://happy-robot-websocket.onrender.com/broadcast",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    }
  );
}
```

### 3.3 WebSocket Server Broadcasting

#### Production Server Processing
```javascript
// 5. WebSocket server receives HTTPS POST
app.post("/broadcast", (req, res) => {
  const { type, payload, projectId, operationId, timestamp } = req.body;
  
  // Create message object
  const message = { type, payload, operationId, timestamp };
  
  // Broadcast to all clients in project room
  broadcastToProject(projectId, message);
  
  res.json({ 
    success: true, 
    projectId,
    clientCount: projectRooms.get(projectId)?.size || 0
  });
});

// 6. Server broadcasts to all connected clients
function broadcastToProject(projectId, message, excludeClientId = null) {
  const roomClients = projectRooms.get(projectId);
  
  roomClients.forEach(clientId => {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN
      // Send WSS message to browser
      client.ws.send(JSON.stringify(message));
    }
  });
}
```

### 3.4 Client Receives Real-Time Updates

#### Browser WebSocket Message Handling
```typescript
// 7. All connected browsers receive WSS message
ws.onmessage = (event) => {
  const message: WebSocketMessage = JSON.parse(event.data);
  
  // Handle different message types
  switch (message.type) {
    case "TASK_UPDATE":
      handleTaskUpdate(message.payload as TaskUpdate);
      break;
    case "TASK_CREATE":
      handleTaskCreate(message.payload);
      break;
    case "COMMENT_CREATE":
      handleCommentCreate(message.payload);
      break;
    // ... other message types
  }
};

// 8. Store updates trigger UI re-renders
handleTaskUpdate: (update) => {
  set((state) => {
    const taskIndex = state.tasks.findIndex((t) => t.id === update.id);
    if (taskIndex === -1) return state;

    const updatedTask = { ...state.tasks[taskIndex], ...update.changes };
    const newTasks = [...state.tasks];
    newTasks[taskIndex] = updatedTask;

    return { tasks: newTasks };
  });
};
```

## Step 4: Production-Specific Considerations

### 4.1 Security and CORS

#### WebSocket Server CORS Configuration
```javascript
// websocket-server/src/server.js
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    "http://localhost:3000",
    "https://happy-robot-app.onrender.com"  // Production domain
  ],
  credentials: true
}));
```

#### Secure WebSocket Connections
- **Local Development**: `ws://localhost:3001/ws`
- **Production**: `wss://happy-robot-websocket.onrender.com/ws` (Secure WebSocket)

### 4.2 Connection Management

#### Auto-Reconnection in Production
```typescript
// lib/use-websocket.ts
const reconnectInterval = 3000;
const maxReconnectAttempts = 5;

// Production WebSocket connections automatically reconnect
// with exponential backoff on network failures
```

#### Health Monitoring
```bash
# Monitor production WebSocket server
curl https://happy-robot-websocket.onrender.com/health

# Check server statistics
curl https://happy-robot-websocket.onrender.com/stats
```

### 4.3 Load Balancing and Scaling

#### Render.com Automatic Scaling
- **Free Plan**: Single instance
- **Paid Plans**: Automatic scaling based on load
- **Health Checks**: Render monitors `/health` endpoint

#### Multiple WebSocket Server Instances
```javascript
// For horizontal scaling, you would need:
// 1. Redis for shared state across instances
// 2. Load balancer with sticky sessions
// 3. Message queue for broadcasting

// Current setup works well for single instance
// Can scale vertically on Render paid plans
```

## Step 5: Monitoring and Debugging

### 5.1 Production Monitoring

#### WebSocket Server Logs
```bash
# View Render logs
# Go to Render dashboard → WebSocket service → Logs

# Key log messages to monitor:
# "New WebSocket connection: client_123"
# "Client client_123 joined project project_456"
# "Broadcasted to 3 clients in project project_456"
# "Client client_123 disconnected"
```

#### Health Checks
```bash
# Automated health monitoring
curl https://happy-robot-websocket.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": 1703123456789,
  "clients": 15,
  "projects": 3,
  "uptime": 3600
}
```

### 5.2 Debugging Production Issues

#### Common Production Issues

1. **CORS Errors**
   ```bash
   # Check ALLOWED_ORIGINS includes your domain
   curl -H "Origin: https://happy-robot-app.onrender.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        https://happy-robot-websocket.onrender.com/broadcast
   ```

2. **WebSocket Connection Failures**
   ```bash
   # Test WebSocket connection
   wscat -c wss://happy-robot-websocket.onrender.com/ws
   
   # Check if server is responding
   curl https://happy-robot-websocket.onrender.com/health
   ```

3. **Broadcast Failures**
   ```bash
   # Test broadcast endpoint
   curl -X POST https://happy-robot-websocket.onrender.com/broadcast \
        -H "Content-Type: application/json" \
        -d '{"type":"TEST","projectId":"test-123","payload":{"message":"Hello"}}'
   ```

## Step 6: Performance Optimization

### 6.1 Connection Efficiency

#### Single WebSocket Connection per Browser Tab
```typescript
// Each browser tab maintains one WebSocket connection
// Multiple tabs of same user share the same connection
// Project rooms isolate message broadcasting
```

#### Message Optimization
```javascript
// WebSocket server only broadcasts to relevant clients
// Project rooms prevent unnecessary message distribution
// Message compression for large payloads (future enhancement)
```

### 6.2 Render.com Resource Management

#### Free Plan Limitations
- **Sleep Mode**: WebSocket server sleeps after 15 minutes of inactivity
- **Cold Start**: ~30 second wake-up time
- **Connection Limit**: ~100 concurrent connections

#### Paid Plan Benefits
- **Always On**: No sleep mode
- **Higher Limits**: More concurrent connections
- **Better Performance**: Faster response times

## Step 7: Deployment Checklist

### 7.1 Pre-Deployment
- [ ] **WebSocket server deployed** on Render
- [ ] **Environment variables set** correctly
- [ ] **CORS configured** for production domain
- [ ] **Health checks passing** (`/health` endpoint)
- [ ] **SSL certificates** working (HTTPS/WSS)

### 7.2 Post-Deployment Testing
- [ ] **WebSocket connection** establishes successfully
- [ ] **Project room joining** works
- [ ] **Real-time updates** sync between multiple browsers
- [ ] **API to WebSocket** communication works
- [ ] **Error handling** works for connection failures
- [ ] **Reconnection** works after network issues

### 7.3 Production Monitoring
- [ ] **Health monitoring** set up
- [ ] **Log monitoring** configured
- [ ] **Performance metrics** tracked
- [ ] **Error alerting** configured

## Summary

The Happy Robot app seamlessly handles production WebSocket server deployment by:

1. **Automatic URL Detection**: Uses environment variables to connect to production WebSocket server
2. **Secure Connections**: Establishes WSS (secure WebSocket) connections in production
3. **HTTP Broadcasting**: API routes send HTTPS requests to WebSocket server for broadcasting
4. **Real-Time Updates**: All connected clients receive updates instantly via WebSocket
5. **Robust Error Handling**: Auto-reconnection and fallback mechanisms
6. **Production Monitoring**: Health checks and logging for operational visibility

The architecture ensures that real-time collaboration works seamlessly whether deployed locally or on production services like Render, with minimal configuration changes required.
