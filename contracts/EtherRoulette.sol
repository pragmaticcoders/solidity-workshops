pragma solidity ^0.4.15;


contract EtherRoulette {
    uint public maxNumber;

    event Won(address indexed account, uint selectedNumber, uint value, uint profit);

    event Lost(address indexed account, uint selectedNumber, uint drawnNumber, uint value);

    function EtherRoulette(uint _maxNumber) payable {
        require(_maxNumber >= 3);

        maxNumber = _maxNumber;
    }

    function play(uint selectedNumber) payable {
        require(selectedNumber >= 1 && selectedNumber <= maxNumber);
        require(msg.value > 0);

        uint drawnNumber = randomNumber();

        if (selectedNumber == drawnNumber) {
            uint profit = msg.value * (maxNumber - 2);

            msg.sender.transfer(msg.value + profit);
            Won(msg.sender, selectedNumber, msg.value, profit);
        }
        else {
            Lost(msg.sender, selectedNumber, drawnNumber, msg.value);
        }
    }

    function() payable {}

    /**
      Returns random number in range of 1..maxNumber
      */
    function randomNumber() private constant returns (uint) {
        return uint(block.blockhash(block.number - 1)) % maxNumber + 1;
    }
}
