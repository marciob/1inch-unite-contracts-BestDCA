import { ethers, run } from "hardhat";

async function main() {
  console.log("Deploying MockAggregator...");

  const MockAggregator = await ethers.getContractFactory("MockAggregator");
  const mock = await MockAggregator.deploy();
  await mock.waitForDeployment();

  const address = await mock.getAddress();
  console.log(`✅ MockAggregator deployed to: ${address}`);

  // Optional: Wait before verification
  await new Promise((res) => setTimeout(res, 30000));

  // Optional: Etherscan verify
  try {
    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("🔍 Verified on Etherscan");
  } catch (err) {
    console.warn("⚠️ Verification failed:", err);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
