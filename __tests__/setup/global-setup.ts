// Global test setup
export const globalSetup = async (): Promise<void> => {
  // Start MSW server (imported dynamically to avoid circular dependencies)
  const { server } = await import("./msw");
  server.listen({
    onUnhandledRequest: "warn",
  });

  // Setup test database
  const { setupTestDatabase } = await import("./test-db");
  await setupTestDatabase();
};

// Global test teardown
export const globalTeardown = async (): Promise<void> => {
  // Stop MSW server
  const { server } = await import("./msw");
  server.close();

  // Cleanup test database
  const { teardownTestDatabase } = await import("./test-db");
  await teardownTestDatabase();
};

// Test environment setup
export const setupTestEnvironment = (): void => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.TEST_DATABASE_URL = "file:./test.db";
  process.env.NEXT_PUBLIC_WS_URL = "ws://localhost:3001/ws";
  process.env.WEBSOCKET_SERVER_URL = "http://localhost:3001";

  // Mock console methods to reduce noise in tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args: any[]) => {
    // Only log errors that are not from our test environment
    if (
      !args[0]?.includes?.("Warning: ReactDOM.render is no longer supported")
    ) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args: any[]) => {
    // Only log warnings that are not from our test environment
    if (
      !args[0]?.includes?.("Warning: ReactDOM.render is no longer supported")
    ) {
      originalConsoleWarn(...args);
    }
  };
};
