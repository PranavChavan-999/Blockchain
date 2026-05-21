import { useState } from "react";

export default function TransactionReceipt({ txHash, badgeId, walletAddress, skill, gasSaved, mintTimestamp }) {
  const [copied, setCopied] = useState(false);

  function copyHash() {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const shortWallet = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  const shortHash = txHash
    ? txHash.slice(0, 14) + "..." + txHash.slice(-10)
    : "";

  return (
    <div className="receipt-card">
      <div className="receipt-header">
        <div className="receipt-title">Transaction Receipt</div>
        <div className="receipt-confirmed">✓ Confirmed</div>
      </div>

      <div className="receipt-rows">
        {badgeId && (
          <div className="receipt-row">
            <span className="receipt-label">Badge ID</span>
            <span className="receipt-value">#{badgeId}</span>
          </div>
        )}
        {skill && (
          <div className="receipt-row">
            <span className="receipt-label">Skill</span>
            <span className="receipt-value">{skill.icon} {skill.label}</span>
          </div>
        )}
        <div className="receipt-row">
          <span className="receipt-label">Wallet</span>
          <span className="receipt-value receipt-mono">{shortWallet}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Network</span>
          <span className="receipt-value">Base Sepolia</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Status</span>
          <span className="receipt-value receipt-green">✓ Confirmed</span>
        </div>
        {mintTimestamp && (
          <div className="receipt-row">
            <span className="receipt-label">Timestamp</span>
            <span className="receipt-value">{mintTimestamp}</span>
          </div>
        )}
        <div className="receipt-row">
          <span className="receipt-label">Gas Saved</span>
          <span className="receipt-value receipt-green">~${gasSaved}</span>
        </div>
      </div>

      {txHash && (
        <div className="receipt-hash-section">
          <div className="receipt-label" style={{ marginBottom: "6px" }}>Tx Hash</div>
          <div className="receipt-hash-row">
            <span className="receipt-hash-text">{shortHash}</span>
            <button className="receipt-copy-btn" onClick={copyHash}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <a
        className="basescan-link"
        href={txHash ? `https://sepolia.basescan.org/tx/${txHash}` : "https://sepolia.basescan.org"}
        target="_blank"
        rel="noreferrer"
        style={{ marginTop: "12px" }}
      >
        🔍 View on BaseScan ↗
      </a>
    </div>
  );
}
