import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  // Get the user from our database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    // If user doesn't exist, create them
    // This should normally be handled by the Clerk webhook, but we'll create them here as a fallback
    user = await prisma.user.create({
      data: {
        id: `user-${clerkUserId}`, // Generate a unique ID
        clerkId: clerkUserId,
        email: `user-${clerkUserId}@example.com`, // Placeholder email
        firstName: "User",
        lastName: "Name",
        updatedAt: new Date(),
      },
    });
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
