pragma solidity ^0.4.15;

contract Random {
    function generate(uint blockNumber, uint maxNumber) public constant returns (uint);
}

contract EtherRoulette {
    struct Bet {
        uint blockNumber;
        uint selectedNumber;
        uint value;
    }

    address public owner;
    Random random;
    uint public maxNumber;
    mapping (address => Bet) bets;

    event BetPlaced(address indexed account, uint selectedNumber, uint value);
    event Won(address indexed account, uint selectedNumber, uint value, uint profit);
    event Lost(address indexed account, uint selectedNumber, uint drawnNumber, uint value);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function EtherRoulette(Random _random, uint _maxNumber) payable {
        require(_maxNumber >= 3);

        owner = msg.sender;
        random = _random;
        maxNumber = _maxNumber;
    }

    function placeBet(uint selectedNumber) payable {
        require(selectedNumber >= 1 && selectedNumber <= maxNumber);
        require(msg.value > 0);
        require(bets[msg.sender].blockNumber == 0);

        bets[msg.sender] = Bet({
            blockNumber: block.number,
            selectedNumber: selectedNumber,
            value: msg.value
        });

        BetPlaced(msg.sender, selectedNumber, msg.value);
    }

    function roll() {
        Bet storage bet = bets[msg.sender];
        require(bet.blockNumber != 0); // exists
        require(block.number > bet.blockNumber + 1); // next block after unknown one

        uint drawnNumber = random.generate(bet.blockNumber + 1, maxNumber);

        if (bet.selectedNumber == drawnNumber) {
            uint profit = bet.value * (maxNumber - 2);

            msg.sender.transfer(bet.value + profit);
            Won(msg.sender, bet.selectedNumber, bet.value, profit);
        } else {
            Lost(msg.sender, bet.selectedNumber, drawnNumber, bet.value);
        }
    }

    function payout() onlyOwner {
        owner.transfer(this.balance);
    }

    function() payable {}
}
