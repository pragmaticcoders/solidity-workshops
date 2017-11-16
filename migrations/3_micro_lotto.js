const Random = artifacts.require('./Random.sol');
const MicroLotto = artifacts.require('./MicroLotto.sol');

async function deploy(deployer) {
  const MAX_NUMBER = 9;
  const LOTTO_FEE_PERCENT = web3.toWei(0.01, 'ether');
  const LOTTERY_DURATION = 10;
  const TICKET_FEE_WEI = web3.toWei(0.1, 'ether');

  await deployer.deploy(
    MicroLotto,
    Random.address,
    LOTTO_FEE_PERCENT,
    MAX_NUMBER,
    LOTTERY_DURATION,
    TICKET_FEE_WEI
  );
}

module.exports = function (deployer) {
  deployer.then(() => deploy(deployer));
};
