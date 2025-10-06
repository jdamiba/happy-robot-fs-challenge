#!/bin/bash

# Happy Robot Development Startup Script
# Starts both WebSocket server and Next.js app

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if .env files exist
if [ ! -f .env ]; then
    print_warning ".env file not found. Please run ./setup-local.sh first"
    exit 1
fi

if [ ! -f websocket-server/.env ]; then
    print_warning "websocket-server/.env file not found. Please run ./setup-local.sh first"
    exit 1
fi

print_status "Starting Happy Robot development environment..."

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down services..."
    kill $WEBSOCKET_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start WebSocket server in background
print_status "Starting WebSocket server on port 3001..."
cd websocket-server
npm start &
WEBSOCKET_PID=$!
cd ..

# Wait a moment for WebSocket server to start
sleep 3

# Check if WebSocket server started successfully
if ! curl -s http://localhost:3001/health > /dev/null; then
    print_warning "WebSocket server may not have started properly"
    print_warning "Check the logs above for any errors"
fi

# Start Next.js app in background
print_status "Starting Next.js app on port 3000..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 5

print_success "Both services are starting up!"
echo ""
echo "🌐 Next.js App: http://localhost:3000"
echo "🔌 WebSocket Server: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/health"
echo "📈 Server Stats: http://localhost:3001/stats"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for user to stop services
wait $WEBSOCKET_PID $NEXTJS_PID
