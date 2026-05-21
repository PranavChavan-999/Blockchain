import { useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { api } from "../lib/api";
import { formatAuthError } from "../lib/authErrors";
import { isAaveConnector, waitForAaveReady } from "../lib/aaveAccount";
import { useAuthStore } from "../stores/authStore";

/**
 * Syncs ConnectKit/wagmi wallet state with backend JWT auth.
 */
export function useWalletAuth() {
  const { address, isConnected, status, connector } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const signingRef = useRef(false);

  const {
    user,
    isAuthenticated,
    authLoading,
    setWallet,
    setAuth,
    setAuthLoading,
    setAuthError,
    setAuthStatusMessage,
    clearAuth,
    hydrateFromStorage,
  } = useAuthStore();

  const isReady =
    isConnected && status === "connected" && !!address;

  useEffect(() => {
    if (!isConnected || !address) {
      clearAuth();
      return;
    }

    if (status === "connecting" || status === "reconnecting") {
      return;
    }

    if (
      user?.walletAddress &&
      user.walletAddress.toLowerCase() !== address.toLowerCase()
    ) {
      clearAuth();
    }

    setWallet(address);

    if (!isReady) {
      return;
    }

    if (hydrateFromStorage(address)) {
      setAuthStatusMessage(null);
      return;
    }

    if (isAuthenticated || authLoading || signingRef.current) {
      return;
    }

    let cancelled = false;

    async function authenticate() {
      signingRef.current = true;
      setAuthLoading(true);
      setAuthError(null);

      try {
        if (isAaveConnector(connector)) {
          setAuthStatusMessage("Connecting Aave Account…");
          const aave = await waitForAaveReady();
          if (cancelled) return;
          if (!aave.ok) {
            throw new Error(aave.detail);
          }
        }

        setAuthStatusMessage("Requesting sign-in message from server…");
        const { message } = await api.post("/api/auth/nonce", {
          walletAddress: address,
        });

        setAuthStatusMessage("Please sign the message in your wallet…");
        const signature = await signMessageAsync({ message });

        if (cancelled) return;

        setAuthStatusMessage("Verifying signature…");
        const { token, user: profile } = await api.post("/api/auth/verify", {
          walletAddress: address,
          signature,
        });

        if (cancelled) return;

        setAuth({ token, user: profile, walletAddress: address });
        setAuthStatusMessage(null);
      } catch (err) {
        if (cancelled) return;
        const msg = formatAuthError(err);
        console.error("[useWalletAuth]", err);
        setAuthError(msg);
        setAuthStatusMessage(null);
        clearAuth();
        setWallet(address);
      } finally {
        signingRef.current = false;
        if (!cancelled) setAuthLoading(false);
      }
    }

    authenticate();

    return () => {
      cancelled = true;
    };
  }, [
    isConnected,
    isReady,
    status,
    address,
    connector,
    user,
    isAuthenticated,
    authLoading,
    signMessageAsync,
    setWallet,
    setAuth,
    setAuthLoading,
    setAuthError,
    setAuthStatusMessage,
    clearAuth,
    hydrateFromStorage,
  ]);
}
