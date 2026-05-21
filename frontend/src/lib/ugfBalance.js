/**
 * Throttled balance fetch for UGF modal — avoids parallel ensureAuth/login storms.
 */

import { JsonRpcProvider, Contract, formatUnits } from "ethers";
import { ugfLogin } from "./ugfAuth";

const MIN_POLL_MS = 30_000;
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

let isFetchingBalance = false;
let balancePollInterval = null;

async function readTestnetBalance(signer, tokenAddress) {
  const address = await signer.getAddress();
  const provider = new JsonRpcProvider(BASE_SEPOLIA_RPC);
  const token = new Contract(tokenAddress, ERC20_ABI, provider);
  const [raw, decimals] = await Promise.all([
    token.balanceOf(address),
    token.decimals(),
  ]);
  return {
    raw: raw.toString(),
    decimals: Number(decimals),
    formatted: Number(formatUnits(raw, decimals)).toFixed(4),
  };
}

async function readMainnetBalance(signer, tokenAddress, chainId) {
  const token = await ugfLogin(signer, "mainnet");
  if (!token) {
    throw new Error("UGF auth unavailable");
  }
  const address = await signer.getAddress();
  const res = await fetch(
    `https://gateway.universalgasframework.com/balance?chain_id=${chainId}&token_address=${tokenAddress}&address=${address}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Balance fetch failed");
  const dec = Number(data.decimals);
  return {
    raw: data.raw,
    decimals: dec,
    formatted: (Number(data.raw) / Math.pow(10, dec)).toFixed(4),
  };
}

/**
 * Single-flight balance read.
 */
export async function fetchBalanceThrottled(signer, tokenAddress, chainId, mode) {
  if (isFetchingBalance) return null;
  isFetchingBalance = true;
  try {
    if (mode === "testnet") {
      return await readTestnetBalance(signer, tokenAddress);
    }
    return await readMainnetBalance(signer, tokenAddress, chainId);
  } finally {
    isFetchingBalance = false;
  }
}

export function startBalancePolling(signer, tokenAddress, chainId, mode, onBalance) {
  stopBalancePolling();

  const tick = async () => {
    try {
      const bal = await fetchBalanceThrottled(
        signer,
        tokenAddress,
        chainId,
        mode
      );
      if (bal) onBalance(bal);
    } catch {
      onBalance(null);
    }
  };

  tick();
  balancePollInterval = setInterval(tick, MIN_POLL_MS);
}

export function stopBalancePolling() {
  if (balancePollInterval) {
    clearInterval(balancePollInterval);
    balancePollInterval = null;
  }
  isFetchingBalance = false;
}
