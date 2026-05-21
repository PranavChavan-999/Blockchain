const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const CONTRACT_ADDRESS = "0xf56AaaeDA493114f3461Dc091149643BA1cef802";

const CONTRACT_ABI = [
  "function hasClaimedSkill(address wallet, string memory skillName) public view returns (bool)",
  "function getClaimedSkills(address wallet) public view returns (string[] memory)",
  "function getBadgeCount(address wallet) public view returns (uint256)",
  "function getBadgeId(address wallet, string memory skillName) public view returns (uint256)",
  "function totalBadgesMinted() public view returns (uint256)",
];

const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

module.exports = {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  BASE_SEPOLIA_RPC,
  PORT,
  FRONTEND_ORIGIN,
};
