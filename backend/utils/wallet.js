const { ethers } = require("ethers");

function normalizeAddress(address) {
  return ethers.getAddress(address);
}

function isValidEthereumAddress(address) {
  try {
    normalizeAddress(address);
    return true;
  } catch {
    return false;
  }
}

module.exports = { normalizeAddress, isValidEthereumAddress };
