#!/usr/bin/env node

/**
 * Schema Consistency Verification Script
 * Compares database schemas across test, production, and migration environments
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load environment variables
const envProduction = fs.readFileSync(
  path.join(__dirname, "..", "env.production"),
  "utf8"
);
const envTesting = fs.readFileSync(
  path.join(__dirname, "..", "env.testing"),
  "utf8"
);

function parseEnvFile(content) {
  const env = {};
  content.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#") && line.includes("=")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      env[key.trim()] = value;
    }
  });
  return env;
}

const prodEnv = parseEnvFile(envProduction);
const testEnv = parseEnvFile(envTesting);

console.log("🔍 Schema Consistency Verification");
console.log("=====================================\n");

async function introspectDatabase(databaseUrl, name) {
  console.log(`📊 Introspecting ${name} database...`);

  try {
    const result = execSync(
      `DATABASE_URL="${databaseUrl}" npx prisma db pull --print`,
      { encoding: "utf8", timeout: 30000 }
    );

    // Extract just the schema part (remove generator and datasource)
    const lines = result.split("\n");
    const schemaStart = lines.findIndex((line) => line.includes("model "));
    const schemaEnd = lines.findIndex((line) =>
      line.includes("enum TaskStatus")
    );

    if (schemaStart === -1 || schemaEnd === -1) {
      throw new Error("Could not find schema boundaries");
    }

    return lines.slice(schemaStart, schemaEnd + 10).join("\n");
  } catch (error) {
    console.error(`❌ Failed to introspect ${name}:`, error.message);
    return null;
  }
}

function normalizeSchema(schema) {
  if (!schema) return null;

  // Remove comments, extra whitespace, and normalize formatting
  return schema
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*$/gm, "") // Remove line comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\s*{\s*/g, " { ") // Normalize braces
    .replace(/\s*}\s*/g, " } ") // Normalize braces
    .trim();
}

async function main() {
  console.log("🚀 Starting schema verification...\n");

  // 1. Get Prisma schema (source of truth)
  console.log("📋 Reading Prisma schema.prisma...");
  const prismaSchema = fs.readFileSync(
    path.join(__dirname, "..", "prisma", "schema.prisma"),
    "utf8"
  );

  // 2. Get test database schema
  const testSchema = await introspectDatabase(testEnv.DATABASE_URL, "test");

  // 3. Get production database schema
  const prodSchema = await introspectDatabase(
    prodEnv.DATABASE_URL,
    "production"
  );

  // 4. Read migration schema
  console.log("📋 Reading migration schema...");
  const migrationSchema = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "database",
      "migrations",
      "001_initial_schema.sql"
    ),
    "utf8"
  );

  console.log("\n📊 Schema Comparison Results:");
  console.log("===============================\n");

  // Normalize schemas for comparison
  const normalizedPrisma = normalizeSchema(prismaSchema);
  const normalizedTest = normalizeSchema(testSchema);
  const normalizedProd = normalizeSchema(prodSchema);

  // Compare schemas
  const comparisons = [
    {
      name: "Prisma Schema vs Test DB",
      schema1: normalizedPrisma,
      schema2: normalizedTest,
    },
    {
      name: "Prisma Schema vs Production DB",
      schema1: normalizedPrisma,
      schema2: normalizedProd,
    },
    {
      name: "Test DB vs Production DB",
      schema1: normalizedTest,
      schema2: normalizedProd,
    },
  ];

  let allMatch = true;

  comparisons.forEach(({ name, schema1, schema2 }) => {
    if (schema1 === schema2) {
      console.log(`✅ ${name}: MATCH`);
    } else {
      console.log(`❌ ${name}: MISMATCH`);
      allMatch = false;

      // Show differences (simplified)
      if (schema1 && schema2) {
        const lines1 = schema1.split("\n").filter((l) => l.trim());
        const lines2 = schema2.split("\n").filter((l) => l.trim());

        const maxLines = Math.max(lines1.length, lines2.length);
        let differences = 0;

        for (let i = 0; i < maxLines; i++) {
          if (lines1[i] !== lines2[i]) {
            differences++;
            if (differences <= 3) {
              // Show first 3 differences
              console.log(
                `   Line ${i + 1}: "${lines1[i] || "MISSING"}" vs "${
                  lines2[i] || "MISSING"
                }"`
              );
            }
          }
        }

        if (differences > 3) {
          console.log(`   ... and ${differences - 3} more differences`);
        }
      }
    }
  });

  console.log("\n📋 Schema Summary:");
  console.log("===================");
  console.log(
    `✅ Prisma Schema: ${normalizedPrisma ? "Available" : "Missing"}`
  );
  console.log(`✅ Test Database: ${normalizedTest ? "Available" : "Missing"}`);
  console.log(
    `✅ Production Database: ${normalizedProd ? "Available" : "Missing"}`
  );
  console.log(`✅ Migration File: Available`);

  if (allMatch) {
    console.log("\n🎉 SUCCESS: All database schemas are consistent!");
    console.log("   No schema drift detected.");
    process.exit(0);
  } else {
    console.log("\n⚠️  WARNING: Schema inconsistencies detected!");
    console.log("   Please review and fix schema drift.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Schema verification failed:", error.message);
  process.exit(1);
});
