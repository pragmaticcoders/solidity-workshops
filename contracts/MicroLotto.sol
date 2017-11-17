pragma solidity ^0.4.15;


contract Random {
    function generate(uint blockNumber, uint maxNumber) public constant returns (uint);
}


contract MicroLotto {
    struct Ticket {
        address account;
    }

    address public owner;
    Random public random;
    uint public ticketFee;
    uint public lottoFeePercent;
    uint public lotteryDuration;
    uint public accumulatedValue;
    uint public maxNumber;
    uint public deadlineBlock = 0;
    mapping(uint => Ticket[]) public ticketsPerNumber;

    event TicketFilled(address indexed account, uint selectedNumber);
    event Won(address indexed account, uint selectedNumber, uint profit);
    event Cumulation(uint drawnNumber, uint value);
    event PrizeRedeemed(address indexed account, uint value);
    event OwnerCollected(uint value);

    function MicroLotto(
        Random _random,
        uint _lottoFeePercent,
        uint _maxNumber,
        uint _lotteryDuration
    ) {
        require(_maxNumber >= 2);

        owner = msg.sender;
        random = _random;
        ticketFee = 0.1 ether;  // TODO: Make it configurable during deployment
        lottoFeePercent = _lottoFeePercent;
        maxNumber = _maxNumber;
        lotteryDuration = _lotteryDuration;
    }

    function fillTicket(uint selectedNumber) public payable {
        require(selectedNumber >= 1 && selectedNumber <= maxNumber);
        require(msg.value == ticketFee);

        if (deadlineBlock == 0) {
            // Start a new draw
            deadlineBlock = block.number + lotteryDuration;
        } else {
            require(block.number <= deadlineBlock);
        }

        Ticket[] storage tickets = ticketsPerNumber[selectedNumber];
        tickets.push(Ticket({
            account: msg.sender
        }));

        accumulatedValue += msg.value;

        TicketFilled(msg.sender, selectedNumber);
    }

    function draw() public {
        require(block.number > deadlineBlock + 1);
        require(deadlineBlock != 0);

        uint drawnNumber = random.generate(deadlineBlock + 1, maxNumber);

        deadlineBlock = 0;

        Ticket[] storage wonTickets = ticketsPerNumber[drawnNumber];
        if (wonTickets.length > 0) {
            uint profit = prize() / wonTickets.length;

            for (uint i = 0; i < wonTickets.length; i++) {
                Ticket storage ticket = wonTickets[i];

                accumulatedValue -= profit;
                // TODO: Do you see a problem here?
                ticket.account.transfer(profit);
                Won(ticket.account, drawnNumber, profit);
            }
        } else {
            Cumulation(drawnNumber, accumulatedValue);
        }

        for (uint n = 0; n < maxNumber; n++) {
            delete ticketsPerNumber[n];
        }
    }

    function ownerCollect() public {
        require(msg.sender == owner);

        uint realValue = accumulatedValue - prize();

        owner.transfer(realValue);
        OwnerCollected(realValue);
    }

    function redeemPrize() public {
        // TODO: Implementation
        PrizeRedeemed(msg.sender, 0);
    }

    function prize() public constant returns (uint) {
        return accumulatedValue * (1 ether - lottoFeePercent) / 1 ether;
    }
}
