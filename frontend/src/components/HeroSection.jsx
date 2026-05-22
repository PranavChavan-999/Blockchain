import HeroNftCard from "./HeroNftCard";

export default function HeroSection() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="hero-section">
      <div className="hero-left">
        <div className="logo-badge network-chip">
          <span className="logo-dot" />
          Base Sepolia · Gasless · UGF
        </div>

        <div className="hero-eyebrow">⛓ On-chain · AI-verified · Free to claim</div>

        <h1 className="hero-headline">
          <span className="hero-line hero-line-1">Onchain</span>
          <span className="hero-line hero-line-2">skill credentials.</span>
          <span className="hero-line hero-line-3">Zero gas.</span>
        </h1>

        <p className="hero-body">
          Claim verified onchain credentials — free of gas fees, powered by UGF abstraction on Base Sepolia.
        </p>

        <div className="hero-benefit-pills">
          <span className="hero-pill"><strong>$0</strong> gas forever</span>
          <span className="hero-pill"><strong>AI</strong> verified</span>
          <span className="hero-pill"><strong>Base</strong> Sepolia</span>
          <span className="hero-pill"><strong>6</strong> rarity tiers</span>
        </div>

        <div className="hero-actions">
          <button type="button" className="btn-hero-primary" onClick={() => scrollTo("claim")}>
            CLAIM YOUR BADGE →
          </button>
          <button type="button" className="btn-hero-secondary" onClick={() => scrollTo("benefits")}>
            See how it works
          </button>
        </div>
      </div>
      <HeroNftCard />
    </section>
  );
}
