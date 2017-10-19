var Web3 = require("web3");
var Contracts = require("./contracts.js");
var contracts = new Contracts();
var Promise = require("bluebird");
// var CryptoJS = require("crypto-js");
// var Transaction = require("ethereumjs-tx");
// var ABI = require("ethereumjs-abi");
// var util = require("ethereumjs-util");

class Kiosk {
    constructor(web3) {
        this.web3 = web3;

        this.registry = new web3.eth
            .Contract(contracts.registryABI, contracts.registryAddressKovan);
        this.buy = new web3.eth
            .Contract(contracts.buyABI, contracts.buyAddressKovan);
    }

    owner(DIN) {
        return this.registry.methods.owner(DIN).call();
    }

    resolver(DIN) {
        return this.registry.methods.resolver(DIN).call();
    }

    productURL(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = new this.web3.eth.Contract(contracts.resolverABI, resolverAddr);
            return resolver.methods.productURL(DIN).call();
        });
    }

    signPriceMessage(DIN, price, priceValidUntil, account) {
        const args = [DIN, price, priceValidUntil];
        const argTypes = ["uint256", "uint256", "uint256"];
        const msg = ABI.soliditySHA3(argTypes, args);
        return this.web3.eth.sign(account, util.bufferToHex(msg)).then(result => {
            let signature = util.fromRpcSig(result);
            const { v, r, s } = signature;
            signature.r = util.bufferToHex(r);
            signature.s = util.bufferToHex(s);
            return signature;
        });
    }
}

module.exports = Kiosk;