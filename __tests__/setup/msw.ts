import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock API handlers
export const handlers = [
  // Auth endpoints
  http.get("/api/user/current", () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: "test-user-id",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    });
  }),

  // Project endpoints
  http.get("/api/projects", () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: "test-project-1",
          title: "Test Project 1",
          description: "A test project",
          ownerId: "test-user-id",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  }),

  http.post("/api/projects", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: "new-project-id",
        ...body,
        ownerId: "test-user-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.get("/api/projects/:id", ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        title: "Test Project",
        description: "A test project",
        ownerId: "test-user-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.put("/api/projects/:id", async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        ...body,
        ownerId: "test-user-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete("/api/projects/:id", ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  }),

  // Task endpoints
  http.get("/api/projects/:id/tasks", ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: "test-task-1",
          title: "Test Task 1",
          description: "A test task",
          status: "TODO",
          priority: "MEDIUM",
          projectId: params.id,
          assignedTo: [],
          dependencies: [],
          configuration: {},
          comments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  }),

  http.post("/api/projects/:id/tasks", async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: "new-task-id",
        ...body,
        projectId: params.id,
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: [],
        dependencies: [],
        configuration: {},
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.get("/api/tasks/:id", ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        title: "Test Task",
        description: "A test task",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "test-project-id",
        assignedTo: [],
        dependencies: [],
        configuration: {},
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.put("/api/tasks/:id", async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        ...body,
        projectId: "test-project-id",
        assignedTo: [],
        dependencies: [],
        configuration: {},
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete("/api/tasks/:id", ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  }),

  // Comment endpoints
  http.get("/api/tasks/:id/comments", ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: "test-comment-1",
          content: "Test comment",
          taskId: params.id,
          authorId: "test-user-id",
          author: {
            id: "test-user-id",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }),

  http.post("/api/tasks/:id/comments", async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: "new-comment-id",
        ...body,
        taskId: params.id,
        authorId: "test-user-id",
        author: {
          id: "test-user-id",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
        timestamp: new Date().toISOString(),
      },
    });
  }),

  http.put("/api/comments/:id", async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        ...body,
        taskId: "test-task-id",
        authorId: "test-user-id",
        author: {
          id: "test-user-id",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
        timestamp: new Date().toISOString(),
      },
    });
  }),

  http.delete("/api/comments/:id", ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  }),

  // WebSocket broadcast endpoint
  http.post("*/broadcast", async ({ request }) => {
    const body = await request.json();
    // Mock successful broadcast
    return HttpResponse.json({
      success: true,
      message: "Broadcast sent successfully",
      data: body,
    });
  }),

  // Error handlers for testing error scenarios
  http.get("/api/error-test", () => {
    return HttpResponse.json(
      { success: false, error: "Test error" },
      { status: 500 }
    );
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

// Helper functions for testing
export const resetHandlers = () => {
  server.resetHandlers(...handlers);
};

export const addErrorHandler = (url: string, status: number = 500) => {
  server.use(
    http.get(url, () => {
      return HttpResponse.json(
        { success: false, error: "Test error" },
        { status }
      );
    })
  );
};

export const addNetworkErrorHandler = (url: string) => {
  server.use(
    http.get(url, () => {
      return HttpResponse.error();
    })
  );
};
