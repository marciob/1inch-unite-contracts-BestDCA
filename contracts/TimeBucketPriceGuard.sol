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

    constructor(address _lopAddress, address _priceFeedAddress) {
        lop = ILimitOrderProtocol(_lopAddress);
        priceFeed = IChainlinkAggregator(_priceFeedAddress);
    }

    function isValidFill(
        address vaultAddress, // Pass vault address in predicate
        bytes32 orderHash,
        address maker,
        uint256 makingAmount,
        uint256 fillAmount,
        uint256 maxPrice
    ) external view returns (bool) {
        IVault vault = IVault(vaultAddress);
        IVault.DcaParams memory params = vault.dcaParams(orderHash);

        // ... (rest of the logic is the same)
        uint256 timeElapsed = block.timestamp - params.startTime;
        uint256 currentBucket = timeElapsed / params.deltaTime;
        uint256 spendingAllowance = params.sliceSize * (currentBucket + 1);

        uint256 remainingRaw = lop.remainingInvalidatorForOrder(
            maker,
            orderHash
        );
        uint256 filledSoFar = makingAmount - (~remainingRaw);

        // For a brand new order, remainingRaw is 0, so filledSoFar = makingAmount + 1 which is wrong.
        // Let's correct the filledSoFar logic.
        // A partial fill is stored as the inverse of the remaining amount. A new order is 0.
        if (remainingRaw != 0) {
            filledSoFar = makingAmount - (~remainingRaw);
        } else {
            filledSoFar = 0;
        }

        if (filledSoFar + fillAmount > spendingAllowance) {
            return false;
        }

        (, int256 currentPrice, , , ) = priceFeed.latestRoundData();
        if (uint256(currentPrice) > maxPrice) {
            return false;
        }

        return true;
    }
}
