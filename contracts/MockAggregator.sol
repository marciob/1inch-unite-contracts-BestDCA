// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockAggregator {
    int256 public price = 30000e8; // BTC/USD format with 8 decimals

    function latestRoundData()
        external
        view
        returns (uint80, int256 answer, uint256, uint256 updatedAt, uint80)
    {
        return (0, price, 0, block.timestamp, 0);
    }

    function setPrice(int256 newPrice) external {
        price = newPrice;
    }
}
