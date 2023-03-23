// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./Config.sol";
import "./models/BidModel.sol";
import "./models/StateModel.sol";
import "./libs/MaxHeap.sol";

import "hardhat/console.sol";

/***
 * @title Auction & Raffle
 * @notice Draws winners using a mixed auction & raffle scheme.
 * @author TrueFi Engineering team
 */
contract AuctionRaffle is Ownable, Config, BidModel, StateModel {
    using Address for address payable;
    using SafeERC20 for IERC20;
    using MaxHeap for uint256[];

    mapping(address => Bid) _bids; // bidder address -> Bid
    mapping(uint256 => address payable) _bidders; // bidderID -> bidder address
    uint32 _biddersCount = 0;

    uint256[] _heap;
    uint256 _minKeyIndex;
    uint256 _minKeyValue = type(uint256).max;

    SettleState _settleState = SettleState.AWAITING_SETTLING;
    uint256[] _raffleParticipants;

    uint256[] _auctionWinners;
    uint256[] _raffleWinners;

    bool _proceedsClaimed;
    uint256 _claimedFeesIndex;

    uint256[] _tempWinners; // temp array for sorting auction winners used by settleAuction method

    /// @dev A new bid has been placed or an existing bid has been bumped
    event NewBid(address bidder, uint256 bidderID, uint256 bidAmount);

    /// @dev A bidder has been drawn as auction winner
    event NewAuctionWinner(uint256 bidderID);

    /// @dev A bidder has been drawn as raffle winner
    event NewRaffleWinner(uint256 bidderID);

    /// @dev A bidder has been drawn as the golden ticket winner
    event NewGoldenTicketWinner(uint256 bidderID);

    modifier onlyInState(State requiredState) {
        require(getState() == requiredState, "AuctionRaffle: is in invalid state");
        _;
    }

    modifier onlyExternalTransactions() {
        require(msg.sender == tx.origin, "AuctionRaffle: internal transactions are forbidden");
        _;
    }

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
        Config(
            biddingStartTime,
            biddingEndTime,
            claimingEndTime,
            auctionWinnersCount,
            raffleWinnersCount,
            reservePrice,
            minBidIncrement,
            discountRoot
        )
        Ownable()
    {
        if (initialOwner != msg.sender) {
            Ownable.transferOwnership(initialOwner);
        }
    }

    receive() external payable {
        revert("AuctionRaffle: contract accepts ether transfers only by bid method");
    }

    fallback() external payable {
        revert("AuctionRaffle: contract accepts ether transfers only by bid method");
    }

    /***
     * @notice Places a new bid or bumps an existing bid.
     * @dev Assigns a unique bidderID to the sender address.
     */
    function bid() external payable onlyExternalTransactions onlyInState(State.BIDDING_OPEN) {
        _makeBid(msg.sender, msg.value, 0);
    }

    /***
     * @notice Places a new bid or bumps an existing bid with a discount.
     * The discount is proved using a Merkle Proof.
     * @dev Applies a discount on the msg.sender's bid. We need to store each bidder's discount
     * so that we can easily compute claimable proceeds when settlement is done.
     * If msg.sender makes multiple bids, the highest discount is kept.
     */
    function bidWithDiscount(
        uint256 discountPercentage,
        bytes32[] memory proof
    ) external payable onlyExternalTransactions onlyInState(State.BIDDING_OPEN) {
        require(discountPercentage <= 100, "AuctionRaffle: discount must be at most 100%");

        bytes32 leaf = keccak256(abi.encode(msg.sender, discountPercentage));
        require(
            MerkleProof.verify(proof, discountRoot, leaf),
            "AuctionRaffle: discount proof invalid"
        );
        _makeBid(
            msg.sender,
            msg.value,
            _reservePrice * discountPercentage / 100
        );
    }

    /***
     * @notice Places a new bid or bumps an existing bid.
     * @dev Assigns a unique bidderID to the sender address.
     */
    function _makeBid(address sender, uint256 value, uint256 discount) private {
        // This is a memory cache
        Bid memory bidder = _bids[sender];
        uint96 oldAmount = bidder.amount;
        uint96 newAmount = oldAmount + SafeCast.toUint96(value);
        uint32 bidderID  = oldAmount > 0 ? bidder.bidderID : ++_biddersCount;

        if (oldAmount == 0) {
            require(value >= _reservePrice, "AuctionRaffle: bid amount is below reserve price");

            _bids[sender] = Bid({
                bidderID: bidderID,
                amount: newAmount,
                discount: SafeCast.toUint96(discount),
                winType: WinType.LOSS,
                claimed: false
            });

            _bidders[bidderID] = payable(sender);
            _raffleParticipants.push(bidderID);

            addBidToHeap(bidderID, newAmount);
        } else {
            require(value >= _minBidIncrement, "AuctionRaffle: bid increment too low");

            // update amount
            _bids[sender].amount = newAmount;

            // update discount
            if (bidder.discount < discount) {
              _bids[sender].discount = SafeCast.toUint96(discount);
            }

            updateHeapBid(bidderID, oldAmount, newAmount);
        }
        emit NewBid(sender, bidderID, newAmount);
    }

    /**
     * @notice Draws auction winners and changes contract state to AUCTION_SETTLED.
     * @dev Removes highest bids from the heap, sets their WinType to AUCTION and adds them to _auctionWinners array.
     * Temporarily adds auction winner bidderIDs to a separate heap and then retrieves them in descending order.
     * This is done to efficiently remove auction winners from _raffleParticipants array as they no longer take part
     * in the raffle.
     */
    function settleAuction() external onlyOwner onlyInState(State.BIDDING_CLOSED) {
        _settleState = SettleState.AUCTION_SETTLED;
        uint256 biddersCount = getBiddersCount();
        if (biddersCount <= _raffleWinnersCount) {
            return;
        }

        uint256 winnersLength = Math.min(
          biddersCount - _raffleWinnersCount,
          _auctionWinnersCount
        );

        for (uint256 i = 0; i < winnersLength; ++i) {
            uint256 key = _heap.removeMax();
            uint256 bidderID = extractBidderID(key);
            addAuctionWinner(bidderID);
            _tempWinners.insert(bidderID);
        }

        delete _heap;
        delete _minKeyIndex;
        delete _minKeyValue;

        for (uint256 i = 0; i < winnersLength; ++i) {
            uint256 bidderID = _tempWinners.removeMax();
            removeRaffleParticipant(bidderID - 1);
        }
    }

    /**
     * @notice Draws raffle winners and changes contract state to RAFFLE_SETTLED. The first selected raffle winner
     * becomes the Golden Ticket winner.
     * @dev Sets WinType of the first selected bid to GOLDEN_TICKET. Sets WinType to RAFFLE for the remaining selected
     * bids.
     */
    function settleRaffle() external onlyOwner onlyInState(State.AUCTION_SETTLED) {
        _settleState = SettleState.RAFFLE_SETTLED;

        uint256 participantsLength = _raffleParticipants.length;
        if (participantsLength == 0) {
            return;
        }

        // Updating the compiler to 0.8.18 or above, this should be replace with `block.prevrandao`
        uint256 seed = block.difficulty;
        uint256 randomNumbersLen = _raffleWinnersCount / _winnersPerRandom;
        uint256[] memory randomNumbers = new uint256[](randomNumbersLen);

        for (uint256 i = 0; i < randomNumbersLen; ++i) {
            randomNumbers[i] = uint256(keccak256(abi.encode(seed, i)));
        }

        (participantsLength, randomNumbers[0]) = selectGoldenTicketWinner(participantsLength, randomNumbers[0]);

        if (participantsLength < _raffleWinnersCount) {
            selectAllRaffleParticipantsAsWinners(participantsLength);
            return;
        }

        selectRaffleWinners(participantsLength, randomNumbers);
    }

    /**
     * @notice Allows a bidder to claim their funds after the raffle is settled.
     * Golden Ticket winner can withdraw the full bid amount.
     * Raffle winner can withdraw the bid amount minus `_reservePrice`.
     * Non-winning bidder can withdraw the bid amount minus 2% fee.
     * Auction winner pays the full bid amount and is not entitled to any withdrawal.
     */
    function claim(uint256 bidderID) external onlyInState(State.RAFFLE_SETTLED) {
        address payable bidderAddress = getBidderAddress(bidderID);

        // Memory cache to avoid multiple sloads
        Bid memory bidder = _bids[bidderAddress];
        require(!bidder.claimed, "AuctionRaffle: funds have already been claimed");
        require(bidder.winType != WinType.AUCTION, "AuctionRaffle: auction winners cannot claim funds");
        _bids[bidderAddress].claimed = true;

        uint256 claimAmount;
        if (bidder.winType == WinType.RAFFLE) {
            // discount = 0 if no discount to apply
            // discount = a % of _reservePrice so subtracting is safe
            claimAmount = bidder.amount + bidder.discount- _reservePrice;
        } else if (bidder.winType == WinType.GOLDEN_TICKET) {
            claimAmount = bidder.amount;
        } else if (bidder.winType == WinType.LOSS) {
            claimAmount = (bidder.amount * 98) / 100;
        }

        if (claimAmount > 0) {
            bidderAddress.sendValue(claimAmount);
        }
    }

    /**
     * @notice Allows the owner to claim proceeds from the ticket sale after the raffle is settled.
     * Proceeds include:
     * sum of auction winner bid amounts,
     * `_reservePrice` paid by each raffle winner (except the Golden Ticket winner).
     */
    function claimProceeds() external onlyOwner onlyInState(State.RAFFLE_SETTLED) {
        require(!_proceedsClaimed, "AuctionRaffle: proceeds have already been claimed");
        _proceedsClaimed = true;

        uint256 biddersCount = getBiddersCount();
        if (biddersCount == 0) {
            return;
        }

        // Minus one is for golden ticket holder ?
        uint256 raffleWinnersCount = Math.min(_raffleWinnersCount, biddersCount) - 1;

        // Reserve price of all winner
        uint256 totalAmount = raffleWinnersCount * _reservePrice;

        uint256 auctionWinnersCount = _auctionWinners.length;
        for (uint256 i = 0; i < auctionWinnersCount; ++i) {
            totalAmount += _bids[_bidders[_auctionWinners[i]]].amount;
        }

        // becausse there could be discounts applied on raffle winners, we need to subtract discounts
        for (uint256 i = 0; i < raffleWinnersCount; ++i) {
            totalAmount -= _bids[_bidders[_raffleWinners[i]]].discount;
        }

        payable(owner()).sendValue(totalAmount);
    }

    /**
     * @notice Allows the owner to claim the 2% fees from non-winning bids after the raffle is settled.
     * @dev This function is designed to be called multiple times, to split iteration though all non-winning bids across
     * multiple transactions.
     * @param bidsCount The number of bids to be processed at once.
     */
    function claimFees(uint256 bidsCount) external onlyOwner onlyInState(State.RAFFLE_SETTLED) {
        uint256 claimedFeesIndex = _claimedFeesIndex;
        uint256 feesCount = _raffleParticipants.length;
        require(feesCount > 0, "AuctionRaffle: there are no fees to claim");
        require(claimedFeesIndex < feesCount, "AuctionRaffle: fees have already been claimed");

        uint256 fee = 0;
        uint256 endIndex = Math.min(claimedFeesIndex + bidsCount, feesCount);
        for (uint256 i = claimedFeesIndex; i < endIndex; ++i) {
            address bidderAddress = getBidderAddress(_raffleParticipants[i]);
            uint256 bidAmount = _bids[bidderAddress].amount;
            fee += bidAmount - (bidAmount * 98) / 100;
        }

        _claimedFeesIndex = endIndex;
        payable(owner()).sendValue(fee);
    }

    /**
     * @notice Allows the owner to withdraw all funds left in the contract by the participants.
     * Callable only after the claiming window is closed.
     */
    function withdrawUnclaimedFunds() external onlyOwner onlyInState(State.CLAIMING_CLOSED) {
        payable(owner()).sendValue(address(this).balance);
    }

    /**
     * @notice Allows the owner to retrieve any ERC-20 tokens that were sent to the contract by accident.
     * @param tokenAddress The address of an ERC-20 token contract.
     */
    function rescueTokens(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));

        require(balance > 0, "AuctionRaffle: no tokens for given address");
        token.safeTransfer(owner(), balance);
    }

    function getRaffleParticipants() external view returns (uint256[] memory) {
        return _raffleParticipants;
    }

    /// @return A list of auction winner bidder IDs.
    function getAuctionWinners() external view returns (uint256[] memory) {
        return _auctionWinners;
    }

    /// @return A list of raffle winner bidder IDs.
    function getRaffleWinners() external view returns (uint256[] memory) {
        return _raffleWinners;
    }

    function getBid(address bidder) external view returns (Bid memory) {
        Bid storage bid_ = _bids[bidder];
        require(bid_.bidderID != 0, "AuctionRaffle: no bid by given address");
        return bid_;
    }

    function getBidByID(uint256 bidderID) external view returns (Bid memory) {
        address bidder = getBidderAddress(bidderID);
        return _bids[bidder];
    }

    function getBidsWithAddresses() external view returns (BidWithAddress[] memory) {
        uint256 totalBids = getBiddersCount();

        BidWithAddress[] memory bids = new BidWithAddress[](totalBids);

        for (uint256 i = 1; i <= totalBids; ++i) {
            BidWithAddress memory bid_ = getBidWithAddress(i);
            bids[i - 1] = bid_;
        }

        return bids;
    }

    function getBidWithAddress(uint256 bidderID) public view returns (BidWithAddress memory) {
        address bidder = getBidderAddress(bidderID);
        Bid storage bid_ = _bids[bidder];

        BidWithAddress memory bidWithAddress = BidWithAddress({bidder: bidder, bid: bid_});

        return bidWithAddress;
    }

    /// @return Address of bidder account for given bidder ID.
    function getBidderAddress(uint256 bidderID) public view returns (address payable) {
        address payable bidderAddress = _bidders[bidderID];
        require(bidderAddress != address(0), "AuctionRaffle: bidder with given ID does not exist");
        return bidderAddress;
    }

    function getBiddersCount() public view returns (uint256) {
        return _biddersCount;
    }

    function getState() public view returns (State) {
        if (block.timestamp >= _claimingEndTime) {
            return State.CLAIMING_CLOSED;
        }
        if (_settleState == SettleState.RAFFLE_SETTLED) {
            return State.RAFFLE_SETTLED;
        }
        if (_settleState == SettleState.AUCTION_SETTLED) {
            return State.AUCTION_SETTLED;
        }
        if (block.timestamp >= _biddingEndTime) {
            return State.BIDDING_CLOSED;
        }
        if (block.timestamp >= _biddingStartTime) {
            return State.BIDDING_OPEN;
        }
        return State.AWAITING_BIDDING;
    }

    /**
     * @notice Adds a bid to the heap if it isn't full or the heap key is greater than `_minKeyValue`.
     * @dev Updates _minKeyIndex and _minKeyValue if needed.
     * @param bidderID Unique bidder ID
     * @param amount The bid amount
     */
    function addBidToHeap(uint256 bidderID, uint256 amount) private {
        bool isHeapFull = getBiddersCount() > _auctionWinnersCount; // bid() already incremented _biddersCount
        uint256 key = getKey(bidderID, amount);
        uint256 minKeyValue = _minKeyValue;

        if (isHeapFull) {
            if (key <= minKeyValue) {
                return;
            }
            _heap.increaseKey(minKeyValue, key);
            updateMinKey();
        } else {
            _heap.insert(key);
            if (key <= minKeyValue) {
                _minKeyIndex = _heap.length - 1;
                _minKeyValue = key;
                return;
            }
            updateMinKey();
        }
    }

    /**
     * @notice Updates an existing bid or replaces an existing bid with a new one in the heap.
     * @dev Updates _minKeyIndex and _minKeyValue if needed.
     * @param bidderID Unique bidder ID
     * @param oldAmount Previous bid amount
     * @param newAmount New bid amount
     */
    function updateHeapBid(
        uint256 bidderID,
        uint256 oldAmount,
        uint256 newAmount
    ) private {
        bool isHeapFull = getBiddersCount() >= _auctionWinnersCount;
        uint256 key = getKey(bidderID, newAmount);
        uint256 minKeyValue = _minKeyValue;

        bool shouldUpdateHeap = key > minKeyValue;
        if (isHeapFull && !shouldUpdateHeap) {
            return;
        }
        uint256 oldKey = getKey(bidderID, oldAmount);
        bool updatingMinKey = oldKey <= minKeyValue;
        if (updatingMinKey) {
            _heap.increaseKeyAt(_minKeyIndex, key);
            updateMinKey();
            return;
        }
        _heap.increaseKey(oldKey, key);
    }

    function updateMinKey() private {
        (_minKeyIndex, _minKeyValue) = _heap.findMin();
    }

    function addAuctionWinner(uint256 bidderID) private {
        setBidWinType(bidderID, WinType.AUCTION);
        _auctionWinners.push(bidderID);
        emit NewAuctionWinner(bidderID);
    }

    function addRaffleWinner(uint256 bidderID) private {
        setBidWinType(bidderID, WinType.RAFFLE);
        _raffleWinners.push(bidderID);
        emit NewRaffleWinner(bidderID);
    }

    function addGoldenTicketWinner(uint256 bidderID) private {
        setBidWinType(bidderID, WinType.GOLDEN_TICKET);
        _raffleWinners.push(bidderID);
        emit NewGoldenTicketWinner(bidderID);
    }

    function setBidWinType(uint256 bidderID, WinType winType) private {
        address bidderAddress = getBidderAddress(bidderID);
        _bids[bidderAddress].winType = winType;
    }

    /**
     * @dev Selects one Golden Ticket winner from a random number.
     * Saves the winner at the beginning of _raffleWinners array and sets bidder WinType to GOLDEN_TICKET.
     * @param participantsLength The length of current participants array
     * @param randomNumber The random number to select raffle winner from
     * @return participantsLength New participants array length
     * @return randomNumber Shifted random number by `_randomMaskLength` bits to the right
     */
    function selectGoldenTicketWinner(uint256 participantsLength, uint256 randomNumber)
        private
        returns (uint256, uint256)
    {
        uint256 winnerIndex = winnerIndexFromRandomNumber(participantsLength, randomNumber);

        uint256 bidderID = _raffleParticipants[winnerIndex];
        addGoldenTicketWinner(bidderID);

        removeRaffleParticipant(winnerIndex);
        return (participantsLength - 1, randomNumber >> _randomMaskLength);
    }

    function selectAllRaffleParticipantsAsWinners(uint256 participantsLength) private {
        for (uint256 i = 0; i < participantsLength; ++i) {
            uint256 bidderID = _raffleParticipants[i];
            addRaffleWinner(bidderID);
        }
        delete _raffleParticipants;
    }

    /**
     * @dev Selects `_winnersPerRandom` - 1 raffle winners for the first random number -- it assumes that one bidder
     * was selected before as the Golden Ticket winner. Then it selects `_winnersPerRandom` winners for each remaining
     * random number.
     * @param participantsLength The length of current participants array
     * @param randomNumbers The array of random numbers to select raffle winners from
     */
    function selectRaffleWinners(uint256 participantsLength, uint256[] memory randomNumbers) private {
        participantsLength = selectRandomRaffleWinners(participantsLength, randomNumbers[0], _winnersPerRandom - 1);
        for (uint256 i = 1; i < randomNumbers.length; ++i) {
            participantsLength = selectRandomRaffleWinners(participantsLength, randomNumbers[i], _winnersPerRandom);
        }
    }

    /**
     * @notice Selects a number of raffle winners from _raffleParticipants array. Saves the winners in _raffleWinners
     * array and sets their WinType to RAFFLE.
     * @dev Divides passed randomNumber into `_randomMaskLength` bit numbers and then selects one raffle winner using
     * each small number.
     * @param participantsLength The length of current participants array
     * @param randomNumber The random number used to select raffle winners
     * @param winnersCount The number of raffle winners to select from a single random number
     * @return New participants length
     */
    function selectRandomRaffleWinners(
        uint256 participantsLength,
        uint256 randomNumber,
        uint256 winnersCount
    ) private returns (uint256) {
        for (uint256 i = 0; i < winnersCount; ++i) {
            uint256 winnerIndex = winnerIndexFromRandomNumber(participantsLength, randomNumber);

            uint256 bidderID = _raffleParticipants[winnerIndex];
            addRaffleWinner(bidderID);

            removeRaffleParticipant(winnerIndex);
            --participantsLength;
            randomNumber = randomNumber >> _randomMaskLength;
        }

        return participantsLength;
    }

    /**
     * @notice Removes a participant from _raffleParticipants array.
     * @dev Swaps _raffleParticipants[index] with the last one, then removes the last one.
     * @param index The index of raffle participant to remove
     */
    function removeRaffleParticipant(uint256 index) private {
        uint256 participantsLength = _raffleParticipants.length;
        require(index < participantsLength, "AuctionRaffle: invalid raffle participant index");
        _raffleParticipants[index] = _raffleParticipants[participantsLength - 1];
        _raffleParticipants.pop();
    }

    /**
     * @notice Calculates unique heap key based on bidder ID and bid amount. The key is designed so that higher bids
     * are assigned a higher key value. In case of a draw in bid amount, lower bidder ID gives a higher key value.
     * @dev The difference between `_bidderMask` and bidderID is stored in lower bits of the returned key.
     * Bid amount is stored in higher bits of the returned key.
     * @param bidderID Unique bidder ID
     * @param amount The bid amount
     * @return Unique heap key
     */
    function getKey(uint256 bidderID, uint256 amount) private pure returns (uint256) {
        return (amount << _bidderMaskLength) | (_bidderMask - bidderID);
    }

    /**
     * @notice Extracts bidder ID from a heap key
     * @param key Heap key
     * @return Extracted bidder ID
     */
    function extractBidderID(uint256 key) private pure returns (uint256) {
        return _bidderMask - (key & _bidderMask);
    }

    /**
     * @notice Calculates winner index
     * @dev Calculates modulo of `_randomMaskLength` lower bits of randomNumber and participantsLength
     * @param participantsLength The length of current participants array
     * @param randomNumber The random number to select raffle winner from
     * @return Winner index
     */
    function winnerIndexFromRandomNumber(uint256 participantsLength, uint256 randomNumber)
        private
        pure
        returns (uint256)
    {
        uint256 smallRandom = randomNumber & _randomMask;
        return smallRandom % participantsLength;
    }
}
