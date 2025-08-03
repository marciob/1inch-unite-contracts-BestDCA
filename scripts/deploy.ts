import { ethers } from "hardhat";

async function main() {
  // --- Parameters for Deployment (Base Sepolia Testnet) ---
  const LOP_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65"; // 1inch LOP is the same
  const BTC_USD_PRICE_FEED = "0xca239103f6e7262105310b2d7088998c36916b27"; // Chainlink BTC/USD on Base Sepolia
  const USDC_ADDRESS = "0x036cbd53842c5426634e7929541ec2318f3dcf7e"; // Bridged USDC on Base Sepolia

  // 1. Deploy the Predicate Helper Contract
  const TimeBucketPriceGuard = await ethers.getContractFactory(
    "TimeBucketPriceGuard"
  );
  const timeBucketPriceGuard = await TimeBucketPriceGuard.deploy(
    LOP_ADDRESS,
    BTC_USD_PRICE_FEED
  );
  await timeBucketPriceGuard.waitForDeployment();
  const predicateAddress = await timeBucketPriceGuard.getAddress();
  console.log(`TimeBucketPriceGuard deployed to: ${predicateAddress}`);

  // 2. Deploy the main Vault Contract
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(USDC_ADDRESS, predicateAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`Vault deployed to: ${vaultAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
