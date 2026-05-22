const express = require("express");
const jwt = require("jsonwebtoken");
const { SiweMessage } = require("siwe");
const { getSupabase } = require("../lib/supabase");
const { getOrCreateNonce, getNonce, consumeNonce } = require("../stores/nonceStore");
const { normalizeAddress, isValidEthereumAddress } = require("../utils/wallet");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const JWT_EXPIRES_IN = "7d";
const BASE_SEPOLIA_CHAIN_ID = 84532;
const USERS_TABLE = process.env.SUPABASE_USERS_TABLE || "users";

function issueToken(address, userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("JWT_SECRET is not configured");
    err.code = "JWT_NOT_CONFIGURED";
    throw err;
  }

  return jwt.sign({ address: normalizeAddress(address), userId }, secret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function upsertUser(address) {
  const supabase = getSupabase();
  if (!supabase) {
    const err = new Error("Supabase is not configured");
    err.code = "DB_NOT_CONFIGURED";
    throw err;
  }

  const wallet_address = normalizeAddress(address);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .upsert(
      {
        wallet_address,
        auth_type: "wallet",
        last_active: now,
      },
      { onConflict: "wallet_address" }
    )
    .select("id, wallet_address, created_at, last_active")
    .single();

  if (error) {
    const err = new Error(error.message);
    err.code = "DB_UPSERT_FAILED";
    err.details = error;
    throw err;
  }

  return {
    id: data.id,
    wallet_address: data.wallet_address,
    created_at: data.created_at,
    last_login: data.last_active,
  };
}

/**
 * GET /api/auth/nonce?address=0x...
 */
router.get("/nonce", (req, res) => {
  const address = req.query.address;

  if (!address) {
    return res.status(400).json({ error: "address query parameter is required" });
  }

  if (!isValidEthereumAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum wallet address" });
  }

  try {
    const normalized = normalizeAddress(address);
    const nonce = getOrCreateNonce(normalized);
    return res.json({ nonce });
  } catch (err) {
    console.error("[GET /api/auth/nonce]", err);
    return res.status(500).json({ error: "Failed to create nonce" });
  }
});

/**
 * POST /api/auth/verify
 * Body: { address, message, signature }
 */
router.post("/verify", async (req, res) => {
  const { address, message, signature } = req.body ?? {};

  if (!address || !message || !signature) {
    return res.status(400).json({
      error: "address, message, and signature are required",
    });
  }

  if (!isValidEthereumAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum wallet address" });
  }

  let normalized;
  try {
    normalized = normalizeAddress(address);
  } catch {
    return res.status(400).json({ error: "Invalid Ethereum wallet address" });
  }

  let siweMessage;
  try {
    siweMessage = new SiweMessage(message);
  } catch {
    return res.status(400).json({ error: "Invalid SIWE message" });
  }

  const messageNonce = siweMessage.nonce;
  if (!messageNonce || getNonce(normalized) !== messageNonce) {
    console.warn("[POST /api/auth/verify] 401: nonce missing or stale");
    return res.status(401).json({
      error: "Nonce expired or not found. Connect again and approve a fresh sign prompt.",
      code: "NONCE_INVALID",
    });
  }

  try {
    const { success, error, data } = await siweMessage.verify({
      signature,
      domain: siweMessage.domain,
      nonce: messageNonce,
    });

    if (!success || error) {
      console.warn("[POST /api/auth/verify] 401: SIWE verify failed", error?.type);
      return res.status(401).json({
        error: error?.type || "Invalid SIWE signature",
        details: error?.expected,
        code: "SIWE_VERIFY_FAILED",
      });
    }

    if (normalizeAddress(data.address) !== normalized) {
      return res.status(401).json({
        error: "Signature address mismatch",
        code: "ADDRESS_MISMATCH",
      });
    }

    if (Number(data.chainId) !== BASE_SEPOLIA_CHAIN_ID) {
      return res.status(401).json({
        error: `Wrong network. Expected chain ID ${BASE_SEPOLIA_CHAIN_ID} (Base Sepolia)`,
        code: "WRONG_CHAIN",
      });
    }

    if (!consumeNonce(normalized, messageNonce)) {
      console.warn("[POST /api/auth/verify] 401: nonce race (already used)");
      return res.status(401).json({
        error: "Nonce already used. Connect again and sign a new message.",
        code: "NONCE_USED",
      });
    }

    const user = await upsertUser(normalized);
    const token = issueToken(normalized, user.id);

    return res.json({
      token,
      user: { wallet_address: user.wallet_address },
    });
  } catch (err) {
    if (err.code === "DB_NOT_CONFIGURED" || err.code === "DB_UPSERT_FAILED") {
      console.error("[POST /api/auth/verify] database error:", err.details || err);
      const hint =
        err.details?.code === "PGRST205"
          ? 'Run backend/supabase/migrations/001_users_siwe.sql in the Supabase SQL Editor.'
          : undefined;
      return res.status(503).json({
        error: "Failed to save user profile. Ensure the Supabase users table exists.",
        code: err.code,
        hint,
      });
    }
    if (err.code === "JWT_NOT_CONFIGURED") {
      return res.status(500).json({ error: err.message });
    }
    console.error("[POST /api/auth/verify]", err);
    return res.status(401).json({ error: "Invalid signature or message" });
  }
});

/**
 * POST /api/auth/logout — stateless JWT; client drops token.
 */
router.post("/logout", authMiddleware, (_req, res) => {
  res.json({ ok: true });
});

module.exports = router;
