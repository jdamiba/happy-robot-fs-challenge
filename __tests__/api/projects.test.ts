import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/projects/route";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/projects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/projects", () => {
    it("should return projects for the current user", async () => {
      const mockProjects = [
        {
          id: "project_1",
          name: "Test Project 1",
          description: "Test Description 1",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
        {
          id: "project_2",
          name: "Test Project 2",
          description: "Test Description 2",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Test Project 1");
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user_123" },
        include: {
          tasks: {
            include: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when no projects exist", async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockPrisma.project.findMany.mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch projects");
    });
  });

  describe("POST /api/projects", () => {
    it("should create a new project", async () => {
      const mockProject = {
        id: "project_new",
        name: "New Project",
        description: "New Description",
        ownerId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.create.mockResolvedValue(mockProject);

      const requestBody = {
        name: "New Project",
        description: "New Description",
      };

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Project");
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "New Project",
          description: "New Description",
          ownerId: "user_123",
        }),
      });
    });

    it("should validate required fields", async () => {
      const requestBody = {
        description: "Missing name",
      };

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Name is required");
    });

    it("should handle database errors during creation", async () => {
      mockPrisma.project.create.mockRejectedValue(new Error("Database error"));

      const requestBody = {
        name: "New Project",
        description: "New Description",
      };

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create project");
    });
  });
});
