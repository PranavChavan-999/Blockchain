/**
 * Dedupes in-flight /auth/nonce fetches and applies a cooldown after 429.
 * Chains with installRpcFetchProxy (must run after rpc proxy is installed).
 */

const NONCE_COOLDOWN_MS = 60_000;

let nonceInFlight = null;
let lastNonce429At = 0;

function isNonceUrl(url) {
  return typeof url === "string" && url.includes("/auth/nonce");
}

export function installAuthFetchGuard() {
  if (typeof window === "undefined" || window.__authFetchGuardInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function authGuardFetch(input, init) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input?.url;

    if (!isNonceUrl(url)) {
      return originalFetch(input, init);
    }

    if (Date.now() - lastNonce429At < NONCE_COOLDOWN_MS) {
      const err = new Error("Nonce rate limited — try again shortly");
      err.status = 429;
      throw err;
    }

    if (nonceInFlight) {
      return nonceInFlight;
    }

    nonceInFlight = originalFetch(input, init)
      .then(async (res) => {
        if (res.status === 429) {
          lastNonce429At = Date.now();
        }
        return res;
      })
      .catch((err) => {
        if (err?.status === 429) {
          lastNonce429At = Date.now();
        }
        throw err;
      })
      .finally(() => {
        nonceInFlight = null;
      });

    return nonceInFlight;
  };

  window.__authFetchGuardInstalled = true;
}

export function resetAuthFetchGuard() {
  nonceInFlight = null;
  lastNonce429At = 0;
}
