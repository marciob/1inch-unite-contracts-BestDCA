// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "hardhat/console.sol";

// Interface for the 1inch Limit Order Protocol
interface ILimitOrderProtocol {
    function remainingInvalidatorForOrder(
        address maker,
        bytes32 orderHash
    ) external view returns (uint256);
}

// Interface for Chainlink Price Feeds
interface IChainlinkAggregator {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

// Interface for the Vault to get DCA parameters
interface IVault {
    struct DcaParams {
        uint256 sliceSize;
        uint256 startTime;
        uint256 deltaTime;
    }

    function dcaParams(
        bytes32 orderHash
    ) external view returns (DcaParams memory);
}

contract TimeBucketPriceGuard {
    ILimitOrderProtocol public immutable lop;
    IChainlinkAggregator public immutable priceFeed;
    IVault public immutable vault;

    constructor(
        address _lopAddress,
        address _priceFeedAddress,
        address _vaultAddress
    ) {
        lop = ILimitOrderProtocol(_lopAddress);
        priceFeed = IChainlinkAggregator(_priceFeedAddress);
        vault = IVault(_vaultAddress);
    }

    function isValidFill(
        bytes32 orderHash,
        address maker,
        uint256 makingAmount, // Total size of the order
        uint256 takingAmount, // Not used for checks, but part of order
        uint256 fillAmount, // The amount of this specific fill
        uint256 maxPrice // Max acceptable price (e.g., WBTC in USD with 8 decimals)
    ) external view returns (bool) {
        // --- 1. TIME-BUCKET CHECK ---
        IVault.DcaParams memory params = vault.dcaParams(orderHash);

        uint256 timeElapsed = block.timestamp - params.startTime;
        uint256 currentBucket = timeElapsed / params.deltaTime;
        uint256 spendingAllowance = params.sliceSize * (currentBucket + 1);

        uint256 remaining = lop.remainingInvalidatorForOrder(maker, orderHash);
        // remaining == 0 means it's a new order
        uint256 filledSoFar = remaining == 0 ? 0 : makingAmount - (~remaining);

        if (filledSoFar + fillAmount > spendingAllowance) {
            return false;
        }

        // --- 2. PRICE PROTECTION CHECK ---
        (, int256 currentPrice, , , ) = priceFeed.latestRoundData();
        if (uint256(currentPrice) > maxPrice) {
            return false;
        }

        return true;
    }
}
