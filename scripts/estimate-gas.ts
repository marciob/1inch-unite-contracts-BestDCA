import { ethers } from "hardhat";
import { formatEther, formatUnits } from "ethers";

async function main() {
  console.log("Estimating deployment gas cost...");

  // --- Get deployer and network information ---
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (!gasPrice) {
    throw new Error("Could not fetch gas price from the network.");
  }

  // --- Display Wallet and Network Info ---
  console.log("\n----------------------------------------");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Current Balance: ${formatEther(balance)} Native Token`);
  console.log(`Current Gas Price: ${formatUnits(gasPrice, "gwei")} Gwei`);
  console.log("----------------------------------------");

  // --- Use the same parameters as your deploy script (update if needed) ---
  const LOP_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65";
  const BTC_USD_PRICE_FEED = "0xca239103f6e7262105310b2d7088998c36916b27"; // Base Sepolia
  const USDC_ADDRESS = "0x036cbd53842c5426634e7929541ec2318f3dcf7e"; // Base Sepolia
  const DUMMY_PREDICATE_ADDRESS = "0x0000000000000000000000000000000000000001";

  // 1. Estimate for TimeBucketPriceGuard
  const TimeBucketPriceGuard = await ethers.getContractFactory(
    "TimeBucketPriceGuard"
  );
  const timeBucketDeployTx = await TimeBucketPriceGuard.getDeployTransaction(
    LOP_ADDRESS,
    BTC_USD_PRICE_FEED
  );
  const gasEstimateGuard = await ethers.provider.estimateGas(
    timeBucketDeployTx
  );
  const costGuard = gasEstimateGuard * gasPrice;

  console.log(`TimeBucketPriceGuard Deployment:`);
  console.log(`  - Gas Units (Estimate): ${gasEstimateGuard.toString()}`);
  console.log(
    `  - Cost (Estimate):      ${formatEther(costGuard)} Native Token`
  );

  // 2. Estimate for Vault
  const Vault = await ethers.getContractFactory("Vault");
  const vaultDeployTx = await Vault.getDeployTransaction(
    USDC_ADDRESS,
    DUMMY_PREDICATE_ADDRESS
  );
  const gasEstimateVault = await ethers.provider.estimateGas(vaultDeployTx);
  const costVault = gasEstimateVault * gasPrice;

  console.log(`\nVault Deployment:`);
  console.log(`  - Gas Units (Estimate): ${gasEstimateVault.toString()}`);
  console.log(
    `  - Cost (Estimate):      ${formatEther(costVault)} Native Token`
  );

  // 3. Calculate Final Summary
  const totalCost = costGuard + costVault;
  const difference = balance - totalCost;

  console.log("----------------------------------------");
  console.log("SUMMARY:");
  console.log(
    `  Total Estimated Cost:  ${formatEther(totalCost)} Native Token`
  );
  console.log(`  Your Current Balance:  ${formatEther(balance)} Native Token`);
  console.log("----------------------------------------");

  if (difference >= 0n) {
    console.log(`✅ You have enough funds.`);
    console.log(
      `   Surplus After Deploy: ${formatEther(difference)} Native Token`
    );
  } else {
    console.log(`❌ You have INSUFFICIENT funds.`);
    console.log(
      `   Amount Lacking: ${formatEther(difference * -1n)} Native Token`
    );
    console.log("   Please use a faucet to fund your deployer wallet.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
