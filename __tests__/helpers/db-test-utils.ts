/**
 * Database test utilities - no React dependencies
 */

export interface MockUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockProject {
  id: string;
  name: string;
  description?: string;
  metadata?: any;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTask {
  id: string;
  projectId: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED";
  assignedTo: string[];
  configuration: any;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MockComment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  timestamp: Date;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const now = new Date();
  return {
    id: "test-user-" + Math.random().toString(36).substr(2, 9),
    clerkId: "clerk-" + Math.random().toString(36).substr(2, 9),
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    imageUrl: "https://example.com/avatar.jpg",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockProject(
  overrides: Partial<MockProject> = {}
): MockProject {
  const now = new Date();
  return {
    id: "test-project-" + Math.random().toString(36).substr(2, 9),
    name: "Test Project",
    description: "A test project",
    metadata: {},
    ownerId: "test-user-1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockTask(overrides: Partial<MockTask> = {}): MockTask {
  const now = new Date();
  return {
    id: "test-task-" + Math.random().toString(36).substr(2, 9),
    projectId: "test-project-1",
    title: "Test Task",
    status: "TODO",
    assignedTo: [],
    configuration: {},
    dependencies: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockComment(
  overrides: Partial<MockComment> = {}
): MockComment {
  const now = new Date();
  return {
    id: "test-comment-" + Math.random().toString(36).substr(2, 9),
    taskId: "test-task-1",
    content: "Test comment content",
    authorId: "test-user-1",
    timestamp: now,
    ...overrides,
  };
}
