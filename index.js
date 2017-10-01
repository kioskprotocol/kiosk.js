const Promise = require("bluebird");

function Kiosk(web3, registry) {
    this.web3 = web3;
    this.registryAsync = Promise.resolve(Promise.promisifyAll(registry));
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
        return "https://www.google.com/";
    });
};

module.exports = Kiosk;