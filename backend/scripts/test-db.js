const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { testDbConnection } = require("../services/supabase");

async function main() {
  console.log("Testing Supabase connection...\n");
  const result = await testDbConnection();

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exit(1);
  }

  console.log("\n✓ Database connection OK");
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
