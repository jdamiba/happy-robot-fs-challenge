import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// Clerk webhook events we want to handle
const WEBHOOK_EVENTS = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
} as const;

type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  created_at: number;
  updated_at: number;
}

interface WebhookPayload {
  type: WebhookEvent;
  data: ClerkUser;
}

export async function POST(request: NextRequest) {
  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Missing svix headers" },
        { status: 400 }
      );
    }

    // Get the body
    const payload = await request.text();
    const body = JSON.parse(payload) as WebhookPayload;

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

    let evt: WebhookPayload;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookPayload;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // Handle the webhook
    const { type, data } = evt;

    switch (type) {
      case WEBHOOK_EVENTS.USER_CREATED:
        await handleUserCreated(data);
        break;
      case WEBHOOK_EVENTS.USER_UPDATED:
        await handleUserUpdated(data);
        break;
      case WEBHOOK_EVENTS.USER_DELETED:
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleUserCreated(user: ClerkUser) {
  try {
    const primaryEmail = user.email_addresses.find(
      (email) => email.id === user.email_addresses[0]?.id
    )?.email_address;

    if (!primaryEmail) {
      console.error("No primary email found for user:", user.id);
      return;
    }

    // Create user in our database
    await prisma.user.create({
      data: {
        id: `user-${user.id}`, // Generate a unique ID
        clerkId: user.id,
        email: primaryEmail,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        imageUrl: user.image_url || null,
        updatedAt: new Date(),
      },
    });

    console.log(`User created: ${user.id} (${primaryEmail})`);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function handleUserUpdated(user: ClerkUser) {
  try {
    const primaryEmail = user.email_addresses.find(
      (email) => email.id === user.email_addresses[0]?.id
    )?.email_address;

    if (!primaryEmail) {
      console.error("No primary email found for user:", user.id);
      return;
    }

    // Update user in our database
    await prisma.user.update({
      where: {
        clerkId: user.id,
      },
      data: {
        email: primaryEmail,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        imageUrl: user.image_url || null,
        updatedAt: new Date(),
      },
    });

    console.log(`User updated: ${user.id} (${primaryEmail})`);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

async function handleUserDeleted(user: ClerkUser) {
  try {
    // Delete user from our database
    // Note: This will cascade delete related projects, tasks, and comments
    // due to the onDelete: Cascade in our Prisma schema
    await prisma.user.delete({
      where: {
        clerkId: user.id,
      },
    });

    console.log(`User deleted: ${user.id}`);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
