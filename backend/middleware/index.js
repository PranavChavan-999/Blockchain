const authMiddleware = require("./authMiddleware");
const walletAccessGuard = require("./walletAccessGuard");

/** @deprecated use authMiddleware */
const authenticateJWT = authMiddleware;

module.exports = { authMiddleware, authenticateJWT, walletAccessGuard };
