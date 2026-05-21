/**
 * UGF gateway auth helpers — singleton lock, token cache, nonce backoff, 4100 guard.
 * Used by the react-ugf dist patch and available for direct imports.
 */

import { isUserRejectedSign, isWalletNotAuthorized } from "./authErrors";
import {
  cancelAuthInFlight,
  getNonceWithBackoff,
  isInAuthCooldown,
  isTokenExpired,
  markAuthFailed,
  runWithAuthLock,
} from "./authSession";

const UGF_STORAGE_PREFIX = "ugf_auth";
const UGF_GATEWAY = "https://gateway.universalgasframework.com";

let ugfHttpToken = null;

function getStorageKey(mode) {
  return `${UGF_STORAGE_PREFIX}:${mode}`;
}

function getSavedUgfSession(mode, currentAddress) {
  try {
    const raw = localStorage.getItem(getStorageKey(mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed.address?.toLowerCase() === currentAddress.toLowerCase() &&
      parsed.expiry > Date.now() &&
      parsed.token &&
      !isTokenExpired(parsed.token)
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function httpGet(path) {
  const res = await fetch(`${UGF_GATEWAY}${path}`, {
    headers: ugfHttpToken ? { Authorization: `Bearer ${ugfHttpToken}` } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || res.statusText || "UGF request failed");
    err.status = res.status;
    throw err;
  }
  return body;
}

async function httpPost(path, data) {
  const res = await fetch(`${UGF_GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ugfHttpToken ? { Authorization: `Bearer ${ugfHttpToken}` } : {}),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || res.statusText || "UGF request failed");
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function getNonce(address) {
  const { nonce } = await httpGet(
    `/auth/nonce?address=${encodeURIComponent(address)}`
  );
  return nonce;
}

export async function verifyAndGetToken(address, nonce, signature) {
  const res = await httpPost("/auth/wallet-login", { address, nonce, signature });
  if (!res.token) throw new Error("UGF login failed — no token returned");
  ugfHttpToken = res.token;
  return res.token;
}

/**
 * UGF gateway login with guards (used by patched ensureAuth).
 */
/**
 * UGF gateway login via wagmi signMessageAsync (avoids unauthorized BrowserProvider signer).
 */
export async function ugfPreauthWithSignMessage(
  address,
  signMessageAsync,
  mode = "testnet"
) {
  if (!address || !signMessageAsync) return null;

  const saved = getSavedUgfSession(mode, address);
  if (saved) {
    ugfHttpToken = saved.token;
    return saved.token;
  }

  return runWithAuthLock(async () => {
    if (isInAuthCooldown()) return null;

    let nonce;
    try {
      nonce = await getNonceWithBackoff(() => getNonce(address));
    } catch (err) {
      markAuthFailed();
      console.warn("[UGF] getNonce failed:", err);
      return null;
    }

    let signature;
    try {
      signature = await signMessageAsync({
        message: `Sign in to UGF\nNonce: ${nonce}`,
      });
    } catch (err) {
      if (isWalletNotAuthorized(err) || isUserRejectedSign(err)) {
        console.warn("[UGF] UGF sign skipped — wallet not authorized or rejected");
        return null;
      }
      throw err;
    }

    try {
      const token = await verifyAndGetToken(address, nonce, signature);
      localStorage.setItem(
        getStorageKey(mode),
        JSON.stringify({
          address,
          token,
          expiry: Date.now() + 24 * 60 * 60 * 1000,
        })
      );
      return token;
    } catch (err) {
      markAuthFailed();
      console.warn("[UGF] UGF verify failed:", err);
      return null;
    }
  });
}

export async function ugfLogin(signer, mode = "mainnet") {
  return runWithAuthLock(() => _doLogin(signer, mode));
}

async function _doLogin(signer, mode) {
  if (isInAuthCooldown()) {
    console.warn("[UGF] auth cooldown active — skipping login");
    return null;
  }

  const address = await signer.getAddress();
  if (!address) {
    console.warn("[UGF] No wallet address");
    return null;
  }

  const saved = getSavedUgfSession(mode, address);
  if (saved) {
    ugfHttpToken = saved.token;
    return saved.token;
  }

  if (ugfHttpToken && !isTokenExpired(ugfHttpToken)) {
    return ugfHttpToken;
  }

  let nonce;
  try {
    nonce = await getNonceWithBackoff(() => getNonce(address));
  } catch (err) {
    console.warn("[UGF] getNonce failed, aborting login:", err);
    markAuthFailed();
    return null;
  }

  let signature;
  try {
    signature = await signer.signMessage(`Sign in to UGF\nNonce: ${nonce}`);
  } catch (err) {
    if (isWalletNotAuthorized(err) || isUserRejectedSign(err)) {
      console.warn("[UGF] User not authorized or rejected sign");
      return null;
    }
    throw err;
  }

  try {
    const token = await verifyAndGetToken(address, nonce, signature);
    localStorage.setItem(
      getStorageKey(mode),
      JSON.stringify({
        address,
        token,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      })
    );
    return token;
  } catch (err) {
    markAuthFailed();
    console.warn("[UGF] verify failed:", err);
    return null;
  }
}

export function clearUgfAuth(mode = "mainnet") {
  cancelAuthInFlight();
  ugfHttpToken = null;
  localStorage.removeItem(getStorageKey(mode));
}

