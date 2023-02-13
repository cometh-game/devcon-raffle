// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

/***
 * @dev Defines bid related data types used by AuctionRaffle contract.
 * @author TrueFi Engineering team
 */
abstract contract BidModel {
    struct Bid {
        uint256 bidderID;
        uint256 amount;
        uint256 discount;
        WinType winType;
        bool claimed;
    }

    struct BidWithAddress {
        address bidder;
        Bid bid;
    }

    enum WinType {
        LOSS,
        GOLDEN_TICKET,
        AUCTION,
        RAFFLE
    }
}
