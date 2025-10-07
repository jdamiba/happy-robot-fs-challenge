#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps manage environment variables for different deployment scenarios
 */

const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#") && line.includes("=")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remove quotes
      env[key.trim()] = value;
    }
  });

  return env;
}

function copyEnvFile(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source file not found: ${sourcePath}`);
    return false;
  }

  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied ${sourcePath} to ${targetPath}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to copy ${sourcePath} to ${targetPath}:`,
      error.message
    );
    return false;
  }
}

function validateEnvironment(env) {
  const required = ["DATABASE_URL", "NODE_ENV"];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    return false;
  }

  console.log(`✅ Environment validation passed`);
  return true;
}

function showEnvironment(env, title) {
  console.log(`\n📋 ${title}:`);
  console.log("─".repeat(50));

  Object.entries(env).forEach(([key, value]) => {
    // Mask sensitive values
    const displayValue =
      key.toLowerCase().includes("secret") ||
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("key")
        ? "***masked***"
        : value;

    console.log(`${key}=${displayValue}`);
  });
}

function main() {
  const command = process.argv[2];
  const projectRoot = path.join(__dirname, "..");

  switch (command) {
    case "setup-test":
      console.log("🧪 Setting up test environment...");
      copyEnvFile(
        path.join(projectRoot, "env.testing"),
        path.join(projectRoot, ".env.test")
      );
      const testEnv = parseEnvFile(path.join(projectRoot, "env.testing"));
      validateEnvironment(testEnv);
      showEnvironment(testEnv, "Test Environment");
      break;

    case "setup-production":
      console.log("🚀 Setting up production environment...");
      copyEnvFile(
        path.join(projectRoot, "env.production"),
        path.join(projectRoot, ".env.production")
      );
      const prodEnv = parseEnvFile(path.join(projectRoot, "env.production"));
      validateEnvironment(prodEnv);
      showEnvironment(prodEnv, "Production Environment");
      break;

    case "validate":
      console.log("🔍 Validating environment files...");

      const testFile = path.join(projectRoot, "env.testing");
      const prodFile = path.join(projectRoot, "env.production");

      if (fs.existsSync(testFile)) {
        const testEnv = parseEnvFile(testFile);
        console.log(`\n✅ Test environment file valid`);
        validateEnvironment(testEnv);
      } else {
        console.log(`❌ Test environment file missing: ${testFile}`);
      }

      if (fs.existsSync(prodFile)) {
        const prodEnv = parseEnvFile(prodFile);
        console.log(`\n✅ Production environment file valid`);
        validateEnvironment(prodEnv);
      } else {
        console.log(`❌ Production environment file missing: ${prodFile}`);
      }
      break;

    case "show-test":
      const testEnvShow = parseEnvFile(path.join(projectRoot, "env.testing"));
      showEnvironment(testEnvShow, "Test Environment Configuration");
      break;

    case "show-production":
      const prodEnvShow = parseEnvFile(
        path.join(projectRoot, "env.production")
      );
      showEnvironment(prodEnvShow, "Production Environment Configuration");
      break;

    default:
      console.log(`
🔧 Environment Setup Script

Usage: node scripts/env-setup.js <command>

Commands:
  setup-test       Copy env.testing to .env.test
  setup-production Copy env.production to .env.production
  validate         Validate environment files
  show-test        Display test environment configuration
  show-production  Display production environment configuration

Examples:
  node scripts/env-setup.js setup-test
  node scripts/env-setup.js validate
  node scripts/env-setup.js show-production
      `);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseEnvFile, copyEnvFile, validateEnvironment };
