import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";

/**
 * @swagger
 * /api/user/current:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Internal user ID
 *                       example: "user_123456789"
 *                     clerkId:
 *                       type: string
 *                       description: Clerk user ID
 *                       example: "user_2abc123def456"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.doe@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
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

    return NextResponse.json({
      success: true,
      data: {
        id: user.data!.id,
        clerkId: user.data!.clerkId,
        email: user.data!.email,
        firstName: user.data!.firstName,
        lastName: user.data!.lastName,
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user information",
      },
      { status: 500 }
    );
  }
}
