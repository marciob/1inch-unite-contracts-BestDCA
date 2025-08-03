// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for WETH, needed to approve the 1inch router
interface IWETH {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract Vault is ReentrancyGuard {
    struct DcaParams {
        uint256 sliceSize;
        uint256 startTime;
        uint256 deltaTime;
    }

    address public immutable owner;
    address public immutable predicate;
    IWETH public immutable wethToken; // For approving the router for WETH

    bytes32 public activeOrderHash;
    uint256 public dcaEndTime;

    mapping(bytes32 => DcaParams) public dcaParams;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DCAStarted(bytes32 orderHash, uint256 endTime);
    event DCACancelled(bytes32 orderHash);

    constructor(address _predicateAddress, address _wethAddress) {
        owner = msg.sender;
        predicate = _predicateAddress;
        wethToken = IWETH(_wethAddress);
    }

    // This function is now PAYABLE to receive ETH deposits
    function deposit() external payable nonReentrant {
        require(msg.sender == owner, "Only owner can deposit");
        emit Deposited(msg.sender, msg.value);
    }

    function startDCA(
        bytes32 _orderHash,
        uint256 _durationInSeconds,
        uint256 _sliceSize,
        uint256 _deltaTime
    ) external nonReentrant {
        require(msg.sender == owner, "Only owner can start DCA");
        require(activeOrderHash == 0, "DCA already active");

        activeOrderHash = _orderHash;
        dcaEndTime = block.timestamp + _durationInSeconds;

        dcaParams[_orderHash] = DcaParams({
            sliceSize: _sliceSize,
            startTime: block.timestamp,
            deltaTime: _deltaTime
        });

        // Approve the 1inch router to spend WETH on our behalf
        // Note: The actual wrapping from ETH to WETH is handled by 1inch's infrastructure
        address inchRouterV6 = 0x111111125421cA6dc452d289314280a0f8842A65;
        wethToken.approve(inchRouterV6, type(uint256).max);

        emit DCAStarted(_orderHash, dcaEndTime);
    }

    function withdraw(uint256 _amount) external nonReentrant {
        require(msg.sender == owner, "Only owner can withdraw");
        require(block.timestamp >= dcaEndTime, "DCA is active");

        payable(owner).transfer(_amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function cancelDCA() external nonReentrant {
        require(msg.sender == owner, "Only owner can cancel");
        require(activeOrderHash != 0, "No active DCA");

        bytes32 orderHashToCancel = activeOrderHash;
        delete dcaParams[activeOrderHash];
        activeOrderHash = 0;
        dcaEndTime = 0;

        emit DCACancelled(orderHashToCancel);
    }
}
