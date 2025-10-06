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
      authorId: user.id, // Use internal database user ID
    });

    // Generate a unique ID for the comment
    const commentData = {
      ...validatedData,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const comment = await CommentService.create(commentData);

    // Get task to find project ID for broadcasting
    const task = await TaskService.findById(id);
    if (task) {
      // Broadcast comment creation to WebSocket clients
      console.log("Broadcasting comment creation:", {
        commentId: comment.id,
        taskId: task.id,
        projectId: task.projectId,
      });

      try {
        await websocketClient.broadcastCommentCreate(
          task.projectId,
          comment,
          user.id
        );
        console.log("Comment creation broadcast successful");
      } catch (broadcastError) {
        console.error("Failed to broadcast comment creation:", broadcastError);
      }
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
