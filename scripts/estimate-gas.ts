import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=== GAS ESTIMATION FOR DEPLOYMENT ===");
  console.log("Deployer address:", deployer.address);

  // Check current balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Current POL balance:", ethers.formatEther(balance), "POL");

  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  console.log(
    "Current gas price:",
    ethers.formatUnits(feeData.gasPrice || 0n, "gwei"),
    "gwei"
  );

  // --- Parameters for Deployment (Polygon Amoy Testnet) ---
  const LOP_ADDRESS = "0x111111125421cA6dc452d289314280a0f8842A65";
  const WBTC_USD_PRICE_FEED = "0x007a22900a3b98143368bd5906f9e17e58e342ea";
  const USDC_ADDRESS = "0x41e94eb019c0762f9bfc454586835f283635d926";

  try {
    // 1. Estimate gas for TimeBucketPriceGuard deployment
    console.log("\n--- Estimating TimeBucketPriceGuard deployment ---");
    const TimeBucketPriceGuard = await ethers.getContractFactory(
      "TimeBucketPriceGuard"
    );
    const deployData1 = TimeBucketPriceGuard.interface.encodeDeploy([
      LOP_ADDRESS,
      WBTC_USD_PRICE_FEED,
    ]);
    const gasEstimate1 = await ethers.provider.estimateGas({
      data: TimeBucketPriceGuard.bytecode + deployData1.slice(2),
      from: deployer.address,
    });

    console.log("Estimated gas:", gasEstimate1.toString());
    const gasCost1 = gasEstimate1 * (feeData.gasPrice || 0n);
    console.log("Estimated cost:", ethers.formatEther(gasCost1), "POL");

    // 2. Estimate gas for Vault deployment (rough estimate)
    console.log("\n--- Estimating Vault deployment ---");
    const Vault = await ethers.getContractFactory("Vault");
    // For Vault, we need a placeholder predicate address for estimation
    const placeholderAddress = "0x1111111111111111111111111111111111111111";
    const deployData2 = Vault.interface.encodeDeploy([
      USDC_ADDRESS,
      placeholderAddress,
    ]);
    const gasEstimate2 = await ethers.provider.estimateGas({
      data: Vault.bytecode + deployData2.slice(2),
      from: deployer.address,
    });

    console.log("Estimated gas:", gasEstimate2.toString());
    const gasCost2 = gasEstimate2 * (feeData.gasPrice || 0n);
    console.log("Estimated cost:", ethers.formatEther(gasCost2), "POL");

    // Total estimation
    const totalGasCost = gasCost1 + gasCost2;
    const totalWithBuffer = (totalGasCost * 150n) / 100n; // Add 50% buffer

    console.log("\n=== SUMMARY ===");
    console.log(
      "Total estimated cost:",
      ethers.formatEther(totalGasCost),
      "POL"
    );
    console.log("With 50% buffer:", ethers.formatEther(totalWithBuffer), "POL");
    console.log("Your current balance:", ethers.formatEther(balance), "POL");

    if (balance < totalWithBuffer) {
      const needed = totalWithBuffer - balance;
      console.log("\n❌ INSUFFICIENT FUNDS!");
      console.log("You need at least:", ethers.formatEther(needed), "more POL");
      console.log(
        "Recommended to get:",
        ethers.formatEther(needed + ethers.parseEther("0.1")),
        "POL for safety"
      );
      console.log("\nGet POL from faucets:");
      console.log("- https://www.alchemy.com/faucets/polygon-amoy");
      console.log("- https://faucets.chain.link/polygon-amoy");
    } else {
      console.log("\n✅ You have sufficient funds for deployment!");
    }
  } catch (error) {
    console.error("Error estimating gas:", error);
    console.log("\nThis might be due to:");
    console.log("1. Contract compilation issues");
    console.log("2. Invalid constructor parameters");
    console.log("3. Network connectivity issues");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
