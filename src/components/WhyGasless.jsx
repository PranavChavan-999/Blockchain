export default function WhyGasless() {
  return (
    <div className="why-gasless">
      <div className="why-title">💡 Why Gasless?</div>
      <div className="why-row">
        <span className="why-icon">🚫</span>
        <div>Traditional Web3 onboarding fails because users need <span className="why-highlight">ETH for gas</span> just to interact with any dApp.</div>
      </div>
      <div className="why-row">
        <span className="why-icon">⚡</span>
        <div><span className="why-highlight">UGF (Universal Gas Framework)</span> lets users pay gas fees using stablecoins like Mock USD — no ETH ever needed.</div>
      </div>
      <div className="why-row">
        <span className="why-icon">🏆</span>
        <div>This makes Web3 accessible to <span className="why-highlight">everyone</span>, removing the biggest barrier to blockchain adoption.</div>
      </div>
    </div>
  );
}
