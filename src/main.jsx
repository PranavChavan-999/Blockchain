import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UGFProvider } from "@tychilabs/react-ugf";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UGFProvider network="base-sepolia">
      <App />
    </UGFProvider>
  </React.StrictMode>
);