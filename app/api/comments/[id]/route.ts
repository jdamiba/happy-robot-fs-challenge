import { NextRequest, NextResponse } from "next/server";
import { CommentService, TaskService } from "@/lib/db";
import { UpdateCommentSchema } from "@/lib/types";
import { websocketClient } from "@/lib/websocket-client";
import { generateOperationId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get a specific comment by ID
 *     description: Retrieve a comment by its ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: "comment_123456789"
 *     responses:
 *       200:
 *         description: Comment details
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const comment = await CommentService.findById(id);

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          error: "Comment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch comment",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     description: Update an existing comment. Changes are broadcast to all connected clients in real-time.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: "comment_123456789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment updated successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateCommentSchema.parse(body);

    const comment = await CommentService.update(id, validatedData);

    // Get task to find project ID for broadcasting
    // The comment should have taskId, but we need to handle the type properly
    const taskId =
      (comment as { taskId?: string; task?: { id: string } }).taskId ||
      (comment as { taskId?: string; task?: { id: string } }).task?.id;
    const task = taskId ? await TaskService.findById(taskId) : null;
    if (task) {
      // Broadcast comment update to WebSocket clients
      console.log("Broadcasting comment update:", {
        commentId: (comment as unknown as { id: string }).id,
        taskId: taskId,
        projectId: task.projectId,
        changes: validatedData,
      });

      try {
        // Get the current user for broadcasting
        const user = await getCurrentUser();

        await websocketClient.broadcastCommentUpdate(
          task.projectId,
          {
            id: (comment as unknown as { id: string }).id,
            taskId: (comment as unknown as { taskId: string }).taskId,
            changes: validatedData,
            operationId: generateOperationId(),
            timestamp: Date.now(),
          },
          user?.data?.id
        );
        console.log("Comment update broadcast successful");
      } catch (broadcastError) {
        console.error("Failed to broadcast comment update:", broadcastError);
      }
    }

    return NextResponse.json({
      success: true,
      data: comment,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error updating comment:", error);

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
        error: "Failed to update comment",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Delete a comment. The deletion is broadcast to all connected clients in real-time.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: "comment_123456789"
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 operationId:
 *                   type: string
 *                   example: "op_123456789"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log("DELETE comment request:", { commentId: id });

    const comment = await CommentService.findById(id);
    console.log(
      "Comment found:",
      comment
        ? {
            id: (comment as unknown as { id: string }).id,
            taskId: (comment as unknown as { taskId: string }).taskId,
          }
        : null
    );

    if (!comment) {
      console.log("Comment not found for deletion:", id);
      return NextResponse.json(
        {
          success: false,
          error: "Comment not found",
        },
        { status: 404 }
      );
    }

    await CommentService.delete(id);

    // Get task to find project ID for broadcasting
    const task = await TaskService.findById(
      (comment as unknown as { taskId: string }).taskId
    );
    if (task) {
      // Broadcast comment deletion to WebSocket clients
      console.log("Broadcasting comment deletion:", {
        commentId: (comment as unknown as { id: string }).id,
        taskId: (comment as unknown as { taskId: string }).taskId,
        projectId: task.projectId,
      });

      try {
        // Get the current user for broadcasting
        const user = await getCurrentUser();

        await websocketClient.broadcastCommentDelete(
          task.projectId,
          (comment as unknown as { id: string }).id,
          user?.data?.id
        );
        console.log("Comment deletion broadcast successful");
      } catch (broadcastError) {
        console.error("Failed to broadcast comment deletion:", broadcastError);
      }
    }

    return NextResponse.json({
      success: true,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete comment",
      },
      { status: 500 }
    );
  }
}
