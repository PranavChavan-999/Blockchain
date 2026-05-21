import { ConnectKitButton } from "connectkit";

export default function ConnectScreen({
  status,
  statusType,
  authLoading,
  authError,
  authStatusMessage,
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="connect-icon">🔐</div>
      <div className="connect-title">Connect Your Wallet</div>
      <div className="connect-sub">
        Connect with ConnectKit (choose <strong>MetaMask</strong>) to sign in and claim on Base Sepolia.
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "11px",
          color: "#64748b",
          lineHeight: 1.55,
          maxWidth: "420px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        If connect fails: unlock MetaMask → pick <strong>MetaMask</strong> in the wallet list → approve
        both prompts (connect + sign). Disable other wallet extensions while testing.
      </div>

      <div className="onboarding-steps">
        {[
          { n: 1, label: "Connect Wallet" },
          { n: 2, label: "Sign to Authenticate" },
          { n: 3, label: "Pick a Skill" },
          { n: 4, label: "Get Onchain Badge" },
        ].map((s) => (
          <div key={s.n} className="ob-step">
            <div className="ob-num">{s.n}</div>
            <div>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="connect-features">
        <div className="connect-feat"><span className="connect-feat-icon">⚡</span>Gas sponsored using testnet Mock USD — zero ETH needed</div>
        <div className="connect-feat"><span className="connect-feat-icon">🔗</span>Permanently minted on Base Sepolia blockchain</div>
        <div className="connect-feat"><span className="connect-feat-icon">🏅</span>6 unique skill badges with rarity tiers</div>
        <div className="connect-feat"><span className="connect-feat-icon">🌐</span>Web3 credentials, zero web2 friction</div>
      </div>

      <div className="connectkit-wrap" style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
        <ConnectKitButton />
      </div>

      {authLoading && (
        <div className="status-bar s-info" style={{ textAlign: "left", marginTop: "12px" }}>
          🔄 {authStatusMessage || "Authenticating…"}
        </div>
      )}

      {authError && !authLoading && (
        <div className="status-bar s-error" style={{ textAlign: "left", marginTop: "12px" }}>
          ⚠️ {authError}
        </div>
      )}

      {status && !authLoading && (
        <div className={`status-bar s-${statusType}`} style={{ textAlign: "left", marginTop: "12px" }}>
          {statusType === "error" ? "⚠️" : "ℹ️"} {status}
        </div>
      )}
    </div>
  );
}
