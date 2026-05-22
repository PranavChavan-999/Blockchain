import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";

const FEATURE_ROWS = [
  {
    icon: "⚡",
    iconClass: "connect-feat-icon--gas",
    text: "Gas sponsored using testnet Mock USD — zero ETH needed",
  },
  {
    icon: "⛓",
    iconClass: "connect-feat-icon--chain",
    text: "Permanently minted on Base Sepolia blockchain",
  },
  {
    icon: "🏅",
    iconClass: "connect-feat-icon--rarity",
    text: "6 unique skill badges with rarity tiers",
  },
  {
    icon: "🌐",
    iconClass: "connect-feat-icon--web3",
    text: "Web3 credentials, zero web2 friction",
  },
];

const OB_STEPS = [
  { n: 1, label: "Connect Wallet" },
  { n: 2, label: "Sign to Authenticate" },
  { n: 3, label: "Pick a Skill" },
  { n: 4, label: "Get Onchain Badge" },
];

function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ConnectScreen({
  status,
  statusType,
  authLoading,
  authError,
  authStatusMessage,
}) {
  const { address, isConnected, status: walletStatus } = useAccount();
  const walletReady =
    isConnected && address && walletStatus === "connected";

  const showSetupError =
    authError &&
    (authError.includes("Supabase") ||
      authError.includes("user profile") ||
      authError.includes("users table"));

  return (
    <div className="connect-screen">
      <div className="connect-inner-panel">
        <div className="connect-lock-wrap" aria-hidden="true">
          🔐
        </div>
        <h2 className="connect-title">Connect Your Wallet</h2>
        <p className="connect-sub">
          Connect with ConnectKit (choose <strong>MetaMask</strong>) to sign in and claim on Base Sepolia.
        </p>
        <p className="connect-hint">
          If connect fails: unlock MetaMask → pick <strong>MetaMask</strong> in the wallet list → approve
          both prompts (connect + sign). Disable other wallet extensions while testing.
        </p>

        <div className="onboarding-steps">
          {OB_STEPS.map((s, i) => (
            <div key={s.n} className="ob-step-wrap">
              <div className="ob-step">
                <div className="ob-num">{s.n}</div>
                <div className="ob-label">{s.label}</div>
              </div>
              {i < OB_STEPS.length - 1 && (
                <span className="ob-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="connect-features">
        {FEATURE_ROWS.map((row) => (
          <div key={row.text} className="connect-feat">
            <span className={`connect-feat-icon ${row.iconClass}`} aria-hidden="true">
              {row.icon}
            </span>
            <span>{row.text}</span>
          </div>
        ))}
      </div>

      <div className="connect-wallet-panel">
        <div className="connect-wallet-panel-head">
          {walletReady ? (
            <>
              <span className="connect-wallet-status-dot" aria-hidden="true" />
              <span className="connect-wallet-panel-label">Connected wallet</span>
              <span className="connect-wallet-panel-addr">{shortAddress(address)}</span>
            </>
          ) : (
            <span className="connect-wallet-panel-label">Connect wallet</span>
          )}
        </div>

        <div
          className={`connect-wallet-btn-wrap ${
            walletReady ? "is-connected" : "is-disconnected"
          }`}
        >
          <ConnectKitButton />
        </div>

        {walletReady && !authLoading && (
          <p className="connect-wallet-hint">
            Approve the <strong>sign-in</strong> prompt in MetaMask to continue.
          </p>
        )}
      </div>

      {showSetupError && !authLoading && (
        <div className="setup-error-banner" role="alert">
          <div className="setup-error-title">Database setup required</div>
          <p className="setup-error-body">
            Wallet signature worked, but the API could not save your profile. The Supabase{" "}
            <code>users</code> table is missing.
          </p>
          <ol className="setup-error-steps">
            <li>Open your Supabase project → SQL Editor</li>
            <li>
              Run <code>backend/supabase/migrations/001_users_siwe.sql</code>
            </li>
            <li>Restart the backend, then refresh this page</li>
          </ol>
        </div>
      )}

      {authLoading && (
        <div className="status-bar s-info connect-status">
          🔄 {authStatusMessage || "Authenticating…"}
        </div>
      )}

      {authError && !authLoading && !showSetupError && (
        <div className="status-bar s-error connect-status">
          ⚠️ {authError}
        </div>
      )}

      {status && !authLoading && !authError && (
        <div className={`status-bar s-${statusType} connect-status`}>
          {statusType === "error" ? "⚠️" : "ℹ️"} {status}
        </div>
      )}
    </div>
  );
}
