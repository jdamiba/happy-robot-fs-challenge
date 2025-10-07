#!/usr/bin/env node

/**
 * Simple Schema Consistency Verification
 * Direct comparison of model definitions
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

console.log("🔍 Simple Schema Consistency Verification");
console.log("==========================================\n");

async function getSchemaFromDB(databaseUrl, name) {
  console.log(`📊 Getting schema from ${name} database...`);

  try {
    const result = execSync(
      `DATABASE_URL="${databaseUrl}" npx prisma db pull --print`,
      { encoding: "utf8", timeout: 30000 }
    );

    // Extract just the models and enums (skip generator/datasource)
    const lines = result.split("\n");
    const modelStart = lines.findIndex(
      (line) => line.includes("model ") || line.includes("enum ")
    );

    if (modelStart === -1) {
      throw new Error("No models found");
    }

    return lines.slice(modelStart).join("\n");
  } catch (error) {
    console.error(`❌ Failed to get schema from ${name}:`, error.message);
    return null;
  }
}

function compareSchemas(schema1, schema2, name1, name2) {
  if (!schema1 || !schema2) {
    return false;
  }

  // Normalize schemas for comparison
  const normalize = (schema) => {
    return schema
      .replace(/\s+/g, " ")
      .replace(/\s*{\s*/g, "{")
      .replace(/\s*}\s*/g, "}")
      .replace(/\s*,\s*/g, ",")
      .trim();
  };

  const norm1 = normalize(schema1);
  const norm2 = normalize(schema2);

  return norm1 === norm2;
}

async function main() {
  // 1. Get Prisma schema
  console.log("📋 Reading Prisma schema.prisma...");
  const prismaSchema = fs.readFileSync(
    path.join(__dirname, "..", "prisma", "schema.prisma"),
    "utf8"
  );

  // Extract models from Prisma schema
  const lines = prismaSchema.split("\n");
  const modelStart = lines.findIndex(
    (line) => line.includes("model ") || line.includes("enum ")
  );
  const prismaModels = lines.slice(modelStart).join("\n");

  // 2. Get database schemas
  const testSchema = await getSchemaFromDB(testEnv.DATABASE_URL, "test");
  const prodSchema = await getSchemaFromDB(prodEnv.DATABASE_URL, "production");

  if (!testSchema || !prodSchema) {
    console.error("❌ Could not get schemas from databases");
    process.exit(1);
  }

  console.log("\n📊 Schema Comparison Results:");
  console.log("==============================\n");

  // Compare schemas
  const testMatch = compareSchemas(
    prismaModels,
    testSchema,
    "Prisma",
    "Test DB"
  );
  const prodMatch = compareSchemas(
    prismaModels,
    prodSchema,
    "Prisma",
    "Production DB"
  );
  const dbMatch = compareSchemas(
    testSchema,
    prodSchema,
    "Test DB",
    "Production DB"
  );

  console.log(
    `Prisma Schema vs Test Database: ${testMatch ? "✅ MATCH" : "❌ MISMATCH"}`
  );
  console.log(
    `Prisma Schema vs Production DB: ${prodMatch ? "✅ MATCH" : "❌ MISMATCH"}`
  );
  console.log(
    `Test Database vs Production DB: ${dbMatch ? "✅ MATCH" : "❌ MISMATCH"}`
  );

  // Show model counts
  const prismaModelCount = (prismaModels.match(/model\s+\w+/g) || []).length;
  const prismaEnumCount = (prismaModels.match(/enum\s+\w+/g) || []).length;
  const testModelCount = (testSchema.match(/model\s+\w+/g) || []).length;
  const testEnumCount = (testSchema.match(/enum\s+\w+/g) || []).length;
  const prodModelCount = (prodSchema.match(/model\s+\w+/g) || []).length;
  const prodEnumCount = (prodSchema.match(/enum\s+\w+/g) || []).length;

  console.log("\n📋 Schema Summary:");
  console.log("===================");
  console.log(
    `Prisma Schema: ${prismaModelCount} models, ${prismaEnumCount} enums`
  );
  console.log(
    `Test Database: ${testModelCount} models, ${testEnumCount} enums`
  );
  console.log(
    `Production DB: ${prodModelCount} models, ${prodEnumCount} enums`
  );

  // Check for specific models
  const expectedModels = ["Comment", "Project", "Task", "User"];
  const expectedEnums = ["TaskStatus"];

  console.log("\n🔍 Model Verification:");
  console.log("=======================");

  expectedModels.forEach((model) => {
    const inPrisma = prismaModels.includes(`model ${model}`);
    const inTest = testSchema.includes(`model ${model}`);
    const inProd = prodSchema.includes(`model ${model}`);

    console.log(
      `${model}: Prisma=${inPrisma ? "✅" : "❌"} Test=${
        inTest ? "✅" : "❌"
      } Prod=${inProd ? "✅" : "❌"}`
    );
  });

  expectedEnums.forEach((enumType) => {
    const inPrisma = prismaModels.includes(`enum ${enumType}`);
    const inTest = testSchema.includes(`enum ${enumType}`);
    const inProd = prodSchema.includes(`enum ${enumType}`);

    console.log(
      `${enumType}: Prisma=${inPrisma ? "✅" : "❌"} Test=${
        inTest ? "✅" : "❌"
      } Prod=${inProd ? "✅" : "❌"}`
    );
  });

  if (testMatch && prodMatch && dbMatch) {
    console.log("\n🎉 SUCCESS: All database schemas are perfectly consistent!");
    console.log("   ✅ No schema drift detected");
    console.log("   ✅ All models and enums match across environments");
    console.log("   ✅ Ready for production deployment");
    process.exit(0);
  } else {
    console.log("\n⚠️  WARNING: Schema inconsistencies detected!");
    console.log("   Please review and fix schema drift before deployment.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Schema verification failed:", error.message);
  process.exit(1);
});
