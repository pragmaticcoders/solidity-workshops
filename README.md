# Ether Roulette

## Project structure

This is a standard truffle package layout:

- `/contracts/` - solidity contracts source code
- `/migrations/` - truffle migrations that deploy contracts to the blockchain
- `/build/` - compiled contracts
- `/test/` - contracts tests
- `/webapp/` - standalone web application

## Setting up the project

### Install all the dependencies

https://metamask.io/

`$ npm run install-all`

Runs `npm install` for `/` `/webapp` and `/testrpc`

## Running the project

### Start TestRPC

`$ npm run testrpc`

TestRPC acts like a local chain for testing and developement.
It does not persist any state between runs.

### Running tests

`$ npm run test`

### Compiling contracts

`$ npm run compile`

This generates contracts ABIs (compiled interfaces) in `/build/` directory.

### Deploying contracts to the chain

`$ npm run migrate`

This published contracts to the blockchain and copies their generated
addresses to their interfaces stored in `/build/`.

Note that if you're deploying contracts to TestRPC they will vanish
once it is stopped. Migration should be run each time after TestRPC is started.

### Starting the webapp

``` shell
cd webapp
npm run start
```

Note that web application requires contracts to be compiled and
deployed first. It directly imports their interfaces from json files
in `./build/`.

### Using webapp with MetaMask and TestRPC

When running for the first time:

1. Open metamask (Click on the fox icon in menubar)
2. Connect to localhost (Click on the network in the upper left corner and choose "localhost 8545")
3. Import TestRPC account (Click "Import existing DEN")
   1. Provide a seed: "spike dizzy clump wrist receive limb interest half item lunch betray vivid"
      (it comes from TestRPC output and is hardcoded `package.json`)

### Troubleshooting

- Each time TestRPC is restarted, **browser** has to be
restarted as well.
- After each migration webapp should be reloaded
- If you're getting VM Errors in migrations `rm -r /build/`. Happens especially after switching branches.

# References

- https://github.com/pragmaticcoders/ether-lotto

- https://solidity.readthedocs.io/en/develop/solidity-in-depth.html

- http://truffleframework.com/docs/

- https://metamask.io/
