var Web3 = require("web3");
var contracts = new (require("./contracts.js"))();
var Promise = require("bluebird");
// var Account = require("eth-lib/lib/account");
// var CryptoJS = require("crypto-js");
// var Transaction = require("ethereumjs-tx");
// var ABI = require("ethereumjs-abi");
// var util = require("ethereumjs-util");

class Kiosk {
    constructor(web3) {
        this.web3 = web3;

        this.registry = new web3.eth.Contract(
            contracts.registryABI,
            contracts.registryAddressKovan
        );
        this.buy = new web3.eth.Contract(
            contracts.buyABI,
            contracts.buyAddressKovan
        );
    }

    owner(DIN) {
        return this.registry.methods.owner(DIN).call();
    }

    resolver(DIN) {
        return this.registry.methods.resolver(DIN).call();
    }

    productURL(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = new this.web3.eth.Contract(
                contracts.resolverABI,
                resolverAddr
            );
            return resolver.methods.productURL(DIN).call();
        });
    }

    isValidSignature(signer, hash, v, r, s) {
        return this.buy.methods.isValidSignature(signer, hash, v, r, s).call();
    }

    signPriceMessage(DIN, price, priceValidUntil, privateKey) {
        const hash = this.web3.utils.soliditySha3(
            { type: "uint256", value: DIN },
            { type: "uint256", value: price },
            { type: "uint256", value: priceValidUntil }
        );
        const signature = this.web3.eth.accounts.signHash(hash, privateKey);
        return signature;
    }

    signBuyTransaction(
        DIN,
        quantity,
        totalValue,
        priceValidUntil,
        v,
        r,
        s,
        account,
        privateKey
    ) {
        const data = this.web3.eth.abi.encodeParameters(
            [
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "uint8",
                "bytes32",
                "bytes32"
            ],
            [DIN, quantity, totalValue, priceValidUntil, v, r, s]
        );
        return this.web3.eth.getTransactionCount(account).then(nonce => {
            const transaction = {
                nonce: nonce,
                to: this.buy.address,
                data: data,
                value: 0,
                gas: 4700000
            };
            const signedTx = this.web3.eth.accounts.signTransaction(
                transaction,
                privateKey
            );
            return signedTx;
        });
    }
}

module.exports = Kiosk;