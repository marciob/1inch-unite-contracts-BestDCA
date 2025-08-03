import { ethers, run } from "hardhat";

async function main() {
  // --- Parameters for Deployment (Base Sepolia Testnet) ---
  const LOP_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65";
  const BTC_USD_PRICE_FEED = "0xca239103f6e7262105310b2d7088998c36916b27";
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

  console.log("Starting deployment...");

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

  // 2. Deploy the main Vault Contract with the WETH address
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(predicateAddress, WETH_ADDRESS);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`Vault deployed to: ${vaultAddress}`);

  // Wait for a few block confirmations before verification
  console.log("Waiting for block confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

  // 3. Verify contracts on Etherscan
  try {
    console.log("Verifying TimeBucketPriceGuard contract...");
    await run("verify:verify", {
      address: predicateAddress,
      constructorArguments: [LOP_ADDRESS, BTC_USD_PRICE_FEED],
    });
    console.log("TimeBucketPriceGuard verified successfully");
  } catch (error) {
    console.log("TimeBucketPriceGuard verification failed:", error);
  }

  try {
    console.log("Verifying Vault contract...");
    await run("verify:verify", {
      address: vaultAddress,
      constructorArguments: [predicateAddress, WETH_ADDRESS],
    });
    console.log("Vault verified successfully");
  } catch (error) {
    console.log("Vault verification failed:", error);
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`TimeBucketPriceGuard: ${predicateAddress}`);
  console.log(`Vault: ${vaultAddress}`);
  console.log("Deployment completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
