import "@testing-library/jest-dom";

// Setup test environment
const setupTestEnvironment = () => {
  // Set test environment variables (these will be overridden by jest.env.js)
  process.env.NODE_ENV = "test";
  process.env.TEST_DATABASE_URL =
    "postgresql://happyrobot_test:happyrobot_test123@localhost:5433/happyrobot_test";
  process.env.DATABASE_URL =
    "postgresql://happyrobot_test:happyrobot_test123@localhost:5433/happyrobot_test";
  process.env.NEXT_PUBLIC_WS_URL = "ws://localhost:8080";
  process.env.WEBSOCKET_SERVER_URL = "http://localhost:8080";

  // Mock console methods to reduce noise in tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args) => {
    // Only log errors that are not from our test environment
    if (
      !args[0]?.includes?.("Warning: ReactDOM.render is no longer supported")
    ) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args) => {
    // Only log warnings that are not from our test environment
    if (
      !args[0]?.includes?.("Warning: ReactDOM.render is no longer supported")
    ) {
      originalConsoleWarn(...args);
    }
  };
};

setupTestEnvironment();

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
      fullName: "Test User",
      primaryEmailAddress: {
        emailAddress: "test@example.com",
      },
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  UserButton: () => <div data-testid="user-button">User Button</div>,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "test-user-id",
  }),
  clerkMiddleware: jest.fn(),
  createRouteMatcher: jest.fn(),
}));

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data) => ({ json: () => data })),
    redirect: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock WebSocket for client-side tests
global.WebSocket = class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;

    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 100);
  }

  send(data) {
    // Mock send implementation
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
};

global.WebSocket.CONNECTING = 0;
global.WebSocket.OPEN = 1;
global.WebSocket.CLOSING = 2;
global.WebSocket.CLOSED = 3;

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock TextEncoder/TextDecoder for Node.js environment
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock TransformStream for Node.js environment
global.TransformStream = class MockTransformStream {
  constructor() {
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
  }
};

// Mock ReadableStream and WritableStream
global.ReadableStream = class MockReadableStream {
  constructor() {}
};

global.WritableStream = class MockWritableStream {
  constructor() {}
};

// Mock Request/Response for API tests
global.Request = class MockRequest {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || "GET";
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }

  json = jest.fn().mockResolvedValue({});
};

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || "OK";
    this.headers = new Headers(init?.headers);
  }

  json = jest.fn().mockResolvedValue({});
};

// Mock Headers for Node.js environment
global.Headers = class MockHeaders {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }

  get(name) {
    return this.headers.get(name.toLowerCase());
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.headers.has(name.toLowerCase());
  }

  delete(name) {
    this.headers.delete(name.toLowerCase());
  }

  entries() {
    return this.headers.entries();
  }

  keys() {
    return this.headers.keys();
  }

  values() {
    return this.headers.values();
  }
};

// Mock navigator for @testing-library/user-event (must be done early)
global.navigator = {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(""),
  },
  userAgent: "Mozilla/5.0 (compatible; Test Environment)",
  platform: "Test",
};

// Mock window for @testing-library/user-event
global.window = {
  navigator: global.navigator,
  document: {
    createElement: jest.fn(() => ({
      style: {},
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
  },
};

// Mock @testing-library/user-event to prevent navigator issues
jest.mock("@testing-library/user-event", () => {
  // Return a minimal mock that doesn't cause navigator issues
  return {
    default: {
      setup: jest.fn(() => ({
        click: jest.fn().mockResolvedValue(undefined),
        type: jest.fn().mockResolvedValue(undefined),
        selectOptions: jest.fn().mockResolvedValue(undefined),
        clear: jest.fn().mockResolvedValue(undefined),
        upload: jest.fn().mockResolvedValue(undefined),
        hover: jest.fn().mockResolvedValue(undefined),
        unhover: jest.fn().mockResolvedValue(undefined),
        tab: jest.fn().mockResolvedValue(undefined),
        keyboard: jest.fn().mockResolvedValue(undefined),
      })),
      click: jest.fn().mockResolvedValue(undefined),
      type: jest.fn().mockResolvedValue(undefined),
      selectOptions: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      upload: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn().mockResolvedValue(undefined),
      unhover: jest.fn().mockResolvedValue(undefined),
      tab: jest.fn().mockResolvedValue(undefined),
      keyboard: jest.fn().mockResolvedValue(undefined),
    },
  };
});
