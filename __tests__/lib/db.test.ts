import { ProjectService, TaskService, CommentService } from "@/lib/db";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
  ProjectService: {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByOwnerId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  TaskService: {
    create: jest.fn(),
    findById: jest.fn(),
    findByProjectId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    addDependency: jest.fn(),
    removeDependency: jest.fn(),
  },
  CommentService: {
    create: jest.fn(),
    findById: jest.fn(),
    findByTaskId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Database Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ProjectService", () => {
    it("should create a project", async () => {
      const mockProject = {
        id: "project_1",
        name: "Test Project",
        description: "Test Description",
        ownerId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
      };

      mockPrisma.project.create.mockResolvedValue(mockProject);

      const result = await ProjectService.create({
        name: "Test Project",
        description: "Test Description",
        ownerId: "user_123",
      });

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Project",
          description: "Test Description",
          ownerId: "user_123",
        }),
      });
    });

    it("should find project by ID", async () => {
      const mockProject = {
        id: "project_1",
        name: "Test Project",
        description: "Test Description",
        ownerId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await ProjectService.findById("project_1");

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: "project_1" },
        include: {
          tasks: {
            include: {
              comments: true,
            },
          },
        },
      });
    });

    it("should return null for non-existent project", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const result = await ProjectService.findById("nonexistent");

      expect(result).toBeNull();
    });

    it("should find projects by owner ID", async () => {
      const mockProjects = [
        {
          id: "project_1",
          name: "Project 1",
          description: "Description 1",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
        {
          id: "project_2",
          name: "Project 2",
          description: "Description 2",
          ownerId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await ProjectService.findByOwnerId("user_123");

      expect(result).toEqual(mockProjects);
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

    it("should update a project", async () => {
      const mockProject = {
        id: "project_1",
        name: "Updated Project",
        description: "Updated Description",
        ownerId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
      };

      mockPrisma.project.update.mockResolvedValue(mockProject);

      const result = await ProjectService.update("project_1", {
        name: "Updated Project",
        description: "Updated Description",
      });

      expect(result).toEqual(mockProject);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "project_1" },
        data: expect.objectContaining({
          name: "Updated Project",
          description: "Updated Description",
        }),
        include: {
          tasks: {
            include: {
              comments: true,
            },
          },
        },
      });
    });

    it("should delete a project", async () => {
      mockPrisma.project.delete.mockResolvedValue({});

      await ProjectService.delete("project_1");

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: "project_1" },
      });
    });
  });

  describe("TaskService", () => {
    it("should create a task", async () => {
      const mockTask = {
        id: "task_1",
        title: "Test Task",
        description: "Test Description",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
        project: {} as any,
        comments: [],
      };

      mockPrisma.task.create.mockResolvedValue(mockTask);

      const result = await TaskService.create({
        title: "Test Task",
        description: "Test Description",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
      });

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test Task",
          description: "Test Description",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project_1",
          authorId: "user_123",
        }),
        include: {
          project: true,
          comments: true,
        },
      });
    });

    it("should find tasks by project ID", async () => {
      const mockTasks = [
        {
          id: "task_1",
          title: "Task 1",
          description: "Description 1",
          status: "TODO",
          priority: "MEDIUM",
          projectId: "project_1",
          authorId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
          dependencies: [],
          tags: [],
          configuration: {},
          project: {} as any,
          comments: [],
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await TaskService.findByProjectId("project_1");

      expect(result).toEqual(mockTasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { projectId: "project_1" },
        include: {
          project: true,
          comments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should update task status", async () => {
      const mockTask = {
        id: "task_1",
        title: "Test Task",
        description: "Test Description",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: [],
        configuration: {},
        project: {} as any,
        comments: [],
      };

      mockPrisma.task.update.mockResolvedValue(mockTask);

      const result = await TaskService.updateStatus("task_1", "IN_PROGRESS");

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task_1" },
        data: { status: "IN_PROGRESS" },
        include: {
          project: true,
          comments: true,
        },
      });
    });

    it("should add task dependency", async () => {
      const mockTask = {
        id: "task_1",
        title: "Test Task",
        description: "Test Description",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "project_1",
        authorId: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: ["task_2"],
        tags: [],
        configuration: {},
        project: {} as any,
        comments: [],
      };

      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task_1",
        dependencies: [],
      } as any);

      mockPrisma.task.update.mockResolvedValue(mockTask);

      const result = await TaskService.addDependency("task_1", "task_2");

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task_1" },
        data: { dependencies: ["task_2"] },
        include: {
          project: true,
          comments: true,
        },
      });
    });
  });

  describe("CommentService", () => {
    it("should create a comment", async () => {
      const mockComment = {
        id: "comment_1",
        taskId: "task_1",
        content: "Test comment",
        authorId: "user_123",
        timestamp: new Date(),
        task: {} as any,
        author: {} as any,
      };

      mockPrisma.comment.create.mockResolvedValue(mockComment);

      const result = await CommentService.create({
        taskId: "task_1",
        content: "Test comment",
        authorId: "user_123",
      });

      expect(result).toEqual(mockComment);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: "task_1",
          content: "Test comment",
          authorId: "user_123",
        }),
        include: {
          task: true,
          author: true,
        },
      });
    });

    it("should find comments by task ID", async () => {
      const mockComments = [
        {
          id: "comment_1",
          taskId: "task_1",
          content: "Comment 1",
          authorId: "user_123",
          timestamp: new Date(),
          task: {} as any,
          author: {} as any,
        },
      ];

      mockPrisma.comment.findMany.mockResolvedValue(mockComments);

      const result = await CommentService.findByTaskId("task_1");

      expect(result).toEqual(mockComments);
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { taskId: "task_1" },
        include: {
          task: true,
          author: true,
        },
        orderBy: { timestamp: "asc" },
      });
    });

    it("should update a comment", async () => {
      const mockComment = {
        id: "comment_1",
        taskId: "task_1",
        content: "Updated comment",
        authorId: "user_123",
        timestamp: new Date(),
        task: {} as any,
        author: {} as any,
      };

      mockPrisma.comment.update.mockResolvedValue(mockComment);

      const result = await CommentService.update("comment_1", {
        content: "Updated comment",
      });

      expect(result).toEqual(mockComment);
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: "comment_1" },
        data: { content: "Updated comment" },
        include: {
          task: true,
          author: true,
        },
      });
    });

    it("should delete a comment", async () => {
      mockPrisma.comment.delete.mockResolvedValue({});

      await CommentService.delete("comment_1");

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: "comment_1" },
      });
    });
  });
});
