export default function BadgeCard({ skill, badgeId, mintTimestamp }) {
  if (!skill) return null;
  return (
    <div className="badge-card" style={{ background: `linear-gradient(135deg,${skill.color}cc,${skill.color}38)` }}>
      <div className="badge-noise" />
      <div className="badge-shine" />
      <div className="badge-minted-label">
        <span className="badge-minted-dot" />
        Minted Onchain
      </div>
      <div className="badge-icon-wrap">
        <span className="badge-icon">{skill.icon}</span>
        <span className="badge-trophy">🏆</span>
      </div>
      <div className="badge-title">{skill.label}</div>
      <div className="badge-sub">Certified · Onchain · Permanent</div>
      <div className="badge-meta">
        <span className="badge-meta-tag">✓ Verified</span>
        <span className="badge-meta-tag">⚡ Gasless</span>
        <span className="badge-meta-tag">🔗 Base Sepolia</span>
        <span className="badge-meta-tag" style={{ color: skill.rarityColor }}>★ {skill.rarity}</span>
      </div>
      {badgeId && <div className="badge-id">Badge #{badgeId}</div>}
      {mintTimestamp && (
        <div className="badge-timestamp">{mintTimestamp}</div>
      )}
      <div className="badge-network">
        <div className="badge-network-dot" />
        Minted on Base Sepolia · No ETH required
      </div>
    </div>
  );
}
