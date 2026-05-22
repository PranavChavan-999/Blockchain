export default function FooterTags() {
  return (
    <footer className="site-footer">
      <p className="site-footer-copy">
        SkillBadge — Onchain credentials for the next generation of builders
      </p>
      <div className="footer-tags">
        <span className="footer-tag">
          <span className="footer-tag-accent">Base Sepolia</span>
        </span>
        <span className="footer-tag-sep" aria-hidden="true">·</span>
        <span className="footer-tag">Gasless via <span className="footer-tag-accent">UGF</span></span>
        <span className="footer-tag-sep" aria-hidden="true">·</span>
        <span className="footer-tag">No ETH required</span>
        <span className="footer-tag-sep" aria-hidden="true">·</span>
        <span className="footer-tag">Soul-bound badges</span>
      </div>
    </footer>
  );
}
