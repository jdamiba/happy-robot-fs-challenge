// Load environment variables from env.testing file
const fs = require("fs");
const path = require("path");

// Read and parse env.testing file
const envTestingPath = path.join(__dirname, "env.testing");
if (fs.existsSync(envTestingPath)) {
  const envContent = fs.readFileSync(envTestingPath, "utf8");

  // Parse environment variables from file
  envContent.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#") && line.includes("=")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remove quotes
      process.env[key.trim()] = value;
    }
  });

  console.log("🧪 Test environment variables loaded from env.testing:");
  console.log("  DATABASE_URL:", process.env.DATABASE_URL);
  console.log("  NODE_ENV:", process.env.NODE_ENV);
  console.log("  NEXT_PUBLIC_WS_URL:", process.env.NEXT_PUBLIC_WS_URL);
} else {
  // Fallback to hardcoded values if env.testing doesn't exist
  const testDatabaseUrl =
    "postgresql://happyrobot_test:happyrobot_test123@localhost:5433/happyrobot_test";
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.TEST_DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = "test";

  console.log("🧪 Test environment variables set (fallback):");
  console.log("  DATABASE_URL:", process.env.DATABASE_URL);
  console.log("  NODE_ENV:", process.env.NODE_ENV);
}
