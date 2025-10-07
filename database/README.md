# Happy Robot Database

This directory contains all database-related files for the Happy Robot project management system.

## Quick Start

### Using Docker (Recommended)

```bash
# Start PostgreSQL with pgAdmin
docker-compose up -d

# Verify setup
node verify.js
```

### Using Local PostgreSQL

```bash
# Set your database URL
export DATABASE_URL="postgresql://username:password@localhost:5432/happyrobot"

# Run setup
./setup.sh
```

## Files Overview

### Core Files

- **`migrations/001_initial_schema.sql`** - Complete database schema migration
- **`setup.sh`** - Automated setup script for local PostgreSQL
- **`verify.js`** - Database verification and testing script
- **`docker-compose.yml`** - Docker setup with PostgreSQL and pgAdmin
- **`init.sql`** - Database initialization for Docker containers

### Documentation

- **`README.md`** - This file
- **`../DATABASE_SETUP.md`** - Comprehensive setup guide

## Database Schema

### Entities

- **Users**: User profiles linked to Clerk authentication
- **Projects**: Project containers with metadata
- **Tasks**: Work items with status, dependencies, and configuration
- **Comments**: Task-specific discussions
- **Task Assignees**: Many-to-many relationship for task assignments

### Key Features

- **Automatic timestamps**: `created_at` and `updated_at` fields
- **JSON fields**: Flexible metadata and configuration storage
- **Array fields**: Support for task dependencies and assignments
- **Foreign key constraints**: Maintains data integrity
- **Optimized indexes**: Performance-tuned for common queries
- **Enum types**: Type-safe task status values

## Connection Details

### Docker Setup

- **Host**: localhost
- **Port**: 5432
- **Database**: happyrobot
- **Username**: happyrobot
- **Password**: happyrobot123

### pgAdmin Access

- **URL**: http://localhost:8080
- **Email**: admin@happyrobot.app
- **Password**: admin123

## Environment Variables

```env
DATABASE_URL="postgresql://happyrobot:happyrobot123@localhost:5432/happyrobot"
```

## Verification

Run the verification script to ensure everything is working:

```bash
node verify.js
```

This will test:

- Database connectivity
- Table existence
- Index presence
- Trigger functionality
- Basic CRUD operations
- Prisma client generation

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `docker-compose.yml`
2. **Permission errors**: Ensure scripts are executable (`chmod +x`)
3. **Connection refused**: Check if PostgreSQL is running
4. **Schema conflicts**: Drop and recreate database

### Reset Database

```bash
# Docker
docker-compose down -v && docker-compose up -d

# Local
dropdb happyrobot && createdb happyrobot && ./setup.sh
```

## Development

### Schema Changes

1. Update `../prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev`
3. Update this directory's migration files
4. Test with verification script

### Adding Sample Data

Uncomment the INSERT statements in `migrations/001_initial_schema.sql` to include sample data for testing.

## Production Considerations

- Use strong passwords
- Enable SSL connections
- Set up automated backups
- Monitor performance
- Regular maintenance

## Support

For issues:

1. Check Docker logs: `docker-compose logs`
2. Run verification: `node verify.js`
3. Review setup guide: `../DATABASE_SETUP.md`
4. Check Prisma documentation
