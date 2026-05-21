const { normalizeAddress, isValidEthereumAddress } = require("../utils/wallet");

function collectWalletAddresses(req) {
  const addresses = [];

  if (req.body?.walletAddress) addresses.push(req.body.walletAddress);
  if (req.query?.walletAddress) addresses.push(req.query.walletAddress);
  if (req.params?.walletAddress) addresses.push(req.params.walletAddress);
  if (req.params?.address) addresses.push(req.params.address);

  return addresses;
}

function walletAccessGuard(req, res, next) {
  if (!req.auth?.walletAddress) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const addresses = collectWalletAddresses(req);
  if (addresses.length === 0) {
    return next();
  }

  let authWallet;
  try {
    authWallet = normalizeAddress(req.auth.walletAddress);
  } catch {
    return res.status(401).json({ error: "Invalid authenticated wallet" });
  }

  for (const raw of addresses) {
    if (!isValidEthereumAddress(raw)) {
      return res.status(400).json({ error: "Invalid wallet address in request" });
    }
    try {
      if (normalizeAddress(raw) !== authWallet) {
        return res.status(403).json({
          error: "Wallet address does not match authenticated user",
        });
      }
    } catch {
      return res.status(400).json({ error: "Invalid wallet address in request" });
    }
  }

  next();
}

module.exports = walletAccessGuard;
