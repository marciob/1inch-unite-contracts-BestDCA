import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("Address being used for deployment:", deployer.address);
  console.log("----------------------------------------------------");

  // Check for the native gas token (POL on Amoy testnet)
  const polBalance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "Native Gas Token Balance:",
    ethers.formatEther(polBalance),
    "POL"
  );

  // If you need to check for a specific ERC-20 token, use a different address
  // For example, if you want to check USDC or another ERC-20 token on Amoy:
  // const ERC20_TOKEN_ADDRESS = "0x..."; // Replace with actual ERC-20 token address
  // const tokenContract = await ethers.getContractAt("IERC20", ERC20_TOKEN_ADDRESS);
  // const tokenBalance = await tokenContract.balanceOf(deployer.address);
  // console.log("ERC20 Token Balance:", ethers.formatUnits(tokenBalance, 18), "TOKEN");

  console.log("----------------------------------------------------");

  if (polBalance < ethers.parseEther("0.05")) {
    console.error("\nERROR: Your native POL balance is too low for gas fees.");
    console.log(
      "Please use a reliable Amoy faucet to get POL for this address."
    );
    console.log("=> Faucet: https://www.alchemy.com/faucets/polygon-amoy");
    console.log("=> Faucet: https://faucets.chain.link/polygon-amoy\n");
  } else {
    console.log(
      "\n✅ You have enough POL for gas. You can now deploy your contracts."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
