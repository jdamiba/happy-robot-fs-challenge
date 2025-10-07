/**
 * @jest-environment jsdom
 */
import { setupTestEnvironment } from "./global-setup";
import { TEST_CONFIG } from "./test-config";
import { TestDatabase } from "./test-db";

describe("Test Setup", () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  describe("Environment Configuration", () => {
    it("should have correct test environment variables", () => {
      expect(process.env.NODE_ENV).toBe("test");
      expect(process.env.TEST_DATABASE_URL).toBe("file:./test.db");
      expect(process.env.NEXT_PUBLIC_WS_URL).toBe("ws://localhost:3001/ws");
    });

    it("should have test configuration loaded", () => {
      expect(TEST_CONFIG.database.url).toBe("file:./test.db");
      expect(TEST_CONFIG.websocket.url).toBe("ws://localhost:3001/ws");
      expect(TEST_CONFIG.testData.users.user1.email).toBe("test1@example.com");
    });
  });

  describe("Test Database", () => {
    it("should create TestDatabase instance", () => {
      const db = TestDatabase.getInstance();
      expect(db).toBeDefined();
      expect(db.getPrisma()).toBeDefined();
    });
  });

  describe("Test Utilities", () => {
    it("should create test data", () => {
      const user = TEST_CONFIG.testData.users.user1;
      expect(user.id).toBe("test-user-1");
      expect(user.email).toBe("test1@example.com");
      expect(user.firstName).toBe("Test");
    });

    it("should create project test data", () => {
      const project = TEST_CONFIG.testData.projects.project1;
      expect(project.id).toBe("test-project-1");
      expect(project.title).toBe("Test Project 1");
      expect(project.ownerId).toBe("test-user-1");
    });

    it("should create task test data", () => {
      const task = TEST_CONFIG.testData.tasks.task1;
      expect(task.id).toBe("test-task-1");
      expect(task.title).toBe("Test Task 1");
      expect(task.status).toBe("TODO");
      expect(task.projectId).toBe("test-project-1");
    });
  });

  describe("Test Categories and Tags", () => {
    it("should have test categories defined", () => {
      expect(TEST_CONFIG).toBeDefined();
      expect(TEST_CONFIG.database).toBeDefined();
      expect(TEST_CONFIG.websocket).toBeDefined();
      expect(TEST_CONFIG.api).toBeDefined();
    });
  });
});
