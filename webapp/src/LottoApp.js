import React, { Component } from 'react';
import MicroLottoABI from '../../build/contracts/MicroLotto.json';
import { deduplicate } from './utils/events';
import getWeb3 from './utils/getWeb3';
import { toWei, toEth } from './utils/units';

import 'milligram/dist/milligram.min.css';
import './index.css';


class LottoApp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      instance: null,
      instanceOwner: null,
      account: null,
      balance: null,
      maxNumber: null,
      tickets: [],
      deadlineBlock: null,
      prize: null,
      lastDraw: null,
      drawing: false,
      fillingTicket: false,
      redeemingPrize: false,
      ownerCollecting: false,
    };
  }

  componentWillMount() {
    (async () => {
      await this.loadWeb3();
      await this.loadAccount();
      await this.loadBalance();
      await this.loadContract();
      await this.loadBlockNumber();

      setInterval(() => this.loadBlockNumber(), 3000);
      setInterval(() => this.checkAccountSwitched(), 1000);

      this.watchEvents();
    })();
  }

  async loadWeb3 () {
    const { web3 } = await getWeb3;

    if (!web3) {
      alert('Please install MetaMask extension');
    }

    const loadContract = require('truffle-contract');
    const MicroLottoContract = loadContract(MicroLottoABI);
    MicroLottoContract.setProvider(web3.currentProvider);

    const instance = await MicroLottoContract.deployed();

    this.setState({
      instance,
      web3,
    });
  }

  async loadAccount () {
    const web3 = this.state.web3;
    let account = await getAccount(web3);

    if (!account) {
      account = 'locked';
    }

    this.setState({ account });
  }

  async loadBalance () {
    const balanceWei =
          await getBalance(this.state.web3, this.state.account);
    const balance = toEth(balanceWei).toNumber();

    this.setState({ balance });
  }

  async loadContract () {
    const instance = this.state.instance;

    const maxNumber = (await instance.maxNumber.call()).toNumber();

    const feeWei = (await instance.ticketFee.call()).toNumber();
    const fee = toEth(feeWei);

    const instanceOwner = await instance.owner.call();

    this.setState({ maxNumber, fee, instanceOwner });

    await this.loadPrize();
    await this.loadLastBlock();
  }

  async loadPrize() {
    const prizeWei = await this.state.instance.prize.call();
    const prize = toEth(prizeWei).toNumber();

    this.setState({ prize });
  }

  async loadLastBlock() {
    const deadlineBlock = (await this.state.instance.deadlineBlock.call()).toNumber();

    this.setState({ deadlineBlock });
  }

  async loadBlockNumber() {
    const currentBlock = await loadBlockNumber(this.state.web3);

    this.setState({ currentBlock });
  }

  watchEvents() {
    this.state.instance.allEvents({
      fromBlock: 0,
      toBlock: 'latest',
    }).watch((err, event) => {
      if (deduplicate(event)) {
        return;
      }
      console.log('event', event);
      this.loadPrize();
      if (event.event === 'Won') {
        this.handleWonEvent(event);
      } else if (event.event === 'Cumulation') {
        this.handleCumulationEvent(event);
      } else if (event.event === 'TicketFilled') {
        this.handleTicketFilledEvent(event);
      } else if (event.event === 'PrizeRedeemed') {
        this.handlePrizeRedeemedEvent(event);
      } else if (event.event === 'OwnerCollected') {
        this.handleOwnerCollectedEvent(event);
      } else {
        console.error('Unknown event', event);
      }
    });
  }

  async checkAccountSwitched() {
    const account = await getAccount(this.state.web3);

    if (this.state.account && this.state.account !== account) {
      window.location = '';
    }
  }

  handleWonEvent (event) {
    let state;

    if (event.args.account === this.state.account) {
      this.loadBalance();
      state = 'won';
    } else {
      state = 'lost';
    }

    this.setState({
      tickets: [],
      drawing: false,
      lastDraw: {
        state,
        profit: toEth(event.args.profit).toNumber(),
        number: event.args.selectedNumber,
      }
    });

    this.loadLastBlock();
  }

  handleCumulationEvent (event) {
    this.setState({
      tickets: [],
      drawing: false,
      lastDraw: {
        state: 'cumulation',
        number: event.args.drawnNumber,
      }
    });

    this.loadLastBlock();
  }

  handleTicketFilledEvent (event) {
    const ticket = {
      number: event.args.selectedNumber.toNumber(),
      selfie: event.args.account === this.state.account,
    };

    this.loadLastBlock();

    this.setState({
      tickets: this.state.tickets.concat([ticket]),
    });

    if (this.state.fillingTicket && ticket.selfie) {
      this.setState({ fillingTicket: false });
    }
  }

  handlePrizeRedeemedEvent (event) {
    if (event.args.account === this.state.account) {
      this.setState({ redeemingPrize: false });
    }
  }

  handleOwnerCollectedEvent (event) {
    this.setState({ ownerCollecting: false });
  }

  onFillTicket = () => {
    const number = parseInt(prompt('Enter a number'), 10);

    this.setState({ fillingTicket: true });
    this.state.instance.fillTicket(
      number, {
        value: toWei(this.state.fee),
        gas: 200000,
        from: this.state.account
      }
    );
  }

  onDraw = () => {
    this.setState({ drawing: true });
    this.state.instance.draw({
      gas: 200000,
      from: this.state.account
    });
  }

  onRedeemPrize = () => {
    this.setState({ redeemingPrize: true });
    this.state.instance.redeemPrize({
      gas: 100000,
      from: this.state.account
    });
  }

  onOwnerCollect = () => {
    this.setState({ ownerCollecting: true });
    this.state.instance.ownerCollect({
      gas: 100000,
      from: this.state.account
    });
  }

  render() {
    return (
      <div className="App">
        <h1>Ether Lotto</h1>
        <hr />
        <AccountComponent
          account={this.state.account}
          balance={this.state.balance} />
        <hr />
        <LastDrawComponent lastDraw={this.state.lastDraw} />
        <LottoComponent
          maxNumber={this.state.maxNumber}
          fee={this.state.fee}
          tickets={this.state.tickets}
          prize={this.state.prize}
          currentBlockNumber={this.state.currentBlock}
          deadlineBlockNumber={this.state.deadlineBlock}
          onFillTicket={this.onFillTicket}
          onDraw={this.onDraw}
          onRedeemPrize={this.onRedeemPrize}
          onOwnerCollect={this.onOwnerCollect}
          fillingTicket={this.state.fillingTicket}
          drawing={this.state.drawing}
          redeemingPrize={this.state.redeemingPrize}
          ownerCollecting={this.state.ownerCollecting}
          isOwner={this.state.instanceOwner === this.state.account}
          />
      </div>
    );
  }
}


const AccountComponent = ({ account, balance }) => {
  if (account === 'locked') {
    return (<div>Please unlock MetaMask and reload site</div>);
  }  else if (account) {
    return (
      <div className="container">
        <h3>Your account</h3>
        <div className="row">
          <div className="column">Address</div>
          <div className="column">{account}</div>
        </div>
        <div className="row">
          <div className="column">Balance</div>
          <div className="column">{balance}</div>
        </div>
      </div>
    );
  }
  return (<div>Loading account information...</div>);
};


const LastDrawComponent = ({ lastDraw }) => {
  if (!lastDraw) {
    return (<div/>);
  }

  let drawState = {};

  if (lastDraw.state === 'won') {
    drawState.title = 'You won!';
    drawState.msg = `You bet on ${lastDraw.number} and won ${lastDraw.profit}`;
  } else if (lastDraw.state === 'lost') {
    drawState.title = 'You missed it!';
    drawState.msg = `Lottery result was ${lastDraw.number}`;
  } else if (lastDraw.state === 'cumulation') {
    drawState.title = 'CUMULATION!';
    drawState.msg = `Lottery result was ${lastDraw.number}. Nobody hit it!`;
  }

  return (
    <div>
      <div className="notification">
        <h4>{drawState.title}</h4>
        <div>{drawState.msg}</div>
      </div>
      <hr />
    </div>
  );
};


const LottoComponent = ({
  currentBlockNumber, deadlineBlockNumber,
  maxNumber, prize, tickets, fee,
  onFillTicket, onDraw, onRedeemPrize, onOwnerCollect,
  fillingTicket, drawing, redeemingPrize, ownerCollecting,
  isOwner
}) => {
  if (!maxNumber) {
    return (<div>Loading contract information...</div>);
  }

  const balls = tickets.map((t, i) => (
    <span key={i} className={"ticket " + (t.selfie ? "ticket-selfie" : "")}>
      {t.number}
    </span>
  ));
  const drawEnabled = currentBlockNumber > deadlineBlockNumber && !drawing && isOwner;

  deadlineBlockNumber = deadlineBlockNumber || 'No lottery in progress';

  return (
    <div className="container">
      <h3>Micro Lotto</h3>
      <div className="row">
        <div className="column">Drawing from</div>
        <div className="column">1 to {maxNumber}</div>
      </div>
      <div className="row">
        <div className="column">Prize</div>
        <div className="column">{prize}</div>
      </div>
      <div className="row">
      <div className="column">Ticket fee</div>
      <div className="column">{fee}</div>
      </div>
      <div className="row">
        <div className="column">Ends at block:</div>
        <div className="column">{deadlineBlockNumber}</div>
      </div>
      <div className="row">
        <div className="column">Current block:</div>
        <div className="column">{currentBlockNumber}</div>
      </div>
      <div className="row">
      <div className="column column-40">Filled tickets:</div>
      <div>
        {balls}
        {fillingTicket ? (<div>Filling ticket...</div>) : null}
        {redeemingPrize ? (<div>Redeeming prize...</div>) : null}
        {ownerCollecting ? (<div>Owner collecting...</div>) : null}
      </div>
      </div>
      <hr/>
      <div className="row">
        <div className="column column-25">
      <button className="button-large" onClick={onFillTicket} disabled={currentBlockNumber > deadlineBlockNumber}>Place a bet</button>
        </div>
        <div className="column column-25">
          <button className="button-large" onClick={onRedeemPrize}>Redeem prize</button>
        </div>
        <div className="column column-25">
          <button className="button-large" onClick={onOwnerCollect} disabled={!isOwner}>
            Owner collect
          </button>
        </div>
        <div className="column column-25">
          <button className="button-large" disabled={!drawEnabled} onClick={onDraw}>
              {drawing ? "Drawing..." : "Draw"}
          </button>
        </div>
      </div>
    </div>
  );
};



function getAccount(web3) {
  return new Promise(resolve => {
    web3.eth.getAccounts(
      (error, accounts) => resolve(accounts[0])
    );
  });
}

function getBalance(web3, account) {
  return new Promise(resolve => {
    web3.eth.getBalance(
      account, (error, balance) => resolve(balance)
    );
  });
}


function loadBlockNumber(web3) {
  return new Promise(
    resolve =>
      web3.eth.getBlockNumber((err, number) => resolve(number))
  );
}



export default LottoApp;
