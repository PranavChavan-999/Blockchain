import { ConnectKitButton } from "connectkit";

const NAV_LINKS = [
  { label: "Claim", href: "#claim" },
  { label: "How it works", href: "#benefits" },
  { label: "Stats", href: "#stats" },
];

export default function Navbar() {
  return (
    <header className="site-nav">
      <a href="/" className="site-nav-logo">
        <span className="site-nav-logo-skill">skill</span>
        <span className="site-nav-logo-badge">badge</span>
      </a>
      <nav className="site-nav-links" aria-label="Main">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="site-nav-link">
            {link.label}
          </a>
        ))}
        <a
          href="https://github.com"
          className="site-nav-link site-nav-link--external"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
      </nav>
      <div className="site-nav-cta">
        <ConnectKitButton />
      </div>
    </header>
  );
}
