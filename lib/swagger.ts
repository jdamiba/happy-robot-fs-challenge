import swaggerJsdoc from "swagger-jsdoc";

const options: any = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Happy Robot API",
      version: "1.0.0",
      description:
        "A real-time project management and task tracking API with WebSocket support for collaborative editing.",
      contact: {
        name: "Happy Robot Team",
        email: "support@happyrobot.app",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
      {
        url: "https://your-production-domain.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        ClerkAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Clerk JWT token for authentication",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Internal user ID",
              example: "user_123456789",
            },
            clerkId: {
              type: "string",
              description: "Clerk user ID",
              example: "user_2abc123def456",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "john.doe@example.com",
            },
            firstName: {
              type: "string",
              description: "User first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "User last name",
              example: "Doe",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description: "User profile image URL",
              example: "https://example.com/avatar.jpg",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "User last update timestamp",
            },
          },
          required: ["id", "clerkId", "email", "createdAt", "updatedAt"],
        },
        Project: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Project ID",
              example: "project_123456789",
            },
            name: {
              type: "string",
              description: "Project name",
              example: "Website Redesign",
            },
            description: {
              type: "string",
              description: "Project description",
              example: "Complete redesign of the company website",
            },
            metadata: {
              type: "object",
              description: "Additional project metadata",
              example: { color: "#ff6b6b", category: "design" },
            },
            ownerId: {
              type: "string",
              description: "ID of the project owner",
              example: "user_123456789",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Project creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Project last update timestamp",
            },
          },
          required: ["id", "name", "ownerId", "createdAt", "updatedAt"],
        },
        Task: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Task ID",
              example: "task_123456789",
            },
            projectId: {
              type: "string",
              description: "ID of the project this task belongs to",
              example: "project_123456789",
            },
            title: {
              type: "string",
              description: "Task title",
              example: "Create wireframes",
            },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"],
              description: "Current task status",
              example: "IN_PROGRESS",
            },
            assignedTo: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of user IDs assigned to this task",
              example: ["user_123456789", "user_987654321"],
            },
            configuration: {
              type: "object",
              properties: {
                priority: {
                  type: "string",
                  enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                  example: "HIGH",
                },
                description: {
                  type: "string",
                  example: "Detailed task description",
                },
                tags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["frontend", "design", "priority"],
                },
                customFields: {
                  type: "object",
                  description: "Custom fields specific to the task",
                  example: { estimatedHours: 8, sprint: "Sprint 1" },
                },
              },
            },
            dependencies: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of task IDs that this task depends on",
              example: ["task_111111111", "task_222222222"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Task creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Task last update timestamp",
            },
          },
          required: [
            "id",
            "projectId",
            "title",
            "status",
            "assignedTo",
            "configuration",
            "dependencies",
            "createdAt",
            "updatedAt",
          ],
        },
        Comment: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Comment ID",
              example: "comment_123456789",
            },
            taskId: {
              type: "string",
              description: "ID of the task this comment belongs to",
              example: "task_123456789",
            },
            content: {
              type: "string",
              description: "Comment content",
              example: "This looks great! I have a few suggestions...",
            },
            authorId: {
              type: "string",
              description: "ID of the comment author",
              example: "user_123456789",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Comment creation timestamp",
            },
            author: {
              $ref: "#/components/schemas/User",
            },
          },
          required: ["id", "taskId", "content", "authorId", "timestamp"],
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
              example: true,
            },
            data: {
              description: "Response data (varies by endpoint)",
            },
            error: {
              type: "string",
              description: "Error message if request failed",
              example: "Project not found",
            },
            operationId: {
              type: "string",
              description: "Unique operation ID for tracking",
              example: "op_123456789",
            },
          },
          required: ["success"],
        },
        CreateProjectRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Project name",
              example: "Website Redesign",
            },
            description: {
              type: "string",
              description: "Project description",
              example: "Complete redesign of the company website",
            },
            metadata: {
              type: "object",
              description: "Additional project metadata",
              example: { color: "#ff6b6b", category: "design" },
            },
          },
          required: ["name"],
        },
        UpdateProjectRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Project name",
              example: "Website Redesign v2",
            },
            description: {
              type: "string",
              description: "Project description",
              example: "Updated project description",
            },
            metadata: {
              type: "object",
              description: "Additional project metadata",
              example: { color: "#4ecdc4", category: "design" },
            },
          },
        },
        CreateTaskRequest: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "ID of the project this task belongs to",
              example: "project_123456789",
            },
            title: {
              type: "string",
              description: "Task title",
              example: "Create wireframes",
            },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"],
              description: "Task status",
              example: "TODO",
            },
            assignedTo: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of user IDs assigned to this task",
              example: ["user_123456789"],
            },
            configuration: {
              type: "object",
              properties: {
                priority: {
                  type: "string",
                  enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                  example: "HIGH",
                },
                description: {
                  type: "string",
                  example: "Detailed task description",
                },
                tags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["frontend", "design"],
                },
                customFields: {
                  type: "object",
                  example: { estimatedHours: 8 },
                },
              },
            },
            dependencies: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of task IDs that this task depends on",
              example: ["task_111111111"],
            },
          },
          required: ["projectId", "title"],
        },
        UpdateTaskRequest: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Task title",
              example: "Create detailed wireframes",
            },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"],
              description: "Task status",
              example: "IN_PROGRESS",
            },
            assignedTo: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of user IDs assigned to this task",
              example: ["user_123456789", "user_987654321"],
            },
            configuration: {
              type: "object",
              properties: {
                priority: {
                  type: "string",
                  enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                  example: "URGENT",
                },
                description: {
                  type: "string",
                  example: "Updated task description",
                },
                tags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["frontend", "design", "priority"],
                },
                customFields: {
                  type: "object",
                  example: { estimatedHours: 12, sprint: "Sprint 1" },
                },
              },
            },
            dependencies: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of task IDs that this task depends on",
              example: ["task_111111111", "task_222222222"],
            },
          },
        },
        CreateCommentRequest: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "ID of the task this comment belongs to",
              example: "task_123456789",
            },
            content: {
              type: "string",
              description: "Comment content",
              example: "This looks great! I have a few suggestions...",
            },
          },
          required: ["taskId", "content"],
        },
        UpdateCommentRequest: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Comment content",
              example: "Updated comment with more details...",
            },
          },
          required: ["content"],
        },
        WebSocketMessage: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "TASK_UPDATE",
                "TASK_CREATE",
                "TASK_DELETE",
                "COMMENT_UPDATE",
                "COMMENT_CREATE",
                "COMMENT_DELETE",
                "PROJECT_UPDATE",
                "JOIN_PROJECT",
                "LEAVE_PROJECT",
                "SET_USER",
                "USER_PRESENCE",
                "CONNECTION_ESTABLISHED",
                "ERROR",
              ],
              description: "WebSocket message type",
              example: "TASK_UPDATE",
            },
            payload: {
              description: "Message payload (varies by type)",
            },
            projectId: {
              type: "string",
              description: "Project ID (if applicable)",
              example: "project_123456789",
            },
            operationId: {
              type: "string",
              description: "Unique operation ID",
              example: "op_123456789",
            },
            timestamp: {
              type: "number",
              description: "Message timestamp",
              example: 1640995200000,
            },
            userId: {
              type: "string",
              description: "User ID who initiated the operation",
              example: "user_123456789",
            },
          },
          required: ["type", "operationId", "timestamp"],
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication information is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiResponse",
              },
              example: {
                success: false,
                error: "Unauthorized",
              },
            },
          },
        },
        NotFoundError: {
          description: "The specified resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiResponse",
              },
              example: {
                success: false,
                error: "Resource not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiResponse",
              },
              example: {
                success: false,
                error: "Validation failed: name is required",
              },
            },
          },
        },
        InternalServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiResponse",
              },
              example: {
                success: false,
                error: "Internal server error",
              },
            },
          },
        },
      },
    },
    security: [
      {
        ClerkAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and profile endpoints",
      },
      {
        name: "Projects",
        description: "Project management endpoints",
      },
      {
        name: "Tasks",
        description: "Task management endpoints",
      },
      {
        name: "Comments",
        description: "Task comment endpoints",
      },
      {
        name: "WebSocket",
        description: "Real-time WebSocket communication",
      },
      {
        name: "Webhooks",
        description: "Webhook endpoints for external services",
      },
    ],
  },
  apis: [
    "./app/api/**/*.ts", // Path to the API files
    "./lib/types.ts", // Path to the types file
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
