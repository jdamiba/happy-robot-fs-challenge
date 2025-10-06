#!/bin/bash

# Collaborative Task Management System Startup Script

echo "🚀 Starting Collaborative Task Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Setting up database..."
npx prisma generate

# Push database schema
npx prisma db push

echo "✅ Database setup complete!"

# Start the application
echo "🌟 Starting application..."
echo "   - Next.js app: http://localhost:3000"
echo "   - WebSocket server: ws://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

# Start both servers
npm run dev:full
