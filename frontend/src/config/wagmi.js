import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getAaveAccountOptions } from "../lib/aaveAccount";

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const baseSepoliaRpc =
  import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
  (import.meta.env.DEV ? "/rpc/base-sepolia" : "https://sepolia.base.org");

if (!walletConnectProjectId) {
  console.warn(
    "VITE_WALLETCONNECT_PROJECT_ID is missing. ConnectKit may not work until you add it to .env"
  );
}

/**
 * Passed to <WagmiProvider> (not createConfig). Disables auto-reconnect on mount
 * to avoid duplicate eth_accounts polls and orphaned MetaMask RPC responses.
 */
export const wagmiProviderOptions = {
  reconnectOnMount: false,
};

/** Set VITE_ENABLE_AAVE_ACCOUNT=true to show Aave in ConnectKit (off by default for simpler MetaMask testing). */
const enableAaveAccount =
  import.meta.env.VITE_ENABLE_AAVE_ACCOUNT === "true";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "UGF Badge",
    walletConnectProjectId: walletConnectProjectId || "00000000000000000000000000000000",
    chains: [baseSepolia],
    enableAaveAccount,
    ...(enableAaveAccount ? { aaveAccountOptions: getAaveAccountOptions() } : {}),
    transports: {
      [baseSepolia.id]: http(baseSepoliaRpc),
    },
  })
);
