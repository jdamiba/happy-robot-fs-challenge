# Quick Reference - Happy Robot Development

## 🚀 Quick Start Commands

### Initial Setup

```bash
# Clone and setup everything
git clone <repo-url> && cd happy-robot
./setup-local.sh

# Start both services
./start-dev.sh
```

### Manual Commands

```bash
# Install dependencies
npm install && cd websocket-server && npm install && cd ..

# Setup database
npx prisma generate && npx prisma db push

# Start WebSocket server
cd websocket-server && npm start

# Start Next.js app (in another terminal)
npm run dev
```

## 🔧 Development Commands

### Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open database studio
npx prisma studio

# Reset database
rm prisma/dev.db && npx prisma db push
```

### WebSocket Server

```bash
# Start server
cd websocket-server && npm start

# Test connection
cd websocket-server && node test-client.js

# Load testing
cd websocket-server && artillery run load-test.yml

# Check health
curl http://localhost:3001/health

# Check stats
curl http://localhost:3001/stats
```

### Next.js App

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🐳 Docker Commands

### Development

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Individual Containers

```bash
# Build WebSocket server
cd websocket-server && docker build -t happy-robot-websocket .

# Build Next.js app
docker build -f Dockerfile.dev -t happy-robot-app .

# Run containers
docker run -p 3001:3001 happy-robot-websocket
docker run -p 3000:3000 happy-robot-app
```

## 🌐 URLs & Endpoints

### Application URLs

- **Main App**: http://localhost:3000
- **WebSocket Server**: http://localhost:3001
- **Database Studio**: http://localhost:5555 (when running `npx prisma studio`)

### WebSocket Server Endpoints

- **Health Check**: GET http://localhost:3001/health
- **Server Stats**: GET http://localhost:3001/stats
- **Broadcast**: POST http://localhost:3001/broadcast
- **WebSocket**: ws://localhost:3001/ws

### API Endpoints

- **Projects**: GET/POST http://localhost:3000/api/projects
- **Tasks**: GET/POST http://localhost:3000/api/projects/[id]/tasks
- **Comments**: GET/POST http://localhost:3000/api/tasks/[id]/comments
- **User**: GET http://localhost:3000/api/user/current

## 🧪 Testing Commands

### Real-Time Collaboration Test

```bash
# 1. Start both services
./start-dev.sh

# 2. Open multiple browser windows
# - Window 1: http://localhost:3000 (User A)
# - Window 2: http://localhost:3000 (User B, incognito)

# 3. Test scenarios:
# - Create projects and tasks
# - Edit tasks simultaneously
# - Add comments in real-time
# - Move tasks between columns
```

### WebSocket Testing

```bash
# Test WebSocket server functionality
cd websocket-server && node test-client.js

# Manual WebSocket test (using wscat if installed)
wscat -c ws://localhost:3001/ws

# HTTP broadcast test
curl -X POST http://localhost:3001/broadcast \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","projectId":"test-123","payload":{"message":"Hello"}}'
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load test
cd websocket-server && artillery run load-test.yml
```

## 🔍 Debugging Commands

### Check Services

```bash
# Check if ports are in use
lsof -i :3000  # Next.js app
lsof -i :3001  # WebSocket server

# Check running processes
ps aux | grep node

# Kill processes
pkill -f "next"
pkill -f "websocket-server"
```

### Environment Check

```bash
# Check environment variables
cat .env
cat websocket-server/.env

# Verify Node.js version
node --version  # Should be 18+

# Check npm version
npm --version
```

### Database Debugging

```bash
# Check database file
ls -la prisma/dev.db

# Check database schema
npx prisma db pull --print

# View database contents
npx prisma studio
```

## 📊 Monitoring Commands

### WebSocket Server Monitoring

```bash
# Real-time health monitoring
watch -n 1 'curl -s http://localhost:3001/health | jq'

# Real-time stats monitoring
watch -n 1 'curl -s http://localhost:3001/stats | jq'

# Check server logs
tail -f websocket-server/logs/server.log  # if logging to file
```

### Application Monitoring

```bash
# Check Next.js build status
npm run build

# Check bundle analysis
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build

# Monitor memory usage
top -p $(pgrep -f "next")
```

## 🚨 Troubleshooting Commands

### Connection Issues

```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:3001/ws

# Test CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3001/broadcast
```

### Database Issues

```bash
# Reset everything
rm -rf prisma/dev.db
rm -rf node_modules/.prisma
npx prisma generate
npx prisma db push

# Check database integrity
sqlite3 prisma/dev.db "PRAGMA integrity_check;"
```

### Permission Issues

```bash
# Fix script permissions
chmod +x setup-local.sh
chmod +x start-dev.sh
chmod +x websocket-server/test-client.js

# Fix file ownership (if needed)
sudo chown -R $USER:$USER .
```

## 📝 Common Workflows

### Daily Development

```bash
# Morning routine
git pull
./start-dev.sh

# Testing changes
# Make code changes
# Test in multiple browser windows
# Check WebSocket server logs

# End of day
# Commit changes
git add . && git commit -m "Description"
git push
```

### Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Develop and test
./start-dev.sh
# Test thoroughly with multiple clients

# Test Docker setup
docker-compose -f docker-compose.dev.yml up --build

# Commit and push
git add . && git commit -m "Add new feature"
git push origin feature/new-feature
```

### Production Deployment

```bash
# Test locally first
npm run build
docker-compose -f docker-compose.dev.yml up --build

# Deploy to production
# Follow DEPLOYMENT.md instructions
```

## 🎯 Quick Tips

- **Always test with multiple browser windows** for real-time features
- **Check WebSocket server logs** when debugging real-time issues
- **Use `npx prisma studio`** to inspect database state
- **Monitor server health** with `curl http://localhost:3001/health`
- **Use incognito windows** for testing multiple users
- **Check browser Network tab** for WebSocket connection status
- **Use `./setup-local.sh`** for clean environment setup
- **Use `./start-dev.sh`** for easy service management
