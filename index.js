var Web3 = require("web3");
var Contracts = require("./contracts.js");
var contracts = new Contracts();
var Promise = require("bluebird");

function Kiosk(web3, registry, buy) {
    this.web3 = web3;

    if (registry && buy) {
        this.registry = registry;
        this.buy = buy;
    } else {
        const network = web3.version.network;

        var registryAddress;
        var buyAddress;

        switch (network) {
            case "1": // Main Network
                registryAddress = contracts.registryAddressMainNet;
                break;
            case "42": // Kovan
                registryAddress = contracts.registryAddressKovan;
                buyAddress = contracts.buyAddressKovan;
                break;
            default:
                break;
        }
        this.registry = web3.eth
            .contract(contracts.registryABI)
            .at(registryAddress);
        this.buy = web3.eth.contract(contracts.buyABI).at(buyAddress);
    }
}

Kiosk.prototype.owner = function(DIN) {
    return this.registry.owner(DIN);
};

Kiosk.prototype.resolver = function(DIN) {
    return this.registry.resolver(DIN);
};

Kiosk.prototype.setOwner = function(DIN, owner, params) {
    return this.registry.setOwner(DIN, owner, params);
};

Kiosk.prototype.setResolver = function(DIN, resolver, params) {
    return this.registry.setResolver(DIN, resolver, params);
};

function productURL(DIN, resolverAddr) {
    if (resolverAddr !== "0x0000000000000000000000000000000000000000") {
        var resolverContract = this.web3.eth
            .contract(contracts.resolverABI)
            .at(resolverAddr);
        return resolverContract.productURL(DIN);
    } else {
        return "";
    }
}

Kiosk.prototype.productURL = function(DIN) {
    var resolver = this.resolver(DIN);
    if (typeof resolver === "string") {
        return productURL(DIN, resolver);
    } else {
        // Promise
        return resolver.then(function(result) {
            return productURL(DIN, result);
        });
    }
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
    return this.buy.buy(
        DIN,
        quantity,
        totalValue,
        priceValidUntil,
        v,
        r,
        s,
        params
    );
};

module.exports = Kiosk;