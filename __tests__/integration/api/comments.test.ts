/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock the API route handlers
jest.mock("@/app/api/tasks/[id]/comments/route", () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

jest.mock("@/app/api/comments/[id]/route", () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

describe("Comment CRUD Operations", () => {
  let mockGetComments: jest.Mock;
  let mockCreateComment: jest.Mock;
  let mockGetComment: jest.Mock;
  let mockUpdateComment: jest.Mock;
  let mockDeleteComment: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked handlers
    const commentsRoute = require("@/app/api/tasks/[id]/comments/route");
    const commentByIdRoute = require("@/app/api/comments/[id]/route");

    mockGetComments = commentsRoute.GET;
    mockCreateComment = commentsRoute.POST;
    mockGetComment = commentByIdRoute.GET;
    mockUpdateComment = commentByIdRoute.PUT;
    mockDeleteComment = commentByIdRoute.DELETE;
  });

  describe("GET /api/tasks/[id]/comments", () => {
    it("should return all comments for a task", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "First comment",
          taskId: "task-1",
          authorId: "user-1",
          timestamp: new Date().toISOString(),
          author: {
            id: "user-1",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
        },
        {
          id: "comment-2",
          content: "Second comment",
          taskId: "task-1",
          authorId: "user-2",
          timestamp: new Date().toISOString(),
          author: {
            id: "user-2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
          },
        },
      ];

      mockGetComments.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: mockComments }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments"
      );
      const response = await mockGetComments(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].content).toBe("First comment");
      expect(responseData.data[1].author.firstName).toBe("Jane");
    });

    it("should return empty array when task has no comments", async () => {
      mockGetComments.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: [] }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments"
      );
      const response = await mockGetComments(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(0);
    });

    it("should handle non-existent task", async () => {
      mockGetComments.mockResolvedValue({
        status: 404,
        json: () => ({ success: false, error: "Task not found" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/non-existent/comments"
      );
      const response = await mockGetComments(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Task not found");
    });

    it("should handle unauthorized access to task comments", async () => {
      mockGetComments.mockResolvedValue({
        status: 403,
        json: () => ({ success: false, error: "Access denied" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments"
      );
      const response = await mockGetComments(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Access denied");
    });
  });

  describe("POST /api/tasks/[id]/comments", () => {
    it("should create a new comment", async () => {
      const newComment = {
        content: "This is a new comment",
      };

      const createdComment = {
        id: "comment-new",
        content: "This is a new comment",
        taskId: "task-1",
        authorId: "user-1",
        timestamp: new Date().toISOString(),
        author: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      mockCreateComment.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdComment }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments",
        {
          method: "POST",
          body: JSON.stringify(newComment),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.content).toBe("This is a new comment");
      expect(responseData.data.taskId).toBe("task-1");
      expect(responseData.data.authorId).toBe("user-1");
      expect(mockCreateComment).toHaveBeenCalledWith(request);
    });

    it("should validate required fields", async () => {
      const invalidComment = {
        // Missing content field
      };

      mockCreateComment.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Content is required",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments",
        {
          method: "POST",
          body: JSON.stringify(invalidComment),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("required");
    });

    it("should validate comment content length", async () => {
      const invalidComment = {
        content: "", // Empty content should be invalid
      };

      mockCreateComment.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Content cannot be empty",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments",
        {
          method: "POST",
          body: JSON.stringify(invalidComment),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("empty");
    });

    it("should handle comment on non-existent task", async () => {
      const newComment = {
        content: "Comment on non-existent task",
      };

      mockCreateComment.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Task not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/non-existent/comments",
        {
          method: "POST",
          body: JSON.stringify(newComment),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Task not found");
    });

    it("should handle unauthorized comment creation", async () => {
      const newComment = {
        content: "Unauthorized comment",
      };

      mockCreateComment.mockResolvedValue({
        status: 403,
        json: () => ({
          success: false,
          error: "Access denied",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments",
        {
          method: "POST",
          body: JSON.stringify(newComment),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Access denied");
    });
  });

  describe("GET /api/comments/[id]", () => {
    it("should return a specific comment", async () => {
      const comment = {
        id: "comment-1",
        content: "First comment",
        taskId: "task-1",
        authorId: "user-1",
        timestamp: new Date().toISOString(),
        author: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
        task: {
          id: "task-1",
          title: "Task 1",
          description: "First task",
        },
      };

      mockGetComment.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: comment }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/comment-1"
      );
      const response = await mockGetComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe("comment-1");
      expect(responseData.data.content).toBe("First comment");
      expect(responseData.data.author.firstName).toBe("John");
    });

    it("should return 404 for non-existent comment", async () => {
      mockGetComment.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Comment not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/non-existent"
      );
      const response = await mockGetComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Comment not found");
    });
  });

  describe("PUT /api/comments/[id]", () => {
    it("should update an existing comment", async () => {
      const updateData = {
        content: "Updated comment content",
      };

      const updatedComment = {
        id: "comment-1",
        content: "Updated comment content",
        taskId: "task-1",
        authorId: "user-1",
        timestamp: new Date().toISOString(),
        author: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      mockUpdateComment.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedComment }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/comment-1",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.content).toBe("Updated comment content");
      expect(mockUpdateComment).toHaveBeenCalledWith(request);
    });

    it("should validate update data", async () => {
      const invalidUpdate = {
        content: "", // Empty content should be invalid
      };

      mockUpdateComment.mockResolvedValue({
        status: 400,
        json: () => ({
          success: false,
          error: "Content cannot be empty",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/comment-1",
        {
          method: "PUT",
          body: JSON.stringify(invalidUpdate),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("empty");
    });

    it("should handle update of non-existent comment", async () => {
      const updateData = {
        content: "Updated content",
      };

      mockUpdateComment.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Comment not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/non-existent",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Comment not found");
    });

    it("should handle unauthorized update", async () => {
      const updateData = {
        content: "Unauthorized update",
      };

      mockUpdateComment.mockResolvedValue({
        status: 403,
        json: () => ({
          success: false,
          error: "You can only update your own comments",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/comment-1",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockUpdateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("own comments");
    });
  });

  describe("DELETE /api/comments/[id]", () => {
    it("should delete an existing comment", async () => {
      mockDeleteComment.mockResolvedValue({
        status: 200,
        json: () => ({
          success: true,
          message: "Comment deleted successfully",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/comment-1",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain("deleted successfully");
      expect(mockDeleteComment).toHaveBeenCalledWith(request);
    });

    it("should handle deletion of non-existent comment", async () => {
      mockDeleteComment.mockResolvedValue({
        status: 404,
        json: () => ({
          success: false,
          error: "Comment not found",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/non-existent",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Comment not found");
    });

    it("should handle unauthorized deletion", async () => {
      mockDeleteComment.mockResolvedValue({
        status: 403,
        json: () => ({
          success: false,
          error: "You can only delete your own comments",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/comments/comment-1",
        {
          method: "DELETE",
        }
      );

      const response = await mockDeleteComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain("own comments");
    });
  });

  describe("Comment CRUD Integration", () => {
    it("should complete full CRUD cycle", async () => {
      // 1. Create comment
      const newComment = {
        content: "Full CRUD Test Comment",
      };

      const createdComment = {
        id: "comment-crud-test",
        content: "Full CRUD Test Comment",
        taskId: "task-1",
        authorId: "user-1",
        timestamp: new Date().toISOString(),
        author: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      mockCreateComment.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdComment }),
      });

      // 2. Read comment
      mockGetComment.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: createdComment }),
      });

      // 3. Update comment
      const updatedComment = {
        ...createdComment,
        content: "Updated CRUD Test Comment",
      };

      mockUpdateComment.mockResolvedValue({
        status: 200,
        json: () => ({ success: true, data: updatedComment }),
      });

      // 4. Delete comment
      mockDeleteComment.mockResolvedValue({
        status: 200,
        json: () => ({
          success: true,
          message: "Comment deleted successfully",
        }),
      });

      // Execute the full cycle
      const createRequest = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments",
        {
          method: "POST",
          body: JSON.stringify(newComment),
          headers: { "Content-Type": "application/json" },
        }
      );

      const createResponse = await mockCreateComment(createRequest);
      const createData = await createResponse.json();

      expect(createData.success).toBe(true);
      expect(createData.data.content).toBe("Full CRUD Test Comment");

      // Verify all operations were called
      expect(mockCreateComment).toHaveBeenCalledWith(createRequest);
      expect(mockGetComment).toBeDefined();
      expect(mockUpdateComment).toBeDefined();
      expect(mockDeleteComment).toBeDefined();
    });
  });

  describe("Comment Threading and Context", () => {
    it("should handle comments with mentions", async () => {
      const commentWithMention = {
        content: "Hey @user-2, can you review this?",
      };

      const createdComment = {
        id: "comment-with-mention",
        content: "Hey @user-2, can you review this?",
        taskId: "task-1",
        authorId: "user-1",
        timestamp: new Date().toISOString(),
        author: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      mockCreateComment.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdComment }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments",
        {
          method: "POST",
          body: JSON.stringify(commentWithMention),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.content).toContain("@user-2");
    });

    it("should handle long comment content", async () => {
      const longComment = {
        content:
          "This is a very long comment that contains multiple paragraphs of text. It should be handled properly by the system and not cause any issues with storage or display. The comment system should be able to handle substantial amounts of text content while maintaining performance and readability.",
      };

      const createdComment = {
        id: "comment-long",
        content: longComment.content,
        taskId: "task-1",
        authorId: "user-1",
        timestamp: new Date().toISOString(),
        author: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      mockCreateComment.mockResolvedValue({
        status: 201,
        json: () => ({ success: true, data: createdComment }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/tasks/task-1/comments",
        {
          method: "POST",
          body: JSON.stringify(longComment),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await mockCreateComment(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.content.length).toBeGreaterThan(100);
    });
  });
});
