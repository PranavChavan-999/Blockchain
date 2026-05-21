const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { verifyMessage } = require("ethers");
const { setNonce, getNonce, deleteNonce } = require("../stores/nonceStore");
const { normalizeAddress, isValidEthereumAddress } = require("../utils/wallet");
const { upsertUserByWallet } = require("./users");

const JWT_EXPIRES_IN = "7d";

function buildNonceMessage(walletAddress, nonceId) {
  return [
    "Welcome to ugf-badges!",
    "",
    "Sign this message to prove you own this wallet.",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonceId}`,
  ].join("\n");
}

function createNonceForWallet(walletAddress) {
  if (!isValidEthereumAddress(walletAddress)) {
    const err = new Error("Invalid Ethereum wallet address");
    err.code = "INVALID_ADDRESS";
    throw err;
  }

  const normalized = normalizeAddress(walletAddress);
  const nonceId = uuidv4();
  const message = buildNonceMessage(normalized, nonceId);

  setNonce(normalized, message);
  return message;
}

function verifyWalletSignature(walletAddress, signature) {
  if (!isValidEthereumAddress(walletAddress)) {
    const err = new Error("Invalid Ethereum wallet address");
    err.code = "INVALID_ADDRESS";
    throw err;
  }

  const normalized = normalizeAddress(walletAddress);
  const message = getNonce(normalized);

  if (!message) {
    const err = new Error("Nonce expired or not found. Request a new nonce.");
    err.code = "NONCE_INVALID";
    throw err;
  }

  let recovered;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    const err = new Error("Invalid signature format");
    err.code = "INVALID_SIGNATURE";
    throw err;
  }

  deleteNonce(normalized);

  if (normalizeAddress(recovered) !== normalized) {
    const err = new Error("Signature does not match wallet address");
    err.code = "SIGNATURE_MISMATCH";
    throw err;
  }

  return { normalized, message };
}

function signAuthToken(walletAddress, userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("JWT_SECRET is not configured");
    err.code = "JWT_NOT_CONFIGURED";
    throw err;
  }

  return jwt.sign(
    { walletAddress: normalizeAddress(walletAddress), userId },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function verifyAndAuthenticate(walletAddress, signature) {
  const { normalized } = verifyWalletSignature(walletAddress, signature);
  const user = await upsertUserByWallet(normalized);
  const token = signAuthToken(normalized, user.id);

  return { token, user };
}

module.exports = {
  createNonceForWallet,
  verifyAndAuthenticate,
  JWT_EXPIRES_IN,
};
