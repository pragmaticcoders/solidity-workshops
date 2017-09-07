const EtherRoulette = artifacts.require("./EtherRoulette.sol");
const Random = artifacts.require("./Random.sol");

async function deploy(deployer) {
  const MAX_NUMBER = 6;
  const INITIAL_VALUE = web3.toWei(5, 'ether');

  await deployer.deploy(Random);
  await deployer.deploy(EtherRoulette, Random.address, MAX_NUMBER, {value: INITIAL_VALUE});
}

module.exports = function (deployer) {
  deployer.then(() => deploy(deployer));
};
