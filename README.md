# Happy Robot - Real-Time Project Management

A modern, real-time collaborative project management application built with Next.js, WebSocket server, and Clerk authentication.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repository-url>
cd happy-robot

# Run the setup script
./setup-local.sh

# Start both services
./start-dev.sh
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm install
cd websocket-server && npm install && cd ..

# Set up environment files
cp env.example .env
cp websocket-server/env.example websocket-server/.env

# Set up database (choose one option)

# Option A: Using Docker (Recommended)
cd database && docker-compose up -d && cd ..

# Option B: Using local PostgreSQL
export DATABASE_URL="postgresql://username:password@localhost:5432/happyrobot"
cd database && ./setup.sh && cd ..

# Generate Prisma client
npx prisma generate

# Start WebSocket server (Terminal 1)
cd websocket-server && npm start

# Start Next.js app (Terminal 2)
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Next.js App   │◄─────────────►│   Database      │
│   (Frontend)    │                │   (PostgreSQL)  │
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

## 📁 Project Structure

```
happy-robot/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── projects/             # Project management
│   │   ├── tasks/                # Task management
│   │   ├── comments/             # Comment system
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
│   ├── websocket-client.ts       # WebSocket client service
│   └── types.ts                  # TypeScript types
├── websocket-server/             # Standalone WebSocket server
│   ├── src/
│   │   └── server.js             # Main server file
│   ├── test-client.js            # Test client
│   ├── load-test.yml             # Load testing config
│   └── package.json              # Server dependencies
├── database/                     # Database setup and migrations
│   ├── migrations/               # SQL migration files
│   ├── docker-compose.yml        # Docker database setup
│   ├── setup.sh                  # Database setup script
│   └── verify.js                 # Database verification
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema
└── scripts/                      # Utility scripts
    ├── setup-database.sh         # Database setup
    └── start.sh                  # Development startup
```

## 🔧 Features

### Real-Time Collaboration

- ✅ **Live Updates** - See changes instantly across all clients
- ✅ **Task Management** - Create, edit, delete tasks in real-time
- ✅ **Comment System** - Threaded comments with live updates
- ✅ **Project Rooms** - Isolated collaboration spaces
- ✅ **User Presence** - Track active users per project

### Task Management

- ✅ **Kanban Board** - Drag-and-drop task organization
- ✅ **Task Dependencies** - Link tasks with dependency validation
- ✅ **Status Transitions** - Enforce business rules for status changes
- ✅ **Task Details** - Rich task editing with modal interface
- ✅ **Visual Indicators** - Show blocked tasks and dependencies

### Project Management

- ✅ **Project Creation** - Easy project setup
- ✅ **Project Navigation** - Seamless project switching
- ✅ **Project Deletion** - Safe project removal with cleanup
- ✅ **User Management** - Clerk authentication integration

### Technical Features

- ✅ **WebSocket Server** - Standalone, scalable real-time server
- ✅ **Optimistic Updates** - Instant UI feedback
- ✅ **Error Handling** - Graceful error recovery
- ✅ **Connection Management** - Auto-reconnection and health monitoring
- ✅ **Docker Support** - Containerized development and deployment

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm
- Git

### Environment Setup

1. **Copy environment files**:

   ```bash
   cp env.example .env
   cp websocket-server/env.example websocket-server/.env
   ```

2. **Configure Clerk authentication**:

   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your keys to `.env`

3. **Set up database**:

   **Option A: Using Docker (Recommended)**

   ```bash
   cd database
   docker-compose up -d
   cd ..
   npx prisma generate
   ```

   **Option B: Using Local PostgreSQL**

   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/happyrobot"
   cd database
   ./setup.sh
   cd ..
   npx prisma generate
   ```

   See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

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
- **Server Stats**: http://localhost:3001/stats

### Testing Real-Time Collaboration

1. **Open multiple browser windows**:

   - Window 1: `http://localhost:3000` (User A)
   - Window 2: `http://localhost:3000` (User B, incognito)

2. **Test scenarios**:

   - Create projects and tasks
   - Edit tasks simultaneously
   - Add comments in real-time
   - Move tasks between status columns
   - Delete tasks and projects

3. **Monitor WebSocket activity**:

   ```bash
   # Test WebSocket server
   cd websocket-server && node test-client.js

   # Check server health
   curl http://localhost:3001/health

   # View server stats
   curl http://localhost:3001/stats
   ```

## 🐳 Docker Development

### Using Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Individual Containers

```bash
# Build and run WebSocket server
cd websocket-server
docker build -t happy-robot-websocket .
docker run -p 3001:3001 happy-robot-websocket

# Build and run Next.js app
docker build -f Dockerfile.dev -t happy-robot-app .
docker run -p 3000:3000 happy-robot-app
```

## 📚 Documentation

- **[Local Development Guide](LOCAL_DEVELOPMENT_GUIDE.md)** - Detailed setup and testing instructions
- **[Real-Time Flow Documentation](REAL_TIME_FLOW.md)** - Complete flow trace of real-time updates
- **[Flow Diagrams](FLOW_DIAGRAM.md)** - Visual representations of system interactions
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[WebSocket Server README](websocket-server/README.md)** - Standalone server documentation

## 🧪 Testing

### Unit Testing

```bash
# Run tests (when implemented)
npm test
```

### Integration Testing

```bash
# Test WebSocket server
cd websocket-server && node test-client.js

# Load testing
cd websocket-server && artillery run load-test.yml
```

### Manual Testing

- Follow the [Local Development Guide](LOCAL_DEVELOPMENT_GUIDE.md) for comprehensive testing scenarios
- Test real-time collaboration with multiple browser windows
- Verify WebSocket connection health and reconnection

## 🚀 Deployment

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:

- Render.com
- Vercel + Railway
- Docker containers
- Other cloud platforms

### Environment Variables

```env
# Required for production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com/ws
WEBSOCKET_SERVER_URL=https://your-websocket-server.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Test real-time features with multiple clients
- Update documentation for new features

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

### Common Issues

1. **WebSocket connection failed**: Check if WebSocket server is running on port 3001
2. **Real-time updates not working**: Verify clients are joining project rooms
3. **Database errors**: Run `npx prisma db push` to sync schema
4. **Authentication issues**: Verify Clerk configuration in `.env`

### Getting Help

- Check the troubleshooting sections in the documentation
- Review server logs for error messages
- Test individual components using the provided test scripts

## 🎯 Roadmap

- [ ] **User Roles & Permissions** - Granular access control
- [ ] **File Attachments** - Support for task attachments
- [ ] **Notifications** - Real-time notifications and alerts
- [ ] **Time Tracking** - Built-in time tracking for tasks
- [ ] **Reporting** - Project analytics and reporting
- [ ] **Mobile App** - React Native mobile application
- [ ] **API Documentation** - OpenAPI/Swagger documentation
- [ ] **Advanced Search** - Full-text search across projects and tasks

---

**Happy coding! 🚀** Build amazing projects with real-time collaboration!
