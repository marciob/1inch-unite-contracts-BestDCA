// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  // --- Parameters for Deployment (Polygon Amoy Testnet) ---
  const LOP_ADDRESS = "0x111111125421cA6dc452d289314280a0f8842A65";
  const WBTC_USD_PRICE_FEED = "0x007a22900a3b98143368bd5906f9e17e58e342ea";
  // --- CORRECTED ADDRESS (ALL LOWERCASE) ---
  const USDC_ADDRESS = "0x41e94eb019c0762f9bfc454586835f283635d926"; // USDC on Amoy

  // 1. Deploy the Predicate Helper Contract
  const TimeBucketPriceGuard = await ethers.getContractFactory(
    "TimeBucketPriceGuard"
  );
  const timeBucketPriceGuard = await TimeBucketPriceGuard.deploy(
    LOP_ADDRESS,
    WBTC_USD_PRICE_FEED
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
