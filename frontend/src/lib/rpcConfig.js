/**
 * RPC URL helpers — relative /rpc/* proxies only work with Vite (dev) or Vercel rewrites (prod).
 */

const DEFAULT_BASE_SEPOLIA = "https://sepolia.base.org";
const DEFAULT_MAINNET = "https://ethereum-rpc.publicnode.com";

/**
 * Resolves a same-origin RPC proxy path for fetch rewriting.
 * In production, relative /rpc/* is only used when set (requires vercel.json rewrites).
 */
export function resolveRpcProxyPath(envValue, devFallback) {
  const value = (envValue || "").trim();
  if (import.meta.env.DEV) {
    return value || devFallback;
  }
  if (value && /^https?:\/\//i.test(value)) {
    return value;
  }
  if (value && value.startsWith("/")) {
    return value;
  }
  return null;
}

/** Wagmi / ethers read provider — prefer direct HTTPS in production. */
export function getBaseSepoliaRpcUrl() {
  return (
    import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
    import.meta.env.VITE_BASE_SEPOLIA_RPC ||
    (import.meta.env.DEV ? "/rpc/base-sepolia" : DEFAULT_BASE_SEPOLIA)
  );
}

export const RPC_PROXY_MAINNET = resolveRpcProxyPath(
  import.meta.env.VITE_MAINNET_RPC_PROXY,
  "/rpc/mainnet"
);

export const RPC_PROXY_BASE_SEPOLIA = resolveRpcProxyPath(
  import.meta.env.VITE_BASE_SEPOLIA_RPC_PROXY,
  "/rpc/base-sepolia"
);

export const RPC_REWRITE_TARGETS = [
  { from: "https://eth.merkle.io", to: RPC_PROXY_MAINNET },
  { from: "https://cloudflare-eth.com", to: RPC_PROXY_MAINNET },
  { from: "https://ethereum-rpc.publicnode.com", to: RPC_PROXY_MAINNET },
  { from: DEFAULT_BASE_SEPOLIA, to: RPC_PROXY_BASE_SEPOLIA },
  { from: DEFAULT_MAINNET, to: RPC_PROXY_MAINNET },
].filter((r) => r.to);
