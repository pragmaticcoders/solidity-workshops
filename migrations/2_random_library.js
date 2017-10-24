const Random = artifacts.require("./Random.sol");

async function deploy(deployer) {
  await deployer.deploy(Random);
}

module.exports = function (deployer) {
  deployer.then(() => deploy(deployer));
};
