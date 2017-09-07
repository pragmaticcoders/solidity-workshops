const Web3 = require('web3');
const TestRPC = require('ethereumjs-testrpc');

const Config = require('truffle-config');
const Resolver = require('truffle-resolver');
const Artifactor = require('truffle-artifactor');
const Migrate = require('truffle-migrate');
const compile = require('truffle-compile');
const path = require('path');

const ETH_PORT = 8545;
const ETH_NETWORK = 'development';
const ETH_DIR = path.join(__dirname, '..');
const BUILD_DIR = path.join(__dirname, '../build/contracts');
const MNEMONIC =
  'spike dizzy clump wrist receive limb interest half item lunch betray vivid';
const NEW_BLOCK_EVERY = 6000;

const config = Config.detect({
  reset: true, // run all migrations
  working_directory: ETH_DIR,
  contracts_build_directory: BUILD_DIR,
  port: ETH_PORT,
  network: ETH_NETWORK,
  logger: console
});

console.log('Working directory: ', config.working_directory);
console.log('Build directory: ', BUILD_DIR);

config.resolver = new Resolver(config);
config.artifactor = new Artifactor(BUILD_DIR);

compile.necessary(config, async (compileErr, contracts) => {
  if (compileErr) {
    console.error('Compilation error: ', compileErr);
    return;
  }

  await config.artifactor.saveAll(contracts);

  const server = TestRPC.server({
    mnemonic: MNEMONIC,
    secure: false,
    logger: console
  });

  const web3 = new Web3(config.provider);

  server.listen(ETH_PORT, async (listenErr, state) => {
    if (listenErr) {
      console.error(
        `Failed to start TestRPC server on port ${ETH_PORT}: `,
        listenErr
      );
      return;
    }

    console.log(`Test RPC server started on port ${ETH_PORT}`);

    web3.version.getNetwork(function (getNetworkErr, networkId) {
      if (getNetworkErr) {
        console.error('Failed to get network id: ', getNetworkErr);
        return;
      }

      const network = config.networks[ETH_NETWORK];
      network.network_id = networkId;
      network.from = Object.keys(state.accounts)[0];

      Migrate.run(config, async migrateErr => {
        if (migrateErr) {
          console.error('Failed to perform migration: ', migrateErr);
          return;
        }

        setInterval(() => {
          config.provider.sendAsync({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: 12345
          }, function (err) {
            if (err) {
              console.error('Failed to mine next block', err);
            }
          });
        }, NEW_BLOCK_EVERY);

        console.log('Seed completed');
      });
    });
  });
});
