pragma solidity ^0.4.15;

contract RandomMock {
    uint predefinedNumber;

    function RandomMock(uint _predefinedNumber) {
        predefinedNumber = _predefinedNumber;
    }

    function generate(uint, uint)
        public
        constant
        returns (uint)
    {
        return predefinedNumber;
    }
}
