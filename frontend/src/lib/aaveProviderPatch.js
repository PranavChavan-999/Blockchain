/**
 * Patches @aave/account EthereumProvider before ConnectKit creates the connector.
 */
import {
  AaveAccountSdk,
  EthereumProvider,
  EthereumProviderConnectionTimeoutError,
  production,
} from "@aave/account";

const CACHED_SESSION_KEY = "aave_wallet__cached_session";
const CONNECTION_WAIT_MS = 120_000;
const POLL_MS = 300;

function readCachedAaveSession() {
  try {
    const raw = localStorage.getItem(CACHED_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilConnected(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (AaveAccountSdk.isConnected()) {
      return true;
    }
    if (!AaveAccountSdk.isConnecting()) {
      return false;
    }
    await sleep(POLL_MS);
  }
  return AaveAccountSdk.isConnected();
}

export function applyAaveProviderPatch() {
  if (typeof window === "undefined" || window.__aaveProviderPatchApplied) {
    return;
  }

  if (!EthereumProvider?.prototype) {
    return;
  }

  if (!EthereumProvider.prototype.__initializeLazyConnectionOriginal) {
    EthereumProvider.prototype.__initializeLazyConnectionOriginal =
      EthereumProvider.prototype.initializeLazyConnection;

    EthereumProvider.prototype.initializeLazyConnection =
      async function initializeLazyConnectionPatched() {
        if (!readCachedAaveSession()) {
          return;
        }
        return this.__initializeLazyConnectionOriginal();
      };
  }

  if (!EthereumProvider.prototype.__waitForConnectionOriginal) {
    EthereumProvider.prototype.__waitForConnectionOriginal =
      EthereumProvider.prototype.waitForConnection;

    EthereumProvider.prototype.waitForConnection =
      async function waitForConnectionPatched() {
        if (AaveAccountSdk.isConnected()) {
          return;
        }

        if (AaveAccountSdk.isConnecting()) {
          const ok = await waitUntilConnected(CONNECTION_WAIT_MS);
          if (!ok) {
            throw new EthereumProviderConnectionTimeoutError();
          }
          return;
        }

        const connectPromise = AaveAccountSdk.connect(
          this._config?.options ?? production
        );

        const timedOut = await Promise.race([
          connectPromise.then(() => false),
          sleep(CONNECTION_WAIT_MS).then(() => true),
        ]);

        if (timedOut && !AaveAccountSdk.isConnected()) {
          throw new EthereumProviderConnectionTimeoutError();
        }
      };
  }

  window.__aaveProviderPatchApplied = true;
}
