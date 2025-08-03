import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers"; // Import the generic Contract type

// --- UPDATED IMPORT: Removed MockPredicate as it's not generated ---
import { Vault, MockERC20 } from "../typechain-types";

describe("Vault", function () {
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  let usdcToken: MockERC20;
  // --- UPDATED VARIABLE TYPE: Use the generic Contract type ---
  let predicate: Contract;
  let vault: Vault;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    // Deploy a mock ERC20 token to act as USDC
    const MockERC20Factory = await ethers.getContractFactory(
      "MockERC20",
      owner
    );
    usdcToken = await MockERC20Factory.deploy(
      "Mock USDC",
      "mUSDC",
      ethers.parseUnits("1000000", 6)
    );
    await usdcToken.waitForDeployment();

    // Deploy a mock for the predicate contract address
    const MockPredicateFactory = await ethers.getContractFactory(
      "MockPredicate",
      owner
    );
    predicate = await MockPredicateFactory.deploy();
    await predicate.waitForDeployment();

    // Deploy the Vault contract
    const VaultFactory = await ethers.getContractFactory("Vault", owner);
    vault = await VaultFactory.deploy(
      await usdcToken.getAddress(),
      await predicate.getAddress()
    );
    await vault.waitForDeployment();

    // Give the owner some USDC to deposit by transferring it from the contract deployer
    await usdcToken.transfer(owner.address, ethers.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });
  });

  describe("Deposits", function () {
    it("Should allow the owner to deposit USDC", async function () {
      const depositAmount = ethers.parseUnits("100", 6); // 100 USDC

      // First, approve the vault to spend the owner's USDC
      await usdcToken
        .connect(owner)
        .approve(await vault.getAddress(), depositAmount);

      // Then, deposit
      await expect(vault.connect(owner).deposit(depositAmount))
        .to.emit(vault, "Deposited")
        .withArgs(owner.address, depositAmount);

      // Check the vault's balance
      expect(await usdcToken.balanceOf(await vault.getAddress())).to.equal(
        depositAmount
      );
    });

    it("Should NOT allow a non-owner to deposit", async function () {
      // Transfer some mock USDC to the other account to test with
      await usdcToken.transfer(
        otherAccount.address,
        ethers.parseUnits("100", 6)
      );
      const depositAmount = ethers.parseUnits("100", 6);
      await usdcToken
        .connect(otherAccount)
        .approve(await vault.getAddress(), depositAmount);

      await expect(
        vault.connect(otherAccount).deposit(depositAmount)
      ).to.be.revertedWith("Only owner can deposit");
    });
  });

  describe("Withdrawals", function () {
    it("Should revert if trying to withdraw during an active DCA period", async function () {
      // Start a DCA period of 1 hour
      await vault.startDCA(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        3600,
        1,
        1
      );

      // Try to withdraw immediately
      await expect(vault.withdraw(1)).to.be.revertedWith("DCA is active");
    });

    it("Should allow withdrawal after the DCA period has ended", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      await usdcToken
        .connect(owner)
        .approve(await vault.getAddress(), depositAmount);
      await vault.deposit(depositAmount);

      // Start a DCA period of 1 hour
      await vault.startDCA(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        3600,
        1,
        1
      );

      // Fast-forward time by more than 1 hour
      await time.increase(3601);

      // Now, withdrawal should succeed
      await expect(vault.withdraw(depositAmount))
        .to.emit(vault, "Withdrawn")
        .withArgs(owner.address, depositAmount);
      expect(await usdcToken.balanceOf(await vault.getAddress())).to.equal(0);
    });
  });
});
