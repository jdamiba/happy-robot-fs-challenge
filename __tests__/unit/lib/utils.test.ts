/**
 * @jest-environment jsdom
 */
import { generateId, parseTask, stringifyTaskData } from "@/lib/utils";
import { ParsedTask } from "@/lib/types";

describe("Utils", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
    });

    it("should generate IDs with timestamp format", () => {
      const id1 = generateId();
      const id2 = generateId();

      // Should be in format: timestamp-randomstring
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+-[a-z0-9]+$/);

      // Should be different
      expect(id1).not.toBe(id2);
    });
  });

  describe("parseTask", () => {
    it("should parse a task from database format", () => {
      const dbTask = {
        id: "test-task-id",
        title: "Test Task",
        description: "A test task",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "test-project-id",
        assignedTo: [],
        dependencies: [],
        configuration: {},
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        project: {
          id: "test-project-id",
          title: "Test Project",
          description: "A test project",
          ownerId: "test-user-id",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const parsedTask = parseTask(dbTask);

      expect(parsedTask.id).toBe("test-task-id");
      expect(parsedTask.title).toBe("Test Task");
      expect(parsedTask.status).toBe("TODO");
      expect(parsedTask.priority).toBe("MEDIUM");
      expect(parsedTask.projectId).toBe("test-project-id");
      expect(parsedTask.assignedTo).toEqual([]);
      expect(parsedTask.dependencies).toEqual([]);
      expect(parsedTask.configuration).toEqual({});
      expect(parsedTask.comments).toEqual([]);
    });
  });

  describe("stringifyTaskData", () => {
    it("should stringify task data for database storage", () => {
      const taskData: Partial<ParsedTask> = {
        title: "Test Task",
        description: "A test task",
        status: "TODO",
        priority: "MEDIUM",
        assignedTo: [],
        dependencies: [],
        configuration: {},
      };

      const stringified = stringifyTaskData(taskData);

      expect(stringified.title).toBe("Test Task");
      expect(stringified.description).toBe("A test task");
      expect(stringified.status).toBe("TODO");
      expect(stringified.priority).toBe("MEDIUM");
      expect(stringified.assignedTo).toEqual([]);
      expect(stringified.dependencies).toEqual([]);
      expect(stringified.configuration).toEqual({});
      expect(stringified.id).toBeDefined();
      expect(stringified.createdAt).toBeDefined();
      expect(stringified.updatedAt).toBeDefined();
    });

    it("should preserve existing ID when provided", () => {
      const taskData: Partial<ParsedTask> = {
        id: "existing-task-id",
        title: "Test Task",
      };

      const stringified = stringifyTaskData(taskData);

      expect(stringified.id).toBe("existing-task-id");
    });
  });
});
