export default function FaucetGuide() {
  return (
    <div style={{
      marginTop: "10px",
      padding: "12px 14px",
      background: "rgba(99,102,241,.06)",
      border: "1px solid rgba(99,102,241,.16)",
      borderRadius: "12px",
      fontSize: "11px",
      color: "#818cf8",
      lineHeight: 1.65,
      animation: "slideDown .3s ease",
    }}>
      <div style={{ fontWeight: 800, marginBottom: "6px", fontSize: "11px", letterSpacing: ".05em", textTransform: "uppercase", color: "#a5b4fc" }}>
        💧 Need Gas Credits?
      </div>
      <div style={{ color: "#64748b", marginBottom: "8px" }}>
        Get free testnet stablecoins to cover UGF gas fees:
      </div>
      <a
        href="https://universalgasframework.com/faucets"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "rgba(99,102,241,.14)", border: "1px solid rgba(99,102,241,.26)",
          borderRadius: "8px", padding: "5px 12px",
          color: "#a5b4fc", fontWeight: 700, textDecoration: "none", fontSize: "11px",
          marginBottom: "8px",
        }}
      >
        🔗 UGF Faucet ↗
      </a>
      <ol style={{ paddingLeft: "16px", color: "#3f5070", marginTop: "4px" }}>
        <li>Connect your wallet on the faucet page</li>
        <li>Select <strong style={{ color: "#818cf8" }}>Base Sepolia</strong> network</li>
        <li>Claim <strong style={{ color: "#818cf8" }}>Mock USD / USDC</strong></li>
        <li>Return here and try again</li>
      </ol>
      <div style={{ marginTop: "8px", color: "#263245", fontSize: "10px" }}>
        ℹ️ Alternatively, click <em>"Use normal transaction"</em> in the UGF modal to pay with ETH instead.
      </div>
    </div>
  );
}
