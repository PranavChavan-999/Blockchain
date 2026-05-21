import { applyAaveProviderPatch } from "./lib/aaveProviderPatch";
import { installRpcFetchProxy } from "./lib/rpcProxy";

applyAaveProviderPatch();
installRpcFetchProxy();

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason || "");
  if (
    msg.includes("Aave Account") ||
    msg.includes("AaveAccountSdk") ||
    event.reason?.name === "EthereumProviderConnectionTimeoutError"
  ) {
    console.warn("[Aave Account]", event.reason);
    event.preventDefault();
  }
});

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { UGFProvider } from "@tychilabs/react-ugf";
import Web3Provider from "./providers/Web3Provider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Web3Provider>
      <UGFProvider network="base-sepolia">
        <App />
      </UGFProvider>
    </Web3Provider>
  </React.StrictMode>
);