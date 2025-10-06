import { NextRequest } from "next/server";

// Simple test without complex mocking
describe("Basic API Tests", () => {
  it("should create a NextRequest", () => {
    const request = new NextRequest("http://localhost:3000/api/test");
    expect(request).toBeDefined();
    expect(request.url).toBe("http://localhost:3000/api/test");
  });

  it("should handle JSON parsing", () => {
    const jsonData = { name: "Test Project", description: "Test Description" };
    const jsonString = JSON.stringify(jsonData);
    const parsed = JSON.parse(jsonString);

    expect(parsed.name).toBe("Test Project");
    expect(parsed.description).toBe("Test Description");
  });
});
