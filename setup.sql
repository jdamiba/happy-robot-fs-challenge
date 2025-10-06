-- Database setup script for Collaborative Task Management System
-- This script sets up the initial database structure and sample data

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created by Prisma migrations, but we can add custom ones here

-- Index for user lookups by Clerk ID
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users("clerkId");

-- Index for project lookups by owner
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects("ownerId");

-- Index for task lookups by project
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks("projectId");

-- Index for task lookups by status
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Index for comment lookups by task
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments("taskId");

-- Index for comment lookups by author
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments("authorId");

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle user creation from Clerk webhook
CREATE OR REPLACE FUNCTION create_user_from_clerk(
    p_clerk_id TEXT,
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_id TEXT;
BEGIN
    -- Insert or update user
    INSERT INTO users ("clerkId", email, "firstName", "lastName", "imageUrl", "createdAt", "updatedAt")
    VALUES (p_clerk_id, p_email, p_first_name, p_last_name, p_image_url, NOW(), NOW())
    ON CONFLICT ("clerkId") 
    DO UPDATE SET
        email = EXCLUDED.email,
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        "imageUrl" = EXCLUDED."imageUrl",
        "updatedAt" = NOW()
    RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle user updates from Clerk webhook
CREATE OR REPLACE FUNCTION update_user_from_clerk(
    p_clerk_id TEXT,
    p_email TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        email = COALESCE(p_email, email),
        "firstName" = COALESCE(p_first_name, "firstName"),
        "lastName" = COALESCE(p_last_name, "lastName"),
        "imageUrl" = COALESCE(p_image_url, "imageUrl"),
        "updatedAt" = NOW()
    WHERE "clerkId" = p_clerk_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle user deletion from Clerk webhook
CREATE OR REPLACE FUNCTION delete_user_from_clerk(p_clerk_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM users WHERE "clerkId" = p_clerk_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u."clerkId",
    u.email,
    u."firstName",
    u."lastName",
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT c.id) as comment_count,
    u."createdAt",
    u."updatedAt"
FROM users u
LEFT JOIN projects p ON u.id = p."ownerId"
LEFT JOIN tasks t ON u.id = ANY(t."assignedTo")
LEFT JOIN comments c ON u.id = c."authorId"
GROUP BY u.id, u."clerkId", u.email, u."firstName", u."lastName", u."createdAt", u."updatedAt";

-- Create a view for project statistics
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.name,
    p.description,
    p."ownerId",
    u.email as owner_email,
    u."firstName" as owner_first_name,
    u."lastName" as owner_last_name,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT CASE WHEN t.status = 'TODO' THEN t.id END) as todo_count,
    COUNT(DISTINCT CASE WHEN t.status = 'IN_PROGRESS' THEN t.id END) as in_progress_count,
    COUNT(DISTINCT CASE WHEN t.status = 'IN_REVIEW' THEN t.id END) as in_review_count,
    COUNT(DISTINCT CASE WHEN t.status = 'DONE' THEN t.id END) as done_count,
    COUNT(DISTINCT CASE WHEN t.status = 'BLOCKED' THEN t.id END) as blocked_count,
    p."createdAt",
    p."updatedAt"
FROM projects p
LEFT JOIN users u ON p."ownerId" = u.id
LEFT JOIN tasks t ON p.id = t."projectId"
GROUP BY p.id, p.name, p.description, p."ownerId", u.email, u."firstName", u."lastName", p."createdAt", p."updatedAt";

-- Insert sample data (optional - for development/testing)
-- Uncomment the following lines if you want sample data

/*
-- Sample users (these would normally be created via Clerk webhooks)
INSERT INTO users (clerk_id, email, first_name, last_name, image_url, created_at, updated_at) VALUES
('user_2abc123', 'john.doe@example.com', 'John', 'Doe', 'https://example.com/avatar1.jpg', NOW(), NOW()),
('user_2def456', 'jane.smith@example.com', 'Jane', 'Smith', 'https://example.com/avatar2.jpg', NOW(), NOW())
ON CONFLICT (clerk_id) DO NOTHING;

-- Sample projects
INSERT INTO projects (name, description, owner_id, created_at, updated_at) VALUES
('Sample Project 1', 'A sample project for testing', (SELECT id FROM users WHERE clerk_id = 'user_2abc123' LIMIT 1), NOW(), NOW()),
('Sample Project 2', 'Another sample project', (SELECT id FROM users WHERE clerk_id = 'user_2def456' LIMIT 1), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Sample tasks
INSERT INTO tasks (project_id, title, status, assigned_to, configuration, dependencies, created_at, updated_at) VALUES
((SELECT id FROM projects WHERE name = 'Sample Project 1' LIMIT 1), 'Setup database', 'DONE', ARRAY[(SELECT id FROM users WHERE clerk_id = 'user_2abc123' LIMIT 1)], '{"priority": "HIGH", "description": "Set up the database schema", "tags": ["backend", "database"], "customFields": {}}', ARRAY[]::TEXT[], NOW(), NOW()),
((SELECT id FROM projects WHERE name = 'Sample Project 1' LIMIT 1), 'Create API endpoints', 'IN_PROGRESS', ARRAY[(SELECT id FROM users WHERE clerk_id = 'user_2abc123' LIMIT 1)], '{"priority": "MEDIUM", "description": "Create REST API endpoints", "tags": ["backend", "api"], "customFields": {}}', ARRAY[]::TEXT[], NOW(), NOW()),
((SELECT id FROM projects WHERE name = 'Sample Project 2' LIMIT 1), 'Design UI', 'TODO', ARRAY[(SELECT id FROM users WHERE clerk_id = 'user_2def456' LIMIT 1)], '{"priority": "LOW", "description": "Design the user interface", "tags": ["frontend", "design"], "customFields": {}}', ARRAY[]::TEXT[], NOW(), NOW())
ON CONFLICT DO NOTHING;
*/

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

COMMIT;
