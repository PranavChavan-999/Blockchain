const CARDS = [
  {
    icon: "⚡",
    iconClass: "benefit-icon-wrap--gas",
    title: "Zero gas, always",
    body: (
      <>
        Gas is fully sponsored via <span className="benefit-highlight">UGF abstraction</span>.
        No ETH in your wallet. No friction. Ever.
      </>
    ),
  },
  {
    icon: "🤖",
    iconClass: "benefit-icon-wrap--ai",
    title: "AI-verified skills",
    body: (
      <>
        Your credentials are checked by AI before minting —{" "}
        <span className="benefit-highlight">no fake badges</span>, no shortcuts.
      </>
    ),
  },
  {
    icon: "⛓",
    iconClass: "benefit-icon-wrap--chain",
    title: "Permanent on-chain",
    body: (
      <>
        Minted on Base Sepolia and yours forever.{" "}
        <span className="benefit-highlight">Soul-bound</span>. Verifiable by anyone, anywhere.
      </>
    ),
  },
];

export default function BenefitCards() {
  return (
    <section className="benefit-section" id="benefits">
      <h2 className="benefit-section-label">Why SkillBadge</h2>
      <div className="benefit-grid">
        {CARDS.map((card) => (
          <article key={card.title} className="benefit-card">
            <div className={`benefit-icon-wrap ${card.iconClass}`}>{card.icon}</div>
            <h3 className="benefit-card-title">{card.title}</h3>
            <p className="benefit-card-body">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
