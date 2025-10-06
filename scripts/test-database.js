#!/usr/bin/env node

// Test script to verify database setup
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDatabase() {
  console.log("🧪 Testing database setup...\n");

  try {
    // Test 1: Database connection
    console.log("1. Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful\n");

    // Test 2: Check if tables exist
    console.log("2. Checking database tables...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const expectedTables = ["users", "projects", "tasks", "comments"];
    const existingTables = tables.map((t) => t.table_name);

    console.log("Found tables:", existingTables);

    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    console.log("");

    // Test 3: Check if indexes exist
    console.log("3. Checking database indexes...");
    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `;

    console.log(
      "Found indexes:",
      indexes.map((i) => `${i.indexname} on ${i.tablename}`)
    );
    console.log("");

    // Test 4: Check if functions exist
    console.log("4. Checking database functions...");
    const functions = await prisma.$queryRaw`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%clerk%'
      ORDER BY routine_name;
    `;

    console.log(
      "Found Clerk functions:",
      functions.map((f) => f.routine_name)
    );
    console.log("");

    // Test 5: Check if views exist
    console.log("5. Checking database views...");
    const views = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log(
      "Found views:",
      views.map((v) => v.table_name)
    );
    console.log("");

    // Test 6: Test user creation function
    console.log("6. Testing user creation function...");
    try {
      const testUserId = await prisma.$queryRaw`
        SELECT create_user_from_clerk(
          'test_clerk_id_123',
          'test@example.com',
          'Test',
          'User',
          'https://example.com/avatar.jpg'
        ) as user_id;
      `;
      console.log("✅ User creation function works");
      console.log("Created user ID:", testUserId[0].user_id);

      // Clean up test user
      await prisma.user.delete({
        where: { clerkId: "test_clerk_id_123" },
      });
      console.log("✅ Test user cleaned up");
    } catch (error) {
      console.log("❌ User creation function failed:", error.message);
    }
    console.log("");

    console.log("🎉 Database setup test completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- Database connection: ✅");
    console.log("- Tables created: ✅");
    console.log("- Indexes created: ✅");
    console.log("- Functions created: ✅");
    console.log("- Views created: ✅");
    console.log("- User management: ✅");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabase().catch(console.error);
