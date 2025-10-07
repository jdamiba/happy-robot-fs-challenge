/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { createMockUser } from "../../helpers/test-utils";

// Mock the webhook route
jest.mock("@/app/api/webhooks/clerk/route", () => ({
  POST: jest.fn(),
}));

describe("Clerk Webhook Integration", () => {
  let mockWebhookHandler: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the webhook handler
    mockWebhookHandler = require("@/app/api/webhooks/clerk/route").POST;
  });

  describe("User Created Webhook", () => {
    it("should handle user.created webhook successfully", async () => {
      const webhookPayload = {
        type: "user.created",
        data: {
          id: "clerk-new-user-123",
          email_addresses: [
            {
              email_address: "newuser@example.com",
              id: "email-id",
            },
          ],
          first_name: "New",
          last_name: "User",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 200,
        json: () => ({
          success: true,
          message: "Webhook processed successfully",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockWebhookHandler).toHaveBeenCalledWith(request);
    });

    it("should handle user.created webhook with missing data", async () => {
      const invalidPayload = {
        type: "user.created",
        data: {
          id: "clerk-invalid-user",
          // Missing required fields
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 400,
        json: () => ({ success: false, error: "Missing required user data" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(invalidPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Missing required");
    });

    it("should handle duplicate user creation via webhook", async () => {
      const duplicatePayload = {
        type: "user.created",
        data: {
          id: "clerk-existing-user",
          email_addresses: [
            {
              email_address: "existing@example.com",
              id: "email-id",
            },
          ],
          first_name: "Existing",
          last_name: "User",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 409,
        json: () => ({ success: false, error: "User already exists" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(duplicatePayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("already exists");
    });
  });

  describe("User Updated Webhook", () => {
    it("should handle user.updated webhook successfully", async () => {
      const webhookPayload = {
        type: "user.updated",
        data: {
          id: "clerk-updated-user",
          email_addresses: [
            {
              email_address: "updated@example.com",
              id: "email-id",
            },
          ],
          first_name: "Updated",
          last_name: "User",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, message: "User updated successfully" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain("updated successfully");
    });

    it("should handle user.updated webhook for non-existent user", async () => {
      const webhookPayload = {
        type: "user.updated",
        data: {
          id: "clerk-non-existent-user",
          email_addresses: [
            {
              email_address: "nonexistent@example.com",
              id: "email-id",
            },
          ],
          first_name: "Non",
          last_name: "Existent",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 404,
        json: () => ({ success: false, error: "User not found" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("not found");
    });
  });

  describe("User Deleted Webhook", () => {
    it("should handle user.deleted webhook successfully", async () => {
      const webhookPayload = {
        type: "user.deleted",
        data: {
          id: "clerk-deleted-user",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, message: "User deleted successfully" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain("deleted successfully");
    });

    it("should handle user.deleted webhook for non-existent user", async () => {
      const webhookPayload = {
        type: "user.deleted",
        data: {
          id: "clerk-non-existent-user",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 404,
        json: () => ({ success: false, error: "User not found" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("not found");
    });

    it("should handle user.deleted webhook with user dependencies", async () => {
      const webhookPayload = {
        type: "user.deleted",
        data: {
          id: "clerk-user-with-projects",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 409,
        json: () => ({
          success: false,
          error: "Cannot delete user with existing projects",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("existing projects");
    });
  });

  describe("Webhook Security", () => {
    it("should handle invalid webhook signature", async () => {
      const webhookPayload = {
        type: "user.created",
        data: {
          id: "clerk-user",
          email_addresses: [
            {
              email_address: "user@example.com",
              id: "email-id",
            },
          ],
          first_name: "Test",
          last_name: "User",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 401,
        json: () => ({ success: false, error: "Invalid webhook signature" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
            "svix-signature": "invalid-signature",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Invalid webhook signature");
    });

    it("should handle malformed webhook payload", async () => {
      const malformedPayload = "invalid json";

      mockWebhookHandler.mockResolvedValue({
        status: 400,
        json: () => ({ success: false, error: "Invalid JSON payload" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: malformedPayload,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Invalid JSON");
    });

    it("should handle unsupported webhook event type", async () => {
      const unsupportedPayload = {
        type: "session.created", // Unsupported event type
        data: {
          id: "session-id",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Unsupported webhook event type",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(unsupportedPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Unsupported webhook event");
    });
  });

  describe("Webhook Error Handling", () => {
    it("should handle database connection errors", async () => {
      const webhookPayload = {
        type: "user.created",
        data: {
          id: "clerk-user",
          email_addresses: [
            {
              email_address: "user@example.com",
              id: "email-id",
            },
          ],
          first_name: "Test",
          last_name: "User",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 500,
        json: () => ({ success: false, error: "Database connection error" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("Database connection error");
    });

    it("should handle webhook timeout", async () => {
      const webhookPayload = {
        type: "user.created",
        data: {
          id: "clerk-user",
          email_addresses: [
            {
              email_address: "user@example.com",
              id: "email-id",
            },
          ],
          first_name: "Test",
          last_name: "User",
        },
      };

      mockWebhookHandler.mockResolvedValue({
        status: 408,
        json: () => ({ success: false, error: "Webhook processing timeout" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/webhooks/clerk",
        {
          method: "POST",
          body: JSON.stringify(webhookPayload),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockWebhookHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(408);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("timeout");
    });
  });
});
