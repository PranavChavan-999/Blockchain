/**
 * Shared auth session utilities — singleton login lock, JWT cache, nonce backoff.
 */

const NONCE_MAX_ATTEMPTS = 3;
const AUTH_FAIL_COOLDOWN_MS = 60_000;

let authPromise = null;
let lastAuthFailAt = 0;

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp - 60;
  } catch {
    return true;
  }
}

export function isInAuthCooldown() {
  return Date.now() - lastAuthFailAt < AUTH_FAIL_COOLDOWN_MS;
}

export function markAuthFailed() {
  lastAuthFailAt = Date.now();
}

export function clearAuthCooldown() {
  lastAuthFailAt = 0;
}

/**
 * Runs at most one login flow at a time; returns the same promise to concurrent callers.
 */
export async function runWithAuthLock(loginFn) {
  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      return await loginFn();
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

/**
 * GET nonce with exponential backoff on 429 (max 3 attempts).
 */
export async function getNonceWithBackoff(fetchNonce, attempt = 0) {
  try {
    return await fetchNonce();
  } catch (err) {
    const status = err?.status ?? err?.response?.status;
    if (status === 429 && attempt < NONCE_MAX_ATTEMPTS - 1) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      return getNonceWithBackoff(fetchNonce, attempt + 1);
    }
    if (status === 429) {
      markAuthFailed();
    }
    throw err;
  }
}

export function cancelAuthInFlight() {
  authPromise = null;
  lastAuthFailAt = 0;
}
