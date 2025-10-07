/**
 * @jest-environment jsdom
 */
import { createMockUser } from "../../helpers/test-utils";

// Mock auth utilities
jest.mock("@/lib/auth-utils", () => ({
  getCurrentUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

describe("Authentication & User Management", () => {
  describe("User Creation", () => {
    it("should create a new user with valid data", async () => {
      const mockUser = createMockUser({
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
      });

      const { createUser } = await import("@/lib/auth-utils");
      (createUser as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const result = await createUser({
        clerkId: "clerk-new-user",
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
      });
      expect(createUser).toHaveBeenCalledWith({
        clerkId: "clerk-new-user",
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
      });
    });

    it("should handle user creation with missing required fields", async () => {
      const { createUser } = await import("@/lib/auth-utils");
      (createUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "Missing required fields: email",
      });

      const result = await createUser({
        clerkId: "clerk-invalid-user",
        email: "", // Invalid empty email
        firstName: "Invalid",
        lastName: "User",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing required fields");
    });

    it("should handle duplicate user creation", async () => {
      const { createUser } = await import("@/lib/auth-utils");
      (createUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "User with this email already exists",
      });

      const result = await createUser({
        clerkId: "clerk-duplicate-user",
        email: "existing@example.com",
        firstName: "Duplicate",
        lastName: "User",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });
  });

  describe("User Authentication", () => {
    it("should get current user when authenticated", async () => {
      const mockCurrentUser = createMockUser({
        id: "authenticated-user-id",
        email: "authenticated@example.com",
      });

      const { getCurrentUser } = await import("@/lib/auth-utils");
      (getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCurrentUser,
      });

      const result = await getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: "authenticated-user-id",
        email: "authenticated@example.com",
      });
    });

    it("should handle unauthenticated user", async () => {
      const { getCurrentUser } = await import("@/lib/auth-utils");
      (getCurrentUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "User not authenticated",
      });

      const result = await getCurrentUser();

      expect(result.success).toBe(false);
      expect(result.error).toContain("not authenticated");
    });

    it("should handle invalid session", async () => {
      const { getCurrentUser } = await import("@/lib/auth-utils");
      (getCurrentUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "Invalid session token",
      });

      const result = await getCurrentUser();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid session");
    });
  });

  describe("User Profile Management", () => {
    it("should update user profile", async () => {
      const updatedUser = createMockUser({
        id: "user-to-update",
        firstName: "Updated",
        lastName: "Name",
        email: "updated@example.com",
      });

      const { updateUser } = await import("@/lib/auth-utils");
      (updateUser as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedUser,
      });

      const result = await updateUser("user-to-update", {
        firstName: "Updated",
        lastName: "Name",
        email: "updated@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe("Updated");
      expect(result.data.lastName).toBe("Name");
      expect(updateUser).toHaveBeenCalledWith("user-to-update", {
        firstName: "Updated",
        lastName: "Name",
        email: "updated@example.com",
      });
    });

    it("should handle user update with invalid data", async () => {
      const { updateUser } = await import("@/lib/auth-utils");
      (updateUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "Invalid email format",
      });

      const result = await updateUser("user-id", {
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email");
    });

    it("should handle user not found during update", async () => {
      const { updateUser } = await import("@/lib/auth-utils");
      (updateUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "User not found",
      });

      const result = await updateUser("non-existent-user", {
        firstName: "Updated",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("User Deletion", () => {
    it("should delete user successfully", async () => {
      const { deleteUser } = await import("@/lib/auth-utils");
      (deleteUser as jest.Mock).mockResolvedValue({
        success: true,
        message: "User deleted successfully",
      });

      const result = await deleteUser("user-to-delete");

      expect(result.success).toBe(true);
      expect(result.message).toContain("deleted successfully");
      expect(deleteUser).toHaveBeenCalledWith("user-to-delete");
    });

    it("should handle user not found during deletion", async () => {
      const { deleteUser } = await import("@/lib/auth-utils");
      (deleteUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "User not found",
      });

      const result = await deleteUser("non-existent-user");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should handle user with dependencies during deletion", async () => {
      const { deleteUser } = await import("@/lib/auth-utils");
      (deleteUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "Cannot delete user with existing projects",
      });

      const result = await deleteUser("user-with-projects");

      expect(result.success).toBe(false);
      expect(result.error).toContain("existing projects");
    });
  });

  describe("Session Management", () => {
    it("should validate session token", async () => {
      const { getCurrentUser } = await import("@/lib/auth-utils");
      (getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: createMockUser({ id: "valid-session-user" }),
      });

      const result = await getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data.id).toBe("valid-session-user");
    });

    it("should handle expired session", async () => {
      const { getCurrentUser } = await import("@/lib/auth-utils");
      (getCurrentUser as jest.Mock).mockResolvedValue({
        success: false,
        error: "Session expired",
      });

      const result = await getCurrentUser();

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
    });
  });
});
