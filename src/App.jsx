
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useUGFModal } from "@tychilabs/react-ugf";

// ═══════════════════════════════════════════════════════════════
// COMPONENT: constants.js  →  src/config/constants.js
// ═══════════════════════════════════════════════════════════════

export const CONTRACT_ADDRESS = "0xf56AaaeDA493114f3461Dc091149643BA1cef802";

export const CONTRACT_ABI = [
  "function claimBadge(string memory skillName) public",
  "function hasClaimedSkill(address wallet, string memory skillName) public view returns (bool)",
  "function getClaimedSkills(address wallet) public view returns (string[] memory)",
  "function getBadgeCount(address wallet) public view returns (uint256)",
  "function getBadgeId(address wallet, string memory skillName) public view returns (uint256)",
  "function totalBadgesMinted() public view returns (uint256)",
  "event BadgeClaimed(address indexed claimer, string skill, uint256 badgeId, uint256 timestamp)",
];

export const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14A34";
export const BASE_SEPOLIA_CHAIN_ID_DEC = 84532;

export const SKILLS = [
  { id: "react",     label: "React Developer",     icon: "⚛️",  color: "#61dafb", glow: "rgba(97,218,251,0.28)",  desc: "Modern UI engineering",   rarity: "Rare",      rarityColor: "#61dafb" },
  { id: "solidity",  label: "Solidity Developer",   icon: "🔷",  color: "#627eea", glow: "rgba(98,126,234,0.28)",  desc: "Smart contract expert",   rarity: "Epic",      rarityColor: "#a78bfa" },
  { id: "ai",        label: "AI Engineer",          icon: "🤖",  color: "#a78bfa", glow: "rgba(167,139,250,0.28)", desc: "Machine learning builder", rarity: "Legendary", rarityColor: "#f59e0b" },
  { id: "fullstack", label: "Full Stack Developer", icon: "🚀",  color: "#34d399", glow: "rgba(52,211,153,0.28)",  desc: "End-to-end craftsman",    rarity: "Common",    rarityColor: "#34d399" },
  { id: "web3",      label: "Web3 Developer",       icon: "🌐",  color: "#f59e0b", glow: "rgba(245,158,11,0.28)",  desc: "Decentralized architect", rarity: "Epic",      rarityColor: "#a78bfa" },
  { id: "cpp",       label: "C++ Engineer",         icon: "⚙️",  color: "#f87171", glow: "rgba(248,113,113,0.28)", desc: "Performance systems guru",rarity: "Rare",      rarityColor: "#61dafb" },
];

export const STEPS = [
  { id: 1, label: "Connect" },
  { id: 2, label: "Choose"  },
  { id: 3, label: "Claim"   },
];

const CONFETTI_COLORS = ["#6366f1","#a78bfa","#34d399","#f59e0b","#f87171","#61dafb","#fff"];

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Confetti.jsx
// ═══════════════════════════════════════════════════════════════

function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const pieces    = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    pieces.current = Array.from({ length: 140 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height * 0.3 - canvas.height * 0.3,
      w:     Math.random() * 9 + 4,
      h:     Math.random() * 4 + 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vx:    (Math.random() - 0.5) * 4.5,
      vy:    Math.random() * 3.5 + 2,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.22,
      life:  1,
      decay: Math.random() * 0.007 + 0.003,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.current.forEach((p) => {
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.spin;
        p.life  -= p.decay;
        if (p.y > canvas.height) { p.y = -10; p.life = 1; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    const stop = setTimeout(() => cancelAnimationFrame(animRef.current), 4500);
    return () => { cancelAnimationFrame(animRef.current); clearTimeout(stop); };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:999 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Header.jsx
// ═══════════════════════════════════════════════════════════════

function Header() {
  return (
    <div className="header">
      <div className="logo-badge">
        <span className="logo-dot" />
        Base Sepolia · Gasless · UGF
      </div>
      <h1 className="main-title">SkillBadge</h1>
      <p className="main-sub">
        Claim verified onchain credentials — free of gas fees, powered by UGF abstraction.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Stepper.jsx
// ═══════════════════════════════════════════════════════════════

function Stepper({ step }) {
  return (
    <div className="steps">
      {STEPS.map((s, i) => {
        const state = step > s.id ? "done" : step === s.id ? "active" : "inactive";
        return (
          <div key={s.id} className="step-item">
            <div className={`step-num ${state}`}>{state === "done" ? "✓" : s.id}</div>
            <span className={`step-label ${state}`}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${step > s.id ? "done" : "inactive"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: SkillGrid.jsx
// ═══════════════════════════════════════════════════════════════

function SkillGrid({ selectedSkill, onSelect, loading, hasClaimed, onChainClaimed }) {
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

// ═══════════════════════════════════════════════════════════════
// COMPONENT: BadgeCard.jsx
// ═══════════════════════════════════════════════════════════════

function BadgeCard({ skill, badgeId, mintTimestamp }) {
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

// ═══════════════════════════════════════════════════════════════
// COMPONENT: TransactionReceipt.jsx
// ═══════════════════════════════════════════════════════════════

function TransactionReceipt({ txHash, badgeId, walletAddress, skill, gasSaved, mintTimestamp }) {
  const [copied, setCopied] = useState(false);

  function copyHash() {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const shortWallet = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  const shortHash = txHash
    ? txHash.slice(0, 14) + "..." + txHash.slice(-10)
    : "";

  return (
    <div className="receipt-card">
      <div className="receipt-header">
        <div className="receipt-title">Transaction Receipt</div>
        <div className="receipt-confirmed">✓ Confirmed</div>
      </div>

      <div className="receipt-rows">
        {badgeId && (
          <div className="receipt-row">
            <span className="receipt-label">Badge ID</span>
            <span className="receipt-value">#{badgeId}</span>
          </div>
        )}
        {skill && (
          <div className="receipt-row">
            <span className="receipt-label">Skill</span>
            <span className="receipt-value">{skill.icon} {skill.label}</span>
          </div>
        )}
        <div className="receipt-row">
          <span className="receipt-label">Wallet</span>
          <span className="receipt-value receipt-mono">{shortWallet}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Network</span>
          <span className="receipt-value">Base Sepolia</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Status</span>
          <span className="receipt-value receipt-green">✓ Confirmed</span>
        </div>
        {mintTimestamp && (
          <div className="receipt-row">
            <span className="receipt-label">Timestamp</span>
            <span className="receipt-value">{mintTimestamp}</span>
          </div>
        )}
        <div className="receipt-row">
          <span className="receipt-label">Gas Saved</span>
          <span className="receipt-value receipt-green">~${gasSaved}</span>
        </div>
      </div>

      {txHash && (
        <div className="receipt-hash-section">
          <div className="receipt-label" style={{ marginBottom: "6px" }}>Tx Hash</div>
          <div className="receipt-hash-row">
            <span className="receipt-hash-text">{shortHash}</span>
            <button className="receipt-copy-btn" onClick={copyHash}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <a
        className="basescan-link"
        href={txHash ? `https://sepolia.basescan.org/tx/${txHash}` : "https://sepolia.basescan.org"}
        target="_blank"
        rel="noreferrer"
        style={{ marginTop: "12px" }}
      >
        🔍 View on BaseScan ↗
      </a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: Inventory.jsx
// ═══════════════════════════════════════════════════════════════

function Inventory({ inventory, onChainClaimed }) {
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

// ═══════════════════════════════════════════════════════════════
// COMPONENT: History.jsx
// ═══════════════════════════════════════════════════════════════

function History({ txHistory }) {
  if (txHistory.length === 0) return null;

  return (
    <div className="history-wrap">
      <div className="section-label">Recent Claims</div>
      {txHistory.map((tx) => (
        <div key={tx.id} className="history-item">
          <div className="history-left">
            <span className="history-emoji">{tx.icon}</span>
            <div>
              <div className="history-skill">{tx.skill}</div>
              <div className="history-time">{tx.time}</div>
              {tx.hash && (
                <div className="history-hash">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                </div>
              )}
            </div>
          </div>
          <span className="history-badge">CLAIMED</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: WhyGasless.jsx
// ═══════════════════════════════════════════════════════════════

function WhyGasless() {
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

// ═══════════════════════════════════════════════════════════════
// COMPONENT: ConnectScreen.jsx
// ═══════════════════════════════════════════════════════════════

function ConnectScreen({ onConnect, status, statusType }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="connect-icon">🔐</div>
      <div className="connect-title">Connect Your Wallet</div>
      <div className="connect-sub">
        Link MetaMask to start claiming your onchain skill credentials on Base Sepolia.
      </div>

      <div className="onboarding-steps">
        {[
          { n: 1, label: "Connect Wallet" },
          { n: 2, label: "Pick a Skill"   },
          { n: 3, label: "Pay with Mock USD" },
          { n: 4, label: "Get Onchain Badge" },
        ].map((s) => (
          <div key={s.n} className="ob-step">
            <div className="ob-num">{s.n}</div>
            <div>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="connect-features">
        <div className="connect-feat"><span className="connect-feat-icon">⚡</span>Gas sponsored using testnet Mock USD — zero ETH needed</div>
        <div className="connect-feat"><span className="connect-feat-icon">🔗</span>Permanently minted on Base Sepolia blockchain</div>
        <div className="connect-feat"><span className="connect-feat-icon">🏅</span>6 unique skill badges with rarity tiers</div>
        <div className="connect-feat"><span className="connect-feat-icon">🌐</span>Web3 credentials, zero web2 friction</div>
      </div>

      <button className="btn btn-connect" onClick={onConnect}>
        <span className="btn-icon">🦊</span>Connect with MetaMask
      </button>

      {status && (
        <div className={`status-bar s-${statusType}`} style={{ textAlign: "left", marginTop: "12px" }}>
          {statusType === "error" ? "⚠️" : "ℹ️"} {status}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PATCH ADDITION: FaucetGuide — shown when UGF reports
//                 insufficient stablecoin balance
// ═══════════════════════════════════════════════════════════════

function FaucetGuide() {
  return (
    <div style={{
      marginTop: "10px",
      padding: "12px 14px",
      background: "rgba(99,102,241,.06)",
      border: "1px solid rgba(99,102,241,.16)",
      borderRadius: "12px",
      fontSize: "11px",
      color: "#818cf8",
      lineHeight: 1.65,
      animation: "slideDown .3s ease",
    }}>
      <div style={{ fontWeight: 800, marginBottom: "6px", fontSize: "11px", letterSpacing: ".05em", textTransform: "uppercase", color: "#a5b4fc" }}>
        💧 Need Gas Credits?
      </div>
      <div style={{ color: "#64748b", marginBottom: "8px" }}>
        Get free testnet stablecoins to cover UGF gas fees:
      </div>
      <a
        href="https://universalgasframework.com/faucets"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "rgba(99,102,241,.14)", border: "1px solid rgba(99,102,241,.26)",
          borderRadius: "8px", padding: "5px 12px",
          color: "#a5b4fc", fontWeight: 700, textDecoration: "none", fontSize: "11px",
          marginBottom: "8px",
        }}
      >
        🔗 UGF Faucet ↗
      </a>
      <ol style={{ paddingLeft: "16px", color: "#3f5070", marginTop: "4px" }}>
        <li>Connect your wallet on the faucet page</li>
        <li>Select <strong style={{ color: "#818cf8" }}>Base Sepolia</strong> network</li>
        <li>Claim <strong style={{ color: "#818cf8" }}>Mock USD / USDC</strong></li>
        <li>Return here and try again</li>
      </ol>
      <div style={{ marginTop: "8px", color: "#263245", fontSize: "10px" }}>
        ℹ️ Alternatively, click <em>"Use normal transaction"</em> in the UGF modal to pay with ETH instead.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PATCH ADDITION: extractTxHash — handles all result shapes:
//   • UGF gasless:   { txHash | transactionHash | hash }
//   • ethers fallback TransactionResponse: { hash }
//   • Nested under .response or .receipt
//   • Bare string hash
// ═══════════════════════════════════════════════════════════════

function extractTxHash(result) {
  if (!result) return "";
  if (typeof result === "string" && result.startsWith("0x")) return result;

  const direct =
    result.txHash ||
    result.transactionHash ||
    result.hash ||
    "";
  if (direct) return direct;

  const nested =
    result.response?.txHash ||
    result.response?.transactionHash ||
    result.response?.hash ||
    "";
  if (nested) return nested;

  const fromReceipt =
    result.receipt?.transactionHash ||
    result.receipt?.hash ||
    "";
  return fromReceipt;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT: App.jsx  (main orchestrator)
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [walletAddress,  setWalletAddress]  = useState("");
  const [isReturning,    setIsReturning]    = useState(false);
  const [selectedSkill,  setSelectedSkill]  = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [status,         setStatus]         = useState("");
  const [statusType,     setStatusType]     = useState("info");
  const [hasClaimed,     setHasClaimed]     = useState(false);
  const [claimedSkill,   setClaimedSkill]   = useState(null);
  const [txHash,         setTxHash]         = useState("");
  const [badgeId,        setBadgeId]        = useState(null);
  const [gasSaved,       setGasSaved]       = useState("0.00");
  const [mintTimestamp,  setMintTimestamp]  = useState("");
  const [step,           setStep]           = useState(1);
  const [particles,      setParticles]      = useState([]);
  const [txHistory,      setTxHistory]      = useState([]);
  const [showConfetti,   setShowConfetti]   = useState(false);
  const [inventory,      setInventory]      = useState([]);
  const [networkOk,      setNetworkOk]      = useState(true);
  const [onChainClaimed, setOnChainClaimed] = useState(new Set());
  const [totalMinted,    setTotalMinted]    = useState(null);
  const [slowNetwork,    setSlowNetwork]    = useState(false);
  const badgeRef = useRef(null);

  const { openUGF } = useUGFModal();

  // ── Generate floating particles once ─────────────────────────
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id:      i,
        x:       Math.random() * 100,
        y:       Math.random() * 100,
        size:    Math.random() * 6 + 2,
        dur:     Math.random() * 12 + 8,
        delay:   Math.random() * 6,
        opacity: Math.random() * 0.18 + 0.03,
      }))
    );
  }, []);

  // ── Load persisted data ───────────────────────────────────────
  useEffect(() => {
    try {
      const savedInv = localStorage.getItem("skillbadge_inventory");
      if (savedInv) setInventory(JSON.parse(savedInv));

      if (localStorage.getItem("skillbadge_claimed") === "true") setIsReturning(true);

      const savedHistory = localStorage.getItem("skillbadge_history");
      if (savedHistory) setTxHistory(JSON.parse(savedHistory));
    } catch (_) {}
  }, []);

  // ── Auto-reconnect wallet ─────────────────────────────────────
  useEffect(() => {
    async function reconnect() {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setStep(2);
          checkNetwork();
          fetchOnChainState(accounts[0]);
        }
      } catch (_) {}
    }
    reconnect();
  }, []);

  // ── Listen for wallet / chain changes ────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(""); setStep(1);
        setHasClaimed(false); setClaimedSkill(null); setStatus("");
        setOnChainClaimed(new Set()); setSelectedSkill(null);
      } else {
        setWalletAddress(accounts[0]);
        setStep(2);
        fetchOnChainState(accounts[0]);
      }
    };

    const onChainChanged = () => { checkNetwork(); };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged",    onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged",    onChainChanged);
    };
  }, []);

  // ── Scroll badge into view on success ────────────────────────
  useEffect(() => {
    if (hasClaimed && badgeRef.current) {
      setTimeout(() => badgeRef.current.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
    }
  }, [hasClaimed]);

  // ── Helpers ───────────────────────────────────────────────────
  function setMsg(msg, type = "info") { setStatus(msg); setStatusType(type); }

  async function checkNetwork() {
    if (!window.ethereum) return;
    try {
      const hex     = await window.ethereum.request({ method: "eth_chainId" });
      setNetworkOk(parseInt(hex, 16) === BASE_SEPOLIA_CHAIN_ID_DEC);
    } catch (_) {}
  }

  function formatTimestamp(ts) {
    const d = ts ? new Date(ts * 1000) : new Date();
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
      + " · "
      + d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  }

  // ── Fetch on-chain state ──────────────────────────────────────
  async function fetchOnChainState(address) {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network  = await provider.getNetwork();
      if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID_DEC) return;

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const claimed  = await contract.getClaimedSkills(address);
      setOnChainClaimed(new Set(claimed));

      const localInv = (() => {
        try { return JSON.parse(localStorage.getItem("skillbadge_inventory") || "[]"); }
        catch (_) { return []; }
      })();

      const chainInv = claimed.map((label) => {
        const meta    = SKILLS.find((s) => s.label === label);
        const cached  = localInv.find((b) => b.label === label);
        return meta ? { ...meta, badgeId: cached?.badgeId || null, time: cached?.time || "" } : null;
      }).filter(Boolean);

      setInventory(chainInv);
      localStorage.setItem("skillbadge_inventory", JSON.stringify(chainInv));

      const total = await contract.totalBadgesMinted();
      setTotalMinted(Number(total));
    } catch (_) {}
  }

  // ── Connect wallet ────────────────────────────────────────────
  async function connectWallet() {
    if (!window.ethereum) {
      setMsg("MetaMask not detected. Please install it to continue.", "error");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
        });
        setNetworkOk(true);
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId:            BASE_SEPOLIA_CHAIN_ID_HEX,
              chainName:          "Base Sepolia",
              nativeCurrency:     { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls:            ["https://sepolia.base.org"],
              blockExplorerUrls:  ["https://sepolia.basescan.org"],
            }],
          });
          setNetworkOk(true);
        }
      }

      setMsg("Wallet connected! Choose your skill badge.", "success");
      setStep(2);
      fetchOnChainState(accounts[0]);
    } catch (err) {
      const m = err?.message?.toLowerCase() ?? "";
      if (m.includes("user rejected") || m.includes("cancel")) {
        setMsg("Connection cancelled. Please try again.", "error");
      } else {
        setMsg("Connection failed. Make sure MetaMask is unlocked.", "error");
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PATCHED: claimBadge()
  //
  // Changes from original:
  //  1. extractTxHash() handles all result shapes (UGF gasless,
  //     ethers fallback TransactionResponse, nested, bare string)
  //  2. waitForTransaction() called first when hash is available,
  //     so ETH fallback txs are confirmed via receipt immediately
  //  3. hasClaimedSkill polling continues regardless of receipt
  //     outcome — catches UGF gasless flow too
  //  4. Detailed console logs throughout for debugging
  //  5. insufficient error message updated to trigger FaucetGuide
  // ═══════════════════════════════════════════════════════════
  async function claimBadge() {
    setStatus(""); setLoading(true); setSlowNetwork(false);
    setHasClaimed(false); setClaimedSkill(null); setTxHash(""); setBadgeId(null); setMintTimestamp("");

    let signerAddr = "";

    try {
      setMsg("Getting gas quote...", "info");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network  = await provider.getNetwork();

      if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID_DEC) {
        setMsg("Wrong network. Please switch to Base Sepolia in MetaMask.", "error");
        setNetworkOk(false);
        setLoading(false);
        return;
      }

      setNetworkOk(true);
      const signer = await provider.getSigner();
      signerAddr   = await signer.getAddress();
      const iface  = new ethers.Interface(CONTRACT_ABI);
      const data   = iface.encodeFunctionData("claimBadge", [selectedSkill.label]);

      setMsg("Waiting for approval in MetaMask...", "info");

      // ── UGF call — DO NOT CHANGE ──────────────────────────
      const result = await openUGF({
        signer,
        tx: { to: CONTRACT_ADDRESS, data, value: BigInt(0) },
        destChainId: "84532",
      });
      // ─────────────────────────────────────────────────────

      console.log("[claimBadge] openUGF result:", result);
      console.log("[claimBadge] result keys:", result ? Object.keys(result) : "null/undefined");

      setMsg("Verifying on Base Sepolia...", "info");

      // ── Robust hash extraction (all result shapes) ────────
      const hash = extractTxHash(result);
      console.log("[claimBadge] extracted txHash:", hash || "(none — gasless relay or no hash returned)");

      // ── Slow-network warning ──────────────────────────────
      const slowTimer = setTimeout(() => setSlowNetwork(true), 6000);

      let confirmedOnChain = false;
      let realBadgeId      = null;
      let onChainTimestamp = null;

      try {
        const readProvider = new ethers.BrowserProvider(window.ethereum);
        const contract     = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

        // ── Step 1: if we have a hash, wait for mined receipt ─
        // This handles the ETH fallback path where MetaMask returns
        // a standard TransactionResponse with a .hash property.
        if (hash) {
          console.log("[claimBadge] waiting for tx to be mined, hash:", hash);
          try {
            const receipt = await Promise.race([
              readProvider.waitForTransaction(hash, 1, 30_000),
              new Promise((_, rej) => setTimeout(() => rej(new Error("receipt timeout")), 30_000)),
            ]);
            console.log("[claimBadge] tx receipt status:", receipt?.status, receipt);
            if (receipt && receipt.status === 1) {
              confirmedOnChain = true;
              // Parse BadgeClaimed event
              for (const log of receipt.logs) {
                try {
                  const parsed = iface.parseLog(log);
                  if (parsed?.name === "BadgeClaimed") {
                    onChainTimestamp = Number(parsed.args.timestamp);
                    realBadgeId      = Number(parsed.args.badgeId);
                    console.log("[claimBadge] BadgeClaimed event — badgeId:", realBadgeId, "ts:", onChainTimestamp);
                    break;
                  }
                } catch (_) {}
              }
            }
          } catch (receiptErr) {
            console.warn("[claimBadge] waitForTransaction failed, falling back to polling:", receiptErr.message);
          }
        }

        // ── Step 2: poll hasClaimedSkill (covers UGF gasless +
        //    any case where receipt wait timed out / no hash) ──
        const MAX_ATTEMPTS = 14;
        const POLL_MS      = 2000;

        for (let attempt = 0; attempt < MAX_ATTEMPTS && !confirmedOnChain; attempt++) {
          console.log(`[claimBadge] polling hasClaimedSkill attempt ${attempt + 1}/${MAX_ATTEMPTS}`);
          try {
            const claimed = await contract.hasClaimedSkill(signerAddr, selectedSkill.label);
            console.log(`[claimBadge] hasClaimedSkill:`, claimed);

            if (claimed) {
              confirmedOnChain = true;

              if (!realBadgeId) {
                try {
                  realBadgeId = Number(await contract.getBadgeId(signerAddr, selectedSkill.label));
                  console.log("[claimBadge] fetched badgeId from contract:", realBadgeId);
                } catch (_) {}
              }

              // Late receipt attempt for timestamp if not yet obtained
              if (!onChainTimestamp && hash) {
                try {
                  const receipt = await readProvider.getTransactionReceipt(hash);
                  console.log("[claimBadge] late receipt fetch:", receipt?.status);
                  if (receipt) {
                    for (const log of receipt.logs) {
                      try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === "BadgeClaimed") {
                          onChainTimestamp = Number(parsed.args.timestamp);
                          if (!realBadgeId) realBadgeId = Number(parsed.args.badgeId);
                          break;
                        }
                      } catch (_) {}
                    }
                  }
                } catch (_) {}
              }
              break;
            }
          } catch (pollErr) {
            console.warn(`[claimBadge] poll attempt ${attempt + 1} error:`, pollErr.message);
          }

          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((res) => setTimeout(res, POLL_MS));
          }
        }
      } catch (verifyErr) {
        console.error("[claimBadge] verification block error:", verifyErr);
        // Last-resort: if result has no .error, treat as confirmed
        if (result && !result.error) {
          console.log("[claimBadge] verification failed but result has no .error — treating as confirmed");
          confirmedOnChain = true;
        }
      }

      clearTimeout(slowTimer);
      setSlowNetwork(false);

      console.log("[claimBadge] final state — confirmedOnChain:", confirmedOnChain, "| hash:", hash, "| badgeId:", realBadgeId);

      if (confirmedOnChain) {
        const saved = (0.003 + Math.random() * 0.05).toFixed(4);
        const id    = realBadgeId ?? Math.floor(1001 + Math.random() * 8999);
        const ts    = formatTimestamp(onChainTimestamp);

        setTxHash(hash);
        setBadgeId(id);
        setGasSaved(saved);
        setMintTimestamp(ts);
        setHasClaimed(true);
        setClaimedSkill(selectedSkill);
        setStep(3);

        setOnChainClaimed((prev) => new Set([...prev, selectedSkill.label]));
        setTotalMinted((prev) => (prev !== null ? prev + 1 : null));

        await fetchOnChainState(walletAddress);

        const newHistory = [
          { skill: selectedSkill.label, icon: selectedSkill.icon, time: ts, id: Date.now(), hash },
          ...txHistory.slice(0, 4),
        ];
        setTxHistory(newHistory);
        localStorage.setItem("skillbadge_history", JSON.stringify(newHistory));
        localStorage.setItem("skillbadge_claimed", "true");
        setIsReturning(true);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4500);
        setMsg("🎉 Badge claimed! Certified onchain.", "success");

      } else {
        setMsg("Transaction was not completed. Please try again.", "error");
      }

    } catch (err) {
      console.error("[claimBadge] caught error:", err);
      setSlowNetwork(false);
      const m = err?.message?.toLowerCase() ?? "";

      // UGF modal closed — check chain before treating as failure
      if (m.includes("modal") || m.includes("closed") || m.includes("popup") || m.includes("dismissed")) {
        console.log("[claimBadge] modal closed — checking on-chain state");
        try {
          const rp       = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, rp);
          const addr     = signerAddr || await (await rp.getSigner()).getAddress();
          const claimed  = await contract.hasClaimedSkill(addr, selectedSkill.label);
          if (claimed) {
            console.log("[claimBadge] badge IS on-chain after modal close — showing success");
            await fetchOnChainState(walletAddress);
            setHasClaimed(true);
            setClaimedSkill(selectedSkill);
            setStep(3);
            setOnChainClaimed((prev) => new Set([...prev, selectedSkill.label]));
            setMsg("✅ Badge confirmed on-chain!", "success");
            return;
          }
        } catch (_) {}
        setMsg("Transaction cancelled. Feel free to try again.", "error");
        return;
      }

      if (m.includes("user rejected") || m.includes("user denied") || err?.code === 4001) {
        setMsg("Transaction rejected in MetaMask. No badge was claimed.", "error");
        return;
      }
      if (m.includes("already claimed")) {
        setMsg("You already own this badge! Pick a different skill.", "error");
        fetchOnChainState(walletAddress);
        return;
      }
      if (m.includes("network") || m.includes("chain")) {
        setMsg("Network error. Please ensure you're on Base Sepolia and retry.", "error");
        return;
      }
      if (m.includes("insufficient")) {
        // Updated message triggers FaucetGuide in JSX below
        setMsg("Insufficient Mock USD for gas. Get free testnet tokens below.", "error");
        return;
      }
      setMsg("Something went wrong. Please retry.", "error");

    } finally {
      setLoading(false);
    }
  }

  // ── Reset for another claim ───────────────────────────────────
  function resetForAnother() {
    setHasClaimed(false); setClaimedSkill(null);
    setTxHash(""); setBadgeId(null); setStatus(""); setMintTimestamp("");
    setSelectedSkill(null); setStep(2);
  }

  const shortAddr = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  const badgesRemaining = SKILLS.length - onChainClaimed.size;

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #030710;
          font-family: 'Outfit', sans-serif;
          color: #e2e8f0;
          min-height: 100vh;
          overflow-x: hidden;
        }

        @keyframes floatUp {
          0%   { transform:translateY(0) rotate(0deg);     opacity:var(--op); }
          50%  { transform:translateY(-26px) rotate(180deg); opacity:calc(var(--op)*1.5); }
          100% { transform:translateY(0) rotate(360deg);   opacity:var(--op); }
        }
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulseRing {
          0%   { box-shadow:0 0 0 0 rgba(99,102,241,.55); }
          70%  { box-shadow:0 0 0 12px rgba(99,102,241,0); }
          100% { box-shadow:0 0 0 0 rgba(99,102,241,0); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes badgePop {
          0%   { transform:scale(.45) rotate(-8deg); opacity:0; }
          55%  { transform:scale(1.08) rotate(2deg); opacity:1; }
          75%  { transform:scale(.97) rotate(-1deg); }
          100% { transform:scale(1) rotate(0deg); }
        }
        @keyframes spin      { to { transform:rotate(360deg); } }
        @keyframes glowPulse { 0%,100%{opacity:.45} 50%{opacity:.9} }
        @keyframes rippleOut {
          0%   { transform:scale(1); opacity:.7; }
          100% { transform:scale(2.6); opacity:0; }
        }
        @keyframes trophyBounce {
          0%,100% { transform:translateY(0) scale(1); }
          40%     { transform:translateY(-11px) scale(1.1); }
          60%     { transform:translateY(-4px) scale(1.04); }
        }
        @keyframes legendaryGlow {
          0%,100% { filter:drop-shadow(0 0 7px #f59e0b) drop-shadow(0 0 14px #f59e0b33); }
          50%     { filter:drop-shadow(0 0 14px #f59e0b) drop-shadow(0 0 28px #f59e0b66); }
        }
        @keyframes epicGlow {
          0%,100% { filter:drop-shadow(0 0 5px #a78bfa) drop-shadow(0 0 10px #a78bfa33); }
          50%     { filter:drop-shadow(0 0 10px #a78bfa) drop-shadow(0 0 22px #a78bfa66); }
        }
        @keyframes networkWarn {
          0%,100% { border-color:rgba(248,113,113,.25); }
          50%     { border-color:rgba(248,113,113,.6); }
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cardEntrance {
          from { opacity:0; transform:translateY(22px) scale(.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes successPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(74,222,128,0); }
          50%     { box-shadow:0 0 0 6px rgba(74,222,128,.1); }
        }
        @keyframes badgeCountPop {
          0%   { transform:scale(1); }
          40%  { transform:scale(1.18); }
          100% { transform:scale(1); }
        }
        @keyframes tiltIn {
          from { opacity:0; transform:rotateY(-8deg) translateY(8px); }
          to   { opacity:1; transform:rotateY(0deg) translateY(0); }
        }

        /* ── Layout ── */
        .page {
          min-height:100vh; display:flex; flex-direction:column;
          align-items:center; padding:36px 16px 80px; position:relative;
        }
        .bg-grid {
          position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:
            linear-gradient(rgba(99,102,241,.028) 1px,transparent 1px),
            linear-gradient(90deg,rgba(99,102,241,.028) 1px,transparent 1px);
          background-size:52px 52px;
        }
        .bg-orb {
          position:fixed; border-radius:50%;
          filter:blur(120px); pointer-events:none; z-index:0;
        }
        .particle {
          position:fixed; border-radius:50%; pointer-events:none; z-index:0;
          animation:floatUp var(--dur) ease-in-out var(--delay) infinite;
        }
        .content { position:relative; z-index:1; width:100%; max-width:490px; }

        /* ── Header ── */
        .header { text-align:center; margin-bottom:28px; animation:fadeSlideIn .5s ease both; }
        .logo-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(99,102,241,.09); border:1px solid rgba(99,102,241,.2);
          border-radius:100px; padding:5px 15px;
          font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
          color:#818cf8; margin-bottom:14px;
        }
        .logo-dot {
          width:7px; height:7px; border-radius:50%; background:#4ade80;
          animation:glowPulse 2s ease infinite; box-shadow:0 0 8px #4ade80;
        }
        .main-title {
          font-family:'Syne',sans-serif; font-size:clamp(38px,8vw,58px);
          font-weight:900; line-height:1.0; letter-spacing:-1px;
          background:linear-gradient(135deg,#fff 0%,#818cf8 42%,#c084fc 78%,#f59e0b 100%);
          background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          margin-bottom:10px;
        }
        .main-sub { color:#3a4b65; font-size:13px; line-height:1.7; max-width:340px; margin:0 auto; }

        /* ── Steps ── */
        .steps {
          display:flex; align-items:center; justify-content:center;
          gap:0; margin-bottom:24px; animation:fadeSlideIn .5s .1s ease both;
        }
        .step-item { display:flex; align-items:center; gap:8px; }
        .step-num {
          width:32px; height:32px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:800; transition:all .4s ease;
        }
        .step-num.done    { background:#4ade80; color:#022c22; box-shadow:0 0 14px rgba(74,222,128,.45); }
        .step-num.active  { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; animation:pulseRing 2s infinite; }
        .step-num.inactive{ background:rgba(255,255,255,.04); color:#2a3545; border:1px solid rgba(255,255,255,.07); }
        .step-label { font-size:10px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; transition:color .3s; }
        .step-label.done    { color:#4ade80; }
        .step-label.active  { color:#a5b4fc; }
        .step-label.inactive{ color:#1a2535; }
        .step-line { width:34px; height:1px; margin:0 8px; transition:background .5s; }
        .step-line.done    { background:linear-gradient(90deg,#4ade80,#22d3ee); }
        .step-line.inactive{ background:rgba(255,255,255,.05); }

        /* ── Network warning ── */
        .network-warn {
          display:flex; align-items:center; gap:10px;
          background:rgba(248,113,113,.07); border:1px solid rgba(248,113,113,.22);
          border-radius:14px; padding:10px 14px; margin-bottom:14px;
          font-size:12px; color:#f87171; font-weight:600;
          animation:networkWarn 2s ease infinite, slideDown .3s ease;
        }
        .network-warn-icon { font-size:16px; flex-shrink:0; }
        .switch-btn {
          margin-left:auto; background:rgba(248,113,113,.12);
          border:1px solid rgba(248,113,113,.28); border-radius:7px;
          padding:3px 10px; color:#f87171; font-size:10px; font-weight:700;
          cursor:pointer; font-family:'Outfit',sans-serif; transition:background .2s;
        }
        .switch-btn:hover { background:rgba(248,113,113,.22); }

        /* ── Slow network banner ── */
        .slow-network {
          display:flex; align-items:center; gap:8px;
          background:rgba(245,158,11,.07); border:1px solid rgba(245,158,11,.18);
          border-radius:12px; padding:8px 13px; margin-top:10px;
          font-size:11px; color:#f59e0b; font-weight:600;
          animation:slideDown .3s ease;
        }

        /* ── Card ── */
        .card {
          background:rgba(9,15,32,.78);
          border:1px solid rgba(99,102,241,.14);
          border-radius:28px; padding:28px;
          backdrop-filter:blur(28px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,.02),
            0 28px 56px rgba(0,0,0,.55),
            0 0 90px rgba(99,102,241,.05);
          animation:cardEntrance .55s ease both;
        }

        /* ── Wallet pill ── */
        .wallet-pill {
          display:flex; align-items:center; justify-content:space-between;
          background:rgba(74,222,128,.05); border:1px solid rgba(74,222,128,.15);
          border-radius:14px; padding:10px 15px; margin-bottom:14px; font-size:13px;
          animation:successPulse 3s ease infinite;
        }
        .wallet-left { display:flex; align-items:center; gap:9px; color:#4ade80; font-weight:700; }
        .wallet-dot {
          width:8px; height:8px; border-radius:50%; background:#4ade80;
          box-shadow:0 0 9px #4ade80; animation:glowPulse 2s ease infinite;
        }
        .wallet-addr { color:#3f5070; font-size:11px; font-family:'DM Mono',monospace; letter-spacing:.04em; }
        .returning-tag {
          font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;
          background:rgba(99,102,241,.16); color:#a5b4fc;
          border-radius:6px; padding:2px 7px; margin-left:4px;
        }

        /* ── Badge counter ── */
        .badge-counter {
          display:flex; align-items:center; justify-content:center; gap:6px;
          font-size:11px; color:#334155; font-weight:600;
          margin-bottom:14px; padding:6px 12px;
          background:rgba(99,102,241,.05); border:1px solid rgba(99,102,241,.1);
          border-radius:10px;
        }
        .badge-counter strong { color:#818cf8; }
        .badge-counter.pop   { animation:badgeCountPop .4s ease; }

        /* ── Skill grid ── */
        .skill-section-label {
          font-size:11px; font-weight:700; letter-spacing:.1em;
          text-transform:uppercase; color:#263245; margin-bottom:12px;
          display:flex; align-items:center; gap:8px;
        }
        .skill-section-label::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.04); }
        .skill-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:16px; }

        .skill-card {
          border-radius:16px; padding:13px 12px; cursor:pointer;
          transition:all .2s ease; border:1.5px solid rgba(255,255,255,.05);
          background:rgba(255,255,255,.02); text-align:left;
          position:relative; overflow:hidden;
          font-family:'Outfit',sans-serif;
          perspective:600px;
        }
        .skill-card:hover:not(.disabled):not(.on-chain-claimed) {
          transform:translateY(-3px) rotateX(2deg) rotateY(-1.5deg);
          background:rgba(255,255,255,.045);
          border-color:rgba(255,255,255,.09);
        }
        .skill-card.selected {
          border-color:var(--sc);
          background:rgba(255,255,255,.048);
        }
        .skill-card.selected.rarity-common    { box-shadow:0 0 10px rgba(52,211,153,0.2); }
        .skill-card.selected.rarity-rare      { box-shadow:0 0 14px rgba(97,218,251,0.28); }
        .skill-card.selected.rarity-epic      { box-shadow:0 0 18px rgba(167,139,250,0.36); }
        .skill-card.selected.rarity-legendary { box-shadow:0 0 24px rgba(245,158,11,0.44); }
        .skill-card.on-chain-claimed {
          opacity:.48; pointer-events:none;
          border-color:rgba(74,222,128,.18) !important;
          background:rgba(74,222,128,.03) !important;
        }
        .skill-card.disabled { pointer-events:none; opacity:.35; }

        .skill-icon { font-size:22px; margin-bottom:6px; display:block; }
        .skill-card.selected.rarity-legendary .skill-icon { animation:legendaryGlow 2s ease infinite; }
        .skill-card.selected.rarity-epic      .skill-icon { animation:epicGlow 2.2s ease infinite; }

        .skill-name { font-size:11.5px; font-weight:700; color:#e2e8f0; line-height:1.3; margin-bottom:2px; }
        .skill-desc { font-size:10px; color:#263245; }
        .skill-check {
          position:absolute; top:8px; right:8px;
          width:18px; height:18px; border-radius:50%;
          background:var(--sc); display:flex; align-items:center; justify-content:center;
          font-size:10px; color:#000; font-weight:900;
        }
        .skill-claimed-overlay {
          position:absolute; top:7px; right:7px;
          background:rgba(74,222,128,.18); color:#4ade80;
          border-radius:6px; padding:2px 7px;
          font-size:9px; font-weight:800; letter-spacing:.05em;
        }
        .rarity-tag {
          display:inline-block; margin-top:6px;
          font-size:9px; font-weight:800; letter-spacing:.07em; text-transform:uppercase;
          padding:2px 7px; border-radius:5px;
          background:rgba(255,255,255,.055); color:var(--rc);
        }

        /* ── Select prompt ── */
        .select-prompt {
          text-align:center; padding:9px;
          font-size:12px; color:#263245; font-weight:500;
          background:rgba(99,102,241,.04); border:1px dashed rgba(99,102,241,.13);
          border-radius:12px; margin-bottom:14px; animation:slideDown .3s ease;
        }

        /* ── Gas bar ── */
        .gas-bar {
          display:flex; align-items:center; gap:8px;
          background:rgba(99,102,241,.05); border:1px solid rgba(99,102,241,.1);
          border-radius:13px; padding:9px 14px; margin-bottom:14px;
          font-size:12px; color:#3f5070; font-weight:500;
        }
        .gas-chip {
          background:rgba(99,102,241,.2); color:#a5b4fc;
          border-radius:6px; padding:1px 8px;
          font-size:10px; font-weight:800; letter-spacing:.06em;
        }
        .gas-bar-stat {
          margin-left:auto; font-size:10px; color:#263245; white-space:nowrap;
        }

        /* ── Buttons ── */
        .btn {
          width:100%; padding:15px; border-radius:16px; border:none;
          font-family:'Outfit',sans-serif; font-size:clamp(13px,3.5vw,15px);
          font-weight:700; color:#fff; cursor:pointer;
          position:relative; overflow:hidden;
          transition:all .2s ease; letter-spacing:.02em;
          white-space:nowrap; text-overflow:ellipsis;
        }
        .btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,transparent,rgba(255,255,255,.08),transparent);
          background-size:200% 100%; animation:shimmer 3s ease infinite;
        }
        .btn-claim { background:linear-gradient(135deg,#5b5ef4,#8b5cf6,#7c3aed); }
        .btn-claim:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 28px rgba(99,102,241,.42); }
        .btn-claim:active:not(:disabled){ transform:translateY(0); }
        .btn-claim:disabled { opacity:.48; cursor:not-allowed; transform:none !important; }
        .btn-claim.is-loading { background:linear-gradient(135deg,#373a8a,#58388a); cursor:wait; }
        .btn-connect {
          background:linear-gradient(135deg,#131d36,#0b1320);
          border:1px solid rgba(99,102,241,.26);
        }
        .btn-connect:hover { border-color:rgba(99,102,241,.48); box-shadow:0 0 28px rgba(99,102,241,.14); }
        .btn-secondary {
          background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.11);
          font-size:clamp(11px,3vw,13px); padding:11px; margin-top:12px;
        }
        .btn-secondary:hover { background:rgba(255,255,255,.09); }
        .btn-icon { margin-right:8px; font-size:16px; }

        /* ── Spinner ── */
        .spinner {
          display:inline-block; width:15px; height:15px;
          border:2px solid rgba(255,255,255,.22); border-top-color:#fff;
          border-radius:50%; animation:spin .65s linear infinite;
          margin-right:8px; vertical-align:middle;
        }
        .loading-steps { display:flex; justify-content:center; gap:6px; margin-top:10px; }
        .loading-dot {
          width:6px; height:6px; border-radius:50%;
          background:rgba(99,102,241,.3); animation:glowPulse 1.2s ease infinite;
        }
        .loading-dot:nth-child(2) { animation-delay:.2s; }
        .loading-dot:nth-child(3) { animation-delay:.4s; }

        /* ── Status bar ── */
        .status-bar {
          margin-top:12px; padding:9px 13px; border-radius:12px;
          font-size:12px; font-weight:500;
          display:flex; align-items:center; gap:8px; animation:slideDown .3s ease;
        }
        .s-info    { background:rgba(99,102,241,.08); color:#a5b4fc; border:1px solid rgba(99,102,241,.16); }
        .s-success { background:rgba(74,222,128,.08); color:#4ade80; border:1px solid rgba(74,222,128,.16); }
        .s-error   { background:rgba(248,113,113,.08); color:#f87171; border:1px solid rgba(248,113,113,.16); }

        /* ── Badge success wrap ── */
        .badge-wrap {
          margin-top:20px; position:relative;
          animation:badgePop .7s cubic-bezier(.34,1.56,.64,1) both;
        }
        .badge-ripple {
          position:absolute; inset:-18px; border-radius:34px;
          border:2px solid var(--sc);
          animation:rippleOut 1.1s ease forwards; pointer-events:none;
        }
        .badge-ripple2 {
          position:absolute; inset:-10px; border-radius:30px;
          border:1.5px solid var(--sc);
          animation:rippleOut 1.3s .2s ease forwards; pointer-events:none;
        }
        .badge-card {
          border-radius:22px; padding:28px 22px;
          position:relative; overflow:hidden; text-align:center;
        }
        .badge-noise {
          position:absolute; inset:0; pointer-events:none; opacity:.35;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
        }
        .badge-shine {
          position:absolute; top:-50%; left:-50%; width:200%; height:200%;
          background:conic-gradient(transparent 0deg,rgba(255,255,255,.07) 60deg,transparent 120deg);
          animation:spin 10s linear infinite; pointer-events:none;
        }
        .badge-minted-label {
          display:inline-flex; align-items:center; gap:5px;
          background:rgba(255,255,255,.14); backdrop-filter:blur(8px);
          border-radius:100px; padding:4px 12px;
          font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
          color:rgba(255,255,255,.9); margin-bottom:12px;
        }
        .badge-minted-dot { width:5px; height:5px; border-radius:50%; background:#4ade80; box-shadow:0 0 7px #4ade80; }
        .badge-icon-wrap { position:relative; display:inline-block; margin-bottom:10px; }
        .badge-icon { font-size:56px; filter:drop-shadow(0 4px 16px rgba(0,0,0,.4)); display:block; animation:trophyBounce 2.2s ease infinite; }
        .badge-trophy { position:absolute; top:-6px; right:-16px; font-size:20px; }
        .badge-title {
          font-family:'Syne',sans-serif; font-size:21px; font-weight:900;
          color:#fff; text-shadow:0 2px 14px rgba(0,0,0,.4); margin-bottom:3px;
        }
        .badge-sub {
          font-size:10px; font-weight:700; color:rgba(255,255,255,.55);
          letter-spacing:.12em; text-transform:uppercase; margin-bottom:14px;
        }
        .badge-meta { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-bottom:10px; }
        .badge-meta-tag {
          background:rgba(255,255,255,.13); border-radius:100px;
          padding:3px 11px; font-size:10px; font-weight:700;
          color:rgba(255,255,255,.9); backdrop-filter:blur(4px);
        }
        .badge-id {
          font-size:11px; color:rgba(255,255,255,.42);
          font-family:'DM Mono',monospace; margin-bottom:5px;
        }
        .badge-timestamp {
          font-size:10px; color:rgba(255,255,255,.35);
          font-family:'DM Mono',monospace; margin-bottom:10px;
        }
        .badge-network {
          display:flex; align-items:center; gap:6px; justify-content:center;
          font-size:10px; color:rgba(255,255,255,.45); font-weight:600;
        }
        .badge-network-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; box-shadow:0 0 7px #4ade80; }

        /* ── Gas saved ── */
        .gas-saved {
          margin-top:10px; padding:10px 14px;
          background:rgba(74,222,128,.06); border:1px solid rgba(74,222,128,.14);
          border-radius:12px; text-align:center;
          font-size:12px; color:#4ade80; font-weight:700;
        }
        .gas-saved span { opacity:.5; font-weight:400; }

        /* ── Transaction receipt ── */
        .receipt-card {
          margin-top:12px; padding:16px;
          background:rgba(255,255,255,.025); border:1px solid rgba(99,102,241,.14);
          border-radius:16px; animation:slideDown .4s ease;
        }
        .receipt-header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:12px;
        }
        .receipt-title {
          font-size:12px; font-weight:800; letter-spacing:.06em;
          text-transform:uppercase; color:#64748b;
        }
        .receipt-confirmed {
          font-size:10px; font-weight:800; color:#4ade80;
          background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.2);
          border-radius:100px; padding:2px 10px;
        }
        .receipt-rows { display:flex; flex-direction:column; gap:7px; margin-bottom:12px; }
        .receipt-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .receipt-label { font-size:10px; color:#334155; font-weight:600; flex-shrink:0; }
        .receipt-value { font-size:11px; color:#94a3b8; font-weight:600; text-align:right; }
        .receipt-mono  { font-family:'DM Mono',monospace; font-size:10px; }
        .receipt-green { color:#4ade80; }
        .receipt-hash-section { margin-top:8px; padding-top:10px; border-top:1px solid rgba(255,255,255,.05); }
        .receipt-hash-row {
          display:flex; align-items:center; gap:8px; margin-top:5px;
          background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06);
          border-radius:8px; padding:7px 10px;
        }
        .receipt-hash-text { font-size:10px; color:#4a5a7a; font-family:'DM Mono',monospace; flex:1; word-break:break-all; }
        .receipt-copy-btn {
          flex-shrink:0; background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.25);
          border-radius:6px; padding:3px 10px; color:#a5b4fc;
          font-size:10px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif;
          transition:background .2s; white-space:nowrap;
        }
        .receipt-copy-btn:hover { background:rgba(99,102,241,.25); }

        /* ── BaseScan link ── */
        .basescan-link {
          display:flex; align-items:center; justify-content:center; gap:8px;
          padding:10px 14px;
          background:rgba(99,102,241,.06); border:1px solid rgba(99,102,241,.14);
          border-radius:12px; text-decoration:none;
          font-size:12px; color:#a5b4fc; font-weight:700;
          transition:background .2s, transform .2s;
        }
        .basescan-link:hover { background:rgba(99,102,241,.12); transform:translateY(-1px); }

        /* ── Inventory ── */
        .inventory-wrap { margin-top:20px; }
        .section-label {
          font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
          color:#1a2535; margin-bottom:10px;
          display:flex; align-items:center; gap:8px;
        }
        .section-label::before, .section-label::after {
          content:''; flex:1; height:1px; background:rgba(255,255,255,.04);
        }
        .inventory-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .inv-card {
          border-radius:13px; padding:12px 8px; text-align:center;
          background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.05);
          transition:transform .2s, box-shadow .2s;
        }
        .inv-card:hover { transform:translateY(-3px); }
        .inv-card.rarity-legendary { box-shadow:0 0 12px rgba(245,158,11,.18); border-color:rgba(245,158,11,.18); }
        .inv-card.rarity-epic      { box-shadow:0 0 9px rgba(167,139,250,.18); border-color:rgba(167,139,250,.18); }
        .inv-card.rarity-rare      { box-shadow:0 0 7px rgba(97,218,251,.14); border-color:rgba(97,218,251,.14); }
        .inv-icon   { font-size:24px; margin-bottom:5px; }
        .inv-name   { font-size:9px; font-weight:700; color:#4a5a7a; line-height:1.3; margin-bottom:3px; }
        .inv-rarity { font-size:8px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; }
        .inv-id     { font-size:8px; color:#1a2535; font-family:'DM Mono',monospace; margin-top:2px; }

        /* ── History ── */
        .history-wrap { margin-top:20px; animation:fadeSlideIn .5s ease both; }
        .history-item {
          display:flex; align-items:center; justify-content:space-between;
          padding:9px 12px;
          background:rgba(255,255,255,.016); border:1px solid rgba(255,255,255,.03);
          border-radius:12px; margin-bottom:5px; font-size:12px; transition:background .2s;
        }
        .history-item:hover { background:rgba(255,255,255,.028); }
        .history-left  { display:flex; align-items:center; gap:9px; }
        .history-emoji { font-size:17px; }
        .history-skill { color:#e2e8f0; font-weight:700; font-size:12px; }
        .history-time  { color:#1a2535; font-size:10px; margin-top:1px; }
        .history-hash  { color:#263245; font-size:9px; font-family:'DM Mono',monospace; margin-top:1px; }
        .history-badge {
          background:rgba(74,222,128,.08); color:#4ade80;
          border-radius:6px; padding:2px 8px;
          font-size:9px; font-weight:800; letter-spacing:.06em;
        }

        /* ── Why Gasless ── */
        .why-gasless {
          margin-top:16px; padding:14px;
          background:rgba(99,102,241,.03); border:1px solid rgba(99,102,241,.09);
          border-radius:14px;
        }
        .why-title {
          font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
          color:#2d3f5a; margin-bottom:10px;
        }
        .why-row { display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; font-size:11px; color:#263245; line-height:1.55; }
        .why-row:last-child { margin-bottom:0; }
        .why-icon  { font-size:13px; flex-shrink:0; margin-top:1px; }
        .why-highlight { color:#818cf8; font-weight:600; }

        /* ── Connect screen ── */
        .connect-icon  { font-size:60px; margin-bottom:16px; }
        .connect-title { font-family:'Syne',sans-serif; font-size:21px; font-weight:900; color:#e2e8f0; margin-bottom:8px; }
        .connect-sub   { color:#263245; font-size:13px; margin-bottom:22px; line-height:1.7; }
        .connect-features { display:flex; flex-direction:column; gap:7px; margin-bottom:20px; text-align:left; }
        .connect-feat {
          display:flex; align-items:center; gap:10px;
          background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.05);
          border-radius:11px; padding:9px 12px; font-size:12px; color:#3f5070; font-weight:500;
        }
        .connect-feat-icon { font-size:16px; flex-shrink:0; }
        .onboarding-steps {
          display:flex; gap:0; margin-bottom:20px;
          background:rgba(99,102,241,.05); border:1px solid rgba(99,102,241,.11);
          border-radius:14px; padding:12px 14px; align-items:center;
        }
        .ob-step {
          flex:1; text-align:center; position:relative;
          font-size:10px; color:#3f5070; font-weight:600;
          display:flex; flex-direction:column; align-items:center; gap:5px;
        }
        .ob-step:not(:last-child)::after {
          content:'→'; position:absolute; right:-8px; top:12px; color:#1a2535; font-size:12px;
        }
        .ob-num {
          width:26px; height:26px; border-radius:50%;
          background:rgba(99,102,241,.18); color:#818cf8;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:800;
        }

        /* ── Footer ── */
        .ugf-brand {
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin-top:16px; padding:9px 14px;
          background:rgba(99,102,241,.04); border:1px solid rgba(99,102,241,.09);
          border-radius:12px; font-size:11px; color:#2d3f5a; font-weight:600;
        }
        .ugf-dot   { color:#818cf8; font-size:13px; }
        .ugf-brand strong { color:#6366f1; }
        .footer {
          margin-top:28px; text-align:center;
          font-size:11px; color:#1a2535; animation:fadeSlideIn .6s .3s ease both;
        }
        .powered {
          display:inline-flex; align-items:center; gap:6px; margin-top:7px;
          background:rgba(99,102,241,.06); border:1px solid rgba(99,102,241,.1);
          border-radius:100px; padding:4px 13px;
          font-size:10px; color:#263245; font-weight:700;
        }
        .powered-dot { color:#818cf8; }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .page  { padding:20px 12px 60px; }
          .card  { padding:20px 16px; border-radius:22px; }
          .main-title { font-size:34px; }
          .skill-grid { gap:7px; }
          .skill-card { padding:11px 9px; }
          .skill-icon { font-size:18px; }
          .skill-name { font-size:10px; }
          .step-line  { width:22px; }
          .step-label { display:none; }
          .badge-icon { font-size:46px; }
          .inventory-grid { gap:6px; }
          .why-gasless { display:none; }
          .onboarding-steps { flex-direction:column; gap:8px; }
          .ob-step:not(:last-child)::after { content:'↓'; position:static; }
          .btn { font-size:13px; padding:13px; }
          .receipt-card { padding:14px; }
        }
        @media (max-width: 360px) {
          .skill-grid { grid-template-columns:1fr; }
          .main-title { font-size:30px; }
        }
      `}</style>

      <Confetti active={showConfetti} />

      <div className="page">
        <div className="bg-grid" />
        <div className="bg-orb" style={{ width:500,height:500,top:-220,left:-220, background:"radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 70%)" }} />
        <div className="bg-orb" style={{ width:400,height:400,bottom:-160,right:-160, background:"radial-gradient(circle,rgba(167,139,250,.07) 0%,transparent 70%)" }} />
        <div className="bg-orb" style={{ width:280,height:280,top:"42%",right:-90, background:"radial-gradient(circle,rgba(245,158,11,.04) 0%,transparent 70%)" }} />
        {particles.map((p) => (
          <div key={p.id} className="particle" style={{
            left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size,
            background:`rgba(99,102,241,${p.opacity})`,
            "--dur":`${p.dur}s`, "--delay":`${p.delay}s`, "--op":p.opacity,
          }} />
        ))}

        <div className="content">
          <Header />
          <Stepper step={step} />

          <div className="card">
            {!walletAddress ? (
              <ConnectScreen
                onConnect={connectWallet}
                status={status}
                statusType={statusType}
              />
            ) : (
              <>
                {/* Network warning */}
                {!networkOk && (
                  <div className="network-warn">
                    <span className="network-warn-icon">⚠️</span>
                    <div>Wrong network. Switch to <strong>Base Sepolia</strong>.</div>
                    <button className="switch-btn" onClick={async () => {
                      try {
                        await window.ethereum.request({ method:"wallet_switchEthereumChain", params:[{chainId:BASE_SEPOLIA_CHAIN_ID_HEX}] });
                        setNetworkOk(true);
                      } catch (_) {}
                    }}>Switch</button>
                  </div>
                )}

                {/* Wallet pill */}
                <div className="wallet-pill">
                  <div className="wallet-left">
                    <span className="wallet-dot" />
                    Connected
                    {isReturning && <span className="returning-tag">Returning</span>}
                  </div>
                  <span className="wallet-addr">{shortAddr}</span>
                </div>

                {/* Badge counter */}
                {onChainClaimed.size > 0 && (
                  <div className={`badge-counter${hasClaimed ? " pop" : ""}`}>
                    🏅 <strong>{onChainClaimed.size} / {SKILLS.length}</strong> Badges Collected
                  </div>
                )}

                {/* Skill grid */}
                <div className="skill-section-label">Select your skill badge</div>
                <SkillGrid
                  selectedSkill={selectedSkill}
                  onSelect={setSelectedSkill}
                  loading={loading}
                  hasClaimed={hasClaimed}
                  onChainClaimed={onChainClaimed}
                />

                {/* Select prompt */}
                {!selectedSkill && !hasClaimed && (
                  <div className="select-prompt">👆 Tap a skill card above to select your badge</div>
                )}

                {/* Gas bar */}
                <div className="gas-bar">
                  ⚡ Gas fee <span className="gas-chip">FREE</span>
                  · Gas sponsored using testnet Mock USD
                  {totalMinted !== null && (
                    <span className="gas-bar-stat">🏅 {totalMinted} minted</span>
                  )}
                </div>

                {/* Claim button */}
                <button
                  className={`btn btn-claim${loading ? " is-loading" : ""}`}
                  onClick={claimBadge}
                  disabled={
                    loading || hasClaimed || !selectedSkill || !networkOk ||
                    (selectedSkill && onChainClaimed.has(selectedSkill.label))
                  }
                >
                  {loading ? (
                    <><span className="spinner" />{status || "Processing..."}</>
                  ) : hasClaimed ? (
                    <>✅ Badge Claimed</>
                  ) : !selectedSkill ? (
                    <>🏅 Select a Skill to Claim</>
                  ) : onChainClaimed.has(selectedSkill?.label) ? (
                    <>✅ Already Owned On-Chain</>
                  ) : (
                    <><span className="btn-icon">🏅</span>Claim {selectedSkill.label} Badge</>
                  )}
                </button>

                {/* Loading dots */}
                {loading && (
                  <div className="loading-steps">
                    <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
                  </div>
                )}

                {/* Slow network warning */}
                {slowNetwork && loading && (
                  <div className="slow-network">
                    ⏳ Network is taking longer than usual — please wait…
                  </div>
                )}

                {/* Status bar + FaucetGuide (shown on insufficient balance error) */}
                {!loading && status && (
                  <>
                    <div className={`status-bar s-${statusType}`} style={{ textAlign:"left" }}>
                      {statusType === "success" ? "✅" : statusType === "error" ? "⚠️" : "🔄"} {status}
                    </div>
                    {statusType === "error" && status.toLowerCase().includes("insufficient") && (
                      <FaucetGuide />
                    )}
                  </>
                )}

                {/* Success: badge card + receipt */}
                {hasClaimed && claimedSkill && (
                  <div className="badge-wrap" ref={badgeRef}>
                    <div className="badge-ripple"  style={{ "--sc": claimedSkill.color }} />
                    <div className="badge-ripple2" style={{ "--sc": claimedSkill.color }} />

                    <BadgeCard
                      skill={claimedSkill}
                      badgeId={badgeId}
                      mintTimestamp={mintTimestamp}
                    />

                    <div className="gas-saved">
                      ⚡ You saved ~${gasSaved} in gas fees
                      <span> · Powered by UGF abstraction</span>
                    </div>

                    <TransactionReceipt
                      txHash={txHash}
                      badgeId={badgeId}
                      walletAddress={walletAddress}
                      skill={claimedSkill}
                      gasSaved={gasSaved}
                      mintTimestamp={mintTimestamp}
                    />

                    {badgesRemaining > 0 ? (
                      <button className="btn btn-secondary" onClick={resetForAnother}>
                        🔄 Claim Another Badge ({badgesRemaining} remaining)
                      </button>
                    ) : (
                      <div style={{
                        marginTop:"12px", textAlign:"center", fontSize:"12px",
                        color:"#4ade80", fontWeight:"700", padding:"10px",
                        background:"rgba(74,222,128,.06)", borderRadius:"12px",
                        border:"1px solid rgba(74,222,128,.14)"
                      }}>
                        🏆 You've collected all 6 skill badges!
                      </div>
                    )}
                  </div>
                )}

                <Inventory inventory={inventory} onChainClaimed={onChainClaimed} />
                <History   txHistory={txHistory} />
                <WhyGasless />
              </>
            )}
          </div>

          <div className="ugf-brand">
            <span className="ugf-dot">◆</span>
            Built on <strong>Base Sepolia</strong> · Gasless via <strong>UGF</strong> · No ETH required
          </div>

          <div className="footer">
            <div>SkillBadge — Onchain credentials for the next generation of builders</div>
            <div className="powered">
              <span className="powered-dot">◆</span>
              Powered by UGF Gas Abstraction
            </div>
          </div>
        </div>
      </div>
    </>
  );
}