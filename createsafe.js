const ethEnabled = () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        window.ethereum.enable();
        return true;
    }
    return false;
}

if (!ethEnabled()) {
    alert("Please install an Ethereum-compatible browser or extension like MetaMask to use this dApp!");
}

function createSafe() {
    signers = signers.split(",");
    console.log(signers);
    console.log(squad);
    console.log(consensus);
    var contractAddress = '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B';

    const contract = new web3.eth.Contract([
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
    ], contractAddress);

    var payload = "0xb63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000" + consensus;
    payload += "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    var numOfSigners2 = new Number(parseInt("14", 16) + (signers.length - 1) * 2).toString(16);
    payload += numOfSigners2;
    payload += "0000000000000000000000000d5d82b6addc9027b22dca772aa68d5d74cdbdf44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    var numOfSigners1 = new Number(signers.length).toString(16);
    payload += numOfSigners1;

    signers.forEach(s => {
        payload += "000000000000000000000000";
        payload += s.substring(2);
    })

    payload += "0000000000000000000000000000000000000000000000000000000000000000";

    contract.methods.createProxyWithNonce("0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F",
        payload,
        Date.now()
    ).send({from: web3.currentProvider.selectedAddress}, function (error, result) {
        var tx = result;

        var sentValue = new Object();
        sentValue.tx = tx;
        sentValue.squad = squad;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/safetx", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            value: sentValue
        }));
        alert("Your transaction  is: https://etherscan.io/tx/" + result + ". You can now go back to discord, SquadDAO bot will let you know once the safe has been initialized.");
        console.log(error);
    });

}


setTimeout(function () {
    document.getElementById("address").innerHTML = web3.currentProvider.selectedAddress;
}, 1000 * 1);

setInterval(function () {
    document.getElementById("address").innerHTML = web3.currentProvider.selectedAddress;
}, 1000 * 10);
