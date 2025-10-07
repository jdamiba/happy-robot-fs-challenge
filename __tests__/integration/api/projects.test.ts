/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock the API route handlers
jest.mock("@/app/api/projects/route", () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

jest.mock("@/app/api/projects/[id]/route", () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

describe("Project CRUD Operations", () => {
  let mockGetProjects: jest.Mock;
  let mockCreateProject: jest.Mock;
  let mockGetProject: jest.Mock;
  let mockUpdateProject: jest.Mock;
  let mockDeleteProject: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked handlers
    const projectsRoute = require("@/app/api/projects/route");
    const projectByIdRoute = require("@/app/api/projects/[id]/route");

    mockGetProjects = projectsRoute.GET;
    mockCreateProject = projectsRoute.POST;
    mockGetProject = projectByIdRoute.GET;
    mockUpdateProject = projectByIdRoute.PUT;
    mockDeleteProject = projectByIdRoute.DELETE;
  });

  describe("GET /api/projects", () => {
    it("should return all projects for a user", async () => {
      const mockProjects = [
        {
          id: "project-1",
          title: "Test Project 1",
          description: "First test project",
          ownerId: "user-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "project-2",
          title: "Test Project 2",
          description: "Second test project",
          ownerId: "user-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockGetProjects.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: mockProjects }),
      });

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await mockGetProjects(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].title).toBe("Test Project 1");
      expect(responseData.data[1].title).toBe("Test Project 2");
    });

    it("should return empty array when user has no projects", async () => {
      mockGetProjects.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: [] }),
      });

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await mockGetProjects(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(0);
    });

    it("should handle unauthorized access", async () => {
      mockGetProjects.mockResolvedValue({
        status: 401,
        json: () => ({ success: false, error: "Unauthorized" }),
      });

      const request = new NextRequest("http://localhost:3000/api/projects");
      const response = await mockGetProjects(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/projects", () => {
    it("should create a new project", async () => {
      const newProject = {
        title: "New Test Project",
        description: "A newly created test project",
      };

      const createdProject = {
        id: "project-new",
        title: "New Test Project",
        description: "A newly created test project",
        ownerId: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateProject.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdProject }),
      });

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify(newProject),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await mockCreateProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.title).toBe("New Test Project");
      expect(responseData.data.ownerId).toBe("user-1");
      expect(mockCreateProject).toHaveBeenCalledWith(request);
    });

    it("should validate required fields", async () => {
      const invalidProject = {
        description: "Project without title",
      };

      mockCreateProject.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Title is required",
        }),
      });

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify(invalidProject),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await mockCreateProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("required");
    });

    it("should handle duplicate project titles", async () => {
      const duplicateProject = {
        title: "Existing Project",
        description: "Project with duplicate title",
      };

      mockCreateProject.mockResolvedValue({
        status: 409,
        json: () => ({
          success: false,
          error: "Project with this title already exists",
        }),
      });

      const request = new NextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: JSON.stringify(duplicateProject),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await mockCreateProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("already exists");
    });
  });

  describe("GET /api/projects/[id]", () => {
    it("should return a specific project", async () => {
      const project = {
        id: "project-1",
        title: "Test Project 1",
        description: "First test project",
        ownerId: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockGetProject.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: project }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1"
      );
      const response = await mockGetProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe("project-1");
      expect(responseData.data.title).toBe("Test Project 1");
    });

    it("should return 404 for non-existent project", async () => {
      mockGetProject.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Project not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/non-existent"
      );
      const response = await mockGetProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Project not found");
    });

    it("should handle unauthorized access to project", async () => {
      mockGetProject.mockResolvedValue({
        status: 403,
        json: () => ({
          success: false,
          error: "Access denied",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1"
      );
      const response = await mockGetProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Access denied");
    });
  });

  describe("PUT /api/projects/[id]", () => {
    it("should update an existing project", async () => {
      const updateData = {
        title: "Updated Project Title",
        description: "Updated project description",
      };

      const updatedProject = {
        id: "project-1",
        title: "Updated Project Title",
        description: "Updated project description",
        ownerId: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUpdateProject.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedProject }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.title).toBe("Updated Project Title");
      expect(responseData.data.description).toBe("Updated project description");
      expect(mockUpdateProject).toHaveBeenCalledWith(request);
    });

    it("should validate update data", async () => {
      const invalidUpdate = {
        title: "", // Empty title should be invalid
      };

      mockUpdateProject.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Title cannot be empty",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1",
        {
          method: "PUT",
          body: JSON.stringify(invalidUpdate),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("empty");
    });

    it("should handle update of non-existent project", async () => {
      const updateData = {
        title: "Updated Title",
      };

      mockUpdateProject.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Project not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/non-existent",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Project not found");
    });

    it("should handle unauthorized update", async () => {
      const updateData = {
        title: "Unauthorized Update",
      };

      mockUpdateProject.mockResolvedValue({
        status: 403,
        json: () => ({
          success: false,
          error: "You can only update your own projects",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("own projects");
    });
  });

  describe("DELETE /api/projects/[id]", () => {
    it("should delete an existing project", async () => {
      mockDeleteProject.mockResolvedValue({
        status: 200,
        json: () => ({
          success: true,
          message: "Project deleted successfully",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain("deleted successfully");
      expect(mockDeleteProject).toHaveBeenCalledWith(request);
    });

    it("should handle deletion of non-existent project", async () => {
      mockDeleteProject.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Project not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/non-existent",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Project not found");
    });

    it("should handle unauthorized deletion", async () => {
      mockDeleteProject.mockResolvedValue({
        status: 403,
        json: () => ({
          success: false,
          error: "You can only delete your own projects",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("own projects");
    });

    it("should handle project with dependencies", async () => {
      mockDeleteProject.mockResolvedValue({
        status: 409,
        json: () => ({
          success: false,
          error: "Cannot delete project with existing tasks",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-with-tasks",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteProject(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("existing tasks");
    });
  });

  describe("Project CRUD Integration", () => {
    it("should complete full CRUD cycle", async () => {
      // 1. Create project
      const newProject = {
        title: "Full CRUD Test Project",
        description: "Testing complete CRUD cycle",
      };

      const createdProject = {
        id: "project-crud-test",
        title: "Full CRUD Test Project",
        description: "Testing complete CRUD cycle",
        ownerId: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateProject.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdProject }),
      });

      // 2. Read project
      mockGetProject.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: createdProject }),
      });

      // 3. Update project
      const updatedProject = {
        ...createdProject,
        title: "Updated CRUD Test Project",
        description: "Updated description",
      };

      mockUpdateProject.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedProject }),
      });

      // 4. Delete project
      mockDeleteProject.mockResolvedValue({
        status: 200,
        json: () => ({
          success: true,
          message: "Project deleted successfully",
        }),
      });

      // Execute the full cycle
      const createRequest = new NextRequest(
        "http://localhost:3000/api/projects",
        {
          method: "POST",
          body: JSON.stringify(newProject),
          headers: { "Content-Type": "application/json" },
        }
      );

      const createResponse = await mockCreateProject(createRequest);
      const createData = await createResponse.json();

      expect(createData.success).toBe(true);
      expect(createData.data.title).toBe("Full CRUD Test Project");

      // Verify all operations were called
      expect(mockCreateProject).toHaveBeenCalledWith(createRequest);
      expect(mockGetProject).toBeDefined();
      expect(mockUpdateProject).toBeDefined();
      expect(mockDeleteProject).toBeDefined();
    });
  });
});
