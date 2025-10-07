-- Happy Robot Database Migration
-- Initial schema setup for project management and task tracking system
-- Compatible with PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create TaskStatus enum
CREATE TYPE task_status AS ENUM (
    'TODO',
    'IN_PROGRESS', 
    'IN_REVIEW',
    'DONE',
    'BLOCKED'
);

-- Create users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB,
    owner_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create tasks table
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status task_status DEFAULT 'TODO',
    assigned_to TEXT[] DEFAULT '{}',
    configuration JSONB NOT NULL DEFAULT '{}',
    dependencies TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create comments table
CREATE TABLE comments (
    id VARCHAR(255) PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);

-- Create many-to-many relationship table for task assignees
CREATE TABLE task_assignees (
    task_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (task_id, user_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for task assignees
CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- Uncomment these lines if you want sample data

/*
-- Sample user
INSERT INTO users (id, clerk_id, email, first_name, last_name, created_at, updated_at) 
VALUES (
    'user_sample_123',
    'user_2sample123456789',
    'demo@happyrobot.app',
    'Demo',
    'User',
    NOW(),
    NOW()
);

-- Sample project
INSERT INTO projects (id, name, description, metadata, owner_id, created_at, updated_at)
VALUES (
    'project_sample_456',
    'Sample Project',
    'This is a sample project for testing',
    '{"color": "#ff6b6b", "category": "demo"}',
    'user_sample_123',
    NOW(),
    NOW()
);

-- Sample task
INSERT INTO tasks (id, project_id, title, status, assigned_to, configuration, dependencies, created_at, updated_at)
VALUES (
    'task_sample_789',
    'project_sample_456',
    'Sample Task',
    'TODO',
    '{"user_sample_123"}',
    '{"priority": "MEDIUM", "description": "This is a sample task", "tags": ["demo", "sample"], "customFields": {}}',
    '{}',
    NOW(),
    NOW()
);

-- Sample comment
INSERT INTO comments (id, task_id, content, author_id, timestamp)
VALUES (
    'comment_sample_101',
    'task_sample_789',
    'This is a sample comment',
    'user_sample_123',
    NOW()
);

-- Link task assignee
INSERT INTO task_assignees (task_id, user_id)
VALUES ('task_sample_789', 'user_sample_123');
*/

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

COMMIT;
