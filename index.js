var Promise = require("bluebird");
var Web3 = require("web3");
var Contracts = require("./contracts.js");
var contracts = new Contracts();

function Kiosk(web3, registry, buy) {
    this.web3 = web3;

    if (registry && buy) {
        this.registry = Promise.resolve(Promise.promisifyAll(registry));
        this.buy = Promise.resolve(Promise.promisifyAll(buy));
    } else {
        // const network = web3.version.network;

        // var registryAddress;
        // var buyAddress;

        // switch (network) {
        //     case "1": // Main Network
        //         registryAddress = contracts.registryAddressMainNet;
        //         break;
        //     case "42": // Kovan
        //         registryAddress = contracts.registryAddressKovan;
        //         buyAddress = contracts.buyAddressKovan;
        //         break;
        //     default:
        //         break;
        // }

        // const registry = web3.eth.contract(contracts.registryABI).at(contracts.registryAddress);
        // this.registryAsync = Promise.resolve(Promise.promisifyAll(registry));

        // const buy = web3.eth.contract(contracts.buyABI).at(contracts.buyAddress);
        // this.buyAsync = Promise.resolve(Promise.promisifyAll(buy));
    }
}

Kiosk.prototype.owner = function(DIN) {
    return this.registry.then(function(registry) {
        return registry.ownerAsync(DIN);
    });
};

Kiosk.prototype.resolver = function(DIN) {
    return this.registry.then(function(registry) {
        return registry.resolverAsync(DIN);
    });
};

Kiosk.prototype.setOwner = function(DIN, owner, params) {
    return this.registry.then(function(registry) {
        return registry.setOwnerAsync(DIN, owner, params);
    });
};

Kiosk.prototype.setResolver = function(DIN, resolver, params) {
    return this.registry.then(function(registry) {
        return registry.setResolverAsync(DIN, resolver, params);
    });
};

Kiosk.prototype.productURL = function(DIN) {
    var web3 = this.web3;
    return this.resolver(DIN).then(function(resolverAddr) {
        if (resolverAddr !== "0x0000000000000000000000000000000000000000") {
            var resolverContract = web3.eth
                .contract(contracts.resolverABI)
                .at(resolverAddr);
            var resolverAsync = Promise.resolve(
                Promise.promisifyAll(resolverContract)
            );
            return resolverAsync.then(function(resolver) {
                return resolver.productURLAsync(DIN);
            });
        } else {
            return "";
        }
    });
};

Kiosk.prototype.buy = function(
    DIN,
    quantity,
    totalValue,
    priceValidUntil,
    v,
    r,
    s
) {
    return this.buyAsync.then(function(buy) {
        return buy.buyAsync(
            DIN,
            quantity,
            totalValue,
            priceValidUntil,
            v,
            r,
            s
        );
    });
};

module.exports = Kiosk;