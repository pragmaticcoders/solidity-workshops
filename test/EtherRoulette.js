const EtherRoulette = artifacts.require('./EtherRoulette.sol');
const {
  getBlock,
  getBalance,
  getEventFromLogs,
  assertThrowsInvalidOpcode,
  assertNumberEqual,
  assertValueEqual,
  assertValueAlmostEqual
} = require('./Helpers.js');
const BigNumber = require('bignumber.js');

const MAX_NUMBER = 5;

const VALUE = 1;
const VALUE_WEI = web3.toWei(VALUE, 'ether');

const EPSILON = 0.01;
const EPSILON_WEI = web3.toWei(EPSILON, 'ether');

const EXPECTED_PROFIT = (MAX_NUMBER - 2) * VALUE;
const EXPECTED_PROFIT_WEI = web3.toWei(EXPECTED_PROFIT, 'ether');

contract(`EtherRoulette with max number of ${MAX_NUMBER}`, accounts => {
  const OWNER = accounts[0];
  const ACCOUNT = accounts[1];

  let roulette;
  let initialBalance;
  let expectedNumber;

  beforeEach(async () => {
    roulette = await EtherRoulette.new(MAX_NUMBER, {
      from: OWNER,
      value: EXPECTED_PROFIT_WEI
    });

    initialBalance = await getBalance(ACCOUNT);
    expectedNumber = await getExpectedNumber();
  });

  context(`Given won playing ${VALUE} ether`, () => {
    let playResult;

    beforeEach(async () => {
      playResult = await roulette.play(expectedNumber, {
        from: ACCOUNT,
        value: VALUE_WEI,
      });
      assert.ok(playResult.logs);
    });

    it(`Account should gain ${EXPECTED_PROFIT} ethers`, async () => {
      const balance = await getBalance(ACCOUNT);
      assertValueAlmostEqual(balance, initialBalance.add(EXPECTED_PROFIT_WEI), EPSILON_WEI);
    });

    it('Should emit Won event', async () => {
      const event = getEventFromLogs(playResult.logs, 'Won');
      assert.ok(event);
      assert.equal(event.args.account, ACCOUNT);
      assertNumberEqual(event.args.selectedNumber, expectedNumber);
      assertValueEqual(event.args.value, VALUE_WEI);
      assertValueEqual(event.args.profit, EXPECTED_PROFIT_WEI);
    });

    it('Should return all ether to owner on payout by owner', async () => {
      let initialBalance = await getBalance(OWNER);
      let rouletteBalance = await getBalance(roulette.address);

      await roulette.payout({
        from: OWNER
      });

      const balance = await getBalance(OWNER);
      const newRouletteBalance = await getBalance(roulette.address);
      const acceptableError = web3.toWei(0.01, 'ether');

      assertValueAlmostEqual(balance, initialBalance.add(rouletteBalance), acceptableError);
      assertValueEqual(newRouletteBalance, 0);
    });

    it('Should throw on payout by non-owner', async () => {
      assertThrowsInvalidOpcode(async () => {
        await roulette.payout({
          from: ACCOUNT
        });
      });
    });
  });

  context(`Given lost playing ${VALUE} ether`, () => {
    let playResult;
    let invalidNumber;

    beforeEach(async () => {
      invalidNumber = shiftNumber(expectedNumber, MAX_NUMBER);
      playResult = await roulette.play(invalidNumber, {
        value: VALUE_WEI,
        from: ACCOUNT
      });
      assert.ok(playResult.logs);
    });

    it(`Account should lose ${VALUE} ether`, async () => {
      const balance = await getBalance(ACCOUNT);
      assertValueAlmostEqual(balance, initialBalance.sub(VALUE_WEI), EPSILON_WEI);
    });

    it('Should emit Lost event', async () => {
      const event = getEventFromLogs(playResult.logs, 'Lost');
      assert.ok(event);
      assertNumberEqual(event.args.account, ACCOUNT);
      assertNumberEqual(event.args.selectedNumber, invalidNumber);
      assertNumberEqual(event.args.drawnNumber, expectedNumber);
      assertValueEqual(event.args.value, VALUE_WEI);
    });
  });

  async function getExpectedNumber() {
    const block = await getBlock('latest');
    const n = new BigNumber(block.hash);
    return n.modulo(MAX_NUMBER).add(1);
  }

  function shiftNumber(num, max) {
    return num.add(1).modulo(max).add(1);
  }
});
