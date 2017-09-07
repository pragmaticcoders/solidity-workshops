pragma solidity ^0.4.15;


contract Random {
    function generate(uint blockNumber, uint maxNumber) public constant returns (uint);
}


contract MicroLotto {
    struct Ticket {
        address account;
    }

    Random public random;
    uint public ticketFee;
    uint public lottoFeePercent;
    uint public accumulatedValue;
    uint public maxNumber;
    uint public lastBlock;
    mapping(uint => Ticket[]) public ticketsPerNumber;

    event TicketFilled(address indexed account, uint selectedNumber);
    event Won(address indexed account, uint selectedNumber, uint profit);
    event Cumulation(uint drawnNumber, uint value);

    modifier updatesBlock() {
        _;
        lastBlock = block.number;
    }

    function MicroLotto(
        Random _random,
        uint _ticketFee,
        uint _lottoFeePercent,
        uint _maxNumber
    )
        updatesBlock
    {
        require(_maxNumber >= 2);

        random = _random;
        ticketFee = _ticketFee;
        lottoFeePercent = _lottoFeePercent;
        maxNumber = _maxNumber;
    }

    function fillTicket(uint selectedNumber) public payable updatesBlock {
        require(selectedNumber >= 1 && selectedNumber <= maxNumber);
        require(msg.value == ticketFee);

        Ticket[] storage tickets = ticketsPerNumber[selectedNumber];
        tickets.push(Ticket({
            account: msg.sender
        }));

        accumulatedValue += msg.value;

        TicketFilled(msg.sender, selectedNumber);
    }

    function draw() public updatesBlock {
        require(block.number > lastBlock + 1);

        uint drawnNumber = random.generate(lastBlock + 1, maxNumber);
        Ticket[] storage wonTickets = ticketsPerNumber[drawnNumber];
        if (wonTickets.length > 0) {
            uint profit = prize() / wonTickets.length;

            for (uint i = 0; i < wonTickets.length; i++) {
                Ticket storage ticket = wonTickets[i];
                // TODO: Do you see a problem here?
                ticket.account.transfer(profit);
                Won(ticket.account, drawnNumber, profit);
            }

            // TODO: Do you see another problem here?
            accumulatedValue = 0;
        } else {
            Cumulation(drawnNumber, accumulatedValue);
        }

        for (uint n = 0; n < maxNumber; n++) {
            delete ticketsPerNumber[n];
        }
    }

    function prize() public constant returns (uint) {
        return accumulatedValue * (1 ether - lottoFeePercent) / 1 ether;
    }
}
