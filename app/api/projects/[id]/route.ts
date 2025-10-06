import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@/lib/db";
import { UpdateProjectSchema } from "@/lib/types";
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
    const project = await ProjectService.findById(id);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateProjectSchema.parse(body);

    const project = await ProjectService.update(id, validatedData);

    // Broadcast project update to WebSocket clients
    await websocketClient.broadcastProjectUpdate(project.id, {
      id: project.id,
      projectId: project.id,
      changes: validatedData,
      operationId: generateOperationId(),
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      data: project,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error updating project:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project data",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await ProjectService.delete(id);

    // Broadcast project deletion to WebSocket clients
    await websocketClient.broadcastProjectDelete(id);

    return NextResponse.json({
      success: true,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete project",
      },
      { status: 500 }
    );
  }
}
