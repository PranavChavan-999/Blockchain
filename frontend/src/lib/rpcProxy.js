/**
 * Rewrites browser RPC calls to same-origin proxies (Vite dev / Vercel rewrites).
 * viem's default mainnet RPC (eth.merkle.io) blocks CORS and rate-limits heavily.
 */

import { RPC_REWRITE_TARGETS } from "./rpcConfig";

function rewriteUrl(url) {
  for (const { from, to } of RPC_REWRITE_TARGETS) {
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
