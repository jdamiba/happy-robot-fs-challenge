#!/usr/bin/env node

/**
 * Database Verification Script
 * Verifies that the Happy Robot database is set up correctly
 */

const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkMark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossMark() {
  return `${colors.red}✗${colors.reset}`;
}

async function verifyDatabase() {
  log("\n🔍 Verifying Happy Robot Database Setup\n", "cyan");

  let allTestsPassed = true;

  try {
    // Test 1: Database Connection
    log("Testing database connection...", "blue");
    await prisma.$connect();
    log(`  ${checkMark()} Database connection successful\n`);

    // Test 2: Check Tables Exist
    log("Checking required tables...", "blue");
    const tables = ["users", "projects", "tasks", "comments", "task_assignees"];

    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        `;

        if (result[0].count > 0) {
          log(`  ${checkMark()} Table '${table}' exists`);
        } else {
          log(`  ${crossMark()} Table '${table}' missing`, "red");
          allTestsPassed = false;
        }
      } catch (error) {
        log(
          `  ${crossMark()} Error checking table '${table}': ${error.message}`,
          "red"
        );
        allTestsPassed = false;
      }
    }

    // Test 3: Check Enum Types
    log("\nChecking enum types...", "blue");
    try {
      const enumResult = await prisma.$queryRaw`
        SELECT typname 
        FROM pg_type 
        WHERE typname = 'task_status'
      `;

      if (enumResult.length > 0) {
        log(`  ${checkMark()} TaskStatus enum exists`);
      } else {
        log(`  ${crossMark()} TaskStatus enum missing`, "red");
        allTestsPassed = false;
      }
    } catch (error) {
      log(`  ${crossMark()} Error checking enum: ${error.message}`, "red");
      allTestsPassed = false;
    }

    // Test 4: Check Indexes
    log("\nChecking database indexes...", "blue");
    const expectedIndexes = [
      "idx_users_clerk_id",
      "idx_projects_owner_id",
      "idx_tasks_project_id",
      "idx_tasks_status",
      "idx_comments_author_id",
      "idx_comments_task_id",
    ];

    for (const index of expectedIndexes) {
      try {
        const indexResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM pg_indexes 
          WHERE indexname = ${index}
        `;

        if (indexResult[0].count > 0) {
          log(`  ${checkMark()} Index '${index}' exists`);
        } else {
          log(`  ${crossMark()} Index '${index}' missing`, "red");
          allTestsPassed = false;
        }
      } catch (error) {
        log(
          `  ${crossMark()} Error checking index '${index}': ${error.message}`,
          "red"
        );
        allTestsPassed = false;
      }
    }

    // Test 5: Check Triggers
    log("\nChecking update triggers...", "blue");
    const triggers = [
      "update_users_updated_at",
      "update_projects_updated_at",
      "update_tasks_updated_at",
    ];

    for (const trigger of triggers) {
      try {
        const triggerResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.triggers 
          WHERE trigger_name = ${trigger}
        `;

        if (triggerResult[0].count > 0) {
          log(`  ${checkMark()} Trigger '${trigger}' exists`);
        } else {
          log(`  ${crossMark()} Trigger '${trigger}' missing`, "red");
          allTestsPassed = false;
        }
      } catch (error) {
        log(
          `  ${crossMark()} Error checking trigger '${trigger}': ${
            error.message
          }`,
          "red"
        );
        allTestsPassed = false;
      }
    }

    // Test 6: Test Basic Operations
    log("\nTesting basic database operations...", "blue");

    try {
      // Test user creation
      const testUser = await prisma.user.create({
        data: {
          id: "test-user-verification",
          clerkId: "test-clerk-123",
          email: "test@verification.com",
          firstName: "Test",
          lastName: "User",
        },
      });
      log(`  ${checkMark()} User creation works`);

      // Test project creation
      const testProject = await prisma.project.create({
        data: {
          id: "test-project-verification",
          name: "Test Project",
          ownerId: testUser.id,
        },
      });
      log(`  ${checkMark()} Project creation works`);

      // Test task creation
      const testTask = await prisma.task.create({
        data: {
          id: "test-task-verification",
          projectId: testProject.id,
          title: "Test Task",
          status: "TODO",
          configuration: { priority: "MEDIUM" },
        },
      });
      log(`  ${checkMark()} Task creation works`);

      // Test comment creation
      const testComment = await prisma.comment.create({
        data: {
          id: "test-comment-verification",
          taskId: testTask.id,
          content: "Test comment",
          authorId: testUser.id,
        },
      });
      log(`  ${checkMark()} Comment creation works`);

      // Cleanup test data
      await prisma.comment.delete({ where: { id: testComment.id } });
      await prisma.task.delete({ where: { id: testTask.id } });
      await prisma.project.delete({ where: { id: testProject.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      log(`  ${checkMark()} Test data cleanup completed`);
    } catch (error) {
      log(`  ${crossMark()} Error testing operations: ${error.message}`, "red");
      allTestsPassed = false;
    }

    // Test 7: Check Prisma Client
    log("\nChecking Prisma client generation...", "blue");
    try {
      execSync("npx prisma generate", { stdio: "pipe" });
      log(`  ${checkMark()} Prisma client generated successfully`);
    } catch (error) {
      log(
        `  ${crossMark()} Error generating Prisma client: ${error.message}`,
        "red"
      );
      allTestsPassed = false;
    }
  } catch (error) {
    log(
      `\n${crossMark()} Database verification failed: ${error.message}`,
      "red"
    );
    allTestsPassed = false;
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  log("\n" + "=".repeat(50), "cyan");
  if (allTestsPassed) {
    log("🎉 Database verification completed successfully!", "green");
    log("Your Happy Robot database is ready to use.", "green");
  } else {
    log("❌ Database verification found issues.", "red");
    log("Please check the errors above and fix them before proceeding.", "red");
    process.exit(1);
  }
  log("=".repeat(50) + "\n", "cyan");
}

// Run verification
verifyDatabase().catch((error) => {
  log(`\n💥 Unexpected error: ${error.message}`, "red");
  process.exit(1);
});
