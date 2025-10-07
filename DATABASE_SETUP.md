# Database Setup Guide

This guide provides comprehensive instructions for setting up the Happy Robot database for new project clones.

## Overview

The Happy Robot application uses PostgreSQL as its database with the following main entities:

- **Users**: User profiles and authentication (linked to Clerk)
- **Projects**: Project management containers
- **Tasks**: Individual work items within projects
- **Comments**: Task-specific discussions
- **Task Assignees**: Many-to-many relationship between users and tasks

## Prerequisites

- PostgreSQL 12+ or Docker
- Node.js 18+ (for Prisma)
- Access to a PostgreSQL server or ability to run Docker containers

## Setup Options

### Option 1: Docker Setup (Recommended for Development)

The easiest way to get started is using Docker Compose:

```bash
# Navigate to the database directory
cd database

# Start PostgreSQL and pgAdmin
docker-compose up -d

# Check that services are running
docker-compose ps
```

This will start:

- **PostgreSQL** on port `5432`
- **pgAdmin** on port `8080` (admin@happyrobot.app / admin123)

**Connection Details:**

- Host: `localhost`
- Port: `5432`
- Database: `happyrobot`
- Username: `happyrobot`
- Password: `happyrobot123`

### Option 2: Local PostgreSQL Setup

If you have PostgreSQL installed locally:

```bash
# Create database
createdb happyrobot

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/happyrobot"

# Run the setup script
./database/setup.sh
```

### Option 3: Cloud Database Setup

For production or cloud environments:

1. Create a PostgreSQL database on your cloud provider
2. Set the `DATABASE_URL` environment variable
3. Run the migration script

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
./database/setup.sh
```

## Environment Variables

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL="postgresql://happyrobot:happyrobot123@localhost:5432/happyrobot"

# Clerk Authentication (get these from your Clerk dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# WebSocket Server (for real-time features)
NEXT_PUBLIC_WS_URL="ws://localhost:3001/ws"
WEBSOCKET_SERVER_URL="http://localhost:3001"

# Optional: For production
NEXTAUTH_URL="http://localhost:3000"
```

## Database Schema

### Tables

#### Users

- `id`: Primary key (string)
- `clerk_id`: Unique Clerk identifier
- `email`: User email (unique)
- `first_name`, `last_name`: User names
- `image_url`: Profile image URL
- `created_at`, `updated_at`: Timestamps

#### Projects

- `id`: Primary key (string)
- `name`: Project name
- `description`: Project description
- `metadata`: JSON metadata
- `owner_id`: Foreign key to users
- `created_at`, `updated_at`: Timestamps

#### Tasks

- `id`: Primary key (string)
- `project_id`: Foreign key to projects
- `title`: Task title
- `status`: TaskStatus enum (TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED)
- `assigned_to`: Array of user IDs
- `configuration`: JSON configuration
- `dependencies`: Array of task IDs
- `created_at`, `updated_at`: Timestamps

#### Comments

- `id`: Primary key (string)
- `task_id`: Foreign key to tasks
- `content`: Comment text
- `author_id`: Foreign key to users
- `timestamp`: Creation timestamp

#### Task Assignees

- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users
- Composite primary key

### Indexes

The schema includes optimized indexes for:

- User lookups by Clerk ID
- Project lookups by owner
- Task lookups by project and status
- Comment lookups by task and author

## Verification

After setup, verify your database is working:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Generate Prisma client
npx prisma generate

# Run Prisma Studio (optional)
npx prisma studio
```

## Troubleshooting

### Common Issues

1. **Connection Refused**

   - Ensure PostgreSQL is running
   - Check port 5432 is not blocked
   - Verify DATABASE_URL is correct

2. **Permission Denied**

   - Ensure database user has proper permissions
   - Check if database exists

3. **Schema Conflicts**

   - Drop existing tables if needed: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
   - Re-run the migration script

4. **Docker Issues**
   - Check Docker is running: `docker ps`
   - Restart containers: `docker-compose restart`
   - View logs: `docker-compose logs postgres`

### Reset Database

To completely reset the database:

```bash
# Docker
docker-compose down -v
docker-compose up -d

# Local PostgreSQL
dropdb happyrobot
createdb happyrobot
./database/setup.sh
```

## Production Considerations

### Security

- Use strong passwords
- Enable SSL connections
- Restrict database access by IP
- Use environment variables for credentials

### Performance

- Monitor query performance
- Add additional indexes as needed
- Consider connection pooling
- Regular database maintenance

### Backup

- Set up automated backups
- Test restore procedures
- Monitor disk space

## Development Workflow

1. **Schema Changes**: Update `prisma/schema.prisma`
2. **Generate Migration**: `npx prisma migrate dev --name description`
3. **Update Client**: `npx prisma generate`
4. **Test Changes**: Run tests and manual verification

## Sample Data

The migration script includes optional sample data. Uncomment the INSERT statements in `001_initial_schema.sql` to include:

- Sample user account
- Sample project
- Sample task with dependencies
- Sample comment

## Support

If you encounter issues:

1. Check the logs in `docker-compose logs`
2. Verify environment variables
3. Test database connectivity
4. Review the Prisma documentation

---

**Next Steps**: After database setup, proceed to [API Documentation Setup](./API_DOCUMENTATION.md) and [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md).
