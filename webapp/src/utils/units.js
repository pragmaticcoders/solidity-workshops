import Web3 from 'web3';

const _web3 = new Web3();

export function toWei(value) {
  return _web3.toWei(value, 'ether');
}


export function toEth(value) {
  return _web3.fromWei(value, 'ether');
}
