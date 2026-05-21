const jwt = require("jsonwebtoken");

/**
 * Stateless JWT auth — attaches req.user = { address }.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("[authMiddleware] JWT_SECRET is not configured");
    return res.status(500).json({ error: "Authentication is not configured" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const address = decoded.address || decoded.walletAddress;

    if (!address) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { address: address.toLowerCase() };
    req.auth = { walletAddress: address.toLowerCase(), userId: decoded.userId };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = authMiddleware;
