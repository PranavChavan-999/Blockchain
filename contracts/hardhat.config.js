require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url:
        process.env.BASE_SEPOLIA_RPC_URL ||
        "https://sepolia.base.org",
      chainId: 84532,
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
};
