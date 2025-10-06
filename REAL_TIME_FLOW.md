# Real-Time UI Update Flow

This document traces how the Next.js frontends interact with the WebSocket server and how UI updates happen when changes are made to projects and tasks.

## Architecture Overview

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Next.js App   │◄─────────────►│   Database      │
│   (Frontend)    │                │   (SQLite)      │
└─────────────────┘                └─────────────────┘
         │                                   │
         │ WebSocket                         │
         ▼                                   │
┌─────────────────┐                          │
│ WebSocket Server│                          │
│ (Standalone)    │                          │
└─────────────────┘                          │
         ▲                                   │
         │ HTTP Broadcast                    │
         └───────────────────────────────────┘
```

## Complete Flow Trace

### 1. Initial Connection Setup

#### Frontend Connection (useWebSocket.ts)

```typescript
// 1. Client connects to WebSocket server
const ws = new WebSocket("ws://localhost:3001/ws");

// 2. Server sends CONNECTION_ESTABLISHED message
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "CONNECTION_ESTABLISHED") {
    // Client receives clientId for identification
  }
};
```

#### Project Room Joining

```typescript
// 3. Client joins project room when viewing a project
const joinProject = (projectId: string) => {
  ws.send(
    JSON.stringify({
      type: "JOIN_PROJECT",
      projectId: projectId,
      operationId: `join-${Date.now()}`,
      timestamp: Date.now(),
    })
  );
};

// 4. Server adds client to project room
// Server stores: projectRooms.set(projectId, Set([clientId1, clientId2, ...]))
```

### 2. User Action Flow (Task Update Example)

#### Step 1: User Initiates Action

```typescript
// User edits a task in TaskDetailModal
const handleSave = async () => {
  const updateData = {
    title: editedTask.title,
    status: editedTask.status,
    // ... other changes
  };

  // API call to update task
  const response = await apiClient.updateTask(task.id, updateData);
};
```

#### Step 2: API Route Processes Request

```typescript
// app/api/tasks/[id]/route.ts
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 1. Validate and update task in database
  const task = await TaskService.update(id, validatedData);

  // 2. Broadcast update to WebSocket server
  await websocketClient.broadcastTaskUpdate(task.projectId, {
    id: task.id,
    projectId: task.projectId,
    changes: validatedData,
    operationId: generateOperationId(),
    timestamp: Date.now(),
  });

  // 3. Return updated task to client
  return NextResponse.json({
    success: true,
    data: task,
  });
}
```

#### Step 3: WebSocket Client Sends HTTP Request

```typescript
// lib/websocket-client.ts
async broadcastTaskUpdate(projectId: string, update: any): Promise<void> {
  await this.sendMessage({
    type: 'TASK_UPDATE',
    payload: update,
    projectId,
    operationId: `task-update-${Date.now()}`,
    timestamp: Date.now(),
  });
}

private async sendMessage(message: WebSocketMessage): Promise<void> {
  // HTTP POST to WebSocket server's /broadcast endpoint
  const response = await fetch(`${this.serverUrl}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}
```

#### Step 4: WebSocket Server Broadcasts to All Clients

```javascript
// websocket-server/src/server.js
app.post("/broadcast", (req, res) => {
  const { type, payload, projectId, operationId, timestamp } = req.body;

  // Create message object
  const message = {
    type,
    payload,
    operationId,
    timestamp,
  };

  // Broadcast to all clients in the project
  broadcastToProject(projectId, message);

  res.json({ success: true });
});

function broadcastToProject(projectId, message, excludeClientId = null) {
  const roomClients = projectRooms.get(projectId);

  roomClients.forEach((clientId) => {
    if (excludeClientId && clientId === excludeClientId) return;

    const client = clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      // WebSocket.OPEN
      client.ws.send(JSON.stringify(message));
    }
  });
}
```

#### Step 5: Frontend Receives WebSocket Message

```typescript
// lib/use-websocket.ts
ws.onmessage = (event) => {
  const message: WebSocketMessage = JSON.parse(event.data);

  // Handle different message types
  switch (message.type) {
    case "TASK_UPDATE":
      handleTaskUpdate(message.payload as TaskUpdate);
      break;
    // ... other cases
  }
};
```

#### Step 6: Store Updates State

```typescript
// lib/store.ts
handleTaskUpdate: (update) => {
  set((state) => {
    const taskIndex = state.tasks.findIndex((t) => t.id === update.id);
    if (taskIndex === -1) return state;

    const updatedTask = { ...state.tasks[taskIndex], ...update.changes };
    const newTasks = [...state.tasks];
    newTasks[taskIndex] = updatedTask;

    return { tasks: newTasks };
  });
},
```

#### Step 7: UI Components Re-render

```typescript
// components/task-board.tsx
// Component automatically re-renders when tasks state changes
const { tasks } = useAppStore(); // Zustand subscription

// TaskDetailModal also updates immediately
useEffect(() => {
  if (selectedTask) {
    const updatedTask = tasks.find((t) => t.id === selectedTask.id);
    if (updatedTask) {
      setSelectedTask(updatedTask); // Updates modal content
    }
  }
}, [tasks, selectedTask]);
```

## Message Types and Their Flows

### Task Operations

#### Task Creation

1. **User**: Creates new task in TaskBoard
2. **API**: `POST /api/projects/[id]/tasks` → Database → WebSocket broadcast
3. **Server**: Broadcasts `TASK_CREATE` to project room
4. **Clients**: Receive message → Store adds task → UI shows new task

#### Task Update

1. **User**: Edits task in TaskDetailModal
2. **API**: `PUT /api/tasks/[id]` → Database → WebSocket broadcast
3. **Server**: Broadcasts `TASK_UPDATE` to project room
4. **Clients**: Receive message → Store updates task → UI reflects changes

#### Task Deletion

1. **User**: Deletes task in TaskDetailModal
2. **API**: `DELETE /api/tasks/[id]` → Database → WebSocket broadcast
3. **Server**: Broadcasts `TASK_DELETE` to project room
4. **Clients**: Receive message → Store removes task → UI removes task card

### Comment Operations

#### Comment Creation

1. **User**: Adds comment in TaskDetailModal
2. **API**: `POST /api/tasks/[id]/comments` → Database → WebSocket broadcast
3. **Server**: Broadcasts `COMMENT_CREATE` to project room
4. **Clients**: Receive message → Store adds comment → Modal shows new comment

#### Comment Update

1. **User**: Edits comment in TaskDetailModal
2. **API**: `PUT /api/comments/[id]` → Database → WebSocket broadcast
3. **Server**: Broadcasts `COMMENT_UPDATE` to project room
4. **Clients**: Receive message → Store updates comment → Modal shows edited comment

#### Comment Deletion

1. **User**: Deletes comment in TaskDetailModal
2. **API**: `DELETE /api/comments/[id]` → Database → WebSocket broadcast
3. **Server**: Broadcasts `COMMENT_DELETE` to project room
4. **Clients**: Receive message → Store removes comment → Modal removes comment

### Project Operations

#### Project Creation

1. **User**: Creates new project
2. **API**: `POST /api/projects` → Database → WebSocket broadcast
3. **Server**: Broadcasts `PROJECT_UPDATE` to project room
4. **Clients**: Receive message → Store adds project → Project list updates

#### Project Update

1. **User**: Edits project details
2. **API**: `PUT /api/projects/[id]` → Database → WebSocket broadcast
3. **Server**: Broadcasts `PROJECT_UPDATE` to project room
4. **Clients**: Receive message → Store updates project → UI reflects changes

#### Project Deletion

1. **User**: Deletes project
2. **API**: `DELETE /api/projects/[id]` → Database → WebSocket broadcast
3. **Server**: Broadcasts `PROJECT_DELETE` to project room
4. **Clients**: Receive message → Store removes project → UI removes project

## Real-Time Collaboration Scenarios

### Scenario 1: Multiple Users Editing Same Task

```
User A (Tab 1)          WebSocket Server          User B (Tab 2)
     │                         │                         │
     │ 1. Edits task title     │                         │
     ├────────────────────────►│                         │
     │                         │ 2. Broadcasts update    │
     │                         ├────────────────────────►│
     │ 3. Receives own update  │                         │ 3. Receives update
     │ 4. UI updates           │                         │ 4. UI updates
     │                         │                         │
     │                         │                         │ 5. Edits task status
     │                         │                         ├────────────────────────►│
     │ 6. Receives update      │ 6. Broadcasts update    │                         │
     │ 7. UI updates           │◄────────────────────────┤                         │
     │◄────────────────────────┤                         │ 7. Receives own update
     │                         │                         │ 8. UI updates
```

### Scenario 2: User Adds Comment While Another User Views Task

```
User A (Viewing Task)   WebSocket Server          User B (Adding Comment)
     │                         │                         │
     │ 1. Joined project room  │                         │
     │◄────────────────────────┤                         │
     │                         │                         │ 2. Creates comment
     │                         │                         ├────────────────────────►│
     │                         │ 3. Broadcasts comment   │                         │
     │ 4. Receives comment     │◄────────────────────────┤                         │
     │ 5. Modal updates        │                         │ 4. Receives own comment
     │◄────────────────────────┤                         │ 5. Modal updates
```

## State Synchronization

### Zustand Store Structure

```typescript
interface AppState {
  // Core data
  projects: ParsedProject[];
  tasks: ParsedTask[];
  currentProject: ParsedProject | null;
  comments: Record<string, Comment[]>; // taskId -> comments

  // WebSocket state
  wsConnected: boolean;
  wsMessages: WebSocketMessage[];

  // Real-time handlers
  handleTaskUpdate: (update: TaskUpdate) => void;
  handleTaskCreate: (task: ParsedTask) => void;
  handleTaskDelete: (taskId: string) => void;
  handleCommentUpdate: (update: CommentUpdate) => void;
  handleCommentCreate: (comment: Comment) => void;
  handleCommentDelete: (taskId: string, commentId: string) => void;
}
```

### Component State Updates

#### TaskBoard Component

```typescript
// Automatically re-renders when tasks state changes
const { tasks, currentProject } = useAppStore();

// WebSocket connection management
useEffect(() => {
  if (currentProject) {
    joinProject(currentProject.id); // Join project room
    return () => leaveProject(currentProject.id); // Leave on unmount
  }
}, [currentProject?.id]);
```

#### TaskDetailModal Component

```typescript
// Syncs with global tasks state for real-time updates
useEffect(() => {
  if (selectedTask) {
    const updatedTask = tasks.find((t) => t.id === selectedTask.id);
    if (updatedTask) {
      setSelectedTask(updatedTask); // Updates modal content
    }
  }
}, [tasks, selectedTask]);

// Immediate local updates for better UX
const handleSave = async () => {
  // 1. Update local state immediately (optimistic update)
  setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
  setSelectedTask(updatedTask);

  // 2. Send API request (which triggers WebSocket broadcast)
  await apiClient.updateTask(task.id, updateData);
};
```

## Error Handling and Resilience

### Connection Management

```typescript
// Auto-reconnection with exponential backoff
const reconnectInterval = 3000;
const maxReconnectAttempts = 5;

// Connection health monitoring
const pingInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
  }
}, 30000);
```

### Message Reliability

```typescript
// Message acknowledgment and retry logic
const sendMessage = (message: WebSocketMessage) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn("WebSocket not connected, queuing message");
    // Queue message for when connection is restored
  }
};
```

### Fallback Mechanisms

```typescript
// If WebSocket fails, fall back to polling
if (!wsConnected) {
  // Show offline indicator
  // Optionally implement polling for updates
}
```

## Performance Considerations

### Message Batching

- Multiple rapid updates are batched together
- Debounced message sending to prevent spam

### Connection Pooling

- Single WebSocket connection per browser tab
- Project room management for efficient broadcasting

### State Optimization

- Zustand subscriptions only trigger re-renders for relevant components
- Memoized selectors prevent unnecessary re-renders

## Security and Authentication

### User Identification

```typescript
// Client identifies itself to server
ws.send(
  JSON.stringify({
    type: "SET_USER",
    userId: currentUser.id,
  })
);
```

### Project Access Control

- Users can only join projects they have access to
- Server validates project permissions before adding to rooms

### Message Validation

- All incoming WebSocket messages are validated
- Malformed messages are rejected with error responses

This architecture provides a robust, real-time collaboration system where UI updates happen instantly across all connected clients, ensuring a seamless collaborative experience.
