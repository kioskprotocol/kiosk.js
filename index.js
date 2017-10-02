const Promise = require("bluebird");

const registryABI = [{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrar","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"owner","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"genesis","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"updated","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"owner","type":"address"}],"name":"register","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_registrar","type":"address"}],"name":"setRegistrar","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_genesis","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"owner","type":"address"}],"name":"NewOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"resolver","type":"address"}],"name":"NewResolver","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"owner","type":"address"}],"name":"NewRegistration","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrar","type":"address"}],"name":"NewRegistrar","type":"event"}]


function Kiosk(web3, registry) {
    this.web3 = web3;

    if (registry) {
        this.registryAsync = Promise.resolve(Promise.promisifyAll(registry));
        // this.registrarAsync = Promise.resolve(Promise.promisifyAll(registrar));
    } else {
        // console.log(web3);
    }
}

Kiosk.prototype.registerDIN = function(params) {
    console.log("REGISTER")
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
    return this.resolver(DIN).then(function(resolver) {
        console.log(resolver);
        // const resolverAsync = Promise.resolve(Promise.promisifyAll(resolver));
        // return resolverAsync.productURLAsync(DIN);
    });
};

module.exports = Kiosk;