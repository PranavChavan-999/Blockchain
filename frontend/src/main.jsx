import { applyAaveProviderPatch } from "./lib/aaveProviderPatch";
import { installAuthFetchGuard } from "./lib/authFetchGuard";
import { installRpcFetchProxy } from "./lib/rpcProxy";
import {
  installUgfGatewayFetchGuard,
  isUgfGatewayFetchError,
} from "./lib/ugfGatewayFetch";

applyAaveProviderPatch();
installRpcFetchProxy();
installAuthFetchGuard();
installUgfGatewayFetchGuard();

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason || "");
  if (
    msg.includes("Aave Account") ||
    msg.includes("AaveAccountSdk") ||
    event.reason?.name === "EthereumProviderConnectionTimeoutError"
  ) {
    console.warn("[Aave Account]", event.reason);
    event.preventDefault();
    return;
  }
  if (isUgfGatewayFetchError(event.reason)) {
    console.warn("[UGF] gateway fetch failed (registry may use fallback)", event.reason);
    event.preventDefault();
  }
});

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/master-theme.css";
import App from "./App";
import { UGFProvider } from "@tychilabs/react-ugf";
import Web3Provider from "./providers/Web3Provider";

// StrictMode disabled during dev: it double-mounts effects and amplifies MetaMask
// eth_accounts / StreamMiddleware warnings with wagmi + ConnectKit + Aave Account.
ReactDOM.createRoot(document.getElementById("root")).render(
  <Web3Provider>
    <UGFProvider mode="testnet">
      <App />
    </UGFProvider>
  </Web3Provider>
);