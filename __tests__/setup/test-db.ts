// Test database configuration - use PostgreSQL for testing
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://happyrobot_test:happyrobot_test123@localhost:5433/happyrobot_test";

// Ensure DATABASE_URL is set for Prisma (should already be set by jest.env.js)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
}

import { PrismaClient } from "@prisma/client";

// Create a separate Prisma client for testing
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
});

// Test database utilities
export class TestDatabase {
  private static instance: TestDatabase;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = testPrisma;
  }

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async clean(): Promise<void> {
    // Clean all tables in the correct order (respecting foreign key constraints)
    await this.prisma.comment.deleteMany();
    await this.prisma.task.deleteMany();
    await this.prisma.project.deleteMany();
    await this.prisma.user.deleteMany();
  }

  async seed(): Promise<void> {
    // Create test users
    const user1 = await this.prisma.user.create({
      data: {
        id: "test-user-1",
        clerkId: "clerk-user-1",
        email: "test1@example.com",
        firstName: "Test",
        lastName: "User 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const user2 = await this.prisma.user.create({
      data: {
        id: "test-user-2",
        clerkId: "clerk-user-2",
        email: "test2@example.com",
        firstName: "Test",
        lastName: "User 2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create test project
    const project = await this.prisma.project.create({
      data: {
        id: "test-project-1",
        name: "Test Project",
        description: "A test project",
        ownerId: user1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create test tasks
    const task1 = await this.prisma.task.create({
      data: {
        id: "test-task-1",
        title: "Test Task 1",
        status: "TODO",
        projectId: project.id,
        assignedTo: [],
        dependencies: [],
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const task2 = await this.prisma.task.create({
      data: {
        id: "test-task-2",
        title: "Test Task 2",
        status: "IN_PROGRESS",
        projectId: project.id,
        assignedTo: [],
        dependencies: ["test-task-1"],
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create test comments
    await this.prisma.comment.create({
      data: {
        id: "test-comment-1",
        content: "Test comment 1",
        taskId: task1.id,
        authorId: user1.id,
        timestamp: new Date(),
      },
    });

    await this.prisma.comment.create({
      data: {
        id: "test-comment-2",
        content: "Test comment 2",
        taskId: task1.id,
        authorId: user2.id,
        timestamp: new Date(),
      },
    });
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }
}

// Global test setup and teardown
export const setupTestDatabase = async (): Promise<void> => {
  const db = TestDatabase.getInstance();
  await db.connect();
  await db.clean();
  await db.seed();
};

export const teardownTestDatabase = async (): Promise<void> => {
  const db = TestDatabase.getInstance();
  await db.clean();
  await db.disconnect();
};
