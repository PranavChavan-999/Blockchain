import { useEffect, useRef } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { BASE_SEPOLIA_CHAIN_ID } from "../config/auth";
import { switchProviderToBaseSepolia } from "../lib/walletReady";
import { isAaveConnector } from "../lib/aaveAccount";

/**
 * After ConnectKit connects, prompt Base Sepolia if the wallet is on another chain.
 */
export function useBaseSepoliaNetwork() {
  const { isConnected, status, connector } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const switchingRef = useRef(false);

  useEffect(() => {
    if (!isConnected || status !== "connected" || !connector) return;
    if (chainId === BASE_SEPOLIA_CHAIN_ID) return;
    if (switchingRef.current) return;

    switchingRef.current = true;

    (async () => {
      try {
        await switchChainAsync({ chainId: BASE_SEPOLIA_CHAIN_ID });
      } catch {
        if (!isAaveConnector(connector)) {
          try {
            await switchProviderToBaseSepolia(connector);
          } catch (err) {
            console.warn("[network] Base Sepolia switch failed:", err?.message ?? err);
          }
        }
      } finally {
        switchingRef.current = false;
      }
    })();
  }, [isConnected, status, connector, chainId, switchChainAsync]);
}
