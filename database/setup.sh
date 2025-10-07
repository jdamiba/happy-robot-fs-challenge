#!/bin/bash

# Happy Robot Database Setup Script
# This script sets up the database schema for the Happy Robot project

set -e

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

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    print_status "Please set DATABASE_URL before running this script"
    print_status "Example: export DATABASE_URL='postgresql://username:password@localhost:5432/happyrobot'"
    exit 1
fi

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')

print_status "Setting up database: $DB_NAME on $DB_HOST:$DB_PORT"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_error "psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Test database connection
print_status "Testing database connection..."
if ! psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
    print_error "Cannot connect to database. Please check your DATABASE_URL and ensure the database server is running."
    exit 1
fi
print_success "Database connection successful"

# Check if tables already exist
print_status "Checking if database is already initialized..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'projects', 'tasks', 'comments');" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    print_warning "Database appears to already have tables. This might overwrite existing data."
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled"
        exit 0
    fi
fi

# Run the migration
print_status "Running database migration..."
if psql "$DATABASE_URL" -f "$(dirname "$0")/migrations/001_initial_schema.sql"; then
    print_success "Database migration completed successfully"
else
    print_error "Database migration failed"
    exit 1
fi

# Verify the setup
print_status "Verifying database setup..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'projects', 'tasks', 'comments', 'task_assignees');" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -eq 5 ]; then
    print_success "All tables created successfully"
else
    print_error "Expected 5 tables, found $TABLE_COUNT"
    exit 1
fi

# Check if enum was created
ENUM_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_type WHERE typname = 'task_status';" 2>/dev/null | tr -d ' ')

if [ "$ENUM_COUNT" -eq 1 ]; then
    print_success "TaskStatus enum created successfully"
else
    print_error "TaskStatus enum not found"
    exit 1
fi

# Generate Prisma client
print_status "Generating Prisma client..."
if npx prisma generate; then
    print_success "Prisma client generated successfully"
else
    print_warning "Prisma client generation failed, but database setup is complete"
fi

print_success "Database setup completed successfully!"
print_status "You can now start your Happy Robot application"
print_status "Run 'npm run dev' to start the development server"
