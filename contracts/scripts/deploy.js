const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer account. Set DEPLOYER_PRIVATE_KEY in contracts/.env"
    );
  }

  const net = await hre.ethers.provider.getNetwork();
  console.log("Network:", net.name, "chainId:", net.chainId.toString());
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  const SkillBadge = await hre.ethers.getContractFactory("SkillBadge");
  const contract = await SkillBadge.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\nSkillBadge deployed to:", address);
  console.log("\nAdd to frontend/.env:");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  console.log("\nAdd to backend/.env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
