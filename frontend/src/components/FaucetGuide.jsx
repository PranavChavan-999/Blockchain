export default function FaucetGuide() {
  return (
    <div className="faucet-guide">
      <div className="faucet-guide-title">💧 Need Gas Credits?</div>
      <div className="faucet-guide-body">
        Get free testnet stablecoins to cover UGF gas fees:
      </div>
      <a
        href="https://universalgasframework.com/faucets"
        target="_blank"
        rel="noreferrer"
        className="faucet-guide-link"
      >
        🔗 UGF Faucet ↗
      </a>
      <ol className="faucet-guide-steps">
        <li>Connect your wallet on the faucet page</li>
        <li>
          Select <strong>Base Sepolia</strong> network
        </li>
        <li>
          Claim <strong>Mock USD / USDC</strong>
        </li>
        <li>Return here and try again</li>
      </ol>
      <div className="faucet-guide-note">
        ℹ️ Alternatively, click <em>&quot;Use normal transaction&quot;</em> in the UGF modal to pay with ETH instead.
      </div>
    </div>
  );
}
