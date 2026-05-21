import { BASE_SEPOLIA_CHAIN_ID_HEX } from "../config/constants";

/**
 * Wait until the active connector's provider exposes at least one account.
 * Prevents personal_sign / SIWE before MetaMask finishes eth_requestAccounts.
 */
export async function waitForProviderAccounts(connector, { timeoutMs = 12_000 } = {}) {
  if (!connector) return [];

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const provider = await connector.getProvider();
      if (!provider?.request) break;

      const existing = await provider.request({ method: "eth_accounts" });
      if (existing?.length > 0) {
        return existing;
      }
    } catch (err) {
      if (err?.code === 4001) throw err;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return [];
}

/**
 * Explicitly request accounts (opens MetaMask if not yet connected to this site).
 */
export async function requestProviderAccounts(connector) {
  const provider = await connector?.getProvider();
  if (!provider?.request) {
    throw new Error("Wallet provider not available");
  }
  return provider.request({ method: "eth_requestAccounts" });
}

export async function ensureProviderAccounts(connector) {
  let accounts = await waitForProviderAccounts(connector, { timeoutMs: 800 });
  if (accounts.length > 0) return accounts;

  accounts = await requestProviderAccounts(connector);
  if (accounts?.length > 0) return accounts;

  return waitForProviderAccounts(connector, { timeoutMs: 10_000 });
}

export async function switchProviderToBaseSepolia(connector) {
  const provider = await connector?.getProvider();
  if (!provider?.request) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err) {
    if (err?.code !== 4902) throw err;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
          chainName: "Base Sepolia",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://sepolia.base.org"],
          blockExplorerUrls: ["https://sepolia.basescan.org"],
        },
      ],
    });
  }
}
