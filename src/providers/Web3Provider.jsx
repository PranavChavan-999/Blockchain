import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig } from "../config/wagmi";
import { useAaveConnectionGuard } from "../hooks/useAaveConnectionGuard";
import { useWalletAuth } from "../hooks/useWalletAuth";
const queryClient = new QueryClient();

function WalletAuthSync() {
  useAaveConnectionGuard();
  useWalletAuth();
  return null;
}

export default function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <WalletAuthSync />
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
