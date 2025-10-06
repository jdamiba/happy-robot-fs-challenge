#!/bin/bash

# Happy Robot Local Development Setup Script
# This script sets up the local development environment

set -e  # Exit on any error

echo "🚀 Setting up Happy Robot local development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

print_success "Node.js version $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "npm version $(npm --version) detected"

# Install main app dependencies
print_status "Installing Next.js app dependencies..."
npm install
print_success "Next.js app dependencies installed"

# Install WebSocket server dependencies
print_status "Installing WebSocket server dependencies..."
cd websocket-server
npm install
cd ..
print_success "WebSocket server dependencies installed"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Create environment files if they don't exist
print_status "Setting up environment files..."

if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        print_warning "Created .env file from env.example"
        print_warning "Please edit .env with your Clerk configuration before starting the app"
    else
        print_error "env.example file not found. Please create .env manually."
    fi
else
    print_success ".env file already exists"
fi

if [ ! -f websocket-server/.env ]; then
    if [ -f websocket-server/env.example ]; then
        cp websocket-server/env.example websocket-server/.env
        print_success "Created websocket-server/.env file"
    else
        print_warning "websocket-server/env.example not found"
    fi
else
    print_success "websocket-server/.env file already exists"
fi

# Check if database exists, if not create it
print_status "Setting up database..."
if [ ! -f prisma/dev.db ]; then
    print_status "Creating database..."
    npx prisma db push
    print_success "Database created and migrated"
else
    print_success "Database already exists"
fi

# Make test client executable
chmod +x websocket-server/test-client.js

print_success "Setup completed successfully!"
echo ""
echo "🎉 Happy Robot is ready for local development!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Clerk configuration"
echo "2. Start WebSocket server: cd websocket-server && npm start"
echo "3. Start Next.js app: npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "For detailed instructions, see LOCAL_DEVELOPMENT_GUIDE.md"
echo ""
echo "Quick test commands:"
echo "  - Test WebSocket server: cd websocket-server && node test-client.js"
echo "  - Check server health: curl http://localhost:3001/health"
echo "  - Check server stats: curl http://localhost:3001/stats"
echo ""
print_success "Happy coding! 🚀"
