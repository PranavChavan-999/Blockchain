/**
 * Re-applies UGF balance/auth loop fixes after npm install.
 * Patches @tychilabs/react-ugf/dist/index.mjs in node_modules.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(
  __dirname,
  "../node_modules/@tychilabs/react-ugf/dist/index.mjs"
);

if (!fs.existsSync(target)) {
  console.warn("[patch-react-ugf] Package not installed, skipping");
  process.exit(0);
}

let src = fs.readFileSync(target, "utf8");

if (src.includes("AUTH_FAIL_COOLDOWN_MS")) {
  console.log("[patch-react-ugf] Already patched");
  process.exit(0);
}

src = src.replace(
  "var authInFlight = {};\nvar STORAGE_PREFIX = \"ugf_auth\";",
  `var authInFlight = {};
var lastAuthFailAt = {};
var AUTH_FAIL_COOLDOWN_MS = 6e4;
var balanceFetchInFlight = false;
var STORAGE_PREFIX = "ugf_auth";`
);

src = src.replace(
  `  if (authInFlight[normalizedMode]) {
    return authInFlight[normalizedMode];
  }
  authInFlight[normalizedMode] = (async () => {
    try {
      const token = await c.auth.login(signer);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          address: currentAddress,
          token,
          expiry: Date.now() + 24 * 60 * 60 * 1e3
        })
      );
      authenticatedAddresses[normalizedMode] = currentAddress;
      return c;
    } finally {
      authInFlight[normalizedMode] = null;
    }
  })();
  return authInFlight[normalizedMode];
}`,
  `  if (lastAuthFailAt[normalizedMode] && Date.now() - lastAuthFailAt[normalizedMode] < AUTH_FAIL_COOLDOWN_MS) {
    throw new Error("UGF auth cooldown — try again shortly");
  }
  if (authInFlight[normalizedMode]) {
    return authInFlight[normalizedMode];
  }
  authInFlight[normalizedMode] = (async () => {
    try {
      const token = await c.auth.login(signer);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          address: currentAddress,
          token,
          expiry: Date.now() + 24 * 60 * 60 * 1e3
        })
      );
      authenticatedAddresses[normalizedMode] = currentAddress;
      return c;
    } catch (e) {
      lastAuthFailAt[normalizedMode] = Date.now();
      throw e;
    } finally {
      authInFlight[normalizedMode] = null;
    }
  })();
  return authInFlight[normalizedMode];
}`
);

src = src.replace(
  "balanceIntervalRef.current = setInterval(fetchBalance, 2e3);",
  `balanceFetchInFlight = false;
      }
    };
    await fetchBalance();
    balanceIntervalRef.current = setInterval(fetchBalance, 3e4);`
);

// Balance guard: only apply if old 2e3 interval still present
if (src.includes("setInterval(fetchBalance, 2e3)")) {
  src = src.replace(
    `    const fetchBalance = async () => {
      if (!signer) return;
      try {
        const bal = await getTokenBalance(signer, tokenAddress, chainId, mode);
        setDecimals(bal.decimals);
        setBalance(bal.formatted);
      } catch {
        setBalance("\\u2014");
      }
    };
    await fetchBalance();
    balanceIntervalRef.current = setInterval(fetchBalance, 2e3);`,
    `    const fetchBalance = async () => {
      if (!signer || balanceFetchInFlight) return;
      balanceFetchInFlight = true;
      try {
        const bal = await getTokenBalance(signer, tokenAddress, chainId, mode);
        setDecimals(bal.decimals);
        setBalance(bal.formatted);
      } catch {
        setBalance("\\u2014");
      } finally {
        balanceFetchInFlight = false;
      }
    };
    await fetchBalance();
    balanceIntervalRef.current = setInterval(fetchBalance, 3e4);`
  );
}

fs.writeFileSync(target, src);
console.log("[patch-react-ugf] Patched successfully");
