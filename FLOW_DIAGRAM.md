# Real-Time UI Update Flow Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER ACTION                                      │
│  User edits task title in TaskDetailModal                                          │
└─────────────────────────────┬───────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND LAYER                                       │
│                                                                                     │
│  TaskDetailModal.handleSave()                                                      │
│  ├─ Validates form data                                                             │
│  ├─ Calls apiClient.updateTask()                                                   │
│  └─ Updates local state optimistically                                              │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    OPTIMISTIC UI UPDATE                                     │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │   │
│  │  │   TaskBoard     │    │ TaskDetailModal │    │  Zustand Store  │         │   │
│  │  │                 │    │                 │    │                 │         │   │
│  │  │ • Updates task  │◄──►│ • Shows changes │◄──►│ • tasks[] array │         │   │
│  │  │   in kanban     │    │   immediately   │    │   updated       │         │   │
│  │  │ • Re-renders    │    │ • Modal stays   │    │ • Triggers      │         │   │
│  │  │   columns       │    │   open          │    │   subscriptions │         │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 API LAYER                                          │
│                                                                                     │
│  app/api/tasks/[id]/route.ts (PUT)                                                 │
│  ├─ Validates request with Zod schema                                              │
│  ├─ Updates task in database via TaskService.update()                             │
│  ├─ Calls websocketClient.broadcastTaskUpdate()                                   │
│  └─ Returns updated task data                                                      │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        DATABASE UPDATE                                      │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │   │
│  │  │  Prisma Client  │    │   SQLite DB     │    │  TaskService    │         │   │
│  │  │                 │    │                 │    │                 │         │   │
│  │  │ • Validates     │◄──►│ • Updates task  │◄──►│ • Handles       │         │   │
│  │  │   schema        │    │   record        │    │   business      │         │   │
│  │  │ • Executes SQL  │    │ • Maintains     │    │   logic         │         │   │
│  │  │ • Returns data  │    │   consistency   │    │ • Returns       │         │   │
│  │  └─────────────────┘    └─────────────────┘    │   updated task  │         │   │
│  │                                                 └─────────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            WEBSOCKET CLIENT LAYER                                   │
│                                                                                     │
│  lib/websocket-client.ts                                                            │
│  ├─ websocketClient.broadcastTaskUpdate()                                          │
│  ├─ Creates message with projectId and task data                                   │
│  └─ Sends HTTP POST to WebSocket server                                            │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         HTTP BROADCAST REQUEST                             │   │
│  │                                                                             │   │
│  │  POST http://websocket-server:3001/broadcast                               │   │
│  │  {                                                                          │   │
│  │    "type": "TASK_UPDATE",                                                  │   │
│  │    "projectId": "project-123",                                             │   │
│  │    "payload": {                                                            │   │
│  │      "id": "task-456",                                                     │   │
│  │      "projectId": "project-123",                                           │   │
│  │      "changes": { "title": "Updated Title" }                               │   │
│  │    },                                                                       │   │
│  │    "operationId": "op-789",                                                │   │
│  │    "timestamp": 1703123456789                                              │   │
│  │  }                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            WEBSOCKET SERVER LAYER                                   │
│                                                                                     │
│  websocket-server/src/server.js                                                    │
│  ├─ Receives HTTP POST at /broadcast endpoint                                      │
│  ├─ Validates message format                                                       │
│  ├─ Looks up all clients in project room                                          │
│  └─ Broadcasts WebSocket message to all clients                                   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                          PROJECT ROOM MANAGEMENT                          │   │
│  │                                                                             │   │
│  │  projectRooms Map:                                                          │   │
│  │  ┌─────────────────┐    ┌─────────────────────────────────────────────┐   │   │
│  │  │ "project-123"   │───►│ Set(["client_001", "client_002", "client_003"])│   │   │
│  │  │ "project-456"   │───►│ Set(["client_004", "client_005"])            │   │   │
│  │  └─────────────────┘    └─────────────────────────────────────────────┘   │   │
│  │                                                                             │   │
│  │  For each client in project room:                                           │   │
│  │  ├─ Check if WebSocket connection is open                                   │   │
│  │  ├─ Send JSON.stringify(message)                                            │   │
│  │  └─ Log delivery success/failure                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT RECEPTION LAYER                                   │
│                                                                                     │
│  Multiple connected clients receive the WebSocket message simultaneously            │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT A (Original User)                          │   │
│  │                                                                             │   │
│  │  lib/use-websocket.ts                                                       │   │
│  │  ├─ ws.onmessage receives WebSocket message                                 │   │
│  │  ├─ Parses JSON and calls handleTaskUpdate()                               │   │
│  │  ├─ Store updates tasks array (already updated optimistically)             │   │
│  │  └─ UI components re-render with latest data                               │   │
│  │                                                                             │   │
│  │  Result: Confirmation that change was persisted                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT B (Collaborator)                           │   │
│  │                                                                             │   │
│  │  lib/use-websocket.ts                                                       │   │
│  │  ├─ ws.onmessage receives WebSocket message                                 │   │
│  │  ├─ Parses JSON and calls handleTaskUpdate()                               │   │
│  │  ├─ Store updates tasks array with new data                                │   │
│  │  └─ UI components re-render showing the change                             │   │
│  │                                                                             │   │
│  │  Result: Real-time update visible to collaborator                          │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT C (Another Collaborator)                   │   │
│  │                                                                             │   │
│  │  Same process as Client B                                                   │   │
│  │                                                                             │   │
│  │  Result: Real-time update visible to all collaborators                     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              UI UPDATE LAYER                                       │
│                                                                                     │
│  All connected clients see the update simultaneously                               │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           COMPONENT UPDATES                                │   │
│  │                                                                             │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │   │
│  │  │   TaskBoard     │    │ TaskDetailModal │    │  ProjectList    │         │   │
│  │  │                 │    │                 │    │                 │         │   │
│  │  │ • Task card     │◄──►│ • Shows updated │◄──►│ • Project       │         │   │
│  │  │   re-renders    │    │   title         │    │   indicators    │         │   │
│  │  │ • Column        │    │ • Modal stays   │    │   update        │         │   │
│  │  │   updates       │    │   open          │    │ • Task counts   │         │   │
│  │  │ • Status        │    │ • Real-time     │    │   refresh       │         │   │
│  │  │   indicators    │    │   sync          │    │ • Last modified │         │   │
│  │  │   refresh       │    │                 │    │   timestamps    │         │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘         │   │
│  │                                                                             │   │
│  │  Zustand Store Triggers:                                                    │   │
│  │  ├─ All subscribed components re-render                                     │   │
│  │  ├─ Task data is consistent across all clients                              │   │
│  │  ├─ Comments update if task modal is open                                   │   │
│  │  └─ Project metadata updates if relevant                                    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Message Flow Timeline

```
Time    Original User    API Server    WebSocket Server    Collaborator A    Collaborator B
  │           │              │              │                   │                   │
  │           │              │              │                   │                   │
 1│  Edit Task│              │              │                   │                   │
  ├──────────►│              │              │                   │                   │
  │           │              │              │                   │                   │
 2│           │ Update DB    │              │                   │                   │
  │           ├─────────────►│              │                   │                   │
  │           │              │              │                   │                   │
 3│           │              │              │                   │                   │
  │           │              │              │                   │                   │
 4│           │ HTTP POST    │              │                   │                   │
  │           ├─────────────►│              │                   │                   │
  │           │              │              │                   │                   │
 5│           │              │ Broadcast    │                   │                   │
  │           │              ├─────────────►│                   │                   │
  │           │              │              │                   │                   │
 6│           │              │              │ WebSocket Message │                   │
  │           │              │              ├──────────────────►│                   │
 7│           │              │              │                   │                   │
  │           │              │              │                   │                   │
 8│           │              │              │ WebSocket Message │                   │
  │           │              │              ├─────────────────────────────────────►│
  │           │              │              │                   │                   │
 9│           │              │              │                   │                   │
  │           │              │              │                   │                   │
10│           │ Return Task  │              │                   │                   │
  │           ├─────────────►│              │                   │                   │
  │           │              │              │                   │                   │
11│           │              │              │                   │                   │
  │           │              │              │                   │                   │
12│ UI Update │              │              │                   │ UI Update         │
  ├──────────►│              │              │                   ├──────────────────►│
  │           │              │              │                   │                   │
13│           │              │              │                   │                   │ UI Update
  │           │              │              │                   │                   ├──────────►
  │           │              │              │                   │                   │
```

## Key Benefits of This Architecture

### 1. **Immediate Feedback**

- Original user sees changes instantly (optimistic updates)
- No waiting for server round-trip

### 2. **Real-Time Collaboration**

- All collaborators see changes within milliseconds
- No need to refresh pages or poll for updates

### 3. **Reliability**

- Database is always the source of truth
- WebSocket failures don't affect data integrity
- Automatic reconnection handles network issues

### 4. **Scalability**

- WebSocket server can be deployed independently
- Can handle multiple frontend instances
- Project rooms isolate message broadcasting

### 5. **Performance**

- Single WebSocket connection per client
- Efficient message broadcasting to relevant users only
- Optimistic updates provide instant UI feedback

This architecture ensures that all users working on the same project see changes in real-time, creating a seamless collaborative experience.
