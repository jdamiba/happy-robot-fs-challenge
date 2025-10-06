#!/bin/bash

# Database setup script for Collaborative Task Management System
# This script sets up the PostgreSQL database with Prisma and runs the setup SQL

echo "🚀 Setting up database for Collaborative Task Management System..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your Neon PostgreSQL connection string in .env file"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] || [ -z "$CLERK_SECRET_KEY" ]; then
    echo "⚠️  Warning: Clerk environment variables not set"
    echo "Please add the following to your .env file:"
    echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here"
    echo "CLERK_SECRET_KEY=sk_test_your_key_here"
    echo "CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here"
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma db push

echo "📊 Setting up database functions and triggers..."
# Run the setup SQL file
psql "$DATABASE_URL" -f setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure Clerk webhook endpoint: https://your-domain.com/api/webhooks/clerk"
    echo "2. Set CLERK_WEBHOOK_SECRET in your .env file"
    echo "3. Start the development server: npm run dev:full"
    echo ""
    echo "🔗 Webhook events to enable in Clerk:"
    echo "- user.created"
    echo "- user.updated" 
    echo "- user.deleted"
else
    echo "❌ Database setup failed"
    exit 1
fi
