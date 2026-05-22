export default function HeroNftCard() {
  return (
    <div className="hero-nft-col">
      <div className="hero-nft-frame">
        <div className="hero-nft-top">
          <span className="hero-nft-addr">0x7a3f…9c2e</span>
          <span className="hero-nft-num">#0042</span>
        </div>
        <div className="hero-nft-body">
          <div className="hero-nft-minted">
            <span className="hero-nft-minted-dot" aria-hidden="true" />
            Minted
          </div>
          <div className="hero-nft-icon" aria-hidden="true">
            ⚛️
          </div>
          <div className="hero-nft-title">React Developer</div>
          <div className="hero-nft-rarity">MYTHIC</div>
        </div>
      </div>
      <div className="hero-nft-tags">
        <span className="hero-nft-tag">⛓ On-chain</span>
        <span className="hero-nft-tag">⚡ Gas-free</span>
        <span className="hero-nft-tag">🔐 Soul-bound</span>
      </div>
    </div>
  );
}
