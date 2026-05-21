const express = require("express");
const { createNonceForWallet, verifyAndAuthenticate } = require("../services/auth");

const router = express.Router();

router.post("/nonce", (req, res) => {
  const { walletAddress } = req.body ?? {};

  if (!walletAddress) {
    return res.status(400).json({ error: "walletAddress is required" });
  }

  try {
    const message = createNonceForWallet(walletAddress);
    return res.json({ message });
  } catch (err) {
    if (err.code === "INVALID_ADDRESS") {
      return res.status(400).json({ error: err.message });
    }
    console.error("[POST /api/auth/nonce]", err);
    return res.status(500).json({ error: "Failed to create nonce" });
  }
});

router.post("/verify", async (req, res) => {
  const { walletAddress, signature } = req.body ?? {};

  if (!walletAddress || !signature) {
    return res.status(400).json({ error: "walletAddress and signature are required" });
  }

  try {
    const { token, user } = await verifyAndAuthenticate(walletAddress, signature);
    return res.json({ token, user });
  } catch (err) {
    if (
      err.code === "INVALID_ADDRESS" ||
      err.code === "INVALID_SIGNATURE" ||
      err.code === "SIGNATURE_MISMATCH"
    ) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === "NONCE_INVALID") {
      return res.status(401).json({ error: err.message });
    }
    if (err.code === "JWT_NOT_CONFIGURED") {
      return res.status(500).json({ error: err.message });
    }
    if (err.code === "DB_NOT_CONFIGURED" || err.code === "DB_UPSERT_FAILED") {
      console.error("[POST /api/auth/verify] database error:", err.details || err);
      return res.status(503).json({ error: "Failed to save user profile" });
    }
    console.error("[POST /api/auth/verify]", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

module.exports = router;
