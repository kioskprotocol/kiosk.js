var DINRegistryJSON = require("../contracts/build/contracts/DINRegistry.json");

class DINRegistry {
    constructor(web3, networkId) {
        var registryAddress = DINRegistryJSON["networks"][networkId]["address"];
        this.registry = new web3.eth.Contract(
            DINRegistryJSON.abi,
            registryAddress
        );
    }

    registerDIN(owner) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .registerDIN(owner)
                .send({
                    from: owner
                })
                .then(result => {
                    resolve(result);
                });
        });
    }

    registerDINWithResolver(owner, resolver) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .registerDINWithResolver(owner, resolver)
                .send({
                    from: owner,
                    gas: 1000000
                })
                .then(result => {
                    resolve(result);
                });
        });
    }

    setResolver(DIN, resolver, account) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .setResolver(DIN, resolver)
                .send({ from: account })
                .then(result => {
                    resolve(result);
                });
        });
    }

    owner(DIN) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .owner(DIN)
                .call()
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    resolve(noAccount);
                });
        });
    }

    resolver(DIN) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .resolver(DIN)
                .call()
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    resolve(noAccount);
                });
        });
    }

    productURL(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = new this.web3.eth.Contract(
                ResolverContract.abi,
                resolverAddr
            );
            return resolver.methods.productURL(DIN).call();
        });
    }
}

module.exports = DINRegistry;