import { SKILLS } from "../config/constants";

export default function Inventory({ inventory, onChainClaimed }) {
  if (inventory.length === 0) return null;

  return (
    <div className="inventory-wrap">
      <div className="section-label">Your Collection ({inventory.length} / {SKILLS.length})</div>
      <div className="inventory-grid">
        {inventory.map((b) => (
          <div
            key={b.id}
            className={`inv-card rarity-${b.rarity.toLowerCase()}`}
            style={{ borderColor: b.color + "22" }}
          >
            <div className="inv-icon">{b.icon}</div>
            <div className="inv-name">{b.label}</div>
            <div className="inv-rarity" style={{ color: b.rarityColor }}>{b.rarity}</div>
            {b.badgeId && <div className="inv-id">#{b.badgeId}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
