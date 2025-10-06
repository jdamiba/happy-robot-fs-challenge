import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/db";
import { UpdateTaskSchema } from "@/lib/types";
import { websocketClient } from "@/lib/websocket-client";
import { generateOperationId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const task = await TaskService.findById(id);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch task",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateTaskSchema.parse(body);

    const task = await TaskService.update(id, validatedData);

    // Broadcast task update to WebSocket clients
    console.log("Broadcasting task update:", {
      taskId: task.id,
      projectId: task.projectId,
      changes: validatedData,
    });

    try {
      // Get the current user for broadcasting
      const user = await getCurrentUser();

      await websocketClient.broadcastTaskUpdate(
        task.projectId,
        {
          id: task.id,
          projectId: task.projectId,
          changes: validatedData,
          operationId: generateOperationId(),
          timestamp: Date.now(),
        },
        user?.id
      );
      console.log("Task update broadcast successful");
    } catch (broadcastError) {
      console.error("Failed to broadcast task update:", broadcastError);
    }

    return NextResponse.json({
      success: true,
      data: task,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error updating task:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid task data",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update task",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const task = await TaskService.findById(id);
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    await TaskService.delete(id);

    // Get the current user for broadcasting
    const user = await getCurrentUser();

    // Broadcast task deletion to WebSocket clients
    await websocketClient.broadcastTaskDelete(task.projectId, id, user?.id);

    return NextResponse.json({
      success: true,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete task",
      },
      { status: 500 }
    );
  }
}
