const R = require('ramda');
const BigNumber = require('bignumber.js');

const ETH_DECIMALS = 18;

module.exports.getEventFromLogs = (logs, eventName) => {
  return R.findLast(R.propEq('event', eventName))(logs);
};

module.exports.getBlock = num => {
  return promisify(cb => web3.eth.getBlock(num, cb));
};

module.exports.getBlockNumber = () => {
  return promisify(cb => web3.eth.getBlockNumber(cb));
};
module.exports.getBalance = account => {
  return promisify(cb => web3.eth.getBalance(account, cb));
};

const assertNumberAlmostEqual = module.exports.assertNumberAlmostEqual = (actual, expect, epsilon, decimals) => {
  const actualNum = new BigNumber(actual);
  const expectNum = new BigNumber(expect);
  const epsilonNum = new BigNumber(epsilon);
  if (
    actualNum.lt(expectNum.sub(epsilonNum)) ||
    actualNum.gt(expectNum.add(epsilonNum))
  ) {
    const div = decimals ? Math.pow(10, decimals) : 1;
    assert.fail(
      actualNum.toFixed(),
      expectNum.toFixed(),
      `${actualNum.div(div).toFixed()} == ${expectNum.div(div).toFixed()} (precision ${epsilonNum.div(div).toFixed()})`,
      '='
    );
  }
};

module.exports.assertNumberEqual = (actual, expect, decimals) => {
  return assertNumberAlmostEqual(actual, expect, 0, decimals);
};

module.exports.assertValueEqual = (actual, expect) => {
  return assertNumberAlmostEqual(actual, expect, 0, ETH_DECIMALS);
};

module.exports.assertValueAlmostEqual = (actual, expect, epsilon) => {
  return assertNumberAlmostEqual(actual, expect, epsilon, ETH_DECIMALS);
};

module.exports.assertThrowsInvalidOpcode = async action => {
  try {
    await action();
  } catch (error) {
    module.exports.assertInvalidOpcode(error);
    return;
  }
  assert.fail('Should have thrown');
};

module.exports.assertInvalidOpcode = error => {
  if (error && error.message) {
    assert.isAbove(
      error.message.search('invalid opcode'),
      -1,
      'Invalid opcode error must be returned'
    );
  } else {
    assert.fail(error, {}, 'Expected to throw an error');
  }
};


module.exports.mineBlock = async () => {
  return promisify(cb =>
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_mine",
      id: 12345
    }, cb)
  );
}

module.exports.transferFrom = (from, to, value) => {
  return promisify(cb =>
    web3.eth.sendTransaction(
      {
        from: from,
        to: to,
        value: value
      },
      cb
    )
  );
};

function promisify(inner) {
  return new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    })
  );
}
