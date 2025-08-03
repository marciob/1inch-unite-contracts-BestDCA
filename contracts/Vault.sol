// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct DcaParams {
        uint256 sliceSize;
        uint256 startTime;
        uint256 deltaTime; // e.g., 15 minutes in seconds
    }

    address public immutable owner;
    IERC20 public immutable usdcToken;
    address public immutable predicate;

    bytes32 public activeOrderHash;
    uint256 public dcaEndTime;

    mapping(bytes32 => DcaParams) public dcaParams;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DCAStarted(bytes32 orderHash, uint256 endTime);
    event DCACancelled(bytes32 orderHash);

    constructor(address _usdcAddress, address _predicateAddress) {
        owner = msg.sender;
        usdcToken = IERC20(_usdcAddress);
        predicate = _predicateAddress;
    }

    function deposit(uint256 _amount) external nonReentrant {
        require(msg.sender == owner, "Only owner can deposit");
        usdcToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit Deposited(msg.sender, _amount);
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

        // Approve the 1inch router to spend our USDC
        // The router address is a known, fixed address for each chain
        address inchRouterV6 = 0x111111125421cA6dc452d289314280a0f8842A65;
        usdcToken.approve(inchRouterV6, type(uint256).max);

        emit DCAStarted(_orderHash, dcaEndTime);
    }

    function withdraw(uint256 _amount) external nonReentrant {
        require(msg.sender == owner, "Only owner can withdraw");
        // For the hackathon, we disable withdrawals while a DCA is active
        require(block.timestamp >= dcaEndTime, "DCA is active");

        usdcToken.safeTransfer(msg.sender, _amount);
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
