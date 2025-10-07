import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@/lib/db";
import { CreateProjectSchema } from "@/lib/types";
import { websocketClient } from "@/lib/websocket-client";
import { generateOperationId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth-utils";

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for the current user
 *     description: Retrieve all projects owned by the authenticated user
 *     tags: [Projects]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of user's projects
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
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projects = await ProjectService.findByOwnerId(user.id);
    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       200:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
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
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateProjectSchema.parse({
      ...body,
      ownerId: user.id, // Use our internal user ID
    });

    // Generate a unique ID for the project
    const projectData = {
      ...validatedData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      updatedAt: new Date(),
    };

    const project = await ProjectService.create(projectData);

    // Broadcast project creation to WebSocket clients
    await websocketClient.broadcastProjectUpdate(project.id, {
      type: "PROJECT_CREATE",
      payload: project,
      operationId: generateOperationId(),
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      data: project,
      operationId: generateOperationId(),
    });
  } catch (error) {
    console.error("Error creating project:", error);

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
        error: "Failed to create project",
      },
      { status: 500 }
    );
  }
}
