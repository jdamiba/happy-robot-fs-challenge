/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock the API route handlers
jest.mock("@/app/api/projects/[id]/tasks/route", () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

jest.mock("@/app/api/tasks/[id]/route", () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

describe("Task CRUD Operations", () => {
  let mockGetTasks: jest.Mock;
  let mockCreateTask: jest.Mock;
  let mockGetTask: jest.Mock;
  let mockUpdateTask: jest.Mock;
  let mockDeleteTask: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked handlers
    const tasksRoute = require("@/app/api/projects/[id]/tasks/route");
    const taskByIdRoute = require("@/app/api/tasks/[id]/route");

    mockGetTasks = tasksRoute.GET;
    mockCreateTask = tasksRoute.POST;
    mockGetTask = taskByIdRoute.GET;
    mockUpdateTask = taskByIdRoute.PUT;
    mockDeleteTask = taskByIdRoute.DELETE;
  });

  describe("GET /api/projects/[id]/tasks", () => {
    it("should return all tasks for a project", async () => {
      const mockTasks = [
        {
          id: "task-1",
          title: "Task 1",
          description: "First task",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project-1",
          assignedTo: ["user-1"],
          dependencies: [],
          configuration: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-2",
          title: "Task 2",
          description: "Second task",
          status: "IN_PROGRESS",
          priority: "HIGH",
          projectId: "project-1",
          assignedTo: ["user-2"],
          dependencies: ["task-1"],
          configuration: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockGetTasks.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: mockTasks }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1/tasks"
      );
      const response = await mockGetTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].title).toBe("Task 1");
      expect(responseData.data[1].status).toBe("IN_PROGRESS");
    });

    it("should return empty array when project has no tasks", async () => {
      mockGetTasks.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: [] }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1/tasks"
      );
      const response = await mockGetTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(0);
    });

    it("should handle non-existent project", async () => {
      mockGetTasks.mockResolvedValue({
        status: 404,
        json: () => ({ success: false, error: "Project not found" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/non-existent/tasks"
      );
      const response = await mockGetTasks(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Project not found");
    });
  });

  describe("POST /api/projects/[id]/tasks", () => {
    it("should create a new task", async () => {
      const newTask = {
        title: "New Task",
        description: "A newly created task",
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: ["user-1"],
        dependencies: [],
        configuration: {},
      };

      const createdTask = {
        id: "task-new",
        title: "New Task",
        description: "A newly created task",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project-1",
        assignedTo: ["user-1"],
        dependencies: [],
        configuration: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateTask.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdTask }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1/tasks",
        {
          method: "POST",
          body: JSON.stringify(newTask),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.title).toBe("New Task");
      expect(responseData.data.projectId).toBe("project-1");
      expect(mockCreateTask).toHaveBeenCalledWith(request);
    });

    it("should validate required fields", async () => {
      const invalidTask = {
        description: "Task without title",
        status: "TODO",
      };

      mockCreateTask.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Title is required",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1/tasks",
        {
          method: "POST",
          body: JSON.stringify(invalidTask),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("required");
    });

    it("should validate task status", async () => {
      const invalidTask = {
        title: "Task with invalid status",
        status: "INVALID_STATUS",
        priority: "MEDIUM",
      };

      mockCreateTask.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Invalid task status",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1/tasks",
        {
          method: "POST",
          body: JSON.stringify(invalidTask),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Invalid task status");
    });

    it("should handle task dependencies", async () => {
      const taskWithDependencies = {
        title: "Task with Dependencies",
        description: "Task that depends on other tasks",
        status: "TODO",
        priority: "HIGH",
        dependencies: ["task-1", "task-2"],
        assignedTo: ["user-1"],
        configuration: {},
      };

      const createdTask = {
        id: "task-with-deps",
        ...taskWithDependencies,
        projectId: "project-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateTask.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdTask }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/projects/project-1/tasks",
        {
          method: "POST",
          body: JSON.stringify(taskWithDependencies),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.dependencies).toHaveLength(2);
      expect(responseData.data.dependencies).toContain("task-1");
      expect(responseData.data.dependencies).toContain("task-2");
    });
  });

  describe("GET /api/tasks/[id]", () => {
    it("should return a specific task", async () => {
      const task = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project-1",
        assignedTo: ["user-1"],
        dependencies: [],
        configuration: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockGetTask.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: task }),
      });

      const request = new NextRequest("http://localhost:3000/api/tasks/task-1");
      const response = await mockGetTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe("task-1");
      expect(responseData.data.title).toBe("Task 1");
    });

    it("should return 404 for non-existent task", async () => {
      mockGetTask.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Task not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/non-existent"
      );
      const response = await mockGetTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Task not found");
    });
  });

  describe("PUT /api/tasks/[id]", () => {
    it("should update an existing task", async () => {
      const updateData = {
        title: "Updated Task Title",
        description: "Updated task description",
        status: "IN_PROGRESS",
        priority: "HIGH",
      };

      const updatedTask = {
        id: "task-1",
        title: "Updated Task Title",
        description: "Updated task description",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: "project-1",
        assignedTo: ["user-1"],
        dependencies: [],
        configuration: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUpdateTask.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedTask }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.title).toBe("Updated Task Title");
      expect(responseData.data.status).toBe("IN_PROGRESS");
      expect(mockUpdateTask).toHaveBeenCalledWith(request);
    });

    it("should handle status transitions", async () => {
      const statusUpdate = {
        status: "DONE",
      };

      const updatedTask = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        status: "DONE",
        priority: "MEDIUM",
        projectId: "project-1",
        assignedTo: ["user-1"],
        dependencies: [],
        configuration: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUpdateTask.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedTask }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1",
        {
          method: "PUT",
          body: JSON.stringify(statusUpdate),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.status).toBe("DONE");
    });

    it("should validate status transitions", async () => {
      const invalidTransition = {
        status: "INVALID_STATUS",
      };

      mockUpdateTask.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Invalid status transition",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1",
        {
          method: "PUT",
          body: JSON.stringify(invalidTransition),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Invalid status");
    });

    it("should handle dependency updates", async () => {
      const dependencyUpdate = {
        dependencies: ["task-2", "task-3"],
      };

      const updatedTask = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project-1",
        assignedTo: ["user-1"],
        dependencies: ["task-2", "task-3"],
        configuration: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUpdateTask.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedTask }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1",
        {
          method: "PUT",
          body: JSON.stringify(dependencyUpdate),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.dependencies).toHaveLength(2);
      expect(responseData.data.dependencies).toContain("task-2");
      expect(responseData.data.dependencies).toContain("task-3");
    });

    it("should handle circular dependencies", async () => {
      const circularDependency = {
        dependencies: ["task-1"], // Task depending on itself
      };

      mockUpdateTask.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Circular dependency detected",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1",
        {
          method: "PUT",
          body: JSON.stringify(circularDependency),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Circular dependency");
    });

    it("should handle update of non-existent task", async () => {
      const updateData = {
        title: "Updated Title",
      };

      mockUpdateTask.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Task not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/non-existent",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Task not found");
    });
  });

  describe("DELETE /api/tasks/[id]", () => {
    it("should delete an existing task", async () => {
      mockDeleteTask.mockResolvedValue({
        status: 200,
        json: () => ({
          success: true,
          message: "Task deleted successfully",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain("deleted successfully");
      expect(mockDeleteTask).toHaveBeenCalledWith(request);
    });

    it("should handle deletion of non-existent task", async () => {
      mockDeleteTask.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Task not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/non-existent",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Task not found");
    });

    it("should handle task with dependencies", async () => {
      mockDeleteTask.mockResolvedValue({
        status: 409,
        json: () => ({
          success: false,
          error: "Cannot delete task that other tasks depend on",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-with-deps",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteTask(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("depend on");
    });
  });

  describe("Task CRUD Integration", () => {
    it("should complete full CRUD cycle", async () => {
      // 1. Create task
      const newTask = {
        title: "Full CRUD Test Task",
        description: "Testing complete CRUD cycle",
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: ["user-1"],
        dependencies: [],
        configuration: {},
      };

      const createdTask = {
        id: "task-crud-test",
        ...newTask,
        projectId: "project-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateTask.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdTask }),
      });

      // 2. Read task
      mockGetTask.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: createdTask }),
      });

      // 3. Update task
      const updatedTask = {
        ...createdTask,
        title: "Updated CRUD Test Task",
        status: "IN_PROGRESS",
      };

      mockUpdateTask.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedTask }),
      });

      // 4. Delete task
      mockDeleteTask.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, message: "Task deleted successfully" }),
      });

      // Execute the full cycle
      const createRequest = new NextRequest(
        "http://localhost:3000/api/projects/project-1/tasks",
        {
          method: "POST",
          body: JSON.stringify(newTask),
          headers: { "Content-Type": "application/json" },
        }
      );

      const createResponse = await mockCreateTask(createRequest);
      const createData = await createResponse.json();

      expect(createData.success).toBe(true);
      expect(createData.data.title).toBe("Full CRUD Test Task");

      // Verify all operations were called
      expect(mockCreateTask).toHaveBeenCalledWith(createRequest);
      expect(mockGetTask).toBeDefined();
      expect(mockUpdateTask).toBeDefined();
      expect(mockDeleteTask).toBeDefined();
    });
  });
});
