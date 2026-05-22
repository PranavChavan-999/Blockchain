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

const BALANCE_ORIGINAL = `    const fetchBalance = async () => {
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
    balanceIntervalRef.current = setInterval(fetchBalance, 2e3);`;

const BALANCE_PATCHED = `    const fetchBalance = async () => {
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
    balanceIntervalRef.current = setInterval(fetchBalance, 3e4);`;

const BALANCE_CORRUPTED = `    const fetchBalance = async () => {
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
    balanceFetchInFlight = false;
      }
    };
    await fetchBalance();
    balanceIntervalRef.current = setInterval(fetchBalance, 3e4);`;

const MODAL_OPTIONS_ORIGINAL = `    getAllPaymentOptions(mode).then((opts) => {
      setOptions(opts);
      if (opts.length > 0 && opts[0].chains.length > 0) {
        handleSelect(
          opts[0].token,
          opts[0].chains[0].chainId,
          opts[0].chains[0].tokenAddress
        );
      }
    }).finally(() => setOptionsLoading(false));`;

const MODAL_OPTIONS_PATCHED = `    getAllPaymentOptions(mode).then((opts) => {
      setOptions(opts);
      if (opts.length > 0 && opts[0].chains.length > 0) {
        handleSelect(
          opts[0].token,
          opts[0].chains[0].chainId,
          opts[0].chains[0].tokenAddress
        );
      }
    }).catch((e) => {
      console.warn("[UGF] payment options failed", e);
      setOptions([]);
    }).finally(() => setOptionsLoading(false));`;

const USE_UGF_RETURN_ORIGINAL = `  return { run, loading, step, error };
}`;

const USE_UGF_RETURN_PATCHED = `  function resetFlow() {
    setStep("idle");
    setError(null);
    setLoading(false);
  }
  return { run, loading, step, error, resetFlow };
}`;

const PROVIDER_HOOK_ORIGINAL = `  const { run, step, loading, error } = useUGF(mode);`;

const PROVIDER_HOOK_PATCHED = `  const { run, step, loading, error, resetFlow } = useUGF(mode);`;

const OPEN_UGF_SET_OPEN_ORIGINAL = `    setParams(p);
    setOpen(true);
  }`;

const OPEN_UGF_SET_OPEN_PATCHED = `    setResult(null);
    resetFlow();
    setParams(p);
    setOpen(true);
  }`;

const SUCCESS_CLOSE_ORIGINAL = `  useEffect(() => {
    if (step !== "success") return;
    const timer = setTimeout(() => onClose(), 2e3);
    return () => clearTimeout(timer);
  }, [step]);`;

const SUCCESS_CLOSE_PATCHED = `  useEffect(() => {
    if (!open || step !== "success") return;
    const timer = setTimeout(() => onClose(), 2e3);
    return () => clearTimeout(timer);
  }, [open, step]);`;

let src = fs.readFileSync(target, "utf8");
let changed = false;

const authPatched = src.includes("AUTH_FAIL_COOLDOWN_MS");
const balancePatched =
  src.includes("balanceFetchInFlight = true;") &&
  src.includes("setInterval(fetchBalance, 3e4)") &&
  !src.includes(BALANCE_CORRUPTED);
const modalRegistryPatched = src.includes("[UGF] payment options failed");
const sessionResetPatched =
  src.includes("function resetFlow()") &&
  src.includes("setResult(null);\n    resetFlow();");
const successClosePatched = src.includes('if (!open || step !== "success")');

if (
  authPatched &&
  balancePatched &&
  modalRegistryPatched &&
  sessionResetPatched &&
  successClosePatched
) {
  console.log("[patch-react-ugf] Already patched");
  process.exit(0);
}

if (!authPatched) {
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
  changed = true;
}

if (!balancePatched) {
  if (src.includes(BALANCE_CORRUPTED)) {
    src = src.replace(BALANCE_CORRUPTED, BALANCE_PATCHED);
    changed = true;
  } else if (src.includes(BALANCE_ORIGINAL)) {
    src = src.replace(BALANCE_ORIGINAL, BALANCE_PATCHED);
    changed = true;
  } else if (!src.includes("var balanceFetchInFlight = false;")) {
    src = src.replace(
      "var authInFlight = {};\nvar STORAGE_PREFIX = \"ugf_auth\";",
      `var authInFlight = {};
var balanceFetchInFlight = false;
var STORAGE_PREFIX = "ugf_auth";`
    );
    if (src.includes(BALANCE_ORIGINAL)) {
      src = src.replace(BALANCE_ORIGINAL, BALANCE_PATCHED);
      changed = true;
    }
  }
}

if (!modalRegistryPatched && src.includes(MODAL_OPTIONS_ORIGINAL)) {
  src = src.replace(MODAL_OPTIONS_ORIGINAL, MODAL_OPTIONS_PATCHED);
  changed = true;
}

if (!sessionResetPatched) {
  if (src.includes(USE_UGF_RETURN_ORIGINAL)) {
    src = src.replace(USE_UGF_RETURN_ORIGINAL, USE_UGF_RETURN_PATCHED);
    changed = true;
  }
  if (src.includes(PROVIDER_HOOK_ORIGINAL)) {
    src = src.replace(PROVIDER_HOOK_ORIGINAL, PROVIDER_HOOK_PATCHED);
    changed = true;
  }
  if (src.includes(OPEN_UGF_SET_OPEN_ORIGINAL)) {
    src = src.replace(OPEN_UGF_SET_OPEN_ORIGINAL, OPEN_UGF_SET_OPEN_PATCHED);
    changed = true;
  }
}

if (!successClosePatched && src.includes(SUCCESS_CLOSE_ORIGINAL)) {
  src = src.replace(SUCCESS_CLOSE_ORIGINAL, SUCCESS_CLOSE_PATCHED);
  changed = true;
}

if (!changed) {
  console.warn("[patch-react-ugf] Expected patterns not found; file may need manual review");
  process.exit(1);
}

fs.writeFileSync(target, src);
console.log("[patch-react-ugf] Patched successfully");
