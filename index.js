const Promise = require("bluebird");
const Web3 = require("web3");

const registryABI = [{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrar","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"owner","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"genesis","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"updated","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"owner","type":"address"}],"name":"register","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_registrar","type":"address"}],"name":"setRegistrar","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_genesis","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"owner","type":"address"}],"name":"NewOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"resolver","type":"address"}],"name":"NewResolver","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"owner","type":"address"}],"name":"NewRegistration","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrar","type":"address"}],"name":"NewRegistrar","type":"event"}]
const registryAddressKovan = "0xa26993945449fe1bdf22253fd2583da184e90b56";
const registryAddressMainNet = "0x79bf32b2c0f9a3f30fbcc4aa1e3e07e3366b34f9";

const resolverABI = [{"constant":true,"inputs":[{"name":"interfaceID","type":"bytes4"}],"name":"supportsInterface","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"productURL","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}];

// Registry is optional
function Kiosk(web3, registry) {
    this.web3 = web3;

    if (registry) {
        this.registryAsync = Promise.resolve(Promise.promisifyAll(registry));
    } else {
        const network = web3.version.network;

        var registryAddress;

        switch (network) {
            case "1": // Main Network
                registryAddress = registryAddressMainNet;
                break;
            case "42": // Kovan
                registryAddress = registryAddressKovan;
                break;
            default:
                break;
        }

        const registry = web3.eth.contract(registryABI).at(registryAddress);
        this.registryAsync = Promise.resolve(Promise.promisifyAll(registry));
    }
}

Kiosk.prototype.owner = function(DIN) {
    return this.registryAsync.then(function(registry) {
        return registry.ownerAsync(DIN);
    });
};

Kiosk.prototype.resolver = function(DIN) {
    return this.registryAsync.then(function(registry) {
        return registry.resolverAsync(DIN);
    });
};

Kiosk.prototype.setOwner = function(DIN, owner, params) {
    return this.registryAsync.then(function(registry) {
        return registry.setOwnerAsync(DIN, owner, params);
    });
};

Kiosk.prototype.setResolver = function(DIN, resolver, params) {
    return this.registryAsync.then(function(registry) {
        return registry.setResolverAsync(DIN, resolver, params);
    });
};

Kiosk.prototype.productURL = function(DIN) {
    var web3 = this.web3;
    return this.resolver(DIN).then(function(resolverAddr) {
        if (resolverAddr !== "0x0000000000000000000000000000000000000000") {
            var resolverContract = web3.eth.contract(resolverABI).at(resolverAddr);
            var resolverAsync = Promise.resolve(Promise.promisifyAll(resolverContract));
            return resolverAsync.then(function(resolver) {
                return resolver.productURLAsync(DIN);
            });
        } else {
            return "";
        }
    });
};

module.exports = Kiosk;