/**
 * Resilience for UGF gateway calls (registry often blocks or times out on some networks).
 * Testnet mode still hits gateway.universalgasframework.com/tokens/registry via ugf-testnet-js.
 */

export const UGF_GATEWAY_ORIGIN = "https://gateway.universalgasframework.com";

const REGISTRY_PATH = "/tokens/registry";
const CACHE_KEY = "ugf:tokens:registry:v1";
const FETCH_TIMEOUT_MS = 12_000;

/** Minimal registry for Base Sepolia testnet (TYI_MOCK_USD). */
export const TESTNET_REGISTRY_FALLBACK = {
  payment_options: [
    {
      token: "TYI_MOCK_USD",
      type: "x402",
      chain_type: "evm",
      receiver_address: "0xF9eA6CCf7e7AD134737821C1a918EA1cC4f2be1d",
      chains: [
        {
          chain_id: "84532",
          chain_type: "evm",
          address: "0x27DC1C167AeF232bb1e21073304B526726a8727e",
        },
      ],
    },
  ],
  vault_abi:
    '[{"inputs":[{"internalType":"bytes32","name":"digest","type":"bytes32"}],"name":"payForFuel","outputs":[],"stateMutability":"payable","type":"function"}]',
};

function resolveUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input && typeof input.url === "string") return input.url;
  return "";
}

function isGatewayRegistryRequest(url) {
  return (
    url.startsWith(UGF_GATEWAY_ORIGIN) && url.includes(REGISTRY_PATH)
  );
}

function registryFallbackResponse(cached) {
  const body = cached || JSON.stringify(TESTNET_REGISTRY_FALLBACK);
  console.warn(
    "[UGF] gateway registry unreachable — using",
    cached ? "cached registry" : "built-in testnet registry"
  );
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function cacheRegistryResponse(response) {
  if (!response.ok) return;
  try {
    const data = await response.clone().json();
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function installUgfGatewayFetchGuard() {
  if (typeof window === "undefined" || window.__ugfGatewayFetchGuardInstalled) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function ugfGatewayFetch(input, init) {
    const url = resolveUrl(input);
    if (!url.startsWith(UGF_GATEWAY_ORIGIN)) {
      return originalFetch(input, init);
    }

    const isRegistry = isGatewayRegistryRequest(url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    if (init?.signal) {
      if (init.signal.aborted) controller.abort();
      else init.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await originalFetch(url, {
        ...init,
        signal: controller.signal,
      });
      if (isRegistry) await cacheRegistryResponse(response);
      return response;
    } catch (err) {
      if (isRegistry) {
        const cached = localStorage.getItem(CACHE_KEY);
        return registryFallbackResponse(cached);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  window.__ugfGatewayFetchGuardInstalled = true;
}

export function isUgfGatewayFetchError(reason) {
  const msg = reason?.message || String(reason || "");
  return (
    msg.includes("Failed to fetch") &&
    (msg.includes("gateway.universalgasframework.com") ||
      msg.includes("/tokens/registry"))
  );
}
