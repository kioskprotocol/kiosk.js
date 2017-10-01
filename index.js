const Promise = require('bluebird');

function Kiosk(web3, registry) {
    this.web3 = web3;
    this.registryAsync = Promise.resolve(Promise.promisifyAll(registry));
}

Kiosk.prototype.owner = function(DIN) {
    return this.registryAsync.then(function(registry) {
        return registry.ownerAsync(DIN);
    })
}

module.exports = Kiosk;