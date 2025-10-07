# Happy Robot API Documentation

## Overview

The Happy Robot API is a comprehensive REST API for project management and task tracking with real-time collaboration features. It provides endpoints for managing projects, tasks, and comments, with WebSocket support for live updates.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-production-domain.com/api`

## Authentication

The API uses Clerk JWT tokens for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Interactive Documentation

- **Swagger UI**: `/api-docs` - Interactive API documentation with testing capabilities
- **OpenAPI Spec**: `/api/docs` - Raw OpenAPI 3.0 specification in JSON format

## API Endpoints

### Authentication

#### Get Current User

```http
GET /api/user/current
```

Returns information about the currently authenticated user.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_123456789",
    "clerkId": "user_2abc123def456",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Projects

#### Get All Projects

```http
GET /api/projects
```

Retrieve all projects owned by the authenticated user.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "project_123456789",
      "name": "Website Redesign",
      "description": "Complete redesign of the company website",
      "metadata": { "color": "#ff6b6b", "category": "design" },
      "ownerId": "user_123456789",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Project

```http
POST /api/projects
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Complete redesign of the company website",
  "metadata": { "color": "#ff6b6b", "category": "design" }
}
```

#### Get Project by ID

```http
GET /api/projects/{id}
```

#### Update Project

```http
PUT /api/projects/{id}
Content-Type: application/json

{
  "name": "Website Redesign v2",
  "description": "Updated project description"
}
```

#### Delete Project

```http
DELETE /api/projects/{id}
```

### Tasks

#### Get All Tasks for Project

```http
GET /api/projects/{projectId}/tasks
```

#### Create Task

```http
POST /api/projects/{projectId}/tasks
Content-Type: application/json

{
  "title": "Create wireframes",
  "status": "TODO",
  "assignedTo": ["user_123456789"],
  "configuration": {
    "priority": "HIGH",
    "description": "Create detailed wireframes for the homepage",
    "tags": ["frontend", "design"],
    "customFields": { "estimatedHours": 8 }
  },
  "dependencies": ["task_111111111"]
}
```

#### Get Task by ID

```http
GET /api/tasks/{id}
```

#### Update Task

```http
PUT /api/tasks/{id}
Content-Type: application/json

{
  "title": "Create detailed wireframes",
  "status": "IN_PROGRESS",
  "configuration": {
    "priority": "URGENT",
    "tags": ["frontend", "design", "priority"]
  }
}
```

#### Delete Task

```http
DELETE /api/tasks/{id}
```

### Comments

#### Get All Comments for Task

```http
GET /api/tasks/{taskId}/comments
```

#### Create Comment

```http
POST /api/tasks/{taskId}/comments
Content-Type: application/json

{
  "content": "This looks great! I have a few suggestions..."
}
```

#### Get Comment by ID

```http
GET /api/comments/{id}
```

#### Update Comment

```http
PUT /api/comments/{id}
Content-Type: application/json

{
  "content": "Updated comment with more details..."
}
```

#### Delete Comment

```http
DELETE /api/comments/{id}
```

## Data Models

### User

```typescript
interface User {
  id: string; // Internal user ID
  clerkId: string; // Clerk user ID
  email: string; // User email
  firstName?: string; // User first name
  lastName?: string; // User last name
  imageUrl?: string; // Profile image URL
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Project

```typescript
interface Project {
  id: string; // Project ID
  name: string; // Project name
  description?: string; // Project description
  metadata?: Record<string, any>; // Additional metadata
  ownerId: string; // Owner user ID
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Task

```typescript
interface Task {
  id: string; // Task ID
  projectId: string; // Parent project ID
  title: string; // Task title
  status: TaskStatus; // Current status
  assignedTo: string[]; // Array of assigned user IDs
  configuration: TaskConfiguration; // Task configuration
  dependencies: string[]; // Array of dependent task IDs
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}

type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED";

interface TaskConfiguration {
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description?: string;
  tags: string[];
  customFields: Record<string, any>;
}
```

### Comment

```typescript
interface Comment {
  id: string; // Comment ID
  taskId: string; // Parent task ID
  content: string; // Comment content
  authorId: string; // Author user ID
  timestamp: Date; // Creation timestamp
  author?: User; // Author details (when included)
}
```

## Real-time Features

The API includes real-time collaboration features through WebSocket connections. All create, update, and delete operations are automatically broadcast to connected clients in real-time.

### WebSocket Server

The WebSocket server runs separately and provides real-time communication:

- **Development**: `ws://localhost:3001/ws`
- **Production**: `wss://your-websocket-server.com/ws`

### WebSocket Message Types

```typescript
type WebSocketMessageType =
  | "TASK_UPDATE"
  | "TASK_CREATE"
  | "TASK_DELETE"
  | "COMMENT_UPDATE"
  | "COMMENT_CREATE"
  | "COMMENT_DELETE"
  | "PROJECT_UPDATE"
  | "JOIN_PROJECT"
  | "LEAVE_PROJECT"
  | "SET_USER"
  | "USER_PRESENCE"
  | "CONNECTION_ESTABLISHED"
  | "ERROR";
```

### Real-time Updates

When any user performs an action (create, update, delete), the change is immediately broadcast to all other users viewing the same project. This enables real-time collaboration without requiring page refreshes.

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details (optional)"
}
```

### Common Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## CORS

CORS is configured to allow requests from the frontend application. The WebSocket server also includes CORS headers for cross-origin connections.

## Webhooks

### Clerk Webhooks

The API includes webhook endpoints for Clerk user management:

```http
POST /api/webhooks/clerk
```

This endpoint handles user creation and deletion events from Clerk.

## Development

### Local Setup

1. Install dependencies: `npm install`
2. Set up environment variables (see `.env.example`)
3. Start the development server: `npm run dev`
4. Start the WebSocket server: `cd websocket-server && npm start`
5. Access the API documentation at: `http://localhost:3000/api-docs`

### Testing

The API includes comprehensive test coverage:

```bash
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm test -- --coverage     # Run tests with coverage
```

### Building

```bash
npm run build              # Build for production
npm run start              # Start production server
```

## Security

- All endpoints require authentication except webhook endpoints
- Input validation using Zod schemas
- SQL injection protection through Prisma ORM
- CORS configuration for cross-origin requests
- JWT token validation through Clerk

## Monitoring

The API includes logging for:

- Request/response cycles
- WebSocket connections and messages
- Error tracking
- Performance metrics

## Support

For API support and questions:

- Check the interactive documentation at `/api-docs`
- Review the OpenAPI specification at `/api/docs`
- Contact the development team

---

_Last updated: January 2024_
