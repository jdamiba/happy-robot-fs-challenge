#!/usr/bin/env node

/**
 * Test Migration Schema Verification
 * Verifies that the migration file creates the same schema as Prisma
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Migration Schema Verification");
console.log("=================================\n");

async function main() {
  console.log("📋 Reading migration file...");
  const migrationSQL = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "database",
      "migrations",
      "001_initial_schema.sql"
    ),
    "utf8"
  );

  console.log("📋 Reading Prisma schema...");
  const prismaSchema = fs.readFileSync(
    path.join(__dirname, "..", "prisma", "schema.prisma"),
    "utf8"
  );

  // Extract expected tables and fields from migration
  const migrationTables = {};

  // Parse CREATE TABLE statements
  const createTableRegex = /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/g;
  let match;

  while ((match = createTableRegex.exec(migrationSQL)) !== null) {
    const tableName = match[1];
    const tableDefinition = match[2];

    migrationTables[tableName] = {
      fields: [],
      constraints: [],
      indexes: [],
    };

    // Parse fields
    const fieldLines = tableDefinition
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    for (const line of fieldLines) {
      if (
        line.includes("PRIMARY KEY") ||
        line.includes("FOREIGN KEY") ||
        line.includes("UNIQUE")
      ) {
        migrationTables[tableName].constraints.push(line);
      } else if (line.startsWith("CREATE INDEX")) {
        // Skip indexes for now
      } else if (line.includes(" ")) {
        migrationTables[tableName].fields.push(line.split(" ")[0]);
      }
    }
  }

  // Extract expected models from Prisma schema
  const prismaModels = {};

  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  while ((match = modelRegex.exec(prismaSchema)) !== null) {
    const modelName = match[1];
    const modelDefinition = match[2];

    prismaModels[modelName] = {
      fields: [],
      relations: [],
    };

    const lines = modelDefinition
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    for (const line of lines) {
      if (line.includes("@relation") || line.includes("@@")) {
        prismaModels[modelName].relations.push(line);
      } else if (line.includes(" ") && !line.includes("@")) {
        const fieldName = line.split(" ")[0];
        if (fieldName && !fieldName.startsWith("//")) {
          prismaModels[modelName].fields.push(fieldName);
        }
      }
    }
  }

  // Map Prisma models to database tables
  const expectedTables = {
    User: "users",
    Project: "projects",
    Task: "tasks",
    Comment: "comments",
  };

  console.log("\n📊 Migration vs Prisma Comparison:");
  console.log("====================================\n");

  let allMatch = true;

  for (const [modelName, tableName] of Object.entries(expectedTables)) {
    const prismaFields = prismaModels[modelName]?.fields || [];
    const migrationFields = migrationTables[tableName]?.fields || [];

    console.log(`📋 ${modelName} (${tableName}):`);
    console.log(`   Prisma fields: ${prismaFields.length}`);
    console.log(`   Migration fields: ${migrationFields.length}`);

    // Check if all Prisma fields exist in migration
    const missingInMigration = prismaFields.filter(
      (field) => !migrationFields.includes(field.toLowerCase())
    );
    const extraInMigration = migrationFields.filter(
      (field) => !prismaFields.includes(field)
    );

    if (missingInMigration.length === 0 && extraInMigration.length === 0) {
      console.log(`   ✅ Fields match perfectly`);
    } else {
      console.log(`   ❌ Field mismatch detected`);
      if (missingInMigration.length > 0) {
        console.log(
          `      Missing in migration: ${missingInMigration.join(", ")}`
        );
      }
      if (extraInMigration.length > 0) {
        console.log(`      Extra in migration: ${extraInMigration.join(", ")}`);
      }
      allMatch = false;
    }
    console.log("");
  }

  // Check for enum
  const hasTaskStatusEnum = migrationSQL.includes(
    "CREATE TYPE task_status AS ENUM"
  );
  const hasTaskStatusInPrisma = prismaSchema.includes("enum TaskStatus");

  console.log("📋 TaskStatus Enum:");
  console.log(`   Migration: ${hasTaskStatusEnum ? "✅" : "❌"}`);
  console.log(`   Prisma: ${hasTaskStatusInPrisma ? "✅" : "❌"}`);

  if (hasTaskStatusEnum && hasTaskStatusInPrisma) {
    console.log(`   ✅ Enum definition matches`);
  } else {
    console.log(`   ❌ Enum mismatch`);
    allMatch = false;
  }

  // Check for indexes
  const expectedIndexes = [
    "idx_users_clerk_id",
    "idx_projects_owner_id",
    "idx_tasks_project_id",
    "idx_tasks_status",
    "idx_comments_author_id",
    "idx_comments_task_id",
  ];

  console.log("\n📋 Database Indexes:");
  const missingIndexes = expectedIndexes.filter(
    (index) => !migrationSQL.includes(index)
  );

  if (missingIndexes.length === 0) {
    console.log(`   ✅ All expected indexes present`);
  } else {
    console.log(`   ❌ Missing indexes: ${missingIndexes.join(", ")}`);
    allMatch = false;
  }

  console.log("\n📋 Summary:");
  console.log("============");
  console.log(`Migration file: ${migrationSQL.split("\n").length} lines`);
  console.log(`Prisma schema: ${prismaSchema.split("\n").length} lines`);
  console.log(`Expected tables: ${Object.keys(expectedTables).length}`);
  console.log(`Expected indexes: ${expectedIndexes.length}`);

  if (allMatch) {
    console.log(
      "\n🎉 SUCCESS: Migration file is consistent with Prisma schema!"
    );
    console.log("   ✅ All tables, fields, and indexes match");
    console.log("   ✅ Ready for fresh database setup");
    console.log("   ✅ No schema drift in migration");
    process.exit(0);
  } else {
    console.log("\n⚠️  WARNING: Migration inconsistencies detected!");
    console.log("   Please review and fix migration file.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Migration verification failed:", error.message);
  process.exit(1);
});
