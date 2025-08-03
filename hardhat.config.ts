// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    amoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    // Add this new network configuration
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    // New Etherscan v2 API - single API key for all chains (recommended)
    apiKey: ETHERSCAN_API_KEY || {
      // Fallback to legacy network-specific API keys
      baseSepolia: BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};

export default config;
