/**
 * @jest-environment node
 */
import {
  TestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "../../setup/test-db";
import {
  createMockUser,
  createMockProject,
  createMockTask,
  createMockComment,
} from "../../helpers/db-test-utils";

describe("Database Operations", () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    // Start test database
    console.log("🚀 Starting test database...");
    await setupTestDatabase();
    testDb = TestDatabase.getInstance();
    console.log("✅ Test database ready!");
  }, 60000); // 60 second timeout for database setup

  afterAll(async () => {
    console.log("🛑 Stopping test database...");
    await teardownTestDatabase();
    console.log("✅ Test database stopped!");
  }, 30000); // 30 second timeout for cleanup

  beforeEach(async () => {
    await testDb.clean();
    await testDb.seed();
  });

  describe("User Database Operations", () => {
    it("should create a new user in the database", async () => {
      const userData = createMockUser({
        id: "new-user-id",
        clerkId: "clerk-new-user",
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
      });

      const user = await testDb.getPrisma().user.create({
        data: userData,
      });

      expect(user).toBeDefined();
      expect(user.id).toBe("new-user-id");
      expect(user.clerkId).toBe("clerk-new-user");
      expect(user.email).toBe("newuser@example.com");
      expect(user.firstName).toBe("New");
      expect(user.lastName).toBe("User");
    });

    it("should find a user by ID", async () => {
      const user = await testDb.getPrisma().user.findUnique({
        where: { id: "test-user-1" },
      });

      expect(user).toBeDefined();
      expect(user?.id).toBe("test-user-1");
      expect(user?.email).toBe("test1@example.com");
    });

    it("should find a user by Clerk ID", async () => {
      const user = await testDb.getPrisma().user.findUnique({
        where: { clerkId: "clerk-user-1" },
      });

      expect(user).toBeDefined();
      expect(user?.clerkId).toBe("clerk-user-1");
      expect(user?.email).toBe("test1@example.com");
    });

    it("should update a user", async () => {
      const updatedUser = await testDb.getPrisma().user.update({
        where: { id: "test-user-1" },
        data: {
          firstName: "Updated",
          lastName: "Name",
          updatedAt: new Date(),
        },
      });

      expect(updatedUser.firstName).toBe("Updated");
      expect(updatedUser.lastName).toBe("Name");
    });

    it("should delete a user", async () => {
      // First, delete related data
      await testDb.getPrisma().comment.deleteMany({
        where: { authorId: "test-user-1" },
      });
      await testDb.getPrisma().task.deleteMany({
        where: { projectId: "test-project-1" },
      });
      await testDb.getPrisma().project.deleteMany({
        where: { ownerId: "test-user-1" },
      });

      const deletedUser = await testDb.getPrisma().user.delete({
        where: { id: "test-user-1" },
      });

      expect(deletedUser.id).toBe("test-user-1");

      // Verify user is deleted
      const user = await testDb.getPrisma().user.findUnique({
        where: { id: "test-user-1" },
      });

      expect(user).toBeNull();
    });
  });

  describe("Project Database Operations", () => {
    it("should create a new project", async () => {
      const projectData = createMockProject({
        id: "new-project-id",
        name: "New Project",
        description: "A new test project",
        ownerId: "test-user-1",
      });

      const project = await testDb.getPrisma().project.create({
        data: projectData,
      });

      expect(project).toBeDefined();
      expect(project.id).toBe("new-project-id");
      expect(project.name).toBe("New Project");
      expect(project.ownerId).toBe("test-user-1");
    });

    it("should find a project by ID", async () => {
      const project = await testDb.getPrisma().project.findUnique({
        where: { id: "test-project-1" },
      });

      expect(project).toBeDefined();
      expect(project?.id).toBe("test-project-1");
      expect(project?.name).toBe("Test Project");
    });

    it("should find projects by owner", async () => {
      const projects = await testDb.getPrisma().project.findMany({
        where: { ownerId: "test-user-1" },
      });

      expect(projects).toHaveLength(1);
      expect(projects[0].ownerId).toBe("test-user-1");
    });

    it("should update a project", async () => {
      const updatedProject = await testDb.getPrisma().project.update({
        where: { id: "test-project-1" },
        data: {
          name: "Updated Project",
          description: "Updated description",
          updatedAt: new Date(),
        },
      });

      expect(updatedProject.name).toBe("Updated Project");
      expect(updatedProject.description).toBe("Updated description");
    });

    it("should delete a project and cascade delete related tasks and comments", async () => {
      // Verify tasks exist before deletion
      const tasksBefore = await testDb.getPrisma().task.findMany({
        where: { projectId: "test-project-1" },
      });
      expect(tasksBefore.length).toBeGreaterThan(0);

      // Delete the project
      const deletedProject = await testDb.getPrisma().project.delete({
        where: { id: "test-project-1" },
      });

      expect(deletedProject.id).toBe("test-project-1");

      // Verify project is deleted
      const project = await testDb.getPrisma().project.findUnique({
        where: { id: "test-project-1" },
      });
      expect(project).toBeNull();

      // Verify tasks are cascade deleted
      const tasksAfter = await testDb.getPrisma().task.findMany({
        where: { projectId: "test-project-1" },
      });
      expect(tasksAfter).toHaveLength(0);
    });
  });

  describe("Task Database Operations", () => {
    it("should create a new task", async () => {
      const taskData = createMockTask({
        id: "new-task-id",
        title: "New Task",
        projectId: "test-project-1",
        status: "TODO",
      });

      const task = await testDb.getPrisma().task.create({
        data: taskData,
      });

      expect(task).toBeDefined();
      expect(task.id).toBe("new-task-id");
      expect(task.title).toBe("New Task");
      expect(task.projectId).toBe("test-project-1");
      expect(task.status).toBe("TODO");
      // Priority field doesn't exist in Task model
    });

    it("should find a task by ID", async () => {
      const task = await testDb.getPrisma().task.findUnique({
        where: { id: "test-task-1" },
      });

      expect(task).toBeDefined();
      expect(task?.id).toBe("test-task-1");
      expect(task?.title).toBe("Test Task 1");
    });

    it("should find tasks by project", async () => {
      const tasks = await testDb.getPrisma().task.findMany({
        where: { projectId: "test-project-1" },
      });

      expect(tasks).toHaveLength(2); // We seeded 2 tasks
      expect(tasks.every((task) => task.projectId === "test-project-1")).toBe(
        true
      );
    });

    it("should update a task", async () => {
      const updatedTask = await testDb.getPrisma().task.update({
        where: { id: "test-task-1" },
        data: {
          title: "Updated Task",
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        },
      });

      expect(updatedTask.title).toBe("Updated Task");
      expect(updatedTask.status).toBe("IN_PROGRESS");
      // Priority field doesn't exist in Task model
    });

    it("should handle task dependencies", async () => {
      const task = await testDb.getPrisma().task.findUnique({
        where: { id: "test-task-2" },
      });

      expect(task).toBeDefined();
      expect(task?.dependencies).toContain("test-task-1");
    });

    it("should delete a task and cascade delete related comments", async () => {
      // Verify comments exist before deletion
      const commentsBefore = await testDb.getPrisma().comment.findMany({
        where: { taskId: "test-task-1" },
      });
      expect(commentsBefore.length).toBeGreaterThan(0);

      // Delete the task
      const deletedTask = await testDb.getPrisma().task.delete({
        where: { id: "test-task-1" },
      });

      expect(deletedTask.id).toBe("test-task-1");

      // Verify task is deleted
      const task = await testDb.getPrisma().task.findUnique({
        where: { id: "test-task-1" },
      });
      expect(task).toBeNull();

      // Verify comments are cascade deleted
      const commentsAfter = await testDb.getPrisma().comment.findMany({
        where: { taskId: "test-task-1" },
      });
      expect(commentsAfter).toHaveLength(0);
    });
  });

  describe("Comment Database Operations", () => {
    it("should create a new comment", async () => {
      const commentData = createMockComment({
        id: "new-comment-id",
        content: "New comment",
        taskId: "test-task-1",
        authorId: "test-user-1",
      });

      const comment = await testDb.getPrisma().comment.create({
        data: commentData,
      });

      expect(comment).toBeDefined();
      expect(comment.id).toBe("new-comment-id");
      expect(comment.content).toBe("New comment");
      expect(comment.taskId).toBe("test-task-1");
      expect(comment.authorId).toBe("test-user-1");
    });

    it("should find a comment by ID", async () => {
      const comment = await testDb.getPrisma().comment.findUnique({
        where: { id: "test-comment-1" },
      });

      expect(comment).toBeDefined();
      expect(comment?.id).toBe("test-comment-1");
      expect(comment?.content).toBe("Test comment 1");
    });

    it("should find comments by task", async () => {
      const comments = await testDb.getPrisma().comment.findMany({
        where: { taskId: "test-task-1" },
      });

      expect(comments).toHaveLength(2); // We seeded 2 comments for task-1
      expect(
        comments.every((comment) => comment.taskId === "test-task-1")
      ).toBe(true);
    });

    it("should find comments by author", async () => {
      const comments = await testDb.getPrisma().comment.findMany({
        where: { authorId: "test-user-1" },
      });

      expect(comments.length).toBeGreaterThan(0);
      expect(
        comments.every((comment) => comment.authorId === "test-user-1")
      ).toBe(true);
    });

    it("should update a comment", async () => {
      const updatedComment = await testDb.getPrisma().comment.update({
        where: { id: "test-comment-1" },
        data: {
          content: "Updated comment content",
        },
      });

      expect(updatedComment.content).toBe("Updated comment content");
    });

    it("should delete a comment", async () => {
      const deletedComment = await testDb.getPrisma().comment.delete({
        where: { id: "test-comment-1" },
      });

      expect(deletedComment.id).toBe("test-comment-1");

      // Verify comment is deleted
      const comment = await testDb.getPrisma().comment.findUnique({
        where: { id: "test-comment-1" },
      });
      expect(comment).toBeNull();
    });
  });

  describe("Database Constraints and Validation", () => {
    it("should enforce unique user email constraint", async () => {
      const userData = createMockUser({
        id: "duplicate-email-user",
        clerkId: "clerk-duplicate-email",
        email: "test1@example.com", // Same email as existing user
        firstName: "Duplicate",
        lastName: "Email",
      });

      await expect(
        testDb.getPrisma().user.create({
          data: userData,
        })
      ).rejects.toThrow();
    });

    it("should enforce unique user clerkId constraint", async () => {
      const userData = createMockUser({
        id: "duplicate-clerk-user",
        clerkId: "clerk-user-1", // Same clerkId as existing user
        email: "different@example.com",
        firstName: "Duplicate",
        lastName: "Clerk",
      });

      await expect(
        testDb.getPrisma().user.create({
          data: userData,
        })
      ).rejects.toThrow();
    });

    it("should enforce foreign key constraint for project owner", async () => {
      const projectData = createMockProject({
        id: "invalid-owner-project",
        title: "Invalid Owner Project",
        ownerId: "non-existent-user", // Invalid owner ID
      });

      await expect(
        testDb.getPrisma().project.create({
          data: projectData,
        })
      ).rejects.toThrow();
    });

    it("should enforce foreign key constraint for task project", async () => {
      const taskData = createMockTask({
        id: "invalid-project-task",
        title: "Invalid Project Task",
        projectId: "non-existent-project", // Invalid project ID
      });

      await expect(
        testDb.getPrisma().task.create({
          data: taskData,
        })
      ).rejects.toThrow();
    });

    it("should enforce foreign key constraint for comment author", async () => {
      const commentData = createMockComment({
        id: "invalid-author-comment",
        content: "Invalid Author Comment",
        taskId: "test-task-1",
        authorId: "non-existent-user", // Invalid author ID
      });

      await expect(
        testDb.getPrisma().comment.create({
          data: commentData,
        })
      ).rejects.toThrow();
    });
  });

  describe("Database Transactions", () => {
    it("should handle successful transaction", async () => {
      const result = await testDb.getPrisma().$transaction(async (tx) => {
        // Create a user
        const user = await tx.user.create({
          data: createMockUser({
            id: "transaction-user",
            clerkId: "clerk-transaction-user",
            email: "transaction@example.com",
            firstName: "Transaction",
            lastName: "User",
          }),
        });

        // Create a project for that user
        const project = await tx.project.create({
          data: createMockProject({
            id: "transaction-project",
            name: "Transaction Project",
            ownerId: user.id,
          }),
        });

        return { user, project };
      });

      expect(result.user).toBeDefined();
      expect(result.project).toBeDefined();
      expect(result.project.ownerId).toBe(result.user.id);

      // Verify both were created
      const user = await testDb.getPrisma().user.findUnique({
        where: { id: "transaction-user" },
      });
      const project = await testDb.getPrisma().project.findUnique({
        where: { id: "transaction-project" },
      });

      expect(user).toBeDefined();
      expect(project).toBeDefined();
    });

    it("should rollback failed transaction", async () => {
      await expect(
        testDb.getPrisma().$transaction(async (tx) => {
          // Create a user
          await tx.user.create({
            data: createMockUser({
              id: "rollback-user",
              clerkId: "clerk-rollback-user",
              email: "rollback@example.com",
              firstName: "Rollback",
              lastName: "User",
            }),
          });

          // Try to create a project with invalid owner (this should fail)
          await tx.project.create({
            data: createMockProject({
              id: "rollback-project",
              title: "Rollback Project",
              ownerId: "non-existent-user", // This should cause the transaction to fail
            }),
          });
        })
      ).rejects.toThrow();

      // Verify user was not created due to rollback
      const user = await testDb.getPrisma().user.findUnique({
        where: { id: "rollback-user" },
      });
      expect(user).toBeNull();
    });
  });
});
