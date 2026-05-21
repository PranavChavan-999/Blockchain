const { getSupabase } = require("./supabase");
const { normalizeAddress } = require("../utils/wallet");

const USERS_TABLE = process.env.SUPABASE_USERS_TABLE || "users";

function toUserProfile(row) {
  if (!row) return null;

  return {
    id: row.id,
    walletAddress: row.wallet_address,
    username: row.username ?? null,
    authType: row.auth_type ?? "wallet",
    createdAt: row.created_at ?? null,
    lastActive: row.last_active ?? null,
    mockusdBalance: row.mockusd_balance != null ? Number(row.mockusd_balance) : 0,
    ethBalance: row.eth_balance != null ? Number(row.eth_balance) : 0,
    totalTransactions: row.total_transactions ?? 0,
    totalNfts: row.total_nfts ?? 0,
  };
}

/**
 * Insert or update user by wallet address.
 * New users get defaults; returning users only refresh last_active.
 */
async function upsertUserByWallet(walletAddress) {
  const supabase = getSupabase();
  if (!supabase) {
    const err = new Error("Supabase is not configured");
    err.code = "DB_NOT_CONFIGURED";
    throw err;
  }

  const normalized = normalizeAddress(walletAddress);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .upsert(
      {
        wallet_address: normalized,
        auth_type: "wallet",
        last_active: now,
      },
      { onConflict: "wallet_address" }
    )
    .select("*")
    .single();

  if (error) {
    const err = new Error(error.message);
    err.code = "DB_UPSERT_FAILED";
    err.details = error;
    throw err;
  }

  return toUserProfile(data);
}

module.exports = { upsertUserByWallet, toUserProfile };
