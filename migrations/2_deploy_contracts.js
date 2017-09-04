const EtherRoulette = artifacts.require("./EtherRoulette.sol");

module.exports = function (deployer) {
  const MAX_NUMBER = 6;
  const INITIAL_VALUE = web3.toWei(1, 'ether');

  deployer.deploy(EtherRoulette, MAX_NUMBER, {value: INITIAL_VALUE});
};
