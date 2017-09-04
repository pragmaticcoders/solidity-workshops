import React, { Component } from 'react';
import EtherRouletteABI from '../../build/contracts/EtherRoulette.json';
import getWeb3 from './utils/getWeb3';
import { toWei, toEth } from './utils/units';

import 'milligram/dist/milligram.min.css';
import './index.css';


const BID_VALUE = toWei(0.1);


class RouletteApp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      instance: null,
      chance: null,
      account: null,
      balance: null,
      lastBid: null,
    };
  }

  componentWillMount() {
    (async () => {
      await this.loadWeb3();
      await this.loadAccount();
      await this.loadBalance();
      await this.loadContract();

      this.watchEvents();
    })();
  }

  async loadWeb3 () {
    const { web3 } = await getWeb3;

    if (!web3) {
      alert('Please install MetaMask extension');
    }

    const loadContract = require('truffle-contract');
    const EtherRouletteContract = loadContract(EtherRouletteABI);
    EtherRouletteContract.setProvider(web3.currentProvider);

    const instance = await EtherRouletteContract.deployed();

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
    const balance = toEth(balanceWei, 'ether').toNumber();

    this.setState({ balance });
  }

  async loadContract () {
    const maxNumber = (await this.state.instance.maxNumber.call()).toNumber();
    const contractBalanceWei =
          await getBalance(this.state.web3, this.state.instance.address);
    const contractBalance = toEth(contractBalanceWei).toNumber();

    this.setState({ maxNumber, contractBalance });
  }

  watchEvents() {
    const instance = this.state.instance;
    const account = this.state.account;

    instance.Won({ account }).watch((error, event) => {
      this.loadContract();
      this.loadBalance();

      this.setState({
        lastBid: {
          state: 'won',
          profit: toEth(event.args.profit),
          number: event.args.selectedNumber,
        }
      });
    });

    instance.Lost({ account }).watch((error, event) => {
      this.loadContract();
      this.loadBalance();

      this.setState({
        lastBid: {
          state: 'lost',
          drawnNumber: event.args.drawnNumber,
          value: toEth(event.args.value),
          number: event.args.selectedNumber,
        }
      });
    });
  }

  onClickPlay = () => {
    const number = parseInt(prompt('Enter a number'), 10);

    this.setState({
      lastBid: { state: 'pending' }
    });
    this.state.instance.play(
      number, {
        value: BID_VALUE,
        gas: 40000,
      }
    );
  }

  render() {
    return (
      <div className="App">
        <h1>Ether Roulette</h1>
        <hr />
        <AccountComponent
          account={this.state.account}
          balance={this.state.balance} />
        <hr />
        <LastBidComponent lastBid={this.state.lastBid} />
        <ContractComponent
          maxNumber={this.state.maxNumber}
          balance={this.state.contractBalance}
          onPlay={this.onClickPlay} />
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


const LastBidComponent = ({ lastBid }) => {
  if (!lastBid) {
    return (<div/>);
  }

  let bidState = {};

  if (lastBid.state === 'won') {
    bidState.title = 'You won!';
    bidState.msg = (
      `You bet ${lastBid.number} and won ${lastBid.profit}`
    );
  } else if (lastBid.state === 'pending') {
    bidState.title = 'Waiting for result...';
    bidState.msg = '';
  } else if (lastBid.state === 'lost') {
    bidState.title = 'You lost';
    bidState.msg = `
You bet on ${lastBid.number} but the result was
${lastBid.drawnNumber}
and lost ${lastBid.value}`;
  }

  return (
    <div>
      <div className="notification">
        <h4>{bidState.title}</h4>
        <div>{bidState.msg}</div>
      </div>
      <hr />
    </div>
  );
};


const ContractComponent = ({ maxNumber, balance, onPlay }) => {
  if (!maxNumber) {
    return (<div>Loading contract information...</div>);
  }

  return (
    <div className="container">
      <h3>Contract</h3>
      <div className="row">
        <div className="column">Your chances are</div>
        <div className="column">1 / {maxNumber}</div>
      </div>
      <div className="row">
        <div className="column">Contract balance</div>
        <div className="column">{balance}</div>
      </div>
      <hr/>
      <button className="button-large" onClick={onPlay}>Bid {toEth(BID_VALUE)} and play!</button>
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


export default RouletteApp;
