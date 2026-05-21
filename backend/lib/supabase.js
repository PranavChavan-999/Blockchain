const { createClient } = require("@supabase/supabase-js");

let client;

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
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

/** @deprecated use getSupabase — kept for existing imports */
const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getSupabase();
      if (!instance) return undefined;
      const value = instance[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  }
);

module.exports = { getSupabase, supabase };
