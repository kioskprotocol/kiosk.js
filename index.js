var Web3 = require("web3");
var Contracts = require("./contracts.js");
var contracts = new Contracts();
var Promise = require("bluebird");
var Transaction = require("ethereumjs-tx");
var CryptoJS = require("crypto-js");
var coder = require("web3/lib/solidity/coder");

function Kiosk(web3, registry, buy) {
    this.web3 = web3;

    if (registry && buy) {
        this.registryPromise = Promise.resolve(Promise.promisifyAll(registry));
        this.buyPromise = Promise.resolve(Promise.promisifyAll(buy));
    } else {
        // Kovan
        var registryContract = web3.eth
            .contract(contracts.registryABI)
            .at(contracts.registryAddressKovan);
        this.registryPromise = Promise.resolve(
            Promise.promisifyAll(registryContract)
        );
        var buyContract = web3.eth
            .contract(contracts.buyABI)
            .at(contracts.buyAddressKovan);
        this.buyPromise = Promise.resolve(Promise.promisifyAll(buyContract));
    }
}

Kiosk.prototype.owner = function(DIN) {
    return this.registryPromise.then(function(registry) {
        return registry.ownerAsync(DIN);
    });
};

Kiosk.prototype.resolver = function(DIN) {
    return this.registryPromise.then(function(registry) {
        return registry.resolverAsync(DIN);
    });
};

Kiosk.prototype.setOwner = function(DIN, owner, params) {
    return this.registryPromise.then(function(registry) {
        return registry.setOwnerAsync(DIN, owner, params);
    });
};

Kiosk.prototype.setResolver = function(DIN, resolver, params) {
    return this.registryPromise.then(function(registry) {
        return registry.setResolverAsync(DIN, resolver, params);
    });
};

function productURL(DIN, resolverAddr) {
    if (resolverAddr !== "0x0000000000000000000000000000000000000000") {
        var resolverContract = this.web3.eth
            .contract(contracts.resolverABI)
            .at(resolverAddr);
        var resolverPromise = Promise.resolve(
            Promise.promisifyAll(resolverContract)
        );
        return resolverPromise.then(function(resolver) {
            return resolver.productURLAsync(DIN);
        });
    } else {
        return "";
    }
}

Kiosk.prototype.productURL = function(DIN) {
    return this.resolver(DIN).then(function(result) {
        return result.then(function(resolverAddr) {
            return productURL(DIN, resolverAddr);
        });
    });
};

Kiosk.prototype.buyProduct = function(
    DIN,
    quantity,
    totalValue,
    priceValidUntil,
    v,
    r,
    s,
    params
) {
    return this.buyPromise.then(function(buy) {
        return buy.buy(
            DIN,
            quantity,
            totalValue,
            priceValidUntil,
            v,
            r,
            s,
            params
        );
    });
};

/**
 * Encodes function data
 * Source: https://github.com/ConsenSys/eth-lightwallet/blob/master/lib/txutils.js
 */
function encodeFunctionTxData(functionName, types, args) {
    var fullName = functionName + "(" + types.join() + ")";
    var signature = CryptoJS.SHA3(fullName, {
        outputLength: 256
    })
        .toString(CryptoJS.enc.Hex)
        .slice(0, 8);
    var dataHex = signature + coder.encodeParams(types, args);
    return "0x" + dataHex;
}

function createRawTransaction(account, contractAddr, value, data) {
    var nonce = this.web3.eth.getTransactionCount(account);
    return new Transaction({
        to: contractAddr,
        value: value,
        nonce: nonce,
        data: data,
        gasLimit: 4700000
    });
}

function signRawTransaction(transaction, privateKey) {
    transaction.sign(Buffer.from(privateKey, "hex"));
    return transaction.serialize().toString("hex");
}

Kiosk.prototype.signRawTransactionBuy = function(
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
    var types = [
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint8",
        "bytes32",
        "bytes32"
    ];
    var args = [DIN, quantity, totalValue, priceValidUntil, v, r, s];
    var data = encodeFunctionTxData("buy", types, args);
    var tx = createRawTransaction(account, this.buy.address, 0, data);
    var signedTx = signRawTransaction(tx, privateKey);
    return signedTx;
};

module.exports = Kiosk;