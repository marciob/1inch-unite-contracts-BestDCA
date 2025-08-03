import { run } from "hardhat";

async function main() {
  // --- Already Deployed Contract Addresses (Base Sepolia Testnet) ---
  const DEPLOYED_TIMEBUCKET_GUARD =
    "0x29400fbF641eEa08c56128C8aDd47b9069888EcD";
  const DEPLOYED_VAULT = "0xfA80069B0d906eDe72B2C9B1eeac251854658a11";

  // Constructor arguments used in original deployment
  const LOP_ADDRESS = "0x111111125421ca6dc452d289314280a0f8842a65";
  const BTC_USD_PRICE_FEED = "0xca239103f6e7262105310b2d7088998c36916b27";
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

  console.log("=== Verifying Already Deployed Contracts ===");

  try {
    console.log("Verifying TimeBucketPriceGuard...");
    await run("verify:verify", {
      address: DEPLOYED_TIMEBUCKET_GUARD,
      constructorArguments: [LOP_ADDRESS, BTC_USD_PRICE_FEED],
    });
    console.log("✅ TimeBucketPriceGuard verified successfully");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ TimeBucketPriceGuard already verified");
    } else {
      console.log(
        "❌ TimeBucketPriceGuard verification failed:",
        error.message
      );
    }
  }

  try {
    console.log("Verifying Vault...");
    await run("verify:verify", {
      address: DEPLOYED_VAULT,
      constructorArguments: [DEPLOYED_TIMEBUCKET_GUARD, WETH_ADDRESS],
    });
    console.log("✅ Vault verified successfully");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Vault already verified");
    } else {
      console.log("❌ Vault verification failed:", error.message);
    }
  }

  console.log("\n=== Verification Summary ===");
  console.log(
    `TimeBucketPriceGuard: https://sepolia.basescan.org/address/${DEPLOYED_TIMEBUCKET_GUARD}`
  );
  console.log(`Vault: https://sepolia.basescan.org/address/${DEPLOYED_VAULT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
