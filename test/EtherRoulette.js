const RandomMock = artifacts.require('./RandomMock.sol');
const EtherRoulette = artifacts.require('./EtherRoulette.sol');
const {
  mineBlock,
  getBalance,
  getEventFromLogs,
  assertThrowsInvalidOpcode,
  assertNumberEqual,
  assertValueEqual,
  assertValueAlmostEqual
} = require('./Helpers.js');

const MAX_NUMBER = 5;

const VALUE = 0.1;
const VALUE_WEI = web3.toWei(VALUE, 'ether');

const EPSILON = 0.02;
const EPSILON_WEI = web3.toWei(EPSILON, 'ether');

const EXPECTED_PROFIT = (MAX_NUMBER - 2) * VALUE;
const EXPECTED_PROFIT_WEI = web3.toWei(EXPECTED_PROFIT, 'ether');

contract(`EtherRoulette with max number of ${MAX_NUMBER}`, accounts => {
  const OWNER = accounts[0];
  const ACCOUNT = accounts[1];
  const EXPECTED_NUMBER = 1;

  let roulette;
  let initialBalance;

  beforeEach(async () => {
    const random = await RandomMock.new(EXPECTED_NUMBER, {
      from: OWNER
    });
    roulette = await EtherRoulette.new(random.address, MAX_NUMBER, {
      from: OWNER,
      value: 2*EXPECTED_PROFIT_WEI
    });

    initialBalance = await getBalance(ACCOUNT);
  });

  context(`Given placed lucky bet of ${VALUE} ether`, () => {
    let betResult;

    beforeEach(async () => {
      betResult = await roulette.placeBet(EXPECTED_NUMBER, {
        from: ACCOUNT,
        value: VALUE_WEI,
      });
    });

    it('Should emit BetPlaced event', async () => {
      const event = getEventFromLogs(betResult.logs, 'BetPlaced');
      assert.ok(event);
      assert.equal(event.args.account, ACCOUNT);
      assertNumberEqual(event.args.selectedNumber, EXPECTED_NUMBER);
      assertValueEqual(event.args.value, VALUE_WEI);
    });

    context('Given roll invoked', () => {
      let rollResult;

      beforeEach(async () => {
        await mineBlock();
        rollResult = await roulette.roll({
          from: ACCOUNT
        });
      });

      it('Should emit Won event', async () => {
        const event = getEventFromLogs(rollResult.logs, 'Won');
        const acceptablError = web3.toWei(0.001, 'ether');
        assert.ok(event);
        assert.equal(event.args.account, ACCOUNT);
        assertNumberEqual(event.args.selectedNumber, EXPECTED_NUMBER);
        assertValueEqual(event.args.value, VALUE_WEI);
        assertValueAlmostEqual(event.args.profit, EXPECTED_PROFIT_WEI, acceptablError);
      });

      it(`Account should gain ${EXPECTED_PROFIT} ethers`, async () => {
        const balance = await getBalance(ACCOUNT);
        assertValueAlmostEqual(balance, initialBalance.add(EXPECTED_PROFIT_WEI), EPSILON_WEI);
      });

      it('Should return all ether to owner on payout by owner', async () => {
        const initialBalance = await getBalance(OWNER);
        const rouletteBalance = await getBalance(roulette.address);

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
  });

  context(`Given placed unlucky bet of ${VALUE} ether`, () => {
    let betResult;
    let invalidNumber;

    beforeEach(async () => {
      invalidNumber = shiftNumber(EXPECTED_NUMBER, MAX_NUMBER);
      betResult = await roulette.placeBet(invalidNumber, {
        value: VALUE_WEI,
        from: ACCOUNT
      });
    });

    it('Should emit BetPlaced event', async () => {
      const event = getEventFromLogs(betResult.logs, 'BetPlaced');
      assert.ok(event);
      assert.equal(event.args.account, ACCOUNT);
      assertNumberEqual(event.args.selectedNumber, invalidNumber);
      assertValueEqual(event.args.value, VALUE_WEI);
    });

    context('Given roll invoked', () => {
      let rollResult;

      beforeEach(async () => {
        await mineBlock();
        rollResult = await roulette.roll({
          from: ACCOUNT
        });
      });

      it(`Account should lose ${VALUE} ether`, async () => {
        const balance = await getBalance(ACCOUNT);
        assertValueAlmostEqual(balance, initialBalance.sub(VALUE_WEI), EPSILON_WEI);
      });

      it('Should emit Lost event', async () => {
        const event = getEventFromLogs(rollResult.logs, 'Lost');
        assert.ok(event);
        assertNumberEqual(event.args.account, ACCOUNT);
        assertNumberEqual(event.args.selectedNumber, invalidNumber);
        assertNumberEqual(event.args.drawnNumber, EXPECTED_NUMBER);
        assertValueEqual(event.args.value, VALUE_WEI);
      });
    });
  });

  function shiftNumber(num, max) {
    return (num + 1) % max + 1;
  }
});
