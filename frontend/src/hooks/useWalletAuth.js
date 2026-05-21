import { useCallback, useEffect, useRef } from "react";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { apiGet, apiPost } from "../lib/api";
import {
  formatAuthError,
  isUserRejectedSign,
  isWalletNotAuthorized,
} from "../lib/authErrors";
import { BASE_SEPOLIA_CHAIN_ID, SIWE_STATEMENT } from "../config/auth";
import { isAaveConnector, waitForAaveReady } from "../lib/aaveAccount";
import { ensureProviderAccounts } from "../lib/walletReady";
import { useAuthStore } from "../store/useAuthStore";
import {
  cancelAuthInFlight,
  clearAuthCooldown,
  getNonceWithBackoff,
  isInAuthCooldown,
  isTokenExpired,
  markAuthFailed,
  runWithAuthLock,
} from "../lib/authSession";

function isConnectedReady(address, isConnected, status) {
  return Boolean(address && isConnected && status === "connected");
}

async function getNonce(address) {
  const { nonce } = await apiGet("/api/auth/nonce", {
    params: { address },
  });
  return nonce;
}

/**
 * SIWE sign-in — only runs when wagmi reports a connected wallet.
 * Uses signMessageAsync (never raw BrowserProvider).
 */
async function login({
  address,
  isConnected,
  status,
  chainId,
  connector,
  signMessageAsync,
  setAuth,
  setAuthStatusMessage,
  setAuthError,
  clearAuth,
}) {
  if (!isConnected || !address) {
    console.warn("[UGF] Wallet not connected, skipping login");
    return null;
  }

  if (!isConnectedReady(address, isConnected, status)) {
    console.warn("[UGF] Wallet not ready (connecting), skipping login");
    return null;
  }

  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    setAuthStatusMessage("Switching to Base Sepolia…");
    return null;
  }

  const { token, matchesWallet } = useAuthStore.getState();
  if (token && matchesWallet(address) && !isTokenExpired(token)) {
    return token;
  }

  if (isInAuthCooldown()) {
    console.warn("[UGF] Auth cooldown active — skipping login");
    return null;
  }

  try {
    if (isAaveConnector(connector)) {
      setAuthStatusMessage("Connecting Aave Account…");
      const aave = await waitForAaveReady();
      if (!isConnectedReady(address, isConnected, status)) return null;
      if (!aave.ok) throw new Error(aave.detail);
    }

    setAuthStatusMessage("Requesting sign-in nonce…");
    const nonce = await getNonceWithBackoff(() => getNonce(address));
    if (!nonce) return null;

    if (!isConnectedReady(address, isConnected, status)) return null;

    setAuthStatusMessage("Confirm wallet access in MetaMask…");
    const accounts = await ensureProviderAccounts(connector);
    if (!accounts?.length) {
      setAuthError(
        "MetaMask did not share your account. Open MetaMask, approve this site under Connected sites, then connect again."
      );
      clearAuth();
      return null;
    }

    if (!isConnectedReady(address, isConnected, status)) return null;

    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address,
      statement: SIWE_STATEMENT,
      uri: window.location.origin,
      version: "1",
      chainId: BASE_SEPOLIA_CHAIN_ID,
      nonce,
    });
    const message = siweMessage.prepareMessage();

    setAuthStatusMessage("Please sign the message in your wallet…");

    let signature;
    try {
      signature = await signMessageAsync({ message });
    } catch (err) {
      if (isWalletNotAuthorized(err)) {
        console.warn(
          "[UGF] Wallet not authorized — connect via ConnectKit first"
        );
        setAuthError("Connect your wallet in MetaMask, then try again.");
        clearAuth();
        return null;
      }
      if (isUserRejectedSign(err)) {
        console.warn("[UGF] User rejected the sign request");
        setAuthError("Signature cancelled. Connect again when ready.");
        clearAuth();
        return null;
      }
      throw err;
    }

    if (!isConnectedReady(address, isConnected, status)) return null;

    setAuthStatusMessage("Verifying signature…");
    const { token: newToken, user } = await apiPost("/api/auth/verify", {
      address,
      message,
      signature,
    });

    setAuth(address, newToken, user);
    setAuthStatusMessage(null);
    clearAuthCooldown();
    return newToken;
  } catch (err) {
    if (err?.status === 429) {
      markAuthFailed();
      setAuthError("Too many sign-in attempts. Wait a minute and try again.");
      return null;
    }
    throw err;
  }
}

export function useWalletAuth() {
  const { address, isConnected, status, connector } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const loginStartedRef = useRef(false);
  const connectionRef = useRef({ address, isConnected, status });
  connectionRef.current = { address, isConnected, status };

  const {
    isAuthenticated,
    isLoading,
    matchesWallet,
    setAuth,
    setLoading,
    setAuthError,
    setAuthStatusMessage,
    clearAuth,
  } = useAuthStore();

  const runLogin = useCallback(() => {
    const { address: addr, isConnected: connected, status: st } =
      connectionRef.current;

    return runWithAuthLock(() =>
      login({
        address: addr,
        isConnected: connected,
        status: st,
        chainId,
        connector,
        signMessageAsync,
        setAuth,
        setAuthStatusMessage,
        setAuthError,
        clearAuth,
      })
    );
  }, [
    chainId,
    connector,
    signMessageAsync,
    setAuth,
    setAuthStatusMessage,
    setAuthError,
    clearAuth,
  ]);

  useEffect(() => {
    if (!isConnected || !address) {
      loginStartedRef.current = false;
      cancelAuthInFlight();
      clearAuth();
      return;
    }

    if (status === "connecting" || status === "reconnecting") {
      return;
    }

    if (!isConnectedReady(address, isConnected, status)) {
      return;
    }

    const { token } = useAuthStore.getState();
    if (matchesWallet(address) && token && !isTokenExpired(token)) {
      setAuthStatusMessage(null);
      return;
    }

    if (isLoading || loginStartedRef.current) {
      return;
    }

    if (isInAuthCooldown()) {
      return;
    }

    loginStartedRef.current = true;
    setLoading(true);
    setAuthError(null);

    runLogin()
      .catch((err) => {
        if (isWalletNotAuthorized(err) || isUserRejectedSign(err)) {
          clearAuth();
          return;
        }
        console.error("[useWalletAuth]", err);
        setAuthError(formatAuthError(err));
        clearAuth();
      })
      .finally(() => {
        setLoading(false);
        loginStartedRef.current = false;
      });
  }, [
    address,
    isConnected,
    status,
    chainId,
    isAuthenticated,
    isLoading,
    matchesWallet,
    runLogin,
    clearAuth,
    setLoading,
    setAuthError,
    setAuthStatusMessage,
  ]);
}
