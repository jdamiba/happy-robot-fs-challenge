import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/projects/[id]/tasks/route";
import { PUT, DELETE } from "@/app/api/tasks/[id]/route";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth utils
jest.mock("@/lib/auth-utils", () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: "user_123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
  }),
}));

// Mock WebSocket client
jest.mock("@/lib/websocket-client", () => ({
  websocketClient: {
    broadcastTaskCreate: jest.fn(),
    broadcastTaskUpdate: jest.fn(),
    broadcastTaskDelete: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/tasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects/[id]/tasks", () => {
    it("should return tasks for a project", async () => {
      const mockTasks = [
        {
          id: "task_1",
          title: "Test Task 1",
          description: "Test Description 1",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project_1",
          authorId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          dependencies: [],
          tags: [],
          configuration: {},
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project_1/tasks"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "project_1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe("Test Task 1");
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { projectId: "project_1" },
        include: {
          project: true,
          comments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return 404 for non-existent project", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/projects/nonexistent/tasks"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Project not found or access denied");
    });
  });

  describe("POST /api/projects/[id]/tasks", () => {
    it("should create a new task", async () => {
      const mockProject = {
        id: "project_1",
        name: "Test Project",
        ownerId: "user_123",
      };

      const mockTask = {
        id: "task_new",
        title: "New Task",
        description: "New Description",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.task.create.mockResolvedValue(mockTask);

      const requestBody = {
        title: "New Task",
        description: "New Description",
        priority: "MEDIUM",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project_1/tasks",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: "project_1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("New Task");
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "New Task",
          description: "New Description",
          projectId: "project_1",
          authorId: "user_123",
        }),
        include: {
          project: true,
          comments: true,
        },
      });
    });

    it("should validate required fields", async () => {
      const requestBody = {
        description: "Missing title",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project_1/tasks",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: "project_1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Title is required");
    });
  });

  describe("PUT /api/tasks/[id]", () => {
    it("should update a task", async () => {
      const mockTask = {
        id: "task_1",
        title: "Updated Task",
        description: "Updated Description",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
      };

      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockResolvedValue(mockTask);

      const requestBody = {
        title: "Updated Task",
        status: "IN_PROGRESS",
        priority: "HIGH",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task_1",
        {
          method: "PUT",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "task_1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Updated Task");
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task_1" },
        data: expect.objectContaining({
          title: "Updated Task",
          status: "IN_PROGRESS",
          priority: "HIGH",
        }),
        include: {
          project: true,
          comments: true,
        },
      });
    });

    it("should return 404 for non-existent task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/nonexistent",
        {
          method: "PUT",
          body: JSON.stringify({ title: "Updated Task" }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Task not found");
    });
  });

  describe("DELETE /api/tasks/[id]", () => {
    it("should delete a task", async () => {
      const mockTask = {
        id: "task_1",
        title: "Task to Delete",
        projectId: "project_1",
        authorId: "user_123",
      };

      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.task.delete.mockResolvedValue({});

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task_1",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "task_1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task_1" },
      });
    });

    it("should return 404 for non-existent task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/nonexistent",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Task not found");
    });
  });
});
