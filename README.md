# Happy Robot - Real-Time Project Management

A modern, real-time collaborative project management application built with Next.js, WebSocket server, and Clerk authentication.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repository-url>
cd happy-robot

# Install dependencies
npm install && cd websocket-server && npm install && cd ..

# Set up environment variables (see comprehensive guide)
cp env.example .env.local
cp websocket-server/env.example websocket-server/.env
# Edit .env.local and websocket-server/.env with your actual values

# Start database (Docker)
cd database && docker-compose up -d && cd ..

# Initialize database
npx prisma generate && npx prisma db push

# Start WebSocket server (Terminal 1)
cd websocket-server && npm start

# Start Next.js app (Terminal 2)
npm run dev
```

Access the application at http://localhost:3000

## 📚 Complete Documentation

**👉 [COMPREHENSIVE_SETUP_GUIDE.md](./COMPREHENSIVE_SETUP_GUIDE.md)**

The comprehensive guide includes:

- **Complete setup instructions** for local development
- **Clerk authentication setup** with step-by-step configuration
- **Database setup** with multiple options (Docker, local, cloud)
- **Environment configuration** for all environments
- **Real-time testing** with multiple browser windows
- **API documentation** with interactive Swagger UI
- **Production deployment** to Render.com
- **Monitoring and troubleshooting** guides
- **Quick reference** commands and URLs

## 🏗️ Architecture

```
┌─────────────────┐    JWT Auth     ┌─────────────────┐
│   Clerk.com     │◄──────────────►│   Next.js App   │
│  (Auth Service) │                 │   (Frontend)    │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │ Webhooks                          │ HTTP API
         │ (user.created,                    ▼
         │  user.deleted)            ┌─────────────────┐
         │                           │   PostgreSQL    │
         ▼                           │   Database      │
┌─────────────────┐                 └─────────────────┘
│  Next.js API    │                          │
│  /api/webhooks/ │                          │
│     /clerk      │                          │
└─────────────────┘                          │
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

### Authentication Flow

1. **User Authentication**: Users sign in through Clerk's hosted authentication UI
2. **JWT Tokens**: Clerk provides JWT tokens for authenticated requests
3. **API Authorization**: Next.js API routes validate JWT tokens from Clerk
4. **User Management**: Clerk webhooks sync user data to PostgreSQL database
5. **Real-time Updates**: WebSocket server handles live collaboration features

## 🔄 Data Synchronization & Real-time Strategy

### WebSocket Message Flow

```
User Action → API Route → Database → WebSocket Broadcast → All Connected Clients
```

1. **Optimistic Updates**: UI updates immediately for instant feedback
2. **Server Validation**: API routes validate and persist changes to database
3. **WebSocket Broadcast**: Changes broadcast to all clients in the project room
4. **Conflict Resolution**: Last-write-wins with timestamp-based ordering
5. **Rollback Capability**: Failed operations automatically revert UI changes

### Synchronization Features

- **Project Rooms**: Users join/leave project-specific WebSocket rooms
- **User Presence**: Track active users per project with client IDs
- **Message Filtering**: Clients ignore their own broadcasted messages
- **Connection Resilience**: Auto-reconnection with exponential backoff
- **Rate Limiting**: Prevent API request storms with request throttling

## 📈 Scaling Strategy

### Current Architecture (Single Instance)

**Strengths**:
- Simple deployment and maintenance
- Low latency for small teams
- Easy debugging and monitoring

**Limitations**:
- Single point of failure for WebSocket connections
- Memory usage grows with connected users
- No horizontal scaling capability

### Future Scaling Approaches

#### Phase 1: Connection Optimization
- **Connection Pooling**: Limit concurrent WebSocket connections per user
- **Message Batching**: Batch multiple updates into single broadcasts
- **Memory Management**: Implement connection cleanup for idle users

#### Phase 2: Horizontal Scaling
- **Load Balancer**: Distribute WebSocket connections across multiple servers
- **Redis Pub/Sub**: Share state across WebSocket server instances
- **Sticky Sessions**: Route users to same server instance for session persistence

#### Phase 3: Advanced Scaling
- **Microservices**: Split WebSocket server into specialized services
- **Message Queues**: Use Redis Streams or Apache Kafka for reliable messaging
- **Database Sharding**: Partition data by project or user for better performance

### Scaling Implementation Plan

```typescript
// Future Redis integration example
const redis = new Redis(process.env.REDIS_URL);

// Publish to all server instances
await redis.publish('project:123', JSON.stringify({
  type: 'TASK_UPDATE',
  payload: taskUpdate,
  timestamp: Date.now()
}));
```

## ⚖️ Technology Choices & Tradeoffs

### Frontend: Next.js 15

**✅ Chosen Because**:
- **App Router**: Modern routing with server components
- **TypeScript**: Strong typing for large codebases
- **API Routes**: Built-in backend functionality
- **Performance**: Automatic code splitting and optimization

**❌ Tradeoffs**:
- **Learning Curve**: App Router has different patterns than Pages Router
- **Bundle Size**: Larger initial bundle compared to vanilla React
- **Flexibility**: Less control over build process vs. custom webpack setup

### Authentication: Clerk

**✅ Chosen Because**:
- **Rapid Development**: Pre-built auth UI and flows
- **Security**: Industry-standard JWT handling and security practices
- **Webhooks**: Built-in user lifecycle management
- **Multi-provider**: Support for email, OAuth, and social login

**❌ Tradeoffs**:
- **Vendor Lock-in**: Dependent on Clerk's pricing and feature roadmap
- **Customization**: Limited control over auth UI styling and behavior
- **Cost**: Can become expensive at scale vs. self-hosted solutions

### Database: PostgreSQL + Prisma

**✅ Chosen Because**:
- **Reliability**: ACID compliance and robust data integrity
- **Type Safety**: Prisma generates TypeScript types from schema
- **Migrations**: Version-controlled database schema changes
- **Performance**: Excellent query optimization and indexing

**❌ Tradeoffs**:
- **Complexity**: More setup than SQLite for development
- **Learning Curve**: Prisma ORM patterns vs. raw SQL
- **Cost**: Managed PostgreSQL services cost more than file-based databases

### Real-time: Custom WebSocket Server

**✅ Chosen Because**:
- **Control**: Full control over message routing and business logic
- **Performance**: Low latency for real-time updates
- **Customization**: Project-specific rooms and user presence
- **Cost**: No per-message pricing like hosted solutions

**❌ Tradeoffs**:
- **Maintenance**: Need to handle connection management and scaling
- **Reliability**: More complex than using hosted services like Pusher
- **Development Time**: Custom implementation vs. plug-and-play solutions

### Deployment: Render.com

**✅ Chosen Because**:
- **Simplicity**: Easy deployment from GitHub
- **Free Tier**: Good for development and small projects
- **Auto-scaling**: Automatic scaling based on traffic
- **Built-in Monitoring**: Health checks and logging

**❌ Tradeoffs**:
- **Sleep Mode**: Free services sleep after inactivity
- **Cold Starts**: 30-second wake-up time for sleeping services
- **Vendor Lock-in**: Platform-specific deployment configuration

## 🔄 Data Flow & State Management

### Client-Side State (Zustand)

```typescript
// Optimistic updates with rollback capability
const updateTaskOptimistic = (taskId: string, updates: Partial<Task>) => {
  // 1. Update UI immediately
  setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
  
  // 2. Send to server
  apiClient.updateTask(taskId, updates)
    .then(response => {
      // 3. Confirm update or rollback on failure
      if (!response.success) {
        rollbackOperation(taskId, originalTask);
      }
    });
};
```

### Server-Side Flow

```typescript
// API Route → Database → WebSocket Broadcast
export async function PUT(request: Request) {
  // 1. Validate and update database
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updates
  });
  
  // 2. Broadcast to WebSocket server
  await fetch(`${WEBSOCKET_SERVER_URL}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'TASK_UPDATE',
      projectId: updatedTask.projectId,
      payload: updatedTask
    })
  });
  
  return Response.json({ success: true, data: updatedTask });
}
```

### WebSocket Message Processing

```typescript
// WebSocket server message handling
ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  // Route to project room
  const projectRoom = `project:${message.projectId}`;
  
  // Broadcast to all clients in room (except sender)
  wss.clients.forEach(client => {
    if (client.room === projectRoom && client !== ws) {
      client.send(JSON.stringify(message));
    }
  });
});
```

### Conflict Resolution Strategy

**Current Approach: Last-Write-Wins**
- Timestamp-based conflict resolution
- Client timestamps for optimistic updates
- Server timestamps for authoritative ordering

**Future Improvements**:
- Operational Transformation for text editing
- CRDTs (Conflict-free Replicated Data Types) for complex conflicts
- User-aware conflict resolution with merge strategies

## ✨ Key Features

- ✅ **Real-time collaboration** - See changes instantly across all clients
- ✅ **Project management** - Create, edit, and organize projects
- ✅ **Task management** - Kanban board with drag-and-drop functionality
- ✅ **Comment system** - Threaded comments with live updates
- ✅ **User presence** - Track active users per project
- ✅ **Task dependencies** - Link tasks with dependency validation
- ✅ **Status transitions** - Enforce business rules for status changes

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSocket server with Express
- **Deployment**: Render.com

## 📁 Project Structure

```
happy-robot/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   └── projects/                 # Project pages
├── components/                   # React components
├── lib/                          # Utilities and services
├── websocket-server/             # Standalone WebSocket server
├── prisma/                       # Database schema
└── scripts/                      # Utility scripts
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm
- Git
- Docker (optional)
- Clerk account (for authentication)

### Clerk Authentication Setup

1. **Create Clerk Account**:

   - Go to [clerk.com](https://clerk.com) and sign up
   - Create a new application
   - Choose your preferred authentication method (Email, Google, GitHub, etc.)

2. **Get Clerk Keys**:

   - In your Clerk dashboard, go to **API Keys** section
   - Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)

3. **Configure Clerk URLs**:

   - In Clerk dashboard, go to **Paths** section
   - Set the following URLs:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in URL: `/projects`
     - After sign-up URL: `/projects`

4. **Set up Webhooks** (for production):
   - Go to **Webhooks** in Clerk dashboard
   - Create webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.deleted`
   - Copy the webhook secret

### Environment Setup

1. **Copy environment files**:

   ```bash
   cp env.example .env.local
   cp websocket-server/env.example websocket-server/.env
   ```

2. **Configure environment variables**:

   Edit `.env.local` with your Clerk keys:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   DATABASE_URL=postgresql://happyrobot:happyrobot123@localhost:5432/happyrobot
   NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
   WEBSOCKET_SERVER_URL=http://localhost:3001
   ```

3. **Set up database**:
   ```bash
   cd database
   docker-compose up -d
   cd ..
   npx prisma generate
   ```

### Running Locally

#### Start WebSocket Server

```bash
cd websocket-server
npm start
```

#### Start Next.js App

```bash
npm run dev
```

#### Access the Application

- **App**: http://localhost:3000
- **WebSocket Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Docs**: http://localhost:3000/api-docs

## 🧪 Testing Real-Time Collaboration

1. **Open multiple browser windows**:

   - Window 1: `http://localhost:3000` (User A)
   - Window 2: `http://localhost:3000` (User B, incognito)

2. **Test scenarios**:
   - Create projects and tasks
   - Edit tasks simultaneously
   - Add comments in real-time
   - Move tasks between status columns
   - Delete tasks and projects

## 🚀 Deployment

### Production Deployment

See [COMPREHENSIVE_SETUP_GUIDE.md](./COMPREHENSIVE_SETUP_GUIDE.md#production-deployment) for detailed deployment instructions including:

- Render.com deployment
- Environment configuration
- Database setup
- WebSocket server deployment
- Testing production deployment

## 📖 API Documentation

- **Interactive Documentation**: http://localhost:3000/api-docs
- **OpenAPI Spec**: http://localhost:3000/api/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with multiple browser windows
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

### Getting Help

1. Check the [COMPREHENSIVE_SETUP_GUIDE.md](./COMPREHENSIVE_SETUP_GUIDE.md#monitoring--troubleshooting) troubleshooting section
2. Review server logs for error messages
3. Verify environment variables are set correctly
4. Test individual components using the provided test scripts

### Common Issues

1. **WebSocket connection failed**: Check if WebSocket server is running on port 3001
2. **Real-time updates not working**: Verify clients are joining project rooms
3. **Database errors**: Run `npx prisma db push` to sync schema
4. **Authentication issues**: Verify Clerk configuration in `.env`

---

**Happy coding! 🚀** Build amazing projects with real-time collaboration!

For complete setup instructions, see [COMPREHENSIVE_SETUP_GUIDE.md](./COMPREHENSIVE_SETUP_GUIDE.md)
