const crypto = require("crypto");

const NONCE_TTL_MS = 15 * 60 * 1000;

/** @type {Map<string, { nonce: string, expiresAt: number }>} */
const store = new Map();

function setNonce(walletAddress, nonce) {
  const key = walletAddress.toLowerCase();
  store.set(key, {
    nonce,
    expiresAt: Date.now() + NONCE_TTL_MS,
  });
}

function getNonce(walletAddress) {
  const key = walletAddress.toLowerCase();
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.nonce;
}

/** Reuse a valid nonce so parallel/retry GET /nonce calls do not invalidate an in-flight sign. */
function getOrCreateNonce(walletAddress) {
  const key = walletAddress.toLowerCase();
  const entry = store.get(key);
  if (entry && Date.now() <= entry.expiresAt) {
    entry.expiresAt = Date.now() + NONCE_TTL_MS;
    return entry.nonce;
  }
  const nonce = crypto.randomBytes(16).toString("hex");
  setNonce(walletAddress, nonce);
  return nonce;
}

function deleteNonce(walletAddress) {
  store.delete(walletAddress.toLowerCase());
}

/** Atomically validate and remove nonce (prevents reuse / double-verify races). */
function consumeNonce(walletAddress, nonce) {
  const key = walletAddress.toLowerCase();
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return false;
  }
  if (entry.nonce !== nonce) {
    return false;
  }
  store.delete(key);
  return true;
}

function purgeExpired() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

setInterval(purgeExpired, 60 * 1000).unref();

module.exports = {
  setNonce,
  getNonce,
  getOrCreateNonce,
  deleteNonce,
  consumeNonce,
  NONCE_TTL_MS,
};
