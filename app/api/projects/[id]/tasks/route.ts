import { NextRequest, NextResponse } from "next/server";
import { TaskService, ProjectService } from "@/lib/db";
import { CreateTaskSchema } from "@/lib/types";
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
    const tasks = await TaskService.findByProjectId(id);

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tasks",
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

    // Verify user owns the project
    const project = await ProjectService.findById(id);
    if (!project || project.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = CreateTaskSchema.parse({
      ...body,
      projectId: id,
    });

    // Generate a unique ID for the task and add required fields
    const taskData = {
      ...validatedData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      updatedAt: new Date(),
    };

    const task = await TaskService.create(taskData);

    // Broadcast task creation to WebSocket clients
    await websocketClient.broadcastTaskCreate(id, task);

    return NextResponse.json({
      success: true,
      data: task,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error creating task:", error);

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
        error: "Failed to create task",
      },
      { status: 500 }
    );
  }
}
