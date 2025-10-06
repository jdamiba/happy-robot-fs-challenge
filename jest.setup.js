import "@testing-library/jest-dom";

// Polyfill for Web APIs
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Request and Response APIs
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || "GET";
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
  }
};

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
};

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
      id: "user_123",
      firstName: "Test",
      lastName: "User",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  UserButton: () => "User Button",
  ClerkProvider: ({ children }) => children,
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => null,
}));

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }

  send = jest.fn();
  close = jest.fn();

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
};

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning:") || args[0].includes("Error:"))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
console.warn = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("Warning:")) {
    return;
  }
  originalWarn.call(console, ...args);
};
