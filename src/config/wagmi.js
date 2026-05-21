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

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "ugf-badges",
    walletConnectProjectId: walletConnectProjectId || "00000000000000000000000000000000",
    chains: [baseSepolia],
    enableAaveAccount: true,
    aaveAccountOptions: getAaveAccountOptions(),
    transports: {
      [baseSepolia.id]: http(baseSepoliaRpc),
    },
  })
);
