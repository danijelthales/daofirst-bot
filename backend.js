require('dotenv').config();

const Web3 = require('web3');

const mnemonic = process.env.MNEMONIC;
const HDWalletProvider = require("@truffle/hdwallet-provider");

let provider = new HDWalletProvider({
    mnemonic: {
        phrase: mnemonic
    },
    providerOrUrl: "https://mainnet.infura.io/v3/a71607f8b1644c97b72f508f9c8f2f72"
});
const web3 = new Web3(provider);

const helloWorld = new web3.eth.Contract([
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "contract Proxy",
                "name": "proxy",
                "type": "address"
            }
        ],
        "name": "ProxyCreation",
        "type": "event"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "_mastercopy",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "initializer",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "saltNonce",
                "type": "uint256"
            }
        ],
        "name": "calculateCreateProxyWithNonceAddress",
        "outputs": [
            {
                "internalType": "contract Proxy",
                "name": "proxy",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "masterCopy",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "createProxy",
        "outputs": [
            {
                "internalType": "contract Proxy",
                "name": "proxy",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "_mastercopy",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "initializer",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "saltNonce",
                "type": "uint256"
            },
            {
                "internalType": "contract IProxyCreationCallback",
                "name": "callback",
                "type": "address"
            }
        ],
        "name": "createProxyWithCallback",
        "outputs": [
            {
                "internalType": "contract Proxy",
                "name": "proxy",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "_mastercopy",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "initializer",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "saltNonce",
                "type": "uint256"
            }
        ],
        "name": "createProxyWithNonce",
        "outputs": [
            {
                "internalType": "contract Proxy",
                "name": "proxy",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "proxyCreationCode",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "proxyRuntimeCode",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    }
], '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B');

///https://etherscan.io/address/0x76e2cfc1f5fa8f6a5b3fc4c8f4788f0116861f9b#writeContract
//  createProxyWithNonce(address _mastercopy, bytes initializer, uint256 saltNonce)
// 0	_mastercopy	address	0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F
// 1	initializer	bytes	0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000d5d82b6addc9027b22dca772aa68d5d74cdbdf4400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000008c42138c925d1049ec6b29f1ecf817b1628e54ba000000000000000000000000fff1ec934079d3df0914e66556f07427545b0efa0000000000000000000000000000000000000000000000000000000000000000
// 2	saltNonce	uint256	1611186190069
//
//
// 	_mastercopy	address	0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F
// 1	initializer	bytes	0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000d5d82b6addc9027b22dca772aa68d5d74cdbdf440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000fe826327a0cc88acf15703fb39ecbe78bf42d9030000000000000000000000000000000000000000000000000000000000000000
// 2	saltNonce	uint256	1611393380860
//
//
//
// safe: 0xDaC09f37E132D91b962F30E6ec40d2D08b82b0Fa


helloWorld.methods.createProxyWithNonce("0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F",
    "0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000d5d82b6addc9027b22dca772aa68d5d74cdbdf4400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000008c42138c925d1049ec6b29f1ecf817b1628e54ba000000000000000000000000461783A831E6dB52D68Ba2f3194F6fd1E0087E040000000000000000000000000000000000000000000000000000000000000000",
    "1613319903000"
).send({from: '0x461783A831E6dB52D68Ba2f3194F6fd1E0087E04'}, function (error, result) {
    console.log(result);
    console.log(error);
});


// contractinstance.methods.nameFunction(param1, param2).send({from:"0xfc312ab....", gas: 100000}, function(error, txHash){
//     console.log(txHash);
// });

