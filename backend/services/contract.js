const { ethers } = require("ethers");
const { CONTRACT_ADDRESS, CONTRACT_ABI, BASE_SEPOLIA_RPC } = require("../config");

let provider;
let contract;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
  }
  return provider;
}

function getContract() {
  if (!contract) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getProvider());
  }
  return contract;
}

async function assertContractDeployed() {
  const code = await getProvider().getCode(CONTRACT_ADDRESS);
  if (code === "0x") {
    const err = new Error("SkillBadge contract not deployed at configured address");
    err.code = "CONTRACT_NOT_FOUND";
    throw err;
  }
}

/** @param {string} address */
async function getWalletBadges(address) {
  await assertContractDeployed();
  const c = getContract();
  const normalized = ethers.getAddress(address);

  const [claimedSkills, badgeCount, totalMinted] = await Promise.all([
    c.getClaimedSkills(normalized),
    c.getBadgeCount(normalized),
    c.totalBadgesMinted(),
  ]);

  const badges = await Promise.all(
    claimedSkills.map(async (skill) => {
      const badgeId = await c.getBadgeId(normalized, skill);
      return { skill, badgeId: Number(badgeId) };
    })
  );

  return {
    address: normalized,
    claimedSkills: [...claimedSkills],
    badgeCount: Number(badgeCount),
    badges,
    totalMinted: Number(totalMinted),
  };
}

/** Global contract stats (no wallet required). */
async function getBadgeStats() {
  await assertContractDeployed();
  const c = getContract();
  let totalMinted = null;
  try {
    totalMinted = Number(await c.totalBadgesMinted());
  } catch (err) {
    console.warn("[getBadgeStats] totalBadgesMinted unavailable:", err.shortMessage || err.message);
  }
  return { totalMinted, contractAddress: CONTRACT_ADDRESS };
}

module.exports = { getWalletBadges, getBadgeStats };
