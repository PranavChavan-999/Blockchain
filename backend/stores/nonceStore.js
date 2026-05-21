const NONCE_TTL_MS = 5 * 60 * 1000;

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

function deleteNonce(walletAddress) {
  store.delete(walletAddress.toLowerCase());
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

module.exports = { setNonce, getNonce, deleteNonce, NONCE_TTL_MS };
