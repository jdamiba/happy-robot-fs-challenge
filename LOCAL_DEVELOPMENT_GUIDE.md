# Local Development & Testing Guide

This guide walks you through setting up the Happy Robot project locally, running the WebSocket server, and testing real-time collaboration with multiple clients.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Docker** (optional, for containerized testing)

## Step 1: Clone and Setup the Project

### 1.1 Clone the Repository

```bash
git clone <your-repository-url>
cd happy-robot
```

### 1.2 Install Next.js App Dependencies

```bash
npm install
```

### 1.3 Install WebSocket Server Dependencies

```bash
cd websocket-server
npm install
cd ..
```

## Step 2: Environment Configuration

### 2.1 Create Environment Files

#### Main Application (.env)

```bash
cp env.example .env
```

Edit `.env` with your Clerk configuration:

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/projects
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/projects

# Database
DATABASE_URL=file:./dev.db

# WebSocket Server Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
WEBSOCKET_SERVER_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

#### WebSocket Server (.env)

```bash
cd websocket-server
cp env.example .env
```

Edit `websocket-server/.env`:

```env
# WebSocket Server Configuration
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development
```

## Step 3: Database Setup

### 3.1 Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma db push
```

### 3.2 Verify Database

```bash
# Check database schema
npx prisma studio
```

## Step 4: Start the WebSocket Server

### 4.1 Start WebSocket Server (Terminal 1)

```bash
cd websocket-server
npm start
```

You should see:

```
🚀 WebSocket server running on port 3001
📊 Health check: http://localhost:3001/health
📈 Stats: http://localhost:3001/stats
🔌 WebSocket endpoint: ws://localhost:3001/ws
```

### 4.2 Test WebSocket Server

Open another terminal and test the server:

```bash
cd websocket-server
node test-client.js
```

Expected output:

```
✅ Connected to WebSocket server
🆔 Client ID: client_1234567890_abcdef123
📨 Received message: CONNECTION_ESTABLISHED
📨 Received message: TASK_UPDATE
📡 HTTP broadcast result: { success: true, message: 'Broadcast sent', projectId: 'test-project-123', clientCount: 1 }
💚 Health check: { status: 'healthy', clients: 1, projects: 1, uptime: 1.234 }
📊 Server stats: { totalClients: 1, totalProjects: 1, projectStats: { ... } }
🏁 Tests completed, closing connection...
```

## Step 5: Start the Next.js Application

### 5.1 Start Development Server (Terminal 2)

```bash
npm run dev
```

You should see:

```
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

## Step 6: Test Real-Time Collaboration

### 6.1 Open Multiple Browser Windows

#### Browser Window 1 - User A

1. Open `http://localhost:3000`
2. Sign in with Clerk authentication
3. Create a new project: "Test Collaboration Project"
4. Add a few tasks to the project
5. Keep this window open

#### Browser Window 2 - User B (Incognito/Private)

1. Open `http://localhost:3000` in incognito mode
2. Sign in with a different Clerk account (or same account)
3. Navigate to the same project created by User A
4. Position windows side by side

### 6.2 Test Real-Time Updates

#### Test 1: Task Creation

- **User A**: Create a new task
- **Expected**: Task appears immediately in User B's window

#### Test 2: Task Editing

- **User A**: Edit a task title
- **Expected**: Changes appear in User B's window instantly

#### Test 3: Task Status Changes

- **User B**: Move a task to "In Progress"
- **Expected**: Status change visible in User A's window

#### Test 4: Comments

- **User A**: Open task details and add a comment
- **Expected**: Comment appears in User B's window if they have the same task open

#### Test 5: Task Deletion

- **User B**: Delete a task
- **Expected**: Task disappears from User A's kanban board

## Step 7: Monitor WebSocket Activity

### 7.1 Check WebSocket Server Logs

Watch Terminal 1 (WebSocket server) for activity:

```
New WebSocket connection: client_1234567890_abcdef123
Total clients: 1
Client client_1234567890_abcdef123 set user: user_2abc123def456
Client client_1234567890_abcdef123 joined project project_789xyz
Project project_789xyz now has 1 clients
Message from client_1234567890_abcdef123: TASK_UPDATE
Broadcasted to 1 clients in project project_789xyz
```

### 7.2 Check Server Stats

```bash
curl http://localhost:3001/stats
```

Expected response:

```json
{
  "totalClients": 2,
  "totalProjects": 1,
  "projectStats": {
    "project_789xyz": {
      "clientCount": 2,
      "clients": ["client_1234567890_abcdef123", "client_9876543210_fedcba456"]
    }
  }
}
```

### 7.3 Check Health Status

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": 1703123456789,
  "clients": 2,
  "projects": 1,
  "uptime": 123.45
}
```

## Step 8: Advanced Testing Scenarios

### 8.1 Multiple Project Collaboration

1. **User A**: Create "Project Alpha"
2. **User B**: Create "Project Beta"
3. **User A**: Switch to "Project Beta"
4. **User B**: Add tasks to "Project Beta"
5. **Expected**: User A sees tasks appear in real-time

### 8.2 Connection Resilience Testing

1. **User A**: Make changes while connected
2. **User B**: Disconnect network temporarily (disable WiFi)
3. **User A**: Make more changes
4. **User B**: Reconnect network
5. **Expected**: User B reconnects and sees all changes

### 8.3 Browser Tab Management

1. Open multiple tabs with the same project
2. Make changes in one tab
3. **Expected**: All tabs update simultaneously

## Step 9: Docker Testing (Optional)

### 9.1 Build Docker Images

```bash
# Build Next.js app
docker build -t happy-robot-app .

# Build WebSocket server
cd websocket-server
docker build -t happy-robot-websocket .
cd ..
```

### 9.2 Run with Docker Compose

```bash
# Create docker-compose.yml if it doesn't exist
docker-compose up --build
```

### 9.3 Test Docker Setup

1. Access app at `http://localhost:3000`
2. Access WebSocket server at `http://localhost:3001`
3. Repeat collaboration tests from Step 6

## Step 10: Troubleshooting

### 10.1 Common Issues

#### WebSocket Connection Failed

```bash
# Check if WebSocket server is running
curl http://localhost:3001/health

# Check browser console for errors
# Look for CORS or connection errors
```

#### Real-Time Updates Not Working

```bash
# Check WebSocket server logs
# Verify clients are joining project rooms
curl http://localhost:3001/stats

# Check browser Network tab for WebSocket connection
```

#### Database Issues

```bash
# Reset database
rm prisma/dev.db
npx prisma db push

# Check database schema
npx prisma studio
```

### 10.2 Debug Mode

#### Enable WebSocket Server Debug Logging

```bash
cd websocket-server
LOG_LEVEL=debug npm start
```

#### Enable Next.js Debug Logging

```bash
DEBUG=* npm run dev
```

### 10.3 Network Testing

```bash
# Test WebSocket connection manually
node websocket-server/test-client.js

# Test HTTP endpoints
curl -X POST http://localhost:3001/broadcast \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","projectId":"test-123","payload":{"message":"Hello"}}'
```

## Step 11: Performance Testing

### 11.1 Load Testing WebSocket Server

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test script (websocket-load-test.yml)
artillery run websocket-load-test.yml
```

### 11.2 Monitor Resource Usage

```bash
# Monitor WebSocket server resources
top -p $(pgrep -f "node.*websocket-server")

# Monitor Next.js app resources
top -p $(pgrep -f "next")
```

## Step 12: Cleanup

### 12.1 Stop All Services

```bash
# Stop Next.js app (Ctrl+C in Terminal 2)
# Stop WebSocket server (Ctrl+C in Terminal 1)

# Or kill processes
pkill -f "next"
pkill -f "websocket-server"
```

### 12.2 Clean Docker (if used)

```bash
docker-compose down
docker system prune -f
```

## Expected Results

After completing this guide, you should have:

✅ **WebSocket server running** on port 3001  
✅ **Next.js app running** on port 3000  
✅ **Database initialized** with Prisma  
✅ **Real-time collaboration** working between multiple browser windows  
✅ **WebSocket connections** visible in server logs  
✅ **Health checks** passing for both services  
✅ **Docker setup** tested (optional)

## Next Steps

1. **Deploy to Production**: Follow `DEPLOYMENT.md` for production deployment
2. **Add Features**: Implement additional real-time features
3. **Scale Testing**: Test with more concurrent users
4. **Monitoring**: Set up production monitoring and logging

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify environment variables are set correctly
4. Ensure all ports (3000, 3001) are available
5. Check firewall settings if using Docker

This setup provides a complete local development environment for testing real-time collaboration features!
