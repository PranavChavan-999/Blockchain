const express = require("express");
const cors = require("cors");
const { PORT, FRONTEND_ORIGIN } = require("./config");
const { getWalletBadges, getBadgeStats } = require("./services/contract");
const { testDbConnection } = require("./services/supabase");
const authRoutes = require("./routes/auth");

function warnIfJwtSecretMissing() {
  if (!process.env.JWT_SECRET) {
    console.error("\n========================================");
    console.error("WARNING: JWT_SECRET is not set in backend/.env");
    console.error("Wallet authentication will NOT work until it is set.");
    console.error("========================================\n");
  }
}

warnIfJwtSecretMissing();

const app = express();
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "skillbadge-api" });
});

app.get("/api/db/test", async (_req, res) => {
  const result = await testDbConnection();
  res.status(result.ok ? 200 : result.connected === false ? 503 : 500).json(result);
});

app.get("/api/stats", async (_req, res) => {
  try {
    const stats = await getBadgeStats();
    res.json(stats);
  } catch (err) {
    console.error("[GET /api/stats]", err);
    if (err.code === "CONTRACT_NOT_FOUND") {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to fetch on-chain stats" });
  }
});

app.get("/api/badges/:address", async (req, res) => {
  try {
    const data = await getWalletBadges(req.params.address);
    res.json(data);
  } catch (err) {
    if (err.code === "INVALID_ARGUMENT") {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    if (err.code === "CONTRACT_NOT_FOUND") {
      return res.status(503).json({ error: err.message });
    }
    console.error("[GET /api/badges/:address]", err);
    res.status(500).json({ error: "Failed to fetch badges for wallet" });
  }
});

app.listen(PORT, () => {
  console.log(`SkillBadge API listening on http://localhost:${PORT}`);
});
