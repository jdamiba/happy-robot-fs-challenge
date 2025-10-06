# Database Setup Guide

This guide will help you set up the PostgreSQL database with Neon and Clerk authentication for the Collaborative Task Management System.

## Prerequisites

- Neon PostgreSQL database (already configured in your .env)
- Clerk account with authentication setup
- Node.js 18+ installed

## Environment Variables

Make sure your `.env` file contains the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# WebSocket Configuration
WS_PORT=3001
```

## Database Setup

### 1. Run the Database Setup Script

```bash
./scripts/setup-database.sh
```

This script will:

- Install dependencies
- Generate Prisma client
- Push the database schema
- Set up database functions and triggers
- Create indexes for better performance

### 2. Manual Setup (Alternative)

If you prefer to run the commands manually:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run setup SQL (optional - for additional functions and triggers)
psql "$DATABASE_URL" -f setup.sql
```

## Clerk Webhook Configuration

### 1. Get Your Webhook Secret

1. Go to your Clerk Dashboard
2. Navigate to "Webhooks" in the sidebar
3. Create a new webhook endpoint
4. Set the endpoint URL to: `https://your-domain.com/api/webhooks/clerk`
5. Copy the webhook secret and add it to your `.env` file as `CLERK_WEBHOOK_SECRET`

### 2. Configure Webhook Events

Enable the following events in your Clerk webhook:

- `user.created`
- `user.updated`
- `user.deleted`

### 3. Test the Webhook

You can test the webhook locally using ngrok or by deploying to a staging environment.

## Database Schema

The database includes the following tables:

### Users Table

- `id`: Primary key (CUID)
- `clerk_id`: Unique Clerk user ID
- `email`: User's email address
- `first_name`: User's first name
- `last_name`: User's last name
- `image_url`: User's profile image URL
- `created_at`: Timestamp when user was created
- `updated_at`: Timestamp when user was last updated

### Projects Table

- `id`: Primary key (CUID)
- `name`: Project name
- `description`: Project description
- `metadata`: JSON object for additional project data
- `owner_id`: Foreign key to users table
- `created_at`: Timestamp when project was created
- `updated_at`: Timestamp when project was last updated

### Tasks Table

- `id`: Primary key (CUID)
- `project_id`: Foreign key to projects table
- `title`: Task title
- `status`: Task status (TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED)
- `assigned_to`: Array of user IDs assigned to the task
- `configuration`: JSON object containing priority, description, tags, and custom fields
- `dependencies`: Array of task IDs that this task depends on
- `created_at`: Timestamp when task was created
- `updated_at`: Timestamp when task was last updated

### Comments Table

- `id`: Primary key (CUID)
- `task_id`: Foreign key to tasks table
- `content`: Comment content
- `author_id`: Foreign key to users table
- `timestamp`: Timestamp when comment was created

## Database Functions

The setup includes several PostgreSQL functions:

### User Management Functions

- `create_user_from_clerk()`: Creates or updates a user from Clerk webhook data
- `update_user_from_clerk()`: Updates user information from Clerk webhook
- `delete_user_from_clerk()`: Deletes a user when removed from Clerk

### Utility Functions

- `update_updated_at_column()`: Automatically updates the `updated_at` timestamp

## Database Views

### User Statistics View

Provides aggregated statistics for each user:

- Project count
- Task count
- Comment count

### Project Statistics View

Provides aggregated statistics for each project:

- Task count by status
- Owner information

## Indexes

The following indexes are created for optimal performance:

- `idx_users_clerk_id`: Fast user lookups by Clerk ID
- `idx_projects_owner_id`: Fast project lookups by owner
- `idx_tasks_project_id`: Fast task lookups by project
- `idx_tasks_status`: Fast task filtering by status
- `idx_comments_task_id`: Fast comment lookups by task
- `idx_comments_author_id`: Fast comment lookups by author

## Testing the Setup

### 1. Verify Database Connection

```bash
npx prisma studio
```

This will open Prisma Studio where you can view and manage your data.

### 2. Test User Creation

Create a test user through Clerk and verify it appears in your database:

```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

### 3. Test Webhook

You can test the webhook endpoint by sending a POST request to `/api/webhooks/clerk` with Clerk webhook data.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify your `DATABASE_URL` is correct
   - Check if your Neon database is active
   - Ensure SSL mode is set to `require`

2. **Webhook Not Working**

   - Verify `CLERK_WEBHOOK_SECRET` is set correctly
   - Check that webhook events are enabled in Clerk
   - Ensure the webhook URL is accessible

3. **Prisma Client Issues**
   - Run `npx prisma generate` to regenerate the client
   - Check that your schema is valid with `npx prisma validate`

### Getting Help

- Check the [Prisma documentation](https://www.prisma.io/docs)
- Review the [Clerk webhook documentation](https://clerk.com/docs/webhooks)
- Check the [Neon documentation](https://neon.tech/docs)

## Next Steps

After setting up the database:

1. Configure your Clerk application settings
2. Set up authentication in your frontend
3. Test user registration and login
4. Start building your collaborative features

The database is now ready to support real-time collaborative task management with user authentication!
