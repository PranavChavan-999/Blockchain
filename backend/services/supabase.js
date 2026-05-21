const { createClient } = require("@supabase/supabase-js");

let client;

function getSupabaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

/**
 * Verifies Supabase env vars and runs a read against SUPABASE_TEST_TABLE
 * (default: health_checks). Returns a structured result for API/CLI use.
 */
async function testDbConnection() {
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!getSupabaseKey()) missing.push("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    return {
      ok: false,
      connected: false,
      error: `Missing env: ${missing.join(", ")}`,
      hint: "Add credentials to backend/.env (see .env.example)",
    };
  }

  const supabase = getSupabase();
  const table = process.env.SUPABASE_TEST_TABLE || "health_checks";

  const { data, error, count } = await supabase
    .from(table)
    .select("*", { count: "exact" })
    .limit(1);

  if (error) {
    const isMissingTable =
      error.code === "PGRST205" ||
      error.message?.includes("Could not find the table");

    return {
      ok: false,
      connected: !isMissingTable,
      table,
      error: error.message,
      code: error.code,
      hint: isMissingTable
        ? `Table "${table}" not found. Run backend/supabase/schema.sql in the Supabase SQL editor, or set SUPABASE_TEST_TABLE to an existing table.`
        : "Check URL, API key, and RLS policies for your key type.",
    };
  }

  return {
    ok: true,
    connected: true,
    table,
    rowCount: count ?? data?.length ?? 0,
    sample: data?.[0] ?? null,
  };
}

module.exports = { getSupabase, testDbConnection };
