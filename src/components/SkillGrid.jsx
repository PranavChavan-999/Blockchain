import { SKILLS } from "../config/constants";

export default function SkillGrid({ selectedSkill, onSelect, loading, hasClaimed, onChainClaimed }) {
  return (
    <div className="skill-grid">
      {SKILLS.map((skill) => {
        const isSel       = selectedSkill?.id === skill.id;
        const isOnChain   = onChainClaimed.has(skill.label);
        const rarityClass = "rarity-" + skill.rarity.toLowerCase();
        const isDisabled  = loading || (hasClaimed && !isOnChain) || isOnChain;

        return (
          <button
            key={skill.id}
            className={[
              "skill-card",
              isSel    ? `selected ${rarityClass}` : "",
              isDisabled ? "disabled" : "",
              isOnChain  ? "on-chain-claimed" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => { if (!isDisabled) onSelect(skill); }}
            style={{ "--sc": skill.color, "--sg": skill.glow, "--rc": skill.rarityColor }}
          >
            <span className="skill-icon">{skill.icon}</span>
            <div className="skill-name">{skill.label}</div>
            <div className="skill-desc">{skill.desc}</div>
            <div className="rarity-tag" style={{ "--rc": skill.rarityColor }}>{skill.rarity}</div>
            {isOnChain && <div className="skill-claimed-overlay">✓ Owned</div>}
            {isSel && !isOnChain && (
              <div className="skill-check" style={{ "--sc": skill.color, "--sg": skill.glow }}>✓</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
