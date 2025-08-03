import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

if (!AMOY_RPC_URL) {
  throw new Error("Please set AMOY_RPC_URL in your .env file");
}

if (!PRIVATE_KEY) {
  throw new Error("Please set PRIVATE_KEY in your .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    amoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: "auto", // Let it auto-detect, or set manually like: 30000000000
      gas: "auto", // Auto estimate gas limit
      timeout: 60000, // 60 seconds timeout
    },
  },
};

export default config;
