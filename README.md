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

### Environment Setup

1. **Copy environment files**:

   ```bash
   cp env.production .env.local
   cp websocket-server/env.example websocket-server/.env
   ```

2. **Configure Clerk authentication**:

   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your keys to `.env.local`

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
