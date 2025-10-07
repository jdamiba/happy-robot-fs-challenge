import { NextRequest, NextResponse } from "next/server";
import { CommentService, TaskService } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { CreateCommentSchema } from "@/lib/types";
import { websocketClient } from "@/lib/websocket-client";
import { generateOperationId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     description: Retrieve all comments belonging to a specific task
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: "task_123456789"
 *     responses:
 *       200:
 *         description: List of task comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const comments = await CommentService.findByTaskId(id);

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch comments",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Create a new comment on a task
 *     description: Create a new comment on a specific task. The comment creation is broadcast to all connected clients in real-time.
 *     tags: [Comments]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: "task_123456789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *                 operationId:
 *                   type: string
 *                   example: "op_123456789"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateCommentSchema.parse({
      ...body,
      taskId: id,
      authorId: user.data!.id, // Use internal database user ID
    });

    // Generate a unique ID for the comment
    const commentData = {
      ...validatedData,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    console.log("Creating comment with data:", {
      commentId: commentData.id,
      taskId: commentData.taskId,
      authorId: commentData.authorId,
      content: commentData.content.substring(0, 50) + "...",
    });

    const comment = await CommentService.create(commentData);
    console.log("Comment created successfully:", {
      id: (comment as unknown as { id: string }).id,
      taskId: (comment as unknown as { taskId: string }).taskId,
      authorId: (comment as unknown as { authorId: string }).authorId,
    });

    // Get task to find project ID for broadcasting
    const task = await TaskService.findById(id);
    if (task) {
      // Broadcast comment creation to WebSocket clients
      console.log("Broadcasting comment creation:", {
        commentId: (comment as unknown as { id: string }).id,
        taskId: task.id,
        projectId: task.projectId,
      });

      try {
        await websocketClient.broadcastCommentCreate(
          task.projectId,
          comment,
          user.data!.id
        );
        console.log("Comment creation broadcast successful");
      } catch (broadcastError) {
        console.error("Failed to broadcast comment creation:", broadcastError);
        // Don't fail the request if broadcasting fails
      }
    } else {
      console.error("Task not found for comment broadcasting:", id);
    }

    return NextResponse.json({
      success: true,
      data: comment,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error creating comment:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid comment data",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create comment",
      },
      { status: 500 }
    );
  }
}
