#!/usr/bin/env node

/**
 * Schema Model Consistency Verification Script
 * Compares only the model definitions across environments
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

console.log("🔍 Schema Model Consistency Verification");
console.log("=========================================\n");

function extractModels(schema) {
  // Extract model and enum definitions
  const lines = schema.split("\n");
  const models = [];
  let inModel = false;
  let currentModel = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("model ") || trimmed.startsWith("enum ")) {
      if (inModel) {
        models.push(currentModel.join("\n"));
      }
      currentModel = [line];
      inModel = true;
    } else if (inModel) {
      currentModel.push(line);
      if (trimmed === "}" || trimmed === "}" || line === "") {
        models.push(currentModel.join("\n"));
        currentModel = [];
        inModel = false;
      }
    }
  }

  if (currentModel.length > 0) {
    models.push(currentModel.join("\n"));
  }

  return models.sort();
}

async function introspectDatabase(databaseUrl, name) {
  console.log(`📊 Introspecting ${name} database...`);

  try {
    const result = execSync(
      `DATABASE_URL="${databaseUrl}" npx prisma db pull --print`,
      { encoding: "utf8", timeout: 30000 }
    );
    return result;
  } catch (error) {
    console.error(`❌ Failed to introspect ${name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Starting schema model verification...\n");

  // 1. Get Prisma schema
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

  if (!testSchema || !prodSchema) {
    console.error("❌ Could not introspect one or more databases");
    process.exit(1);
  }

  // Extract models from each schema
  const prismaModels = extractModels(prismaSchema);
  const testModels = extractModels(testSchema);
  const prodModels = extractModels(prodSchema);

  console.log("\n📊 Model Comparison Results:");
  console.log("==============================\n");

  // Compare model counts
  console.log(`📋 Model Counts:`);
  console.log(`   Prisma Schema: ${prismaModels.length} models`);
  console.log(`   Test Database: ${testModels.length} models`);
  console.log(`   Production DB: ${prodModels.length} models\n`);

  // Compare each model
  const allModels = [
    ...new Set([...prismaModels, ...testModels, ...prodModels]),
  ];
  let allMatch = true;

  for (const model of allModels) {
    const modelName = model.split("\n")[0].trim();
    const inPrisma = prismaModels.includes(model);
    const inTest = testModels.includes(model);
    const inProd = prodModels.includes(model);

    if (inPrisma && inTest && inProd) {
      console.log(`✅ ${modelName}: All environments match`);
    } else {
      console.log(`❌ ${modelName}: MISMATCH`);
      console.log(`   Prisma: ${inPrisma ? "✅" : "❌"}`);
      console.log(`   Test:   ${inTest ? "✅" : "❌"}`);
      console.log(`   Prod:   ${inProd ? "✅" : "❌"}`);
      allMatch = false;
    }
  }

  // Check for extra models
  const prismaModelNames = prismaModels.map((m) => m.split("\n")[0].trim());
  const testModelNames = testModels.map((m) => m.split("\n")[0].trim());
  const prodModelNames = prodModels.map((m) => m.split("\n")[0].trim());

  const extraInTest = testModelNames.filter(
    (name) => !prismaModelNames.includes(name)
  );
  const extraInProd = prodModelNames.filter(
    (name) => !prismaModelNames.includes(name)
  );

  if (extraInTest.length > 0) {
    console.log(
      `\n⚠️  Extra models in test database: ${extraInTest.join(", ")}`
    );
    allMatch = false;
  }

  if (extraInProd.length > 0) {
    console.log(
      `\n⚠️  Extra models in production database: ${extraInProd.join(", ")}`
    );
    allMatch = false;
  }

  console.log("\n📋 Schema Summary:");
  console.log("===================");
  console.log(`✅ Prisma Schema: ${prismaModels.length} models`);
  console.log(`✅ Test Database: ${testModels.length} models`);
  console.log(`✅ Production Database: ${prodModels.length} models`);

  if (allMatch) {
    console.log("\n🎉 SUCCESS: All database schemas are consistent!");
    console.log("   No schema drift detected.");
    console.log("   All models match across environments.");
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
