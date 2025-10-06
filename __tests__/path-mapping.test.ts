// Test that path mapping works
import { generateId } from "@/lib/utils";

describe("Path Mapping Test", () => {
  it("should import from @/lib/utils", () => {
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});
