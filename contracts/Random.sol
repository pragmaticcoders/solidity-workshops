pragma solidity ^0.4.15;

contract Random {
    /**
      Returns pseudo-random number in range of 1..maxNumber
      */
    function generate(uint blockNumber, uint maxNumber)
        public
        constant
        returns (uint)
    {
        return uint(sha3(block.blockhash(blockNumber), msg.sender)) % maxNumber + 1;
    }
}
