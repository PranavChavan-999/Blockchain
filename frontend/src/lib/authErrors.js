/**
 * MetaMask / EIP-1193: user disconnected or rejected before authorizing the method.
 * @see https://docs.metamask.io/wallet/reference/json-rpc-api/#error-codes
 */
function extractErrorCode(err, depth = 0) {
  if (!err || depth > 4) return undefined;
  const code = err.code ?? err.info?.error?.code;
  if (code === 4100 || code === 4001) return code;
  return extractErrorCode(err.cause, depth + 1);
}

export function isWalletNotAuthorized(err) {
  if (!err) return false;
  const code = extractErrorCode(err) ?? err.code;
  const message = (err.message || err.shortMessage || String(err)).toLowerCase();
  return (
    code === 4100 ||
    code === 4001 ||
    message.includes("not authorized") ||
    message.includes("not been authorized") ||
    message.includes("user rejected")
  );
}

export function isUserRejectedSign(err) {
  return extractErrorCode(err) === 4001;
}

/**
 * Turns wallet / API / Aave errors into user-facing messages with detail.
 */
export function formatAuthError(err) {
  if (!err) {
    return "Unknown authentication error.";
  }

  const name = err.name || "";
  const message = err.message || String(err);
  const code = err.code ?? err.body?.code;
  const status = err.status ?? err.body?.status;
  const short = err.shortMessage;

  if (name === "EthereumProviderConnectionTimeoutError" || message.includes("connection timeout")) {
    return [
      "Aave Account connection timed out.",
      "Complete the Aave login popup within 2 minutes, or choose MetaMask / WalletConnect instead.",
      short || message,
    ].join(" ");
  }

  if (message.includes("Aave Account is not connected") || message.includes("AaveAccountSdk.connect")) {
    return [
      "Aave Account is not connected yet.",
      "Click “Continue with Aave” and finish sign-in in the popup before the app can authenticate.",
      message,
    ].join(" ");
  }

  if (name === "UserRejectedRequestError" || code === 4001 || message.includes("User rejected")) {
    return `Signature cancelled in wallet. ${message}`;
  }

  if (message.includes("User cancelled") || message.includes("USER_CANCELLED") || message.includes("Popup blocked")) {
    return `Aave sign-in was cancelled or blocked. ${message}`;
  }

  if (
    status === 401 ||
    message.includes("Nonce expired") ||
    message.includes("NONCE_INVALID") ||
    message.includes("nonce")
  ) {
    return `Sign-in expired. Disconnect and connect again. ${err.body?.error || message}`;
  }

  if (message.includes("Wrong network") || message.includes("chain ID")) {
    return err.body?.error || message;
  }

  if (status === 403) {
    return `Access denied. ${err.body?.error || message}`;
  }

  if (status === 503 || code === "DB_NOT_CONFIGURED" || code === "DB_UPSERT_FAILED") {
    return `Backend unavailable. ${err.body?.error || message}`;
  }

  if (status >= 500) {
    return `Server error (${status}). ${err.body?.error || message}`;
  }

  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return `Cannot reach the API. Is the backend running on ${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}? ${message}`;
  }

  if (short) {
    return `${short} (${message})`;
  }

  return message || "Could not sign in with wallet.";
}
