import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/rpc/mainnet": {
        target: "https://ethereum-rpc.publicnode.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/rpc\/mainnet\/?/, "") || "/",
      },
      "/rpc/base-sepolia": {
        target: "https://sepolia.base.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/rpc\/base-sepolia/, "") || "/",
      },
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ["events", "buffer", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  envDir: __dirname,
  resolve: {
    alias: {
      events: path.resolve(__dirname, "node_modules/events/events.js"),
    },
  },
  optimizeDeps: {
    include: [
      "events",
      "buffer",
      "connectkit",
      "@aave/account",
    ],
  },
});
