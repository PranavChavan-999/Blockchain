import { AaveAccountSdk, production } from "@aave/account";

export const AAve_CONNECTOR_ID = "aaveAccountProvider";
const READY_POLL_MS = 400;
const READY_TIMEOUT_MS = 120_000;

export function isAaveConnector(connector) {
  return connector?.id === AAve_CONNECTOR_ID;
}

export function getAaveAccountOptions() {
  return {
    options: {
      environment: production,
    },
  };
}

/**
 * Explicit Aave connect with a long window for the Family/Aave popup.
 */
export async function connectAaveAccount() {
  if (AaveAccountSdk.isConnected()) {
    return { ok: true, message: "Already connected to Aave Account." };
  }

  try {
    await AaveAccountSdk.connect(getAaveAccountOptions().options);
  } catch (err) {
    return {
      ok: false,
      message: err?.message || "AaveAccountSdk.connect() failed.",
      error: err,
    };
  }

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (AaveAccountSdk.isConnected()) {
      return { ok: true, message: "Aave Account connected." };
    }
    if (!AaveAccountSdk.isConnecting()) {
      break;
    }
    await new Promise((r) => setTimeout(r, READY_POLL_MS));
  }

  return {
    ok: AaveAccountSdk.isConnected(),
    message: AaveAccountSdk.isConnected()
      ? "Aave Account connected."
      : "Timed out waiting for Aave Account after connect().",
  };
}

export async function waitForAaveReady(timeoutMs = READY_TIMEOUT_MS) {
  if (AaveAccountSdk.isConnected()) {
    return { ok: true, detail: "Aave SDK already connected." };
  }

  if (!AaveAccountSdk.isConnecting()) {
    const started = await connectAaveAccount();
    if (!started.ok) {
      return { ok: false, detail: started.message };
    }
    if (AaveAccountSdk.isConnected()) {
      return { ok: true, detail: started.message };
    }
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (AaveAccountSdk.isConnected()) {
      return { ok: true, detail: "Aave Account ready." };
    }
    if (!AaveAccountSdk.isConnecting()) {
      const retry = await connectAaveAccount();
      if (!retry.ok) {
        return { ok: false, detail: retry.message };
      }
    }
    await new Promise((r) => setTimeout(r, READY_POLL_MS));
  }

  return {
    ok: false,
    detail:
      "Aave Account did not connect in time. Finish the Aave popup or use MetaMask / WalletConnect.",
  };
}
