import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useConnectionEffect } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig, wagmiProviderOptions } from "../config/wagmi";
import { useAaveConnectionGuard } from "../hooks/useAaveConnectionGuard";
import { useBaseSepoliaNetwork } from "../hooks/useBaseSepoliaNetwork";
import { useWalletAuth } from "../hooks/useWalletAuth";
import { useAuthStore } from "../store/useAuthStore";
import { apiPost } from "../lib/api";
import { cancelAuthInFlight } from "../lib/authSession";
import { resetAuthFetchGuard } from "../lib/authFetchGuard";
import { clearUgfAuth } from "../lib/ugfAuth";
import { stopBalancePolling } from "../lib/ugfBalance";

const queryClient = new QueryClient();

function WalletAuthSync() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const token = useAuthStore((s) => s.token);

  useConnectionEffect({
    onDisconnect() {
      cancelAuthInFlight();
      resetAuthFetchGuard();
      stopBalancePolling();
      clearUgfAuth("testnet");
      clearUgfAuth("mainnet");
      if (token) {
        apiPost("/api/auth/logout").catch(() => {});
      }
      clearAuth();
    },
  });

  useAaveConnectionGuard();
  useBaseSepoliaNetwork();
  useWalletAuth();

  return null;
}

export default function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig} {...wagmiProviderOptions}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <WalletAuthSync />
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
