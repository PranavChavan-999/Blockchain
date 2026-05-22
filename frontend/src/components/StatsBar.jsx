const STATS = [
  { value: "0", unit: "ETH", label: "Cost to claim" },
  { value: "6", unit: "x", label: "Rarity tiers" },
  { value: "∞", unit: "", label: "On-chain forever" },
  { value: "AI", unit: "✓", label: "Skill verified" },
];

export default function StatsBar() {
  return (
    <section className="stats-bar" id="stats" aria-label="Platform stats">
      {STATS.map((stat) => (
        <div key={stat.label} className="stats-bar-cell">
          <div className="stats-bar-value">
            {stat.value}
            {stat.unit && <span className="stats-bar-unit">{stat.unit}</span>}
          </div>
          <div className="stats-bar-label">{stat.label}</div>
        </div>
      ))}
    </section>
  );
}
