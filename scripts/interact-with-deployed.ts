import { ethers } from "hardhat";

async function main() {
  // --- Already Deployed Contract Addresses (Base Sepolia Testnet) ---
  const DEPLOYED_TIMEBUCKET_GUARD =
    "0x29400fbF641eEa08c56128C8aDd47b9069888EcD";
  const DEPLOYED_VAULT = "0xfA80069B0d906eDe72B2C9B1eeac251854658a11";

  // Get contract instances
  const TimeBucketPriceGuard = await ethers.getContractFactory(
    "TimeBucketPriceGuard"
  );
  const Vault = await ethers.getContractFactory("Vault");

  const timeBucketPriceGuard = TimeBucketPriceGuard.attach(
    DEPLOYED_TIMEBUCKET_GUARD
  ) as any;
  const vault = Vault.attach(DEPLOYED_VAULT) as any;

  console.log("=== Connected to Deployed Contracts ===");
  console.log(`TimeBucketPriceGuard: ${DEPLOYED_TIMEBUCKET_GUARD}`);
  console.log(`Vault: ${DEPLOYED_VAULT}`);

  // Get contract information
  try {
    const owner = await vault.owner();
    const predicate = await vault.predicate();
    const wethToken = await vault.wethToken();
    const activeOrderHash = await vault.activeOrderHash();
    const dcaEndTime = await vault.dcaEndTime();

    console.log("\n=== Vault Contract Info ===");
    console.log(`Owner: ${owner}`);
    console.log(`Predicate: ${predicate}`);
    console.log(`WETH Token: ${wethToken}`);
    console.log(`Active Order Hash: ${activeOrderHash}`);
    console.log(`DCA End Time: ${dcaEndTime}`);

    // Get contract balance
    const balance = await ethers.provider.getBalance(DEPLOYED_VAULT);
    console.log(`Contract Balance: ${ethers.formatEther(balance)} ETH`);
  } catch (error) {
    console.error("Error reading contract state:", error);
  }

  // Get TimeBucketPriceGuard info
  try {
    const lopAddress = await timeBucketPriceGuard.lop();
    const priceFeedAddress = await timeBucketPriceGuard.priceFeed();

    console.log("\n=== TimeBucketPriceGuard Info ===");
    console.log(`LOP Address: ${lopAddress}`);
    console.log(`Price Feed Address: ${priceFeedAddress}`);
  } catch (error) {
    console.error("Error reading TimeBucketPriceGuard state:", error);
  }

  // Utility functions for interaction
  console.log("\n=== Available Interaction Functions ===");
  console.log("To use these contracts, you can call:");
  console.log("- vault.deposit() - to deposit ETH");
  console.log("- vault.startDCA() - to start a DCA strategy");
  console.log("- vault.withdraw() - to withdraw funds");
  console.log("- vault.cancelDCA() - to cancel active DCA");
}

// Export utility functions for other scripts to use
export async function getDeployedContracts() {
  const DEPLOYED_TIMEBUCKET_GUARD =
    "0x29400fbF641eEa08c56128C8aDd47b9069888EcD";
  const DEPLOYED_VAULT = "0xfA80069B0d906eDe72B2C9B1eeac251854658a11";

  const TimeBucketPriceGuard = await ethers.getContractFactory(
    "TimeBucketPriceGuard"
  );
  const Vault = await ethers.getContractFactory("Vault");

  const timeBucketPriceGuard = TimeBucketPriceGuard.attach(
    DEPLOYED_TIMEBUCKET_GUARD
  ) as any;
  const vault = Vault.attach(DEPLOYED_VAULT) as any;

  return {
    timeBucketPriceGuard,
    vault,
    addresses: {
      timeBucketPriceGuard: DEPLOYED_TIMEBUCKET_GUARD,
      vault: DEPLOYED_VAULT,
    },
  };
}

// Verification function for already deployed contracts
export async function verifyDeployedContracts() {
  const { run } = require("hardhat");

  const DEPLOYED_TIMEBUCKET_GUARD =
    "0x29400fbF641eEa08c56128C8aDd47b9069888EcD";
  const DEPLOYED_VAULT = "0xfA80069B0d906eDe72B2C9B1eeac251854658a11";

  // Constructor arguments used in original deployment
  const LOP_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65";
  const BTC_USD_PRICE_FEED = "0xca239103f6e7262105310b2d7088998c36916b27";
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

  try {
    console.log("Verifying already deployed TimeBucketPriceGuard...");
    await run("verify:verify", {
      address: DEPLOYED_TIMEBUCKET_GUARD,
      constructorArguments: [LOP_ADDRESS, BTC_USD_PRICE_FEED],
    });
    console.log("TimeBucketPriceGuard verified successfully");
  } catch (error) {
    console.log("TimeBucketPriceGuard verification failed:", error);
  }

  try {
    console.log("Verifying already deployed Vault...");
    await run("verify:verify", {
      address: DEPLOYED_VAULT,
      constructorArguments: [DEPLOYED_TIMEBUCKET_GUARD, WETH_ADDRESS],
    });
    console.log("Vault verified successfully");
  } catch (error) {
    console.log("Vault verification failed:", error);
  }
}

// Run main function if script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
