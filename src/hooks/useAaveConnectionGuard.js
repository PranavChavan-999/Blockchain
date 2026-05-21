import { useEffect } from "react";
import { useAccount } from "wagmi";
import { applyAaveProviderPatch } from "../lib/aaveProviderPatch";
import { connectAaveAccount, isAaveConnector } from "../lib/aaveAccount";
import { useAuthStore } from "../stores/authStore";

/**
 * When user picks Aave in ConnectKit, start SDK.connect() early (before 5s provider timeout).
 */
export function useAaveConnectionGuard() {
  const { connector, status, isConnected } = useAccount();
  const setAuthStatusMessage = useAuthStore((s) => s.setAuthStatusMessage);

  useEffect(() => {
    applyAaveProviderPatch();
  }, []);

  useEffect(() => {
    if (!isAaveConnector(connector)) return;

    if (status === "connecting") {
      setAuthStatusMessage("Opening Aave Account — complete sign-in in the popup…");
      connectAaveAccount().then((result) => {
        if (!result.ok) {
          setAuthStatusMessage(result.message);
        }
      });
      return;
    }

    if (isConnected && status === "connected") {
      setAuthStatusMessage(null);
    }
  }, [connector, status, isConnected, setAuthStatusMessage]);
}
