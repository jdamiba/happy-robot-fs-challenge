import { NextRequest, NextResponse } from "next/server";
import { CommentService, TaskService } from "@/lib/db";
import { UpdateCommentSchema } from "@/lib/types";
import { websocketClient } from "@/lib/websocket-client";
import { generateOperationId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateCommentSchema.parse(body);

    const comment = await CommentService.update(id, validatedData);

    // Get task to find project ID for broadcasting
    const task = await TaskService.findById(comment.taskId);
    if (task) {
      // Broadcast comment update to WebSocket clients
      await websocketClient.broadcastCommentUpdate(task.projectId, {
        id: comment.id,
        taskId: comment.taskId,
        changes: validatedData,
        operationId: generateOperationId(),
        timestamp: Date.now(),
      });
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await CommentService.delete(id);

    // Get task to find project ID for broadcasting
    const task = await TaskService.findById(comment.taskId);
    if (task) {
      // Broadcast comment deletion to WebSocket clients
      await websocketClient.broadcastCommentDelete(task.projectId, comment.id);
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
