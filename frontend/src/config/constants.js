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

/** Fixed Base Sepolia RPC — contract reads must not use MetaMask (network can switch mid-flow). */
export const BASE_SEPOLIA_RPC =
  import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
  import.meta.env.VITE_BASE_SEPOLIA_RPC ||
  (import.meta.env.DEV ? "/rpc/base-sepolia" : "https://sepolia.base.org");

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

export const CONFETTI_COLORS = ["#6366f1","#a78bfa","#34d399","#f59e0b","#f87171","#61dafb","#fff"];
