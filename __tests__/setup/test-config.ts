// Test configuration for different test types

export const TEST_CONFIG = {
  // Database configuration
  database: {
    url: process.env.TEST_DATABASE_URL || "file:./test.db",
    resetBetweenTests: true,
    seedData: true,
  },

  // WebSocket configuration
  websocket: {
    url: "ws://localhost:3001/ws",
    timeout: 5000,
    reconnectAttempts: 3,
  },

  // API configuration
  api: {
    baseUrl: "http://localhost:3000/api",
    timeout: 10000,
    retryAttempts: 3,
  },

  // Test data
  testData: {
    users: {
      user1: {
        id: "test-user-1",
        clerkId: "clerk-user-1",
        email: "test1@example.com",
        firstName: "Test",
        lastName: "User 1",
      },
      user2: {
        id: "test-user-2",
        clerkId: "clerk-user-2",
        email: "test2@example.com",
        firstName: "Test",
        lastName: "User 2",
      },
    },
    projects: {
      project1: {
        id: "test-project-1",
        title: "Test Project 1",
        description: "A test project for testing",
        ownerId: "test-user-1",
      },
    },
    tasks: {
      task1: {
        id: "test-task-1",
        title: "Test Task 1",
        description: "A test task for testing",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "test-project-1",
        assignedTo: [],
        dependencies: [],
        configuration: {},
      },
      task2: {
        id: "test-task-2",
        title: "Test Task 2",
        description: "Another test task",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: "test-project-1",
        assignedTo: [],
        dependencies: ["test-task-1"],
        configuration: {},
      },
    },
    comments: {
      comment1: {
        id: "test-comment-1",
        content: "Test comment 1",
        taskId: "test-task-1",
        authorId: "test-user-1",
      },
    },
  },

  // Test timeouts
  timeouts: {
    unit: 5000,
    integration: 10000,
    e2e: 30000,
    websocket: 5000,
  },

  // Mock configurations
  mocks: {
    api: {
      delay: 100, // Simulate network delay
      errorRate: 0, // Percentage of requests that should fail
    },
    websocket: {
      connectionDelay: 100,
      messageDelay: 50,
    },
  },
};

// Test categories
export const TEST_CATEGORIES = {
  UNIT: "unit",
  INTEGRATION: "integration",
  E2E: "e2e",
  WEBSOCKET: "websocket",
} as const;

// Test tags for filtering
export const TEST_TAGS = {
  FAST: "fast",
  SLOW: "slow",
  DATABASE: "database",
  API: "api",
  WEBSOCKET: "websocket",
  UI: "ui",
  AUTH: "auth",
  CRUD: "crud",
  REAL_TIME: "real-time",
} as const;

// Helper function to create test data
export const createTestData = (type: keyof typeof TEST_CONFIG.testData) => {
  return { ...TEST_CONFIG.testData[type] };
};

// Helper function to get test timeout
export const getTestTimeout = (category: keyof typeof TEST_CONFIG.timeouts) => {
  return TEST_CONFIG.timeouts[category];
};
