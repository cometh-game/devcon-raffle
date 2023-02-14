// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../AuctionRaffle.sol";

contract AuctionRaffleMock is AuctionRaffle {
    constructor(
        address initialOwner,
        uint256 biddingStartTime,
        uint256 biddingEndTime,
        uint256 claimingEndTime,
        uint256 auctionWinnersCount,
        uint256 raffleWinnersCount,
        uint256 reservePrice,
        uint256 minBidIncrement,
        bytes32 discountRoot
    )
        AuctionRaffle(
            initialOwner,
            biddingStartTime,
            biddingEndTime,
            claimingEndTime,
            auctionWinnersCount,
            raffleWinnersCount,
            reservePrice,
            minBidIncrement,
            discountRoot
        )
    {}

    function getHeap() external view returns (uint256[] memory) {
        return _heap;
    }

    function getMinKeyIndex() external view returns (uint256) {
        return _minKeyIndex;
    }

    function getMinKeyValue() external view returns (uint256) {
        return _minKeyValue;
    }

    function getBalance(address addr) external view returns (uint256) {
        return addr.balance;
    }
}
