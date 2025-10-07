import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { generateId } from "./utils";

export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch {
    return { success: false, error: "Failed to get current user" };
  }
}

export async function createUser(userData: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  try {
    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName) {
      return {
        success: false,
        error: "Missing required fields: email, firstName, lastName",
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkId: userData.clerkId }, { email: userData.email }],
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this email or Clerk ID already exists",
      };
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        id: generateId(),
        clerkId: userData.clerkId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true, data: user };
  } catch {
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(
  userId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }
) {
  try {
    // Validate email format if provided
    if (updateData.email && !updateData.email.includes("@")) {
      return { success: false, error: "Invalid email format" };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return { success: true, data: updatedUser };
  } catch {
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(userId: string) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: true,
      },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user has dependencies
    if (existingUser.projects.length > 0) {
      return {
        success: false,
        error: "Cannot delete user with existing projects",
      };
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true, message: "User deleted successfully" };
  } catch {
    return { success: false, error: "Failed to delete user" };
  }
}

export async function requireAuth() {
  const result = await getCurrentUser();

  if (!result.success) {
    throw new Error("Unauthorized");
  }

  return result.data;
}
