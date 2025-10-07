# Happy Robot - Complete Setup & Deployment Guide

A comprehensive guide for setting up, developing, and deploying the Happy Robot real-time project management application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Local Development Setup](#local-development-setup)
5. [Clerk Authentication Setup](#clerk-authentication-setup)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [Testing Real-Time Features](#testing-real-time-features)
10. [API Documentation](#api-documentation)
11. [Production Deployment](#production-deployment)
12. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
13. [Quick Reference](#quick-reference)

## Overview

Happy Robot is a modern, real-time collaborative project management application built with:

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Clerk for user management
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Standalone WebSocket server with Express
- **Deployment**: Render.com for both frontend and WebSocket server

### Key Features

- ✅ **Real-time collaboration** - See changes instantly across all clients
- ✅ **Project management** - Create, edit, and organize projects
- ✅ **Task management** - Kanban board with drag-and-drop functionality
- ✅ **Comment system** - Threaded comments with live updates
- ✅ **User presence** - Track active users per project
- ✅ **Task dependencies** - Link tasks with dependency validation
- ✅ **Status transitions** - Enforce business rules for status changes

## Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Next.js App   │◄─────────────►│   PostgreSQL    │
│   (Frontend)    │                │   Database      │
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

## Prerequisites

- **Node.js** 18+ (recommended: 20.x)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Docker** (optional, for containerized development)
- **Clerk account** (for authentication)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd happy-robot
```

### 2. Install Dependencies

```bash
# Install main application dependencies
npm install

# Install WebSocket server dependencies
cd websocket-server
npm install
cd ..
```

### 3. Project Structure

```
happy-robot/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── projects/             # Project management
│   │   ├── tasks/                # Task management
│   │   ├── comments/             # Comment system
│   │   ├── user/                 # User management
│   │   └── webhooks/             # Clerk webhooks
│   ├── projects/                 # Project pages
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── task-board.tsx            # Kanban board
│   ├── project-list.tsx          # Project listing
│   └── landing-page.tsx          # Landing page
├── lib/                          # Utilities and services
│   ├── api-client.ts             # API client
│   ├── auth-utils.ts             # Authentication helpers
│   ├── db.ts                     # Database services
│   ├── store.ts                  # Zustand store
│   ├── use-websocket.ts          # WebSocket hook
│   └── types.ts                  # TypeScript types
├── websocket-server/             # Standalone WebSocket server
│   ├── src/
│   │   └── server.js             # Main server file
│   ├── package.json              # Server dependencies
│   └── .env                      # Server environment
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema
└── scripts/                      # Utility scripts
```

## Clerk Authentication Setup

### 1. Create Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose your preferred authentication method (Email, Google, GitHub, etc.)

### 2. Get Clerk Keys

From your Clerk dashboard:

1. Go to **API Keys** section
2. Copy the following keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 3. Configure Clerk Settings

In your Clerk dashboard:

1. **Configure URLs**:

   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/projects`
   - After sign-up URL: `/projects`

2. **Set up Webhooks** (for user management):
   - Webhook URL: `https://your-domain.com/api/webhooks/clerk`
   - Events to subscribe to: `user.created`, `user.deleted`

## Database Setup

### Option 1: Docker Setup (Recommended)

```bash
# Navigate to the database directory
cd database

# Start PostgreSQL and pgAdmin
docker-compose up -d

# Check that services are running
docker-compose ps
```

This starts:

- **PostgreSQL** on port `5432`
- **pgAdmin** on port `8080` (admin@happyrobot.app / admin123)

**Connection Details:**

- Host: `localhost`
- Port: `5432`
- Database: `happyrobot`
- Username: `happyrobot`
- Password: `happyrobot123`

### Option 2: Local PostgreSQL

```bash
# Create database
createdb happyrobot

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/happyrobot"
```

### Option 3: Cloud Database

For production or cloud environments:

1. Create a PostgreSQL database on your cloud provider
2. Set the `DATABASE_URL` environment variable
3. Run the migration script

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

### Initialize Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

## Environment Configuration

### 1. Main Application (.env.local)

```bash
# Copy the template file
cp env.example .env.local
```

Then edit `.env.local` with your actual values:

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/projects
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/projects

# Database
DATABASE_URL=postgresql://happyrobot:happyrobot123@localhost:5432/happyrobot

# WebSocket Server Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
WEBSOCKET_SERVER_URL=http://localhost:3001

# Environment
NODE_ENV=development

# Clerk Webhook Secret (for production)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. WebSocket Server (.env)

```bash
# Copy the template file
cp websocket-server/env.example websocket-server/.env
```

Then edit `websocket-server/.env` with your actual values:

```env
# WebSocket Server Configuration
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development
```

## Running the Application

### 1. Start WebSocket Server (Terminal 1)

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

### 2. Start Next.js App (Terminal 2)

```bash
npm run dev
```

You should see:

```
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### 3. Access the Application

- **Main App**: http://localhost:3000
- **WebSocket Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Server Stats**: http://localhost:3001/stats

## Testing Real-Time Features

### 1. Open Multiple Browser Windows

#### Browser Window 1 - User A

1. Open `http://localhost:3000`
2. Sign in with Clerk authentication
3. Create a new project: "Test Collaboration Project"
4. Add a few tasks to the project

#### Browser Window 2 - User B (Incognito/Private)

1. Open `http://localhost:3000` in incognito mode
2. Sign in with a different Clerk account
3. Navigate to the same project created by User A
4. Position windows side by side

### 2. Test Real-Time Updates

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

### 3. Monitor WebSocket Activity

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

## API Documentation

### Interactive Documentation

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: http://localhost:3000/api/docs

### Key API Endpoints

#### Authentication

- `GET /api/user/current` - Get current user information

#### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project by ID
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

#### Tasks

- `GET /api/projects/{projectId}/tasks` - Get all tasks for project
- `POST /api/projects/{projectId}/tasks` - Create new task
- `GET /api/tasks/{id}` - Get task by ID
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

#### Comments

- `GET /api/tasks/{taskId}/comments` - Get all comments for task
- `POST /api/tasks/{taskId}/comments` - Create new comment
- `GET /api/comments/{id}` - Get comment by ID
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

### WebSocket Message Types

```typescript
type WebSocketMessageType =
  | "TASK_UPDATE"
  | "TASK_CREATE"
  | "TASK_DELETE"
  | "COMMENT_UPDATE"
  | "COMMENT_CREATE"
  | "COMMENT_DELETE"
  | "PROJECT_UPDATE"
  | "JOIN_PROJECT"
  | "LEAVE_PROJECT"
  | "SET_USER"
  | "USER_PRESENCE"
  | "CONNECTION_ESTABLISHED"
  | "ERROR";
```

## Production Deployment

### Deploy to Render.com

#### 1. Deploy Next.js App

1. **Create a new Web Service** on Render
2. **Connect your repository**
3. **Configure settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. **Set environment variables**:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_WS_URL=wss://your-websocket-server.onrender.com/ws
   WEBSOCKET_SERVER_URL=https://your-websocket-server.onrender.com
   NODE_ENV=production
   ```

#### 2. Deploy WebSocket Server

1. **Create a separate Web Service** on Render
2. **Connect to the same repository**
3. **Set Root Directory**: `websocket-server`
4. **Configure settings**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
5. **Set environment variables**:
   ```
   PORT=3001
   ALLOWED_ORIGINS=https://your-nextjs-app.onrender.com
   NODE_ENV=production
   ```

#### 3. Production Database Setup

1. **Create PostgreSQL database** on Render or external provider
2. **Update DATABASE_URL** in your Next.js app environment variables
3. **Run migrations**:
   ```bash
   npx prisma db push
   ```

### Environment Variables for Production

#### Next.js App

```env
# Clerk Authentication (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# WebSocket Server
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.onrender.com/ws
WEBSOCKET_SERVER_URL=https://your-websocket-server.onrender.com

# Environment
NODE_ENV=production
```

#### WebSocket Server

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://your-nextjs-app.onrender.com

# Logging
LOG_LEVEL=info
```

### Testing Production Deployment

#### 1. Health Checks

```bash
# Test Next.js app
curl https://your-app.onrender.com/api/health

# Test WebSocket server
curl https://your-websocket-server.onrender.com/health
```

#### 2. WebSocket Connection Test

```javascript
const ws = new WebSocket("wss://your-websocket-server.onrender.com/ws");
ws.onopen = () => console.log("Connected!");
ws.onmessage = (event) => console.log("Message:", event.data);
```

#### 3. Real-time Features Test

1. Open your production app in multiple browser tabs
2. Create a project in one tab
3. Verify project appears in other tabs
4. Test task creation, editing, and deletion
5. Test comment functionality

## Monitoring & Troubleshooting

### WebSocket Server Monitoring

#### Health Endpoint

```bash
curl https://your-websocket-server.onrender.com/health
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

#### Statistics Endpoint

```bash
curl https://your-websocket-server.onrender.com/stats
```

Expected response:

```json
{
  "totalClients": 2,
  "totalProjects": 1,
  "projectStats": {
    "project_789xyz": {
      "clientCount": 2,
      "clients": ["client_123", "client_456"]
    }
  }
}
```

### Common Issues & Solutions

#### 1. WebSocket Connection Failed

**Symptoms**: Real-time updates not working
**Solutions**:

- Check if WebSocket server is running
- Verify CORS configuration in WebSocket server
- Check browser console for connection errors
- Ensure `ALLOWED_ORIGINS` includes your domain

#### 2. Authentication Issues

**Symptoms**: Users can't sign in or access protected routes
**Solutions**:

- Verify Clerk keys are correct
- Check Clerk dashboard configuration
- Ensure webhook URL is set correctly
- Verify environment variables are loaded

#### 3. Database Connection Issues

**Symptoms**: API calls failing with database errors
**Solutions**:

- Verify DATABASE_URL is correct
- Check database server status
- Ensure proper network connectivity
- Run `npx prisma db push` to sync schema

#### 4. Real-time Updates Not Working

**Symptoms**: Changes don't appear in other browser windows
**Solutions**:

- Check WebSocket server logs
- Verify clients are joining project rooms
- Check browser Network tab for WebSocket connection
- Ensure WebSocket server is broadcasting messages

### Debug Commands

```bash
# Test WebSocket connection
wscat -c ws://localhost:3001/ws

# Test HTTP broadcast
curl -X POST http://localhost:3001/broadcast \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","projectId":"test","payload":{"msg":"hello"}}'

# Check database schema
npx prisma db pull --print

# View database contents
npx prisma studio
```

## Quick Reference

### Development Commands

```bash
# Install dependencies
npm install && cd websocket-server && npm install && cd ..

# Start WebSocket server
cd websocket-server && npm start

# Start Next.js app (in another terminal)
npm run dev

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open database studio
npx prisma studio

# Build for production
npm run build
```

### URLs & Endpoints

- **Main App**: http://localhost:3000
- **WebSocket Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Server Stats**: http://localhost:3001/stats
- **API Docs**: http://localhost:3000/api-docs
- **Database Studio**: http://localhost:5555 (when running `npx prisma studio`)

### Docker Commands

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Testing Commands

```bash
# Test WebSocket server
cd websocket-server && node test-client.js

# Load testing
cd websocket-server && artillery run load-test.yml

# Check services
lsof -i :3000  # Next.js app
lsof -i :3001  # WebSocket server
```

## Support

### Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify environment variables are set correctly
4. Ensure all ports (3000, 3001) are available
5. Test individual components using the provided test scripts

### Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**Happy coding! 🚀** Build amazing projects with real-time collaboration!
