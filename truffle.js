const Web3 = require('web3');


const gasPrice = new Web3().toWei(10, 'gwei');


module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gasPrice,
    },
    kovan: {
      host: "localhost",
      port: 8546,
      network_id: "42",
      gasPrice,
    }
  }
};
