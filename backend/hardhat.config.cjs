require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const sepoliaKey = process.env.DEPLOYER_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Public testnet. Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY (a throwaway wallet with test ETH) in backend\.env
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: sepoliaKey && sepoliaKey.length === 66 ? [sepoliaKey] : [],
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  },
};
