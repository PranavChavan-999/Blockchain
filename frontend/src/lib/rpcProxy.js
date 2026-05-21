/**
 * Rewrites browser RPC calls to same-origin proxies (Vite dev server).
 * viem's default mainnet RPC (eth.merkle.io) blocks CORS and rate-limits heavily.
 */

const MAINNET_PROXY =
  import.meta.env.VITE_MAINNET_RPC_PROXY ||
  (import.meta.env.DEV ? "/rpc/mainnet" : null);

const BASE_SEPOLIA_PROXY =
  import.meta.env.VITE_BASE_SEPOLIA_RPC_PROXY ||
  (import.meta.env.DEV ? "/rpc/base-sepolia" : null);

/** RPC hosts we replace in dev (merkle + viem default). */
const RPC_REWRITES = [
  { from: "https://eth.merkle.io", to: MAINNET_PROXY },
  { from: "https://cloudflare-eth.com", to: MAINNET_PROXY },
  { from: "https://ethereum-rpc.publicnode.com", to: MAINNET_PROXY },
  { from: "https://sepolia.base.org", to: BASE_SEPOLIA_PROXY },
].filter((r) => r.to);

function rewriteUrl(url) {
  for (const { from, to } of RPC_REWRITES) {
    if (url === from || url.startsWith(`${from}/`)) {
      const path = url.slice(from.length) || "";
      const base = to.endsWith("/") ? to.slice(0, -1) : to;
      return `${base}${path}`;
    }
  }
  return url;
}

export function installRpcFetchProxy() {
  if (typeof window === "undefined" || window.__rpcFetchProxyInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function rpcProxyFetch(input, init) {
    let url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const rewritten = rewriteUrl(url);

    if (typeof input === "string" || input instanceof URL) {
      return originalFetch(rewritten, init);
    }

    return originalFetch(new Request(rewritten, input), init);
  };

  window.__rpcFetchProxyInstalled = true;
}
