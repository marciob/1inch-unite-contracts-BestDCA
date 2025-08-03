import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=== DEPLOYMENT STARTING ===");
  console.log("Deployer address:", deployer.address);

  // Check balance before starting
  const initialBalance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "Initial POL balance:",
    ethers.formatEther(initialBalance),
    "POL"
  );

  if (initialBalance < ethers.parseEther("0.1")) {
    console.error(
      "❌ Balance too low! You need at least 0.1 POL for deployment."
    );
    console.log("Get POL from: https://www.alchemy.com/faucets/polygon-amoy");
    return;
  }

  // --- Parameters for Deployment (Polygon Amoy Testnet) ---
  const LOP_ADDRESS = "0x111111125421cA6dc452d289314280a0f8842A65";
  const WBTC_USD_PRICE_FEED = "0x007a22900a3b98143368bd5906f9e17e58e342ea";
  const USDC_ADDRESS = "0x41e94eb019c0762f9bfc454586835f283635d926";

  try {
    // Get current gas price and add some buffer
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice
      ? (feeData.gasPrice * 110n) / 100n
      : undefined; // Add 10% buffer

    console.log(
      "Using gas price:",
      ethers.formatUnits(gasPrice || 0n, "gwei"),
      "gwei"
    );

    // 1. Deploy the Predicate Helper Contract
    console.log("\n--- Deploying TimeBucketPriceGuard ---");
    const TimeBucketPriceGuard = await ethers.getContractFactory(
      "TimeBucketPriceGuard"
    );

    const timeBucketPriceGuard = await TimeBucketPriceGuard.deploy(
      LOP_ADDRESS,
      WBTC_USD_PRICE_FEED,
      {
        gasPrice: gasPrice,
        // gasLimit: 2000000 // Uncomment if you want to set a manual gas limit
      }
    );

    console.log(
      "Transaction hash:",
      timeBucketPriceGuard.deploymentTransaction()?.hash
    );
    console.log("Waiting for confirmation...");

    await timeBucketPriceGuard.waitForDeployment();
    const predicateAddress = await timeBucketPriceGuard.getAddress();
    console.log("✅ TimeBucketPriceGuard deployed to:", predicateAddress);

    // Check balance after first deployment
    const midBalance = await ethers.provider.getBalance(deployer.address);
    const cost1 = initialBalance - midBalance;
    console.log(
      "Cost for TimeBucketPriceGuard:",
      ethers.formatEther(cost1),
      "POL"
    );

    // 2. Deploy the main Vault Contract
    console.log("\n--- Deploying Vault ---");
    const Vault = await ethers.getContractFactory("Vault");

    const vault = await Vault.deploy(USDC_ADDRESS, predicateAddress, {
      gasPrice: gasPrice,
      // gasLimit: 2000000 // Uncomment if you want to set a manual gas limit
    });

    console.log("Transaction hash:", vault.deploymentTransaction()?.hash);
    console.log("Waiting for confirmation...");

    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("✅ Vault deployed to:", vaultAddress);

    // Final balance check
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const cost2 = midBalance - finalBalance;
    const totalCost = initialBalance - finalBalance;

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("TimeBucketPriceGuard:", predicateAddress);
    console.log("Vault:", vaultAddress);
    console.log("\nCosts:");
    console.log("- TimeBucketPriceGuard:", ethers.formatEther(cost1), "POL");
    console.log("- Vault:", ethers.formatEther(cost2), "POL");
    console.log("- Total:", ethers.formatEther(totalCost), "POL");
    console.log(
      "- Remaining balance:",
      ethers.formatEther(finalBalance),
      "POL"
    );

    console.log("\n✅ Deployment completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Deployment failed:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.log("\nTroubleshooting tips:");
      console.log("1. Get more POL from faucets");
      console.log("2. Try deploying contracts one at a time");
      console.log("3. Use lower gas price (add gasPrice to config)");
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
