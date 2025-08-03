// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWETH {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract Vault is ReentrancyGuard {
    /* ─────── structs ─────── */
    struct DcaParams {
        uint256 sliceSize;
        uint256 startTime;
        uint256 deltaTime;
        uint256 totalAmount;
    }

    /* ─────── immutables ─────── */
    address public immutable owner;
    address public immutable predicate;
    IWETH public immutable wethToken;

    /* ─────── state ─────── */
    mapping(address => uint256) private balanceOf; // <── NEW
    mapping(bytes32 => DcaParams) private _dcaParams; // rename
    bytes32 public activeOrderHash;
    uint256 public dcaEndTime;

    /* ─────── events ─────── */
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DCAStarted(bytes32 orderHash, uint256 endTime);
    event DCACancelled(bytes32 orderHash);

    /* ─────── ctor ─────── */
    constructor(address _predicate, address _weth) {
        owner = msg.sender;
        predicate = _predicate;
        wethToken = IWETH(_weth);
    }

    /* ─────── user actions ─────── */
    function deposit() external payable nonReentrant {
        require(msg.sender == owner, "only owner");
        balanceOf[msg.sender] += msg.value; //  <── NEW
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(msg.sender == owner, "only owner");
        require(block.timestamp >= dcaEndTime, "DCA active");
        require(balanceOf[msg.sender] >= amount, "insufficient");

        balanceOf[msg.sender] -= amount; //  <── NEW
        payable(owner).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    /* identical startDCA / cancelDCA as before,
       but write _dcaParams instead of dcaParams   */
    function startDCA(
        bytes32 orderHash,
        uint256 duration,
        uint256 sliceSize,
        uint256 deltaTime
    ) external nonReentrant {
        require(msg.sender == owner, "only owner");
        require(activeOrderHash == bytes32(0), "already running");

        activeOrderHash = orderHash;
        dcaEndTime = block.timestamp + duration;

        _dcaParams[orderHash] = DcaParams({
            sliceSize: sliceSize,
            startTime: block.timestamp,
            deltaTime: deltaTime,
            totalAmount: balanceOf[msg.sender] //  <── store total
        });

        // router approval unchanged …
        address lopRouter = 0x111111125421cA6dc452d289314280a0f8842A65;
        wethToken.approve(lopRouter, type(uint256).max);

        emit DCAStarted(orderHash, dcaEndTime);
    }

    /* ─────── VIEWS used by the React hooks ─────── */
    function vaultBalanceOf(address u) external view returns (uint256) {
        return balanceOf[u];
    }

    function dcaParamsOf(
        bytes32 orderHash
    ) external view returns (DcaParams memory) {
        return _dcaParams[orderHash];
    }

    function currentOrder() external view returns (bytes32) {
        return activeOrderHash; // already stored when startDCA() fires
    }
}
